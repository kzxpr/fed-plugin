'use strict';
const express = require('express');
const router = express.Router();

const clc = require('cli-color');

const { loadActorByUsername } = require("./lib/loadActorByUsername")
const { loadFollowersByUri, loadFollowingByUri } = require("./lib/loadFollowersByUsername")
const { makeMessage } = require("./lib/makeMessage");
const { wrapInCreate, wrapInOrderedCollection } = require('./lib/wrappers');
const { sendAcceptMessage } = require("./lib/sendAcceptMessage")
const { sendLatestMessages, addresseesToString } = require("./lib/sendLatestMessages")
const { addFollower, removeFollower } = require("./lib/addFollower")
const { lookupAccountByURI, removeAccount, updateAccount } = require("./lib/addAccount")
const { addLike, removeLike } = require("./lib/addLike")
const { addAnnounce, removeAnnounce } = require("./lib/addAnnounce")
const { startAPLog, endAPLog } = require("./lib/aplog");
const { addMessage, removeMessage, updateMessage } = require('./lib/addMessage');
const { addActivity } = require("./lib/addActivity")
const { verifySign, makeDigest } = require("./lib/verifySign");
const { Message, Account } = require('./models/db');
const { handleCreate } = require('./lib/handleCreate');
const { handleFollow } = require('./lib/handleFollow');
const { handleLike } = require('./lib/handleLike');
const { handleAnnounce } = require('./lib/handleAnnounce');
const { handleUndo } = require('./lib/handleUndo');
const { handleDelete } = require('./lib/handleDelete');
const { handleUpdate } = require('./lib/handleUpdate');
const { handleAccept } = require('./lib/handleAccept');

router.get('/:username', async function (req, res) {
    const aplog = await startAPLog(req)
    let name = req.params.username;
    let domain = req.app.get('domain');
    if (!name) {
        await endAPLog(aplog, "No username provided", 404)
        return res.status(404);
    } else {
        loadActorByUsername(name, domain)
        .then(async(data) => {
            await endAPLog(aplog, data);
            res.json(data);
        })
        .catch(async(err) => {
            await endAPLog(aplog, err.msg, err.statuscode)
            res.status(err.statuscode).send("Error at /u/"+name+": "+err.msg)
        })
    }
});

router.get('/:username/followers', async function (req, res) {
    const aplog = await startAPLog(req)
    let username = req.params.username;
    let domain = req.app.get('domain');

    const uri = await Account.query().where("handle", "=", username+"@"+domain).first()
    .then((account) => {
        return account.uri;
    })
    .catch(async(e) => {
        console.error(e)
        await endAPLog(aplog, "Username not found", 404)
        return res.status(404).send('Bad request.');
    })

    const page = req.query.page ? req.query.page : 0;

    loadFollowersByUri(uri, page)
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
    
    const uri = await Account.query().where("handle", "=", username+"@"+domain).first()
        .then((account) => {
            return account.uri;
        })
        .catch(async(e) => {
            console.error(e)
            await endAPLog(aplog, "Username not found", 400)
            return res.status(400).send('Bad request.');
        })
        
        loadFollowingByUri(uri, page)
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
    
    const user_uri = await Account.query().where("handle", "=", username+"@"+domain).select("uri").first()
        .then((d) => { return d.uri })
        .catch((e) => { res.sendStatus(500)})
    const messages = await Message.query().where("attributedTo", user_uri)
        .withGraphFetched("[addressees]")
        .then(async(messages) => {
            var output = new Array();
            for(let message of messages){
                const { to, cc} = addresseesToString(message.addressees)
                output.push(await makeMessage(message.type, username, domain, message.guid, { published: message.publishedAt, content: message.content, to, cc }))
            }
            return output;
        })
    const id = "https://"+domain+"/u/"+username+"/outbox";
    const data = wrapInOrderedCollection(id, messages);
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
    const user_uri = await Account.query().where("handle", "=", username+"@"+domain).select("uri").first()
        .then((d) => { return d.uri })
        .catch((e) => { res.sendStatus(500)})
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

router.get("/:username/inbox", async(req, res) => {
    console.log("TRIGGER get /inbox")
    res.sendStatus(404)
})

async function unhandled(obj){
    return new Promise((resolve, reject) => {
        reject(obj)
    })
}

router.post(['/inbox', '/:username/inbox'], async function (req, res) {
    const username = req.params.username || "!shared!";
    let domain = req.app.get('domain');
    const aplog = await startAPLog(req)
    const reqtype = req.body.type;

    console.log("POST", clc.blue("/inbox"), "to "+username+" ("+reqtype+") from "+req.body.actor)

    try {
        // VALIDATE DIGEST
        const digest = makeDigest(req.body);
        if(digest!=req.headers.digest){
            console.log("DIGEST DOESN'T MATCH");//, digest, req.headers)
            throw new Error("Digest doesn't match")
        }

        // VERIFY BY SIGNATURE
        var publicKey;
        const account = await lookupAccountByURI(req.body.actor)
        
        if(account){
            publicKey = account.pubkey;
        }else{
            throw new Error("External account not found - so no public key!!!!!!!")
        }

        const verified = verifySign({ method: 'POST', url: req.originalUrl, ...req.headers}, req.body, publicKey);
        if(!verified){
            throw new Error("Signature invalid")
        }
    } catch(e) {
        console.log("ERROR doing lookupAccountByURI", e)
        res.sendStatus(400) // bad request!
        return;
    }

    // CHECK IF ACTIVITY IS ALREADY REGISTERED - IF NOT, ADD ACTIVITY
    try{
        const proceed = await addActivity(req.body)
        if(!proceed){
            //throw new Error("Activity already in DB")
            await unhandled({ statuscode: 200, msg: "Activity already in DB" })
        }
    } catch(e) {
        // IGNORE!!!!!
        console.log(e)
        await endAPLog(aplog, e)
        res.sendStatus(200)
    }

    try {
        let resp;
        console.log("Let's handle reqtype", reqtype)
        switch(reqtype){
            case 'Create': resp = await handleCreate(req.body); break;
            case 'Follow': resp = await handleFollow(req.body, domain); break;
            case 'Like': resp = await handleLike(req.body); break;
            case 'Announce': resp = await handleAnnounce(req.body); break;
            case 'Undo': resp = await handleUndo(req.body); break;
            case 'Delete': resp = await handleDelete(req.body); break;
            case 'Update': resp = await handleUpdate(req.body); break;
            case 'Accept': resp = await handleAccept(req.body); break;
            default:
                resp = await unhandled({ statuscode: 500, msg: "REQ type not recognized in /inbox"});
                break;
        }
        const statuscode = resp.statuscode || 200;
        const data = resp.data || null;
        const msg = resp.msg || "";
        console.log(clc.green("SUCCESS"), msg)
        if(statuscode != 200){
            await endAPLog(aplog, msg, statuscode)
            res.sendStatus(statuscode);
        }else{
            await endAPLog(aplog, msg)
            res.send(data)
        }
        
    } catch(e) {
        console.log(e.msg)
        const statuscode = e.statuscode || 500;
        res.status(statuscode);
    }    
});

router.get("*", async(req, res) => {
    //const aplog = await startAPLog(req)
    //await endAPLog(aplog, "", 404)
    res.sendStatus(404)
})

router.post("*", async(req, res) => {
    //const aplog = await startAPLog(req)
    //await endAPLog(aplog, "", 404)
    res.sendStatus(404)
})

module.exports = router;