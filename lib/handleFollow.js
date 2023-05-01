const { Account } = require("../models/db");
const { lookupAccountByURI } = require("./addAccount");
const { addFollower } = require("./addFollower");

const fed = require("./../index")()

async function handleFollow(body){
    return new Promise(async(resolve, reject) => {
        console.log("handleFollow triggered", body)
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
                        .then(async(d) => {
                            fed.eventHandler.emit("follow:add", body)
                            resolve({ msg: "Added follower: "+follower_uri })
                        })
                        .catch(async(e) => {
                            reject({ statuscode: 500, msg: e })
                        })
                    })
                    .catch((e) => {
                        reject({ statuscode: 404, msg: e })
                    })
                }else{
                    reject({ statuscode: 400, msg: e })
                }
            });
        }else{
            reject({ statuscode: 500, msg: "I got a follow request I can't handle because object is not a string!" })
        }
    });
}

module.exports = { handleFollow }