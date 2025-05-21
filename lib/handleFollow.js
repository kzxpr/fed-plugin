const { Account } = require("../models/db");
const { lookupAccountByURI } = require("./addAccount");
const { addFollower } = require("./addFollower");

const fed = require("./../index")()

function parseTo(to_list){
    if(Array.isArray(to_list)){
        return to_list[0]
    }else{
        return to_list;
    }
}

async function handleFollow(body){
    return new Promise(async(resolve, reject) => {
        if(typeof body.object === 'string'){
            const follow_sender = body.actor; // should also match body.actor
            await Account.query()
                .where("uri", "=", follow_sender).first()
            .then(async(account) => {
                if(account){
                    const follow_receiver_uri = (body.object); // parseTo(body.to);
                    const follow_activity_uri = body.id;
                    await lookupAccountByURI(follow_receiver_uri)
                    .then(async(follower_account) => {
                        await addFollower(follow_receiver_uri, follow_sender, follow_activity_uri)
                        .then(async(d) => {
                            fed.eventHandler.emit("follow:add", body)
                            resolve({ msg: "Added follower: "+follow_receiver_uri })
                        })
                        .catch(async(e) => {
                            reject({ statuscode: 500, msg: e })
                        })
                    })
                    .catch((e) => {
                        reject({ statuscode: 404, msg: e })
                    })
                }else{
                    console.log(clc.red("RED"), "NO ACCOUNT for", follow_sender)
                    reject({ statuscode: 400, msg: "No account for "+follow_sender+"!" })
                }
            })
            .catch((e) => {
                reject({ statuscode: 500, msg: "Error verifying local account in DB" })
            })
        }else{
            reject({ statuscode: 500, msg: "I got a follow request I can't handle because object is not a string!" })
        }
    });
}

module.exports = { handleFollow }