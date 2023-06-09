const { addActivity, parseActivity } = require("./addActivity");
const { handleAccept } = require("./handleAccept");
const { handleAnnounce } = require("./handleAnnounce");
const { handleCreate } = require("./handleCreate");
const { handleDelete } = require("./handleDelete");
const { handleFollow } = require("./handleFollow");
const { handleLike } = require("./handleLike");
const { handleReject } = require("./handleReject");
const { handleUndo } = require("./handleUndo");
const { handleUpdate } = require("./handleUpdate");

async function unhandled(obj){
    return new Promise((resolve, reject) => {
        reject(obj)
    })
}

async function handleActivity(activity_type, body){
    return new Promise(async(resolve, reject) => {
        // Add activity to activity table
        try {
            //console.log("TRIGGER handleActivity", body)
            await addActivity(body)
        } catch(e) {
            reject(e)
        }

        // Add object to database/outb
        try {
            let resp;
            //console.log("Let's handle", activity_type, body)
            switch(activity_type){
                case 'Create': resp = await handleCreate(body); break;
                case 'Follow': resp = await handleFollow(body); break;
                case 'Like': resp = await handleLike(body); break;
                case 'Announce': resp = await handleAnnounce(body); break;
                case 'Undo': resp = await handleUndo(body); break;
                case 'Delete': resp = await handleDelete(body); break;
                case 'Update': resp = await handleUpdate(body); break;
                case 'Accept': resp = await handleAccept(body); break;
                case 'Reject': resp = await handleReject(body); break;
                default:
                    resp = await unhandled({ statuscode: 500, msg: "Activity type not recognized in handleActivity"});
                    break;
            }
            resolve(resp)
        } catch(e) {
            reject(e)
        }
    })
}

module.exports = { handleActivity, unhandled }