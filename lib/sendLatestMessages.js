const db = require("./../../../knexfile")
const knex = require("knex")(db)

const { signAndSend } = require("./signAndSend")
const { makeMessage } = require("./makeMessage")
const { wrapInCreate } = require("./wrappers")
const { findInbox } = require("./addAccount")
const { Message } = require("../../models/db")

function addresseesToString(addressees){
    var to = "";
    var cc = "";
    addressees.map((v) => {
        if(v){
            if(v.field=="to"){
                to += " " + v.uri;
            }else if(v.field=="cc"){
                cc += " " + v.uri;
            }
        }
    })
    cc = cc.substr(1);
    to = to.substr(1);
    return { to, cc }
}

async function sendLatestMessages(follower, user_uri){
    return new Promise(async(resolve, reject) => {
        await Message.query().where("attributedTo", user_uri)
        .andWhere(function(){
            this.where("public", "=", 1).orWhere("followshare", "=", 1)
        })
        .limit(10)
        .withGraphFetched("[addressees]")
        .then(async(messages) => {
            console.log("Found latestMessages:", messages.length)
            for(let message of messages){
                const { to, cc } = addresseesToString(message.addressees)
                const msg = await makeMessage(message.type, user_uri, user_uri, message.guid, { ...message, published: message.publishedAt, to, cc });
                const wrapped = wrapInCreate(msg, user_uri, follower)
                let inbox = await findInbox(follower)
                let myURL = new URL(follower);
                let targetDomain = myURL.hostname;
                const account = await knex("apaccounts").where("uri", "=", user_uri).select("apikey").first();
                const apikey = account.apikey;
                await signAndSend(wrapped, user_uri, targetDomain, inbox, apikey)
                .then((data) => {
                    console.log("SEND LATEST NOTE RESPONSE",data)
                })
                .catch((err) => {
                    reject({err})
                })        
            }
            resolve("OK")
        })
        .catch((e) => {
            console.error(e)
            reject(e)
        })
    })
}

module.exports = { sendLatestMessages, addresseesToString }