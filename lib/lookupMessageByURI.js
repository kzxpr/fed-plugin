const { Message } = require("../models/db")
const { addMessage } = require("./addMessage")
const { getObjectItem } = require("./ap-feed")

async function lookupMessageByURI(message_uri){
    return new Promise(async(resolve, reject) => {
        await Message.query().where("uri", "=", message_uri).first()
        .then(async(message) => {
            if(message){
                resolve(message)
            }else{
                await getObjectItem(message_uri, { Accept: 'application/activity+json' })
                .then(async(message) => {
                    await addMessage(message)
                    .then((data) => {
                        resolve(data);
                    })
                    .catch((err) => {
                        //console.error("ERROR in lookupMessageByURI", err)
                        reject(err)
                    })
                })
                .catch((err) => {
                    console.error(err)
                    reject(err)
                })
            }
        })
        .catch((e) => {
            reject(e)
        })
    })
}

module.exports = { lookupMessageByURI }