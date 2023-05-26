const { findOutbox, lookupAccountByURI } = require("./addAccount")
const { getObjectItem } = require("./ap-feed")
const { addMessage, unwrapMessage } = require("./addMessage");
const { Message, Addressee } = require("../models/db");
const clc = require("cli-color");
const { addActivity } = require("./addActivity");
const { handleActivity } = require("./handleActivity")

async function checkOrphans(){
    return new Promise(async(resolve, reject) => {
        // Then look for inReplyTo-tags
        const threaded_msg = await Message.query().whereNotNull("inReplyTo")
        .withGraphFetched("repliedto")
        .then(async(orphans) => {
            for(let orphan of orphans){
                if(orphan.repliedto==null){
                    const orphan_uri = orphan.inReplyTo;
                    console.log(clc.yellow("Lookup parent:"), orphan.inReplyTo)

                    // lookup message
                    await getObjectItem(orphan_uri, { Accept: 'application/activity+json' })
                    .then(async (message) => {
                        await addMessage(message)
                        .then((d) => {
                            
                        })
                        .catch((e) => {
                            //console.error("E", e)
                            reject("Error adding message: "+orphan_uri)
                        })
                    })
                    .catch((e) => {
                        //console.error("ERROR looking up the orphan message on server...", e)
                        reject("Error looking up message: "+orphan_uri+". "+e)
                    })
                }
            }
            resolve("OK")
        })
        .catch((e) => {
            reject("Error while looking up threaded messages")
        })
    })
}

async function handleOutboxPage(outboxpage){
    //console.log("PROCESS PAGE", outboxpage)
    const items = outboxpage.orderedItems;
    console.log("PROCESS PAGE")
    console.log("ID", outboxpage.id)
    console.log("LEN", outboxpage.orderedItems.length)
    console.log("NEXT", outboxpage.next)
    console.log("PREV", outboxpage.prev)
    for(let item of outboxpage.orderedItems){
        // Is item (activity) already in table??
        //console.log(item)
        const proceed = await addActivity(item)
        if(proceed){
            console.log("PROCEED")
            const resp = await handleActivity(item.type, item)
            .then((data) => {
                console.log(clc.green("Added item"), data.msg)
            })
            .catch((e) => {
                console.warn(clc.red("ERROR"), "adding item ", e)
            })
        }else{
            console.log("ALREADY IN DB")
        }
    }
    return { next: outboxpage.next }
}

/*async function checkOneFeed(follow_uri){
    const outbox_uri = await findOutbox(follow_uri);
    await getObjectItem(outbox_uri, { Accept: 'application/activity+json' })
    .then(async(outboxObj) => {
        //console.log(outboxObj)
        try{
            var outboxpage;
            if(outboxObj.first){
                const firstpage = outboxObj.first;
                outboxpage = await getObjectItem(firstpage, { Accept: 'application/activity+json' })
            }else{
                outboxpage = outboxObj;
            }
        }catch(e){
            console.warn(clc.red("ERROR"), "fetching firstpage", e)
        }

        await handleOutboxPage(outboxpage)
    })
    .catch((e) => {
        console.warn(clc.red("ERROR"), "while getObjectItem on "+outbox_uri, e)
    })
}*/

async function handleOutbox(follow_uri, maxCrawl = 1){
    // find the outbox from the follow_uri
    const outbox_uri = await findOutbox(follow_uri);

    console.log("WHAT'S IN OUTBOX?", outbox_uri)

    // fetch the first outboxObj
    var outboxpage_uri = await getObjectItem(outbox_uri, { Accept: 'application/activity+json' })
    .then(async(outboxObj) => {
        if(outboxObj.first){
            const firstpage = outboxObj.first;
            return firstpage;
        }else{
            return outbox_uri;
        }
    })
    .catch((e) => {
        console.log("SOME ERROR", e)
    })

    console.log("I GOT FIRST OUTBOX URI", outboxpage_uri)

    // Prepare crawl
    let crawl = true;
    var outboxpage;
    var i = 0;

    // loop
    while(crawl){
        // Get the outboxpage object
        outboxpage = await getObjectItem(outboxpage_uri, { Accept: 'application/activity+json' })

        let { next } = await handleOutboxPage(outboxpage);
        if(next){
            outboxpage_uri = next;
        }else{
            crawl = false;
        }
        i++;
        if(i>maxCrawl){
            crawl = false;
        }
    }
    console.log(clc.green("CRAWL DONE"), "for", follow_uri)
    return;
}

async function checkFeed(follow_uris){
    console.log(clc.blue("Check feed"), "for followers", follow_uris)
    for(let follow of follow_uris){
        await handleOutbox(follow, 1);
    }

    console.log(clc.yellow("Checking orphans"))
    await checkOrphans()
    .then((d) => {
        console.log(clc.green("Checked orphans"))
    })
    .catch((e) => {
        console.error(clc.red("ERROR"), "checking orphans", e)
    })

    console.log(clc.yellow("Checking addressees"))
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
                    console.error(clc.red("ERROR"), "in checkFeed for lookupAccountByURI on "+addressee_uri)
                })
            }
        }
    })
    .catch((e) => {
        console.error(clc.red("ERROR"), "looking up addreesees", e)
    })
    
    return "ok";
}

module.exports = { checkFeed }