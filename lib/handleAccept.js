const { addFollower, acceptFollower } = require("./addFollower");

function parseObject(object){
    if(typeof object === "string"){
        return object;
    }else{
        return object.actor;
    }
}

async function handleAccept(body){
    return new Promise(async(resolve, reject) => {
        const accept_from = body.actor;
        const accept_to = parseObject(body.object);

        // TO-DO: Confirm accept_id to make sure
        // that the follow request has actually been sent!
        
        // TO-DO: Add a 'update' to old followers
        // to update the list of followers

        await acceptFollower(accept_from, accept_to)
        .then(async(msg) => {
            resolve({ msg: "A follow was accepted ("+accept_from+" to "+accept_to+")" })
        })
        .catch(async(e) => {
            reject({ statuscode: 500, msg: "ERROR while adding follower "+accept_from+" to "+accept_to+": "+e })
        })                
    })
}

module.exports = { handleAccept }