const { Account } = require("../models/db")
const { wrapInActor } = require("./wrappers")

async function loadActorByUsername(username, domain){
    console.log("\x1b[33m%s\x1b[0m", "PROFILE", "for", username, domain)
    return new Promise(async (resolve, reject) => {
        await Account.query().where("handle", "=", username+"@"+domain).first()
        .then((result) => {
            if (result === undefined) {
                reject({statuscode: 404, msg: "No account found for "+username})
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