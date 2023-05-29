const clc = require("cli-color")
const { Account } = require("../models/db")
const { wrapInActor } = require("./wrappers")

async function loadActorByUsername(username, domain){
    console.log(clc.yellow("PROFILE"), "for", username, domain)
    return new Promise(async (resolve, reject) => {
        await Account.query()
            .where("handle", "=", username+"@"+domain).first()
            .withGraphFetched("links")
        .then((result) => {
            if (result === undefined) {
                reject({statuscode: 404, msg: "loadActorByUsername: No account found for "+username})
            } else {
                const tempActor = wrapInActor(result, username, domain)
                resolve(tempActor);
            }
        })
        .catch((err) => {
            reject({statuscode: 500, msg: "Error connecting to database, while looking up: "+name})
        })
    })
}

module.exports = { loadActorByUsername }