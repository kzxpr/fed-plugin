'use strict';
const express = require('express');
const router = express.Router();

const clc = require('cli-color');

const { loadActorByUsername } = require("./lib/loadActorByUsername")
const { loadFollowersByUri, loadFollowingByUri } = require("./lib/loadFollowersByUsername")
const { makeMessage } = require("./lib/makeMessage");
const { wrapInCreate, wrapInOrderedCollection } = require('./lib/wrappers');
const { sendLatestMessages, addresseesToString } = require("./lib/sendLatestMessages")
const { addFollower, removeFollower } = require("./lib/addFollower")
const { lookupAccountByURI, removeAccount, updateAccount, findInbox } = require("./lib/addAccount")
const { addLike, removeLike } = require("./lib/addLike")
const { addAnnounce, removeAnnounce } = require("./lib/addAnnounce")
const { startAPLog, endAPLog } = require("./lib/aplog");
const { addMessage, removeMessage, updateMessage } = require('./lib/addMessage');
const { addActivity } = require("./lib/addActivity")
const { verifySign, makeDigest } = require("./lib/verifySign");
const { Message, Account, Activity } = require('./models/db');
const { handleActivity, unhandled } = require('./lib/handleActivity');
const { loadRecipients, loadRecipientsByList } = require('./lib/loadRecipientsByList');
const { signAndSend } = require('./lib/signAndSend');

/* BODY PARSER */
var bodyParser = require('body-parser')
router.use(bodyParser.json({type: 'application/json'})); // support json encoded bodies
router.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

router.get('/:username', async function (req, res) {
    const aplog = await startAPLog(req)
    let name = req.params.username;
    let domain = req.app.get('domain');

    await loadActorByUsername(name, domain)
    .then(async(data) => {
        await endAPLog(aplog, data);
        res.json(data);
    })
    .catch(async(err) => {
        await endAPLog(aplog, err.msg, err.statuscode)
        res.sendStatus(err.statuscode).send("Error at /u/"+name+": "+err.msg)
    })
});

router.get('/:username/followers', async function (req, res) {
    const aplog = await startAPLog(req)
    let username = req.params.username;
    let domain = req.app.get('domain');
    const page = req.query.page ? req.query.page : 0;

    // Check user
    const uri = await Account.query().where("handle", "=", username+"@"+domain).first()
    .then((account) => {
        return account.uri;
    })
    .catch(async(e) => {
        console.error(e)
        await endAPLog(aplog, "Username not found", 404)
        return res.sendStatus(404);
    })

    // Load items and wrap
    await loadFollowersByUri(uri, page)
    .then(async (followersCollection) => {
        await endAPLog(aplog, followersCollection)
        res.json(followersCollection);
    })
    .catch(async(e) => {
        console.log(e)
        await endAPLog(aplog, e, 500)
        res.sendStatus(500);
    });    
});

router.get('/:username/following', async function (req, res) {
    const aplog = await startAPLog(req)
    let username = req.params.username;
    let domain = req.app.get('domain');
    const page = req.query.page ? req.query.page : 0;
    
    // Check user
    const uri = await Account.query().where("handle", "=", username+"@"+domain).first()
    .then((account) => {
        return account.uri;
    })
    .catch(async(e) => {
        console.error(e)
        await endAPLog(aplog, "Username not found", 400)
        return res.sendStatus(400);
    })
    
    // Load items and wrap
    await loadFollowingByUri(uri, page)
    .then(async (followersCollection) => {
        await endAPLog(aplog, followersCollection)
        res.json(followersCollection);
    })
    .catch(async(e) => {
        await endAPLog(aplog, e, 500)
        res.statusCode(500);
    });
});


router.get(["/:username/outbox"], async(req, res) => {
    const aplog = await startAPLog(req)
    const { username } = req.params;
    const { page } = req.query;
    const domain = req.app.get('domain');
    
    // Check user
    const user_uri = await Account.query().where("handle", "=", username+"@"+domain).select("uri").first()
        .then((d) => { return d.uri })
        .catch((e) => { res.sendStatus(500)})
    
    // Load items
    const activities = await Activity.query()
    .where("actor", "=", user_uri)
    .select("uri as id", "type", "createdAt as published", "object")
    .then((activities) => {
        const all = activities.map((a) => {
            return { ...a, to: ["https://www.w3.org/ns/activitystreams#Public"], cc: [ user_uri + "/followers" ], actor: user_uri };
        })
        return all;
    })
    /*const messages = await Message.query().where("attributedTo", user_uri)
        .withGraphFetched("[addressees]")
        .then(async(messages) => {
            var output = new Array();
            for(let message of messages){
                const { to, cc } = addresseesToString(message.addressees)
                output.push(await makeMessage(message.type, username, domain, message.guid, { published: message.publishedAt, content: message.content, to, cc }))
            }
            return output;
        })*/
    
    // Wrap
    const id = "https://"+domain+"/u/"+username+"/outbox";
    const data = wrapInOrderedCollection(id, activities);
    await endAPLog(aplog, data)
    res.json(data)
})

