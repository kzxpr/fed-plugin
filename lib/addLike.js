const db = require("./../../../knexfile")
const knex = require("knex")(db)
const crypto = require('crypto');

async function addLike(message_uri, account_uri){
    let newLike = await knex("aplikes").insert({ message_uri, account_uri, createdAt: knex.fn.now() })
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
        await knex("aplikes")
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