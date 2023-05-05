const crypto = require('crypto');
const { Activity } = require("../models/db");
const { fn } = require('objection');
const { date2mysql, isJSON } = require('../utils/funcs');

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
    const published = activity.published
        ? date2mysql(activity.published) : null;
    var object = "";
    if(activity.object){
        if(typeof activity.object === 'object' && activity.object.id){
            object = activity.object.id;
        }else{
            if(isJSON(activity.object)){
                var obj = JSON.parse(activity.object)
                if(obj.id){
                    object = obj.id;
                }
            }else{
                if(typeof activity.object === 'string'){
                    object = activity.object;
                }
            }
        }
    }
    
    return { uri, type, actor, published, object }
}

async function addActivity(activity){
    return new Promise(async(resolve, reject) => {
        //console.log("Running addActivity", activity)
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