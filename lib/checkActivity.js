const { Activity } = require("../models/db");

async function checkActivity(uri){
    return new Promise(async(resolve, reject) => {
        await Activity.query().where("uri", "=", uri)
            .then((rows) => {
                if(rows.length==0){
                    resolve(false)
                }else{
                    resolve(true)
                }
            })
            .catch((e) => {
                console.error("ERROR in checkActivity", e)
                reject("ERROR in checkActivity")
            })
    });
}

module.exports = { checkActivity }