const { removeAccount } = require("./addAccount");
const { removeMessage } = require("./addMessage");

async function handleDelete(body){
    return new Promise(async(resolve, reject) => {
        const actor = body.actor;
        const object = body.object;

        // HOW TO DETERMINE TYPE OF DELETE...
        if(actor == object){
            // PROBABLY WANT TO DELETE USER...
            // TO-DO: This should cascade!
            await removeAccount(actor)
            .then(async(msg) => {
                resolve({ msg })
            })
            .catch(async(e) => {
                reject({ statuscode: 500, msg: "PROBLEM in removeAccount"+e })
            })
        }else if(typeof object === 'object'){
            const msg_id = object.id;
            await removeMessage(msg_id, actor)
            .then(async(msg) => {
                resolve({ msg })
            })
            .catch(async(e) => {
                reject({ statuscode: 500, msg: "ERROR in handleDelete"+e })
            })
        }else{
            reject({ statuscode: 500, msg: "No idea what to do???" })
        }
    })
}

module.exports = { handleDelete }