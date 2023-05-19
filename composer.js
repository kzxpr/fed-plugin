const express = require('express'),
      router = express.Router();
      
const { createActor } = require("./lib/createActor")
const { wrapInCreate, wrapInUpdate, wrapInDelete, wrapInFlag, wrapInUndo, wrapInAnnounce, wrapInFollow, wrapInLike, wrap } = require("./lib/wrappers")
const { signAndSend } = require("./lib/signAndSend")
const { makeArticle, makeEvent, makeNote, makeQuestion, makeImage, handleAddress } = require("./lib/makeMessage")
const { findInbox } = require("./lib/addAccount")

const clc = require("cli-color")

const { Account, Message, Follower } = require("./models/db")

const { fn } = require('objection');
const { handleActivity } = require('./lib/handleActivity');
const { makeObject } = require('./lib/makeObject');
const { header, addName, addContent, addSummary, addAttachments, addTags } = require("./utils/autofields");
const { default: axios } = require('axios');

const composer_root = "/ap/composer";

router.use("/:username/edit", (req, res, next) => {
    const username = req.params.username;
    res.locals.username = username;
    next();
})

router.use("/:username/edit", require("./manager"))

function prettyTest(obj){
    return "<pre style='border: 1px solid #ccc; margin: 10px; padding: 10px;'>"+JSON.stringify(obj, undefined, 4)+"</pre>";
}

router.get("/", async(req, res) => {
    let domain = req.app.get('domain');
    var msg = "";
    if(req.query.username){
        const username = req.query.username;
        await createActor(username, domain)
            .then(async (account) => {
                await Account.query().insert({
                    ...account,
                    createdAt: fn.now()
                })
                .then(() => {
                    msg = "Created actor: "+username+"@"+domain;
                })
                .catch((e) => {
                    console.error("ERROR while creating new actor", e)
                    msg = "ERROR adding actor: "+username+"@"+domain;
                })
            })
            .catch((e) => {
                msg = "ERROR while creating actor: "+username+"@"+domain;
            })
    }
    
    
    var body = header();
    body += "Who are you?!<br>"
    if(msg!=""){
        body += "<i>"+msg+"</i><br>"
    }
    body += "<ul>"
    await Account.query().where("handle", "like", "%@"+domain).then((users) => {
        for(let user of users){
            let username = user.username
            body += "<li><a href='"+composer_root+"/"+username+"'>"+username+"</a></li>"
        }
    })
    body += "</ul>"
    body += "<b>Create new actor</b><br>";
    body += "<form action='"+composer_root+"/' method='get'>";
    body += "<input type='text' name='username' placeholder='username'>"
    body += "<input type='submit' value='Create actor'>"
    body += "</form>"
    res.send(body)
})

router.get("/:username", (req, res) => {
    const { username } = req.params;
    var body = header();
    body += "Hi "+username+".<br>";
    body += "What should we do?"
    const options = ["Create", "Update", "Undo", "Delete", "Follow", "Like", "Announce", "Flag"]
    body += "<ul>"
    for(let option of options){
        body += "<li><a href='"+composer_root+"/"+username+"/"+option+"'>"+option+"</a></li>"
    }
    body += "</ul>"
    body += "Additional stuff"
    body += "<ul>"
    body += "<li><a href='"+composer_root+"/"+username+"/edit/account'>Update account</a></li>"
    body += "<li><a href='"+composer_root+"/"+username+"/edit/messages'>Manage messages</a></li>"
    body += "<li><a href='"+composer_root+"/"+username+"/edit/followings'>Manage followings</a></li>"
    body += "</ul>"
    res.send(body)
})

router.get("/:username/:activity", (req, res) => {
    const domain = req.app.get('domain');
    const { username, activity } = req.params;
    const guid = "";
    const ref_url = "https://"+domain+"/u/"+username+"/statuses/"+guid;
    var body = header();
    body += "Hi "+req.params.username+"<br>So you want to <b>"+req.params.activity+"</b> an activity?<br>";
    body += "Which object would you like to use?"
    const options = ["Note", "Question", "Article", "Page", "Event", "Image", "Audio", "Video", "Id", "Object"]
    body += "<ul>"
    for(let option of options){
        body += "<li><a href='"+composer_root+"/"+username+"/"+activity+"/"+option+"'>"+option+"</a></li>"
    }
    body += "</ul>"
    const preview = wrap(activity, {}, { username, domain, ref_url, to: [], cc: [] });
    body += prettyTest(preview)
    res.send(body)
})

