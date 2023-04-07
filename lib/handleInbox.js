const clc = require('cli-color');

const { startAPLog, endAPLog } = require("./aplog");
const { verifySign, makeDigest } = require("./verifySign");
const { lookupAccountByURI, removeAccount, updateAccount } = require("./addAccount")
const { addActivity } = require("./addActivity")

async function handleInbox(username, domain, req){
    return new Promise(async(resolve, reject) => {  
        //console.log(req.body.actor)
        const myURL = new URL(req.body.actor);
        let targetDomain = myURL.hostname;
        const reqtype = req.body.type;

        console.log("POST", clc.blue("/inbox"), "to "+username+" ("+reqtype+") from "+req.body.actor)

        /* VERIFY DIGEST */
        const digest = makeDigest(req.body);
        
        if(digest!=req.headers.digest){
            reject({ status: 401, msg: "Digest doesn't match" })
        }else{
            console.log("Digest is valid")
        }

        
        try {
            // VERIFY BY SIGNATURE
            var publicKey = "";
            const account = await lookupAccountByURI(req.body.actor)

            if(account){
                publicKey = account.pubkey;
            }else{
                reject({ status: 404, msg: "External account not found - so no public key!!!!!!!" })
            }
    
            /*
            THIS NEEDS TO COME BACK!
            const verified = verifySign({ method: 'POST', url: req.originalUrl, ...req.headers}, req.body, publicKey);
            if(!verified){
                reject({ status: 401, msg: "Signature invalid"})
            }*/
        } catch(e) {
            reject({ status: 400, msg: "ERROR doing lookupAccountByURI: "+e })
        }
        

        // CHECK TO ADD ACTIVITY
        await addActivity(req.body)
        .then(async(proceed) => {
            if(proceed){
                // PROCEEDThis is the content of the message <i>including</i> HTML
                console.log("PROCEEDING....")
                const sender = await Account.query().where("uri", "=", req.body.actor)
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
                        await Account.query().where("uri", "=", local_uri).first()
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
                        await Message.query().where("uri", "=", message_uri).first()
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
                        await Message.query().where("uri", "=", message_uri).first()
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
    })
}

async function test(){
    const username = "username"
    let domain = "domain"
    console.log("POST", clc.blue("/inbox"), "to "+username);// req.body)
    const body = {
        type: "Message",
        actor: "https://todon.eu/users/kzxpr222",
        text: "<b>HEJ</b>"
    };
    const digest = "D"+makeDigest(body);
    const req = {
        ip: "12.34.56.78",
        body,
        originalUrl: "orgurl",
        method: "POST",
        headers: {
            digest,
            signature: ""
        }
    }
    const aplog = await startAPLog(req)
    await handleInbox(username, domain, req)
    .then(async(d) => {
        await endAPLog(aplog, d)
        console.log("RES SEND", d)
    })
    .catch(async(e) => {
        console.log(clc.red("RES ERROR"), e.msg)
        await endAPLog(aplog, e.msg, e.status)
        /*res.sendStatus(401)*/
        console.log("SEND "+e.status)
    })
}

test();

module.exports = { handleInbox }