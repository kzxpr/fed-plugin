const clc = require("cli-color");
const { Tag, TagChannel } = require("../models/db");
const { fn } = require('objection');

function parseTag(tag){
    var obj = {};
    obj.type = tag.type ? tag.type : "";
    obj.name = tag.name ? tag.name : null;
    return obj;
}

async function addTagChannel(tag, href){
    return new Promise(async(resolve, reject) => {
        await TagChannel.query().insert({
            name: tag,
            href,
            createdAt: fn.now()
        })
        .onConflict(["name", "href"])
        .ignore()
        .then((data) => {
            resolve(data)
        })
        .catch((e) => {
            console.log(clc.red("ERROR"), "in addTagChannel", e)
            reject(e)
        })
    })
}

async function addTag(message_uri, tag){
    return new Promise(async(resolve, reject) => {
        const parsedTag = parseTag(tag)
        await Tag.query().insert({
            message_uri: message_uri,
            ... parsedTag,
            createdAt: fn.now()
        })
        .then(async(data) => {
            await addTagChannel(tag.name, tag.href)
            .then((d) => {
                //console.log("Added channel")
            })
            .catch((e) => {
                console.log(e)
            })
            resolve(data)
        })
        .catch((e) => {
            console.log(clc.red("ERROR"), "in addTag", e)
            reject(e)
        })
    })
}

module.exports = { addTag };