const db = require("../../../knexfile")
const knex = require("knex")(db)
const crypto = require('crypto');

function parseActivity(activity){
    const uri = activity.id;
    const type = activity.type;
    const actor = activity.actor
        ? activity.actor : "";
    const published = activity.publishedAt
        ? activity.publishedAt : null;
    const object = activity.object;
    return { uri, type, actor, published, object }
}

async function addActivity(activity){
    return new Promise(async(resolve, reject) => {
        const parsedActivity = parseActivity(activity);
        console.log("TRIGGER addActivity", parsedActivity)

        // NOT ALL ACTIVITIES HAVE A 'uri' APPARENTLY (seen on a 'remove' request)
        if(parsedActivity.uri){
            await knex("apactivities").where("uri", "=", parsedActivity.uri)
            .then(async(rows) => {
                if(rows.length==0){
                    // ADD ACTIVITY
                    await knex("apactivities").insert({
                        ... parsedActivity,
                        createdAt: knex.fn.now()
                    })
                    .then((data) => {
                        resolve(true)
                    })
                    .catch((e) => {
                        reject(e)
                    })
                }else{
                    // IGNORE ACTIVITY
                    resolve(false)
                }
            })
            .catch((e) => {
                console.error("MySQL error on addActivity", e)
                reject(e)
            })
        }
    })
}

module.exports = { addActivity }