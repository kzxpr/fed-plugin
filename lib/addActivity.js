const crypto = require('crypto');
const { Activity } = require("../models/db");
const { fn } = require('objection');

function parseActivity(activity){
    const uri = activity.id;
    const type = activity.type;
    var actor = "";
    if(activity.actor){
        if(typeof activity.actor === 'string'){
            actor = activity.actor;
        }else if(typeof activity.actor === 'object' && activity.actor.id){
            actor = activity.actor.id;
        }
    }
    const published = activity.publishedAt
        ? activity.publishedAt : null;
    const object = activity.object;
    return { uri, type, actor, published, object }
}

async function addActivity(activity){
    return new Promise(async(resolve, reject) => {
        const parsedActivity = parseActivity(activity);

        // NOT ALL ACTIVITIES HAVE A 'uri' APPARENTLY (seen on a 'remove' request)
        if(parsedActivity.uri){
            await Activity.query().where("uri", "=", parsedActivity.uri)
            .then(async(rows) => {
                if(rows.length==0){
                    // ADD ACTIVITY
                    await Activity.query().insert({
                        ... parsedActivity,
                        createdAt: fn.now()
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
        }else{
            reject("No uri on addActivity", parsedActivity)
        }
    })
}

module.exports = { addActivity, parseActivity }