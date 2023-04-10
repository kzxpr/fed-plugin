const { Account } = require("../models/db")
const { wrapInWebfinger } = require("./wrappers")

async function loadWebfingerByUsername(username, domain){
  return new Promise(async (resolve, reject) => {
    const result = await Account.query().where("handle", "=", username+"@"+domain).select("username").first()
      .then((result) => {
        if (result === undefined) {
          reject({statuscode: 404, msg: "No webfinger found for "+username })
        } else {
          const webfinger = wrapInWebfinger(username, domain)
          resolve(webfinger)
        }
      })
      .catch((err) => {
        reject({statuscode: 500, msg: "Error in database, looking up webfinger for "+username})
      })
    })
  }

module.exports = { loadWebfingerByUsername }