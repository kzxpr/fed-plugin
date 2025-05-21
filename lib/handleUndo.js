const { removeAnnounce } = require("./addAnnounce");
const { removeFollower } = require("./addFollower");
const { removeLike } = require("./addLike");

async function handleUndo(body){
    return new Promise(async(resolve, reject) => {
        if(typeof body.object === 'object'){
            const undo_object = body.object;
            const undo_type = undo_object.type;
            const actor = undo_object.actor;
            const object = undo_object.object;

            if(undo_type=="Follow"){    
                await removeFollower(object, actor)
                .then(async(d) => {
                    resolve({ msg: "Removed follower" })
                })
                .catch(async(e) => {
                    reject({ statuscode: 500, msg: "Some error while removing follower: "+e })
                })
            }else if(undo_type=="Like"){
                await removeLike(object, actor)
                .then(async(d) => {
                    resolve({ msg: "Removed like" })
                })
                .catch(async(e) => {
                    reject({ statuscode: 500, msg: "Some error while removing like: "+e })
                })
            }else if(undo_type=="Announce"){
                await removeAnnounce(object, actor)
                .then(async(d) => {
                    resolve({ msg: "Removed announce" })
                })
                .catch(async(e) => {
                    reject({ statuscode: 500, msg: "Some error while removing announce: "+e })
                })
            }else if(undo_type=="Accept"){
                /*await removeAnnounce(object, actor)
                .then(async(d) => {
                    resolve({ msg: "Removed announce" })
                })
                .catch(async(e) => {
                    reject({ statuscode: 500, msg: "Some error while removing announce: "+e })
                })*/
                console.log("NO implementation yet...")
                resolve("Pseudo-ok")
            }else{
                reject({ statuscode: 500, msg: "Unknown undo-type"+undo_type })
            }
        }else{
            reject({ statuscode: 500, msg: "Can't handle non-object for Undo" })
        }
    })
}

module.exports = { handleUndo }