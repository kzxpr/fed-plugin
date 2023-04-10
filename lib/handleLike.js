const { Message } = require("../models/db");
const { lookupAccountByURI } = require("./addAccount");
const { addLike } = require("./addLike");
const { lookupMessageByURI } = require("./lookupMessageByURI");

async function handleLike(body){
    return new Promise(async(resolve, reject) => {
        if(typeof body.object === 'string'){
            const message_uri = body.object;
            await lookupMessageByURI(message_uri)
            .then(async(message) => {
                if(message){
                    const follower_uri = body.actor;
                    await lookupAccountByURI(follower_uri)
                    .then(async(data) => {
                        await addLike(message_uri, follower_uri)
                        resolve({ msg: "Added like" })
                    });
                }else{
                    reject({ statuscode: 404, msg: "ERROR: Message to like not found" })
                }
            })
            .catch(async(e) => {
                console.log(e)
                reject({ statuscode: 500, msg: "ERROR looking up message to like"})
            })
        }else{
            reject({ statuscode: 400, msg: "Type of like object is not string" })
        }
    })
}

module.exports = { handleLike }