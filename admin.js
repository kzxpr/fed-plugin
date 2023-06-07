const express = require('express'),
    router = express.Router();

/* CORS */
const cors = require('cors')

/* PATH */
const path = require("path")

/* BODY PARSER */
var bodyParser = require('body-parser')
router.use(bodyParser.json({type: 'application/activity+json'})); // support json encoded bodies
router.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

/* ICONS */
const feather = require('feather-icons')

/* MODELS */
const { Tag, Account, Message, Request, Activity } = require("./models/db")
const { raw } = require('objection');

/* BASIC AUTH FOR ACTIVITY PUB */
basicAuth = require('express-basic-auth');
let basicUserAuth = basicAuth({
    authorizer: asyncAuthorizer,
    authorizeAsync: true,
    challenge: true
});

function asyncAuthorizer(username, password, cb) {
    let isAuthorized = false;
    const isPasswordAuthorized = username === process.env.AP_USER;
    const isUsernameAuthorized = password === process.env.AP_PASS;
    isAuthorized = isPasswordAuthorized && isUsernameAuthorized;
    if (isAuthorized) {
        return cb(null, true);
    }
    else {
        return cb(null, false);
    }
}

router.use(basicUserAuth)

/* ROUTES */
router.use(cors({ credentials: true, origin: true }));

const composer_routes = require("./composer")
router.use("/composer", composer_routes);

const { pageLogs, logItem } = require("./pages");
const clc = require('cli-color');
const { handleOutbox } = require('./lib/checkFeed');
const { dynamicDate, skipHTMLTags } = require('./utils/funcs');

var CronJob = require('cron').CronJob;

var housekeeping = new CronJob("0 0 19 * * *", cleanUpLogs)
housekeeping.start()

router.get("/cleanup", async(req, res) => {
    try{
        await cleanUpLogs()
        res.send("ok")
    }catch(e){
        console.log("ERROR in /cleanup", e)
        res.send(e)
    }
})

async function cleanUpLogs(){
    return new Promise(async(resolve, reject) => {
        await Request.query().where("timestamp", "<", raw("now() - interval 72 hour"))
        .delete()
        .then((d) => {
            console.log(clc.green("CLEANED UP"))
            resolve(d)
        })
        .catch((e) => {
            reject(e)
        })
    })
}

router.get("/crawl", async(req, res) => {
    const { uri } = req.query;
    console.log(uri)
    await handleOutbox(uri, 5)
    res.send("CRAWLING DONE!")
})

router.get("/notifications", async(req, res) => {
    try{
        const activities = await Activity.query().withGraphFetched("[creator, message.creator]").orderBy("createdAt", "desc");
        var body = "<h1>Notifications for all accounts</h1>"
        body += "<table>";
        body += "<thead>"
        body += "<tr>"
        body += "<td>Icon"
        body += "<td>Activity"
        body += "<td>Timestamp"
        body += "</tr>"
        body += "</thead>"
        for(let activity of activities){
            if(activity.type != "Delete"){
                body += "<tr>"
                var actor = "Somebody";
                if(activity.creator){
                    actor = activity.creator.handle;
                }
                var objtext = "something"
                if(activity.message){
                    objlink = activity.message.url;
                    if(activity.message.name){
                        objtext = "&quot;"+activity.message.name+"&quot;";
                    }else if(activity.message.summary){
                        objtext = "&quot;"+activity.message.summary+"&quot;";
                    }else if(activity.message.content){
                        let content = skipHTMLTags(activity.message.content);
                        if(content.length>100){
                            objtext = "&quot;"+content.substr(0, 100) + "...&quot;"
                        }else{
                            objtext = "&quot;"+content+"&quot;";
                        }
                    }else{
                        if(activity.message.creator){
                            objtext = activity.message.creator.handle + "'s post"
                        }else{
                            objtext = "a post"
                        }
                    }
                }else{
                    objlink = activity.object;
                    if(activity.object == activity.actor){
                        objtext = "their profile"
                    }else{
                        objtext = activity.object;
                    }
                }
                if(activity.type == "Follow"){
                    body += "<td>"
                    body += feather.icons['user-plus'].toSvg();
                    body += "<td>"
                    body += "<b>"+actor+"</b> followed <a href='"+objlink+"'>"+objtext+"</a>";
                }else if(activity.type == "Accept"){
                    body += "<td>"
                    body += feather.icons['user-check'].toSvg();
                    body += "<td>"
                    body += "<b>"+actor+"</b> accepted follow from <a href='"+objlink+"'>"+objtext+"</a>";
                }else if(activity.type == "Reject"){
                    body += "<td>"
                    body += feather.icons['user-minus'].toSvg();
                    body += "<td>"
                    body += "<b>"+actor+"</b> rejected follow from <a href='"+objlink+"'>"+objtext+"</a>";
                }else if(activity.type == "Create"){
                    body += "<td>"
                    body += feather.icons['star'].toSvg();
                    body += "<td>"
                    body += "<b>"+actor+"</b> created <a href='"+objlink+"'>"+objtext+"</a>";
                }else if(activity.type == "Update"){
                    body += "<td>"
                    body += feather.icons['edit'].toSvg();
                    body += "<td>"
                    body += "<b>"+actor+"</b> updated <a href='"+objlink+"'>"+objtext+"</a>";
                }else if(activity.type == "Announce"){
                    body += "<td>"
                    body += feather.icons['share-2'].toSvg();
                    body += "<td>"
                    body += "<b>"+actor+"</b> boosted <a href='"+objlink+"'>"+objtext+"</a>";
                }else if(activity.type == "Like"){
                    body += "<td>"
                    body += feather.icons['thumbs-up'].toSvg();
                    body += "<td>"
                    body += "<b>"+actor+"</b> liked <a href='"+objlink+"'>"+objtext+"</a>";
                }else if(activity.type == "Delete"){
                    body += "<td>"
                    body += feather.icons['trash'].toSvg();
                    body += "<td>"
                    body += "<b>"+actor+"</b> deleted <a href='"+objlink+"'>"+objtext+"</a>";
                }else if(activity.type == "Undo"){
                    body += "<td>"
                    body += feather.icons['delete'].toSvg();
                    body += "<td>"
                    body += "<b>"+actor+"</b> undid <a href='"+objlink+"'>"+objtext+"</a>";
                }else{
                    body += "<td>"
                    body += feather.icons['info'].toSvg();
                    body += "<td>"
                    body += "<span style='color: red'>Unknown activity"+activity.type+"</span>";
                }
                body += "</td>"
                body += "<td>"
                body += dynamicDate(activity.createdAt, false);
                body += "</td>"
                body += "</tr>"
            }
        }
        body += "</table>"
        res.send(body)
    }catch(e){
        console.log("ERROR in /ap/notifications", e)
        res.sendStatus(500)
    }
})

router.get("/logs", async(req, res) => {
    await Request.query().where("timestamp", ">", raw("now() - interval 72 hour")).orderBy("timestamp", "desc")
    .then((logs) => {
        res.send(pageLogs(logs))
    })
    .catch((e) => {
        console.log(e)
        res.sendStatus(404)
    })
})

router.get("/logs/:logid", async(req, res) => {
    const { logid } = req.params;
    await Request.query().where("id", "=", logid).first()
    .then((log) => {
        res.send(logItem(log))
    })
    .catch((e) => {
        res.sendStatus(404)
    })
})

router.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "admin.html"))
})

module.exports = router;