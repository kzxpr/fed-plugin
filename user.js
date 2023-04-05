'use strict';
const express = require('express');
const router = express.Router();

const db = require("./../../knexfile")
const knex = require("knex")(db)
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
const { Message } = require('../models/db');

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
    console.log("lol")
    const aplog = await startAPLog(req)
    let username = req.params.username;
    let domain = req.app.get('domain');

    const uri = await knex("apaccounts").where("handle", "=", username+"@"+domain).first()
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
    
    const uri = await knex("apaccounts").where("handle", "=", username+"@"+domain).first()
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
    
    const user_uri = await knex("apaccounts").where("handle", "=", username+"@"+domain).select("uri").first()
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
    const user_uri = await knex("apaccounts").where("handle", "=", username+"@"+domain).select("uri").first()
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
    const messages = await knex("apmessages").where("uri", "=", uri).first()
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

router.post(['/inbox', '/:username/inbox'], async function (req, res) {
    const aplog = await startAPLog(req)
    const username = req.params.username || "!shared!";
    let domain = req.app.get('domain');
    console.log("POST", clc.blue("/inbox"), "to "+username+" ()", req.body)
    console.log(req.body.actor)
    const myURL = new URL(req.body.actor);
    let targetDomain = myURL.hostname;
    const reqtype = req.body.type;

    console.log("POST", clc.blue("/inbox"), "to "+username+" ("+reqtype+") from "+req.body.actor)

    /* VERIFY DIGEST */
    //const body_without_signature = req.body;
    //delete body_without_signature.signature;
    //delete body_without_signature.object.replies;
    //console.log(body_without_signature)
    const digest = makeDigest(req.body);
    if(digest!=req.headers.digest){
        console.log("DIGEST DOESN'T MATCH");//, digest, req.headers)
        /*await endAPLog(aplog, "Digest invalid", 401)
        res.sendStatus(401)
        return;*/
    }else{
        console.log("VALID DIGEST");//, digest, req.headers, JSON.stringify(req.body))
    }

    // VERIFY BY SIGNATURE
    var publicKey = "";
    const account = await knex("apaccounts").where("uri", "=", req.body.actor).select("pubkey").first();
    if(account){
        publicKey = account.pubkey;
    }else{
        console.log("Account not found!!!!!!!")
        await endAPLog(aplog, "Account not found in DB", 404)
        res.sendStatus(404)
        return;
    }
    
    const verified = verifySign({ method: 'POST', url: req.originalUrl, ...req.headers}, req.body, publicKey);
    if(!verified){
        await endAPLog(aplog, "Signature invalid", 401)
        res.sendStatus(401)
        return;
    }

    // CHECK TO ADD ACTIVITY
    await addActivity(req.body)
    .then(async(proceed) => {
        if(proceed){
            // PROCEEDThis is the content of the message <i>including</i> HTML
            console.log("PROCEEDING....")
            const sender = await knex("apaccounts").where("uri", "=", req.body.actor)
                .then((rows) => {
                    if(rows.length==1){
                        return rows[0]
                    }else{
                        console.warn("Ingen ACTOR in apaccounts...", req.body.actor)
                        return {};
                    }
                })

            if(reqtype === 'Create'){
                const objtype = req.body.object.type;
                if(objtype==="Note"){
                    await addMessage(req.body.object)
                    .then((d) => {
                        console.log("I created a note saying",req.body.object.content)
                    })
                    .catch((e) => {
                        console.error("ERROR in /inbox", e)
                    })
                    await endAPLog(aplog, "Received note", 201)
                    res.sendStatus(201)
                }else if(objtype==="Article"){
                    console.log("I got a article saying",req.body.object.content)
                    addMessage(req.body.object)
                    await endAPLog(aplog, "Received article", 201)
                    res.sendStatus(201)
                }else if(objtype=="Question"){
                    console.log("I got a question saying", req.body.object.content)
                    addMessage(req.body.object)
                    await endAPLog(aplog, "Received question", 201)
                    res.sendStatus(201)
                }else{
                    await endAPLog(aplog, "Received create, but object type wasn't recognized", 500)
                    console.warn("UNHANDLED RECEIVED", objtype)
                    res.sendStatus(500)
                }
            }else if(reqtype == 'Follow'){
                if(typeof req.body.object === 'string'){
                    const local_uri = req.body.object;
                    await knex("apaccounts").where("uri", "=", local_uri).first()
                    .then(async(account) => {
                        if(account){
                            const follower_uri = req.body.actor;
                            await lookupAccountByURI(follower_uri)
                                .then(async(follower_account) => {

                                    await addFollower(local_uri, follower_uri)
                                    await sendAcceptMessage(req.body, local_uri, targetDomain, domain)
                                    await sendLatestMessages(follower_uri, local_uri)
                                    .then(async(d) => {
                                        await endAPLog(aplog, "Pinned messages were sent to new follower: "+follower_uri)
                                        res.sendStatus(200)
                                    })
                                    .catch(async(e) => {
                                        console.error("ERROR in sendLatestMessages", e)
                                        await endAPLog(aplog, "ERROR in sendLatestMessages", 500)
                                        res.sendStatus(500)
                                    })
                                })
                                .catch((err) => {
                                    console.error(err)
                                    console.error("ERROR doing lookupAccountByURI", follower_uri)
                                    res.sendStatus(500)
                                })
                        }else{
                            res.sendStatus(404)
                        }
                    });
                }else{
                    console.error("I got a follow request I can't handle because object is not a string!", req.body.object)
                    res.sendStatus(500)
                }
            }else if(reqtype == 'Like'){
                if(typeof req.body.object === 'string'){
                    const message_uri = req.body.object;
                    await knex("apmessages").where("uri", "=", message_uri).first()
                    .then(async(message) => {
                        console.log("Message is here!")
                        if(message){
                            const follower_uri = req.body.actor;
                            await lookupAccountByURI(follower_uri)
                                .then(async(follower_account) => {
                                    await addLike(message_uri, follower_uri)
                                    await endAPLog(aplog, "Added like")
                                    res.sendStatus(200)
                                });
                        }else{
                            await endAPLog(aplog, "ERROR: Message to like not found", 404)
                            res.sendStatus(404)
                        }
                    })
                    .catch(async(e) => {
                        await endAPLog(aplog, "ERROR looking up message to like", 500)
                        res.sendStatus(500)
                    })
                }else{
                    await endAPLog(aplog, "Type of like object is not string", 400)
                    res.sendStatus(400)
                }
            }else if(reqtype == 'Announce'){
                if(typeof req.body.object === 'string'){
                    const message_uri = req.body.object;
                    await knex("apmessages").where("uri", "=", message_uri).first()
                    .then(async(message) => {
                        if(message){
                            const follower_uri = req.body.actor;
                            await lookupAccountByURI(follower_uri)
                                .then(async(follower_account) => {
                                    await addAnnounce(message_uri, follower_uri)
                                    await endAPLog(aplog, "Added announce")
                                    res.sendStatus(200)
                                })
                                .catch(async(e) => {
                                    await endAPLog(aplog, "ERROR in addAnnounce: "+e, 500)
                                    res.sendStatus(500)
                                })
                        }else{
                            await endAPLog(aplog, "Message not found", 404)
                            res.sendStatus(404)
                        }
                    })
                    .catch(async(e) => {
                        await endAPLog(aplog, "ERROR looking up message to like", 500)
                        res.sendStatus(500)
                    })
                }else{
                    console.error("Type of like object is not string")
                    res.sendStatus(400)
                }
            }else if(reqtype == 'Undo'){
                if(typeof req.body.object === 'object'){
                    const undo_object = req.body.object;
                    const undo_type = undo_object.type;
                    const actor = undo_object.actor;
                    const object = undo_object.object;

                    if(undo_type=="Follow"){    
                        await removeFollower(object, actor)
                            .then(async(d) => {
                                await endAPLog(aplog, "Removed follower")
                                res.sendStatus(200)
                            })
                            .catch(async(e) => {
                                await endAPLog(aplog, "Some error while removing follower: "+e, 500)
                                res.sendStatus(500)
                            })
                    }else if(undo_type=="Like"){
                        await removeLike(object, actor)
                            .then(async(d) => {
                                await endAPLog(aplog, "Removed like")
                                res.sendStatus(200)
                            })
                            .catch(async(e) => {
                                await endAPLog(aplog, "Some error while removing like: "+e, 500)
                                res.sendStatus(500)
                            })
                    }else if(undo_type=="Announce"){
                        await removeAnnounce(object, actor)
                            .then(async(d) => {
                                await endAPLog(aplog, "Removed announce")
                                res.sendStatus(200)
                            })
                            .catch(async(e) => {
                                await endAPLog(aplog, "Some error while removing announce: "+e, 500)
                                res.sendStatus(500)
                            })
                    }else{
                        await endAPLog(aplog, "Unknown undo-type"+undo_type, 500)
                        res.sendStatus(500)
                    }
                }else{
                    await endAPLog(aplog, "Can't handle non-object for Undo", 500)
                    res.sendStatus(500)
                }
            }else if(reqtype=="Delete"){
                const actor = req.body.actor;
                const object = req.body.object;

                // HOW TO DETERMINE TYPE OF DELETE...
                if(actor == object){
                    // PROBABLY WANT TO DELETE USER...
                    // TO-DO: This should cascade!
                    await removeAccount(actor)
                        .then(async(msg) => {
                            await endAPLog(aplog, msg)
                            res.sendStatus(200)
                        })
                        .catch(async(e) => {
                            await endAPLog(aplog, e, 500)
                            res.sendStatus(500)
                        })
                }else if(typeof object === 'object'){
                    const msg_id = object.id;
                    await removeMessage(msg_id, actor)
                        .then(async(msg) => {
                            await endAPLog(aplog, msg)
                            res.sendStatus(200)
                        })
                        .catch(async(e) => {
                            await endAPLog(aplog, e, 500)
                            res.sendStatus(500)
                        })
                }else{
                    await endAPLog(aplog, "No idea what to do???", 500)
                    res.sendStatus(500)
                }
            }else if(reqtype=="Update"){
                // RECEIVE UPDATE
                console.log("UPDATE TRIGGER")

                // GET VALUES
                const actor = req.body.actor;
                const object = req.body.object;
                const id = object.id;

                if(typeof object === "object"){
                    if(object.type=="Person"){
                        // UPDATE
                        if(id==actor){
                            // ALLOWED
                            await updateAccount(object)
                            .then(async(msg) => {
                                await endAPLog(aplog, msg)
                                res.sendStatus(200)
                            })
                            .catch(async(e) => {
                                await endAPLog(aplog, "ERROR from updateAccount: "+e)
                                res.sendStatus(500)
                            })
                        }else{
                            await endAPLog(aplog, "Update denied: Actor "+actor+" cannot change Account for "+id, 401)
                            res.sendStatus(401)
                        }
                    }else{
                        // ASSUMING THIS GOES TO MESSAGES...
                        if(object.attributedTo == actor){
                            // ALLOWED
                            await updateMessage(object)
                                .then(async(msg) => {
                                    await endAPLog(aplog, msg)
                                    res.sendStatus(200)
                                })
                                .catch(async(e) => {
                                    await endAPLog(aplog, "ERROR from updateMessage: "+e)
                                    res.sendStatus(500)
                                })
                            // TO-DO: This should also influence 'to', 'cc', 'hashtags' and other related tables
                        }else{
                            await endAPLog(aplog, "Update denied: Actor "+actor+" cannot change Message for "+id, 401)
                            res.sendStatus(401)
                        }
                    }
                }else{
                    await endAPLog(aplog, "Don't know how to handle non-object Update", 500)
                    res.sendStatus(500)
                }
            }else if(reqtype=="Accept"){
                const accept_from = req.body.actor;
                const accept_to = req.body.object.actor;
                const accept_id = req.body.object.id;

                // TO-DO: Confirm accept_id to make sure
                // that the follow request has actually been sent!
                
                // TO-DO: Add a 'update' to old followers
                // to update the list of followers

                await addFollower(accept_from, accept_to).then(async(msg) => {
                    await endAPLog(aplog, "A follow was accepted ("+accept_from+" to "+accept_to+"): "+msg)
                    res.sendStatus(200)
                })
                .catch(async(e) => {
                    await endAPLog(aplog, "ERROR while adding follower "+accept_from+" to "+accept_to+": "+e, 500)
                    res.sendStatus(500)
                })
                
            }else{
                await endAPLog(aplog, "REQ type is not recognized...", 400)
                res.sendStatus(400)
            }
        }else{
            // IGNORE!!!!!
            console.log("Activity already in DB")
            await endAPLog(aplog, "Activity already in DB")
            res.sendStatus(200)
        }
    })
    .catch((e) => {
        console.warn("ERROR in addActivity", e)
        res.sendStatus(500)
    })
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