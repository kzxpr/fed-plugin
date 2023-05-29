const clc = require("cli-color");
const { updateAccount } = require("./addAccount");
const { updateMessage } = require("./addMessage");
const { getObjectItem } = require("./ap-feed");

async function handleUpdate(body){
    return new Promise(async(resolve, reject) => {
        // RECEIVE UPDATE
        //console.log("UPDATE TRIGGER", body)

        // GET VALUES
        var actor = "";
        if(typeof body.actor === "string"){
            actor = body.actor;
        }else if(typeof body.actor === "object"){
            actor = body.actor.id;
        }else{
            console.log(clc.red("ERROR"), "can't find id in actor")
        }
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
            console.log(clc.cyan("WARNING"), "unhandled case where update's object is NOT an object type!")
            // ASSUMING this is profile

            const account_uri = object;

            // Lookup account anew:
            await getObjectItem(account_uri, { Accept: 'application/activity+json' })
            .then(async(profile) => {
                await updateAccount(object)
                    .then(() => {
                        resolve({ statuscode: 200, msg: "Updated profile "+account_uri})
                    })
                    .catch(async(e) => {
                        reject({ statuscode: 500, msg: "ERROR from updateAccount: "+e })
                    })  
            })
            .catch((e) => {
                console.log(clc.red("ERROR"), "in handleUpdate fetching profile", account_uri)
                reject({ statuscode: 500, msg: "Could not lookup profile" })
            })
            
            //reject({ statuscode: 500, msg: "Don't know how to handle non-object Update" })
        }
    })
}

module.exports = { handleUpdate }