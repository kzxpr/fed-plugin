const db = require("../../../knexfile")
const knex = require("knex")(db)

function parseOption(option){
    var obj = {};
    obj.type = option.type ? option.type : "Note";
    obj.name = option.name ? option.name : "";
    return obj;
}

async function addOption(message_uri, option){
    return new Promise(async(resolve, reject) => {
        const parsedOption = parseOption(option)
        await knex("apoptions").insert({
            message_uri: message_uri,
            ... parsedOption
        })
        .then((data) => {
            resolve(data)
        })
        .catch((e) => {
            reject(e)
        })
    })
}

module.exports = { addOption };