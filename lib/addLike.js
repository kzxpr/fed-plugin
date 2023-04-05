const crypto = require('crypto');
const { Like } = require("../models/db");
const { fn } = require('objection');

async function addLike(message_uri, account_uri){
    let newLike = await Like.query().insert({ message_uri, account_uri, createdAt: fn.now() })
        .onConflict(['message_uri', 'account_uri'])
        .ignore()
        .then((d) => {
            console.log("MESSAGE", message_uri, "received a like from",account_uri)
        })
        .catch((e) => {
            console.error("Uncaught error inside addLike", e)
        })
}

async function removeLike(message, account){
    return new Promise(async(resolve, reject) => {
        await Like.query()
            .where("message_uri", "=", message)
            .andWhere("account_uri", "=", account)
            .delete()
            .then((d) => {
                resolve()
            })
            .catch((e) => {
                console.error("Uncaught error inside removeLike", e)
                reject()
            })
    });
}

module.exports = { addLike, removeLike }