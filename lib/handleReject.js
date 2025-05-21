const clc = require("cli-color");
const { addFollower, acceptFollower } = require("./addFollower");

async function handleReject(body){
    return new Promise(async(resolve, reject) => {
        const reject_from = body.actor;
        const reject_activity_uri = body.id;
        var follow_activity_uri = "";
        var reject_to = "";
        if(body.object && typeof body.object === "object"){
            follow_activity_uri = body.object.id;
            reject_to = body.object.object;
        }else{
            console.log(clc.red("WARNING"), "No reference to a Follow Object in 'Reject'")
        }
        
        // TO-DO: Add a 'update' to old followers
        // to update the list of followers

        console.log(clc.green("OK"), "but no action for Reject", reject_to, reject_from)
        resolve({ msg: "ok"})
        /*await acceptFollower(accept_from, accept_to, follow_activity_uri, accept_activity_uri)
        .then(async(msg) => {
            resolve({ msg: "A follow was accepted ("+accept_from+" to "+accept_to+")" })
        })
        .catch(async(e) => {
            reject({ statuscode: 500, msg: "ERROR while adding follower "+accept_from+" to "+accept_to+": "+e })
        })*/
    })
}

module.exports = { handleReject }