router.get(["/:username/collections/featured"], async(req, res) => {
    // MASTODON = https://todon.eu/users/kzxpr/collections/featured
    const aplog = await startAPLog(req)
    const { username } = req.params;
    const { page } = req.query;
    const domain = req.app.get('domain');
    const context = new Array("https://www.w3.org/ns/activitystreams")

    // Check user
    const user_uri = await Account.query().where("handle", "=", username+"@"+domain).select("uri").first()
        .then((d) => { return d.uri })
        .catch((e) => { res.sendStatus(500)})
    
    // Load items
    const messages = await Message.query().where("attributedTo", user_uri).andWhere("pinned", "=", 1)
        .withGraphFetched("[addressees]")
    .then(async(messages) => {
        var output = new Array();
        for(let message of messages){
            const { to, cc} = addresseesToString(message.addressees)
            output.push(await makeMessage(message.type, username, domain, message.guid, { published: message.publishedAt, content: message.content, to, cc }));
        }
        return output;
    })

    // Wrap
            
    // type = OrderedCollection vs OrderedCollectionPage
    const data = {
        "@context": context,
        "id": "https://"+domain+"/u/"+username+"/collections/featured",
        "type": "OrderedCollection",
        "totalItems": messages.length,
        "orderedItems": messages
    }
    await endAPLog(aplog, data)
    res.json(data)    
})

router.get("/:username/statuses/:messageid", async (req, res) => {
    const aplog = await startAPLog(req)
    const { username, messageid } = req.params;
    const domain = req.app.get('domain');
    const uri = "https://"+domain+"/u/"+username+"/statuses/"+messageid;
    const messages = await Message.query().where("uri", "=", uri).first()
        .then(async (message) => {
            //console.log("M", uri, message)
            if(message){
                const msg = await makeMessage(message.type, username, domain, message.guid, {published: message.publishedAt, content: message.content});
                
                /* IT SEEMS LIKE THIS SHOULD *NOT* BE WRAPPED */

                await endAPLog(aplog, msg)
                res.json(msg)
            }else{
                await endAPLog(aplog, "The message you requested doesn't exist", 404)
                res.sendStatus(404)
            }
        })
        .catch(async(e) => {
            console.error(e)
            await endAPLog(aplog, e, 500)
            res.sendStatus(500)
        })
})

router.post(['/inbox', '/:username/inbox'], async function (req, res) {
    console.log("What's in inbox?", req)
    console.log("CONTENT", JSON.stringify(req.body))
    const username = req.params.username || "!shared!";
    let domain = req.app.get('domain');
    const aplog = await startAPLog(req)
    const reqtype = req.body.type;

    console.log(clc.blue("POST /inbox"), "to "+username+" ("+reqtype+") from "+req.body.actor)

    try {
        // VALIDATE DIGEST
        const digest = makeDigest(JSON.stringify(req.body));
        if(digest!=req.headers.digest){
            console.log("DIGEST DOESN'T MATCH");//, digest, req.headers)
            //throw new Error("Digest doesn't match")
        }

        // VERIFY BY SIGNATURE
        var publicKey;
        const account = await lookupAccountByURI(req.body.actor)
        
        if(account){
            publicKey = account.pubkey;
        }else{
            throw new Error("External account not found - so no public key!!!!!!!")
        }

        //   const digest = crypto.createHash('sha256').update(JSON.stringify(body)).digest('base64');
        console.log("WHAT TO VERIFY!", req.headers)
        const verified = verifySign({ method: 'POST', url: req.originalUrl, ...req.headers}, publicKey);
        if(!verified){
            throw new Error("Signature invalid")
        }
    } catch(e) {
        console.log(clc.red("ERROR"), "doing lookupAccountByURI", e)
        await endAPLog(aplog, e, 400)
        res.sendStatus(400) // bad request!
        return;
    }

    console.log("I'm done here")

    // CHECK IF ACTIVITY IS ALREADY REGISTERED - IF NOT, ADD ACTIVITY
    try{
        const proceed = await addActivity(req.body)
        if(!proceed){
            //throw new Error("Activity already in DB")
            await unhandled({ statuscode: 200, msg: "Activity already in DB" })
        }
    } catch(e) {
        // IGNORE!!!!!
        console.log(clc.cyan("IGNORING"), "activity already in DB", e)
        await endAPLog(aplog, "Activity already in DB", 208)
        res.sendStatus(208)
        return;
    }

    console.log("We're down here!", req.body)

    try {
        const resp = await handleActivity(reqtype, req.body)
        const statuscode = resp.statuscode || 200;
        const data = resp.data || null;
        const msg = resp.msg || "";
        
        console.log(clc.green("SUCCESS"), msg)
        if(statuscode != 200){
            await endAPLog(aplog, msg, statuscode)
            res.sendStatus(statuscode);
            return;
        }else{
            await endAPLog(aplog, msg)
            res.send(data)
            return;
        }
        
    } catch(e) {
        console.log(clc.red("ERROR"), e)
        const statuscode = e.statuscode || 500;
        res.sendStatus(statuscode);
        return;
    }    
});

