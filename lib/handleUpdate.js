const { updateAccount } = require("./addAccount");
const { updateMessage } = require("./addMessage");

async function handleUpdate(body){
    return new Promise(async(resolve, reject) => {
        // RECEIVE UPDATE
        console.log("UPDATE TRIGGER")

        // GET VALUES
        const actor = body.actor;
        const object = body.object;
        const id = object.id;

        if(typeof object === "object"){
            if(object.type=="Person"){
                // UPDATE
                if(id==actor){
                    // ALLOWED
                    await updateAccount(object)
                    .then(async(msg) => {
                        resolve({ msg })
                    })
                    .catch(async(e) => {
                        reject({ statuscode: 500, msg: "ERROR from updateAccount: "+e })
                    })
                }else{
                    reject({ statuscode: 401, msg:"Update denied: Actor "+actor+" cannot change Account for "+id })
                }
            }else{
                // ASSUMING THIS GOES TO MESSAGES...
                if(object.attributedTo == actor){
                    // ALLOWED
                    await updateMessage(object)
                    .then(async(msg) => {
                        resolve({ msg })
                    })
                    .catch(async(e) => {
                        reject({ statuscode: 500, msg: "ERROR from updateMessage: "+e })
                    })
                    // TO-DO: This should also influence 'to', 'cc', 'hashtags' and other related tables
                }else{
                    reject({ statuscode: 401, msg: "Update denied: Actor "+actor+" cannot change Message for "+id })
                }
            }
        }else{
            resolve({})
            //reject({ statuscode: 500, msg: "Don't know how to handle non-object Update" })
        }
    })
}

module.exports = { handleUpdate }