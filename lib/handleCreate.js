const clc = require('cli-color');
const { addMessage, removeMessage, updateMessage } = require('./addMessage');
const fed = require("./../index")()

async function handleCreate(body){
    return new Promise(async(resolve, reject) => {
        if(body.object && body.object.type){
            const objtype = body.object.type;
            //if(objtype==="Note"){
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
        }
        
        /*}else if(objtype==="Article"){
            console.log("I got a article saying",req.body.object.content)
            addMessage(req.body.object)
            await endAPLog(aplog, "Received article", 201)
            res.sendStatus(201)
        }else if(objtype=="Question"){
            console.log("I got a question saying", req.body.object.content)
            addMessage(req.body.object)
            await endAPLog(aplog, "Received question", 201)
            res.sendStatus(201)
        }else{
            await endAPLog(aplog, "Received create, but object type wasn't recognized", 500)
            console.warn("UNHANDLED RECEIVED", objtype)
            res.sendStatus(500)
        }*/
    })
}

module.exports = { handleCreate }