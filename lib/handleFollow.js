const { Account } = require("../models/db");
const { lookupAccountByURI } = require("./addAccount");
const { addFollower } = require("./addFollower");
const { sendAcceptMessage } = require("./sendAcceptMessage");
const { sendLatestMessages } = require("./sendLatestMessages");

async function handleFollow(body, domain){
    return new Promise(async(resolve, reject) => {
        const myURL = new URL(body.actor);
        let targetDomain = myURL.hostname;
        if(typeof body.object === 'string'){
            const local_uri = body.object;
            await Account.query()
            .where("uri", "=", local_uri).first()
            .then(async(account) => {
                if(account){
                    const follower_uri = body.actor;
                    await lookupAccountByURI(follower_uri)
                    .then(async(follower_account) => {
                        await addFollower(local_uri, follower_uri)
                        await sendAcceptMessage(body, local_uri, targetDomain, domain)
                        await sendLatestMessages(follower_uri, local_uri)
                        .then(async(d) => {
                            resolve({ msg: "Pinned messages were sent to new follower: "+follower_uri })
                        })
                        .catch(async(e) => {
                            reject({ statuscode: 500, msg: e })
                        })
                    })
                    .catch((e) => {
                        reject({ statuscode: 500, msg: e })
                    })
                }else{
                    reject({ statuscode: 404, msg: e })
                }
            });
        }else{
            reject({ statuscode: 500, msg: "I got a follow request I can't handle because object is not a string!" })
        }
    });
}

module.exports = { handleFollow }