router.all("/:username/:activity/:object", async (req, res) => {
    const { username, activity, object } = req.params;
    const domain = req.app.get('domain');
    
    var guid = "";
    if(req.query.guid){
        //guid = req.query.guid;
        //console.log(guid)
        //req.body.manual_guid = guid;
        req.body.stringobj = req.query.guid;
    }
    const dd = new Date();
    const published = dd.toISOString();

    const to = req.body.to !== undefined ? req.body.to : "";
    const cc = req.body.cc !== undefined ? req.body.cc : "";
    const pub = ((req.body.pub !== undefined) && (req.body.pub!="false"))
        ? true : false;
    const followshare = ((req.body.followshare !== undefined) && (req.body.followshare!="false"))
        ? true : false;

    /* HERE - it should check for followshare and public */
    const { cc_field, to_field } = handleAddress({
        to, cc, pub, followshare, username, domain
    })

    /* BODY AND STUFF */
    var body = header();
    body += "Hi "+username+"<br>So you want to "+activity+" an <b>"+object+"</b>?<br><br>";
    body += "<b>Parameters</b><br>"

    hidden = "<form action='"+composer_root+"/"+username+"/"+activity+"/"+object+"/sign' method='post'>";
    body += "<form action='"+composer_root+"/"+username+"/"+activity+"/"+object+"' method='post'>"
    
    const { form_append, hidden_append, obj } = await makeObject(object, { username, domain, published, guid, activity }, req.body)
    body += form_append;
    hidden += hidden_append;
    body += "<br><input type='submit' value='Update preview'>"
    body += "</form>"
    hidden += "<br><input type='submit' value='Go to sign and send!'>"
    hidden += "</form>"
    const ref_url = "https://"+domain+"/u/"+username+"/statuses/"+guid;
    const preview = wrap(activity, obj, { username, domain, ref_url, to: to_field, cc: cc_field });
    body += prettyTest(preview)
    body += hidden;
    res.send(body)
})

router.post("/:username/:activity/:object/sign", async (req, res) => {
    const { username, activity, object } = req.params;
    const domain = req.app.get('domain');
    
    const to = req.body.to !== undefined ? req.body.to : "";
    const cc = req.body.cc !== undefined ? req.body.cc : "";

    const pub = ((req.body.pub !== undefined) && (req.body.pub!="false"))
        ? true : false;
    const followshare = ((req.body.followshare !== undefined) && (req.body.followshare!="false"))
        ? true : false;

    /* HERE - it should check for followshare and public */
    const { cc_field, to_field } = handleAddress({
        to, cc, pub, followshare, username, domain
    })

    const guid = "";
    const dd = new Date();
    const published = dd.toISOString();
    var body = header();
    const { body_append, hidden_append, obj } = await makeObject(object, { username, domain, published, guid, activity }, req.body)

    body += "Review one last time...<br>"
    body += "<form action='"+composer_root+"/"+username+"/"+activity+"/"+object+"/sign/send' method='post'>"
    body += hidden_append;
    const ref_url = "https://"+domain+"/u/"+username+"/statuses/"+guid;
    const preview = wrap(activity, obj, { username, domain, ref_url, to: to_field, cc: cc_field });
    body += prettyTest(preview)
    body += "To: "+req.body.to+"<br>";
    body += "CC: "+req.body.cc+"<br>";
    body += "<input type='submit' value='Send'>"
    body += "</form>"
    res.send(body);
});

router.post("/:username/:activity/:object/sign/send", async (req, res) => {
    const { username, activity, object } = req.params;
    const domain = req.app.get('domain');
    
    /* GET 'to' AND 'cc' FIELDS */
    const to = req.body.to !== undefined ? req.body.to : "";
    const cc = req.body.cc !== undefined ? req.body.cc : "";

    /* CHECK FOR 'public' AND 'followers' FLAGS */
    const pub = ((req.body.pub !== undefined) && (req.body.pub!="false"))
        ? true : false;
    const followshare = ((req.body.followshare !== undefined) && (req.body.followshare!="false"))
        ? true : false;
    
    /* EXTRACT ALL 'TO' AND 'CC' ADDRESSES INTO ARRAYS */
    const { to_field, cc_field } = handleAddress({ to, cc, pub, followshare, username, domain })

    /* GENERATE ID AND URI */
    const guid = crypto.randomBytes(16).toString('hex');
    const user_uri = "https://"+domain+"/u/"+username;
    const ref_url = user_uri+"/statuses/"+guid;

    /* GENERATE PUBLISH DATE */
    const dd = new Date();
    const published = dd.toISOString();

    /* MAKE OBJ */
    const { body_append, hidden_append, obj } = await makeObject(object, { username, domain, published, guid, activity }, req.body)

    /* WRAP IN ACTIVITY */
    const wrapped = wrap(activity, obj, { username, domain, ref_url, to: to_field, cc: cc_field });

    /* RENDER BODY FOR WEB */
    var body = header();
    body += prettyTest(wrapped)

    /* GET API KEY */
    const account = await Account.query().where("uri", "=", user_uri).select("apikey").first();
    const apikey = account.apikey;

    /* POST TO OUTBOX! */
    const sent_log = await axios.post(user_uri+"/outbox",
            wrapped,
            {
                headers: {
                  'Content-Type': 'application/activity+json',
                  "Authorization": "Bearer "+apikey
                }
            }
        )
        .then((d) => {
            if(d.status == 200){
                const uri = d.headers.location;
                body += "201 - <a href='"+uri+"'>"+uri+"</a>";
            }
            return d.data;
        })
        .catch((e) => {
            return e;
        })
    body += prettyTest(sent_log)

    body += "<a href='"+composer_root+"'>BACK!</a>"
    res.send(body);
});

router.get("*", (req, res) => {
    res.sendStatus(404)
})

module.exports = router;