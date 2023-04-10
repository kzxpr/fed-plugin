const crypto = require('crypto');
const { Announce } = require("../models/db");
const { fn } = require('objection');

const fed = require("./../index")()

async function addAnnounce(message_uri, account_uri){   
    let newAnnounce = await Announce.query().insert({ message_uri, account_uri, createdAt: fn.now() })
        .onConflict(['message_uri', 'account_uri'])
        .ignore()
        .then((d) => {
            fed.eventHandler.emit("announce:add", { id: message_uri, actor: account_uri })
            //console.log("MESSAGE", message_uri, "received a announce from",account_uri)
        })
        .catch((e) => {
            console.error("Uncaught error inside addAnnounce", e)
        })
}

async function removeAnnounce(message, account){
    return new Promise(async(resolve, reject) => {
        await Announce.query()
            .where("message_uri", "=", message)
            .andWhere("account_uri", "=", account)
            .delete()
            .then((d) => {
                fed.eventHandler.emit("announce:remove", { ...d })
                resolve()
            })
            .catch((e) => {
                console.error("Uncaught error inside removeAnnounce", e)
                reject()
            })
    });
}

module.exports = { addAnnounce, removeAnnounce }