const clc = require("cli-color");
const { addFollower, acceptFollower } = require("./addFollower");

async function handleAccept(body){
    return new Promise(async(resolve, reject) => {
        const accept_from = body.actor;
        const accept_activity_uri = body.id;
        var follow_activity_uri = "";
        var accept_to = "";
        if(body.object && typeof body.object === "object"){
            follow_activity_uri = body.object.id;
            accept_to = body.object.object;
        }else{
            console.log(clc.red("WARNING"), "No reference to a Follow Object in 'Accept'")
        }
        
        // TO-DO: Add a 'update' to old followers
        // to update the list of followers

        await acceptFollower(accept_from, accept_to, follow_activity_uri, accept_activity_uri)
        .then(async(msg) => {
            resolve({ msg: "A follow was accepted ("+accept_from+" to "+accept_to+")" })
        })
        .catch(async(e) => {
            reject({ statuscode: 500, msg: "ERROR while adding follower "+accept_from+" to "+accept_to+": "+e })
        })                
    })
}

module.exports = { handleAccept }