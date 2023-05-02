const { Message } = require("../models/db");
const { lookupAccountByURI } = require("./addAccount");
const { addAnnounce } = require("./addAnnounce");
const { lookupMessageByURI } = require("./lookupMessageByURI");

async function handleAnnounce(body){
    return new Promise(async(resolve, reject) => {
        //console.log("handleAnnounce", body)
        if(typeof body.object === 'string'){
            const message_uri = body.object;
            await lookupMessageByURI(message_uri)
            .then(async(message) => {
                if(message){
                    const follower_uri = body.actor;
                    await lookupAccountByURI(follower_uri)
                    .then(async(follower_account) => {
                        await addAnnounce(message_uri, follower_uri)
                        .then((d) => {
                            resolve({ msg: "Added announce"})
                        })
                        .catch((e) => {
                            reject({ statuscode: 500, msg: e })
                        })
                    })
                    .catch(async(e) => {
                        reject({ statuscode: 500, msg: "ERROR in addAnnounce: "+e })
                    })
                }else{
                    reject({ statuscode: 404, msg: "Message not found" })
                }
            })
            .catch(async(e) => {
                reject({ statuscode: 500, msg: "ERROR looking up message to announce addAnnounce"+e })
            })
        }else{
            reject({ statuscode: 400, msg: "ERROR object in addAnnounce is not a string" })
        }
    })
}

module.exports = { handleAnnounce }