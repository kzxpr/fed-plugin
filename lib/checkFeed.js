const { findOutbox, lookupAccountByURI } = require("./addAccount")
const { getObjectItem } = require("./ap-feed")
const { addMessage, unwrapMessage } = require("./addMessage");
const { Message, Addressee } = require("../models/db")

function getFollowed(){
    // this should somehow exclude users on the same server.....?
    //return ["https://todon.eu/users/kzxpr", "https://todon.nl/users/NOISEBOB", "https://kolektiva.social/users/glaspest", "https://mastodon.social/users/NilsenMuseum"];//, "https://libranet.de/profile/kzxpr"]
    return [];
    //return ["AMOK@todon.nl", "kzxpr@todon.eu"];//, "NOISEBOB@todon.nl", "djhnm@www.yiny.org", "NilsenMuseum@mastodon.social", "pxsx@todon.nl"]; //"asbjorn@norrebro.space", "apconf@conf.tube", "schokoladen@mobilize.berlin", "kzasdxpr@todon.eu"];
}

async function checkOrphans(){
    return new Promise(async(resolve, reject) => {
        // Then look for inReplyTo-tags
        const threaded_msg = await Message.query().whereNotNull("inReplyTo")
        .withGraphFetched("repliedto")
        .then(async(orphans) => {
            for(let orphan of orphans){
                if(orphan.repliedto==null){
                    const orphan_uri = orphan.inReplyTo;

                    // lookup message
                    await getObjectItem(orphan_uri, { Accept: 'application/activity+json' })
                    .then(async (message) => {
                        await addMessage(message)
                        .then((d) => {
                            resolve("OK")
                        })
                        .catch((e) => {
                            console.error("E", e)
                            reject("Error adding message: "+orphan_uri)
                        })
                    })
                    .catch((e) => {
                        console.error("ERROR looking up the orphan message on server...", e)
                        reject("Error looking up message: "+orphan_uri)
                    })
                }
            }
        })
    })
}

async function checkFeed(req, res){
    const follows = getFollowed();
    for(let follow of follows){
        const outbox_uri = await findOutbox(follow);
        console.log(follow, "=", outbox_uri)
        await getObjectItem(outbox_uri, { Accept: 'application/activity+json' })
        .then(async(outboxObj) => {
            //console.log(outboxObj)
            const firstpage = outboxObj.first;
            await getObjectItem(firstpage, { Accept: 'application/activity+json' })
            .then(async(outboxpage) => {
                //console.log(outboxpage)
                const messages = outboxpage.orderedItems;
                for(let message of messages){
                    const msg = unwrapMessage(message)
                    await addMessage(msg)
                    .then((data) => {
                        console.log("Found message", msg.id)
                    })
                    .catch((e) => {
                        console.warn("ERROR in addMessage for "+msg.id)
                    })
                }
            })
            .catch((e) => {
                console.warn("ERROR fetching firstpage")
            })
        })
        .catch((e) => {
            console.warn("ERROR while getObjectItem on "+outbox_uri, e)
        })
    }

    await checkOrphans()
    .then((d) => {
        console.log("Checking orphans")
    })
    .catch((e) => {
        console.error("ERROR checking orphans", e)
    })

        // NOW IT HAS IMPORTED ALL (NEW) MESSAGES, THEN LOOKUP NEW ADDRESSEES AND ADD THEIR ACCOUNTS
        await Addressee.query().select("account_uri").where("type", "=", 0).groupBy("account_uri")
            .then(async(addressees) => {
                //console.log("ALL ADDREESEES", addressees)
                for(let addressee of addressees){
                    if(addressee.account_uri != ""){
                        const addressee_uri = addressee.account_uri;
                        await lookupAccountByURI(addressee_uri)
                            .then((data) => {
                                //console.log("ok")
                            })
                            .catch((e) => {
                                console.error("ERROR in checkFeed for lookupAccountByURI on "+addressee_uri)
                            })
                    }
                }
            })
            .catch((e) => {
                console.error("ERROR looking up addreesees", e)
            })
    
    res.send("OK")
}

module.exports = { checkFeed }