/**
 * This requires a FINISHED Activity object!
 */
router.post('/:username/outbox', async function (req, res) {
    const username = req.params.username;
    let domain = req.app.get('domain');
    const aplog = await startAPLog(req)
    const { to, cc, actor, type, id } = req.body;
    const { authorization, host } = req.headers;

    console.log(clc.blue("POST /outbox"), "("+type+") from "+actor)

    /* AUTHORIZATION */
    if(host!=domain){
        // TO-DO: I'm not sure this is working!
        console.log("UNAUTHORIZED")
        await endAPLog(aplog, "Unauthorized host", 405)
        res.sendStatus(405);
        return;
    }

    /* CHECK APIKEY */
    const account_uri = "https://"+domain+"/u/"+username;
    const account = await Account.query().where("uri", "=", account_uri).select("apikey").first();
    const apikey = account.apikey;

    if(apikey && authorization != "Bearer "+apikey){
        console.log("REQ", authorization)
        await endAPLog(aplog, "Unauthorized Bearer", 405)
        res.sendStatus(405);
        return;
    }

    /* COMBINE 'to' AND 'cc' TO RECIPIENT LIST */
    let recipient_list = to;
    if(Array.isArray(cc)){
        recipient_list = to.concat(cc);
    }

    /* Resolve all recipients */
    const recipients = await loadRecipientsByList(recipient_list, actor)

    /* ADD ACTIVITY TO DATABASE */
    let statuscode;
    try {
        await handleActivity(type, wrapped)
        console.log("DOWN HERE!", id)
        // Activity was created - Set statuscode to 201
        statuscode = 201;
        res.setHeader("Location", id)
    } catch(e) {
        console.log(e)
        statuscode = 500;
        await endAPLog(aplog, "unknown error", statuscode)
        res.sendStatus(statuscode);
        return;
    }
    
    console.log("READY TO SEND...")
    /* SEND IT! */
    var sent_log = {
        err: 0,
        logs: []
    };
    for(let recipient of recipients){
        await findInbox(recipient)
        .then(async(inbox) => {
            console.log("Send to inbox", inbox)
            let recipient_url = new URL(recipient);
            let targetDomain = recipient_url.hostname;
            await signAndSend(req.body, account_uri, targetDomain, inbox, apikey)
                .then((data) => {
                    console.log(clc.green("SUCCESS:"), "Sent to", recipient, ":", data)
                    sent_log.logs.push({
                        user: recipient,
                        status: "ok"
                    })
                })
                .catch((err) => {
                    console.error(err)
                    sent_log.logs.push({
                        user: recipient,
                        status: err
                    })
                    sent_log.err++;
                })
        })
        .catch((e) => {
            console.error("Could not findInbox for "+recipient, e)
            sent_log.logs.push({
                user: recipient,
                status: e
            })
            sent_log.err++;
        })
    }

    if(statuscode != 201){
        await endAPLog(aplog, "Unhandled error", statuscode)
        res.sendStatus(statuscode);
        return;
    }else{
        await endAPLog(aplog, sent_log)
        res.send(sent_log)
    }
});

router.all("*", async(req, res) => {
    //const aplog = await startAPLog(req)
    //await endAPLog(aplog, "", 404)
    res.sendStatus(404)
})

module.exports = router;