const clc = require('cli-color');
const { addMessage, removeMessage, updateMessage } = require('./addMessage');
const fed = require("./../index")()

async function handleCreate(body){
    return new Promise(async(resolve, reject) => {
        if(body.object && body.object.type){
            const objtype = body.object.type;
            await addMessage(body.object)
            .then((d) => {
                fed.eventHandler.emit("create:add", body)
                resolve({ statuscode: 201, msg: "I created a "+objtype })
            })
            .catch((e) => {
                console.log("ERROR from addMessage", e)
                reject({ msg: e, statuscode: 500 })
            })
        }else{
            console.log(clc.red("ERROR"), "handleCreate was called where object is string or undefined!", body.object)
            reject({ msg: "No handling", statuscode: 500 })
        }
    })
}

module.exports = { handleCreate }