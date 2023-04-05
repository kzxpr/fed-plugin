const { Tag } = require("../models/db");
const { fn } = require('objection');

function parseTag(tag){
    var obj = {};
    obj.type = tag.type ? tag.type : "";
    obj.href = tag.href ? tag.href : "";
    obj.name = tag.name ? tag.name : null;
    return obj;
}

async function addTag(message_uri, tag){
    return new Promise(async(resolve, reject) => {
        const parsedTag = parseTag(tag)
        await Tag.query().insert({
            message_uri: message_uri,
            ... parsedTag,
            createdAt: fn.now()
        })
        .then((data) => {
            resolve(data)
        })
        .catch((e) => {
            reject(e)
        })
    })
}

module.exports = { addTag };