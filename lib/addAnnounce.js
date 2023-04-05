const db = require("../../../knexfile")
const knex = require("knex")(db)
const crypto = require('crypto');

async function addAnnounce(message_uri, account_uri){   
    let newAnnounce = await knex("apannounces").insert({ message_uri, account_uri, createdAt: knex.fn.now() })
        .onConflict(['message_uri', 'account_uri'])
        .ignore()
        .then((d) => {
            console.log("MESSAGE", message_uri, "received a announce from",account_uri)
        })
        .catch((e) => {
            console.error("Uncaught error inside addAnnounce", e)
        })
}

async function removeAnnounce(message, account){
    console.log("REMOVE ANNOUNCE TRIGGER", message, account)
    return new Promise(async(resolve, reject) => {
        await knex("apannounces")
            .where("message_uri", "=", message)
            .andWhere("account_uri", "=", account)
            .delete()
            .then((d) => {
                resolve()
            })
            .catch((e) => {
                console.error("Uncaught error inside removeAnnounce", e)
                reject()
            })
    });
}

module.exports = { addAnnounce, removeAnnounce }