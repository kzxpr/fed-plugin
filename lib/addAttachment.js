const { Attachment } = require("../models/db");
const { fn } = require('objection');
const { encodeStr } = require("../utils/encodeStr");

function parseAttachment(attachment){
    var obj = {};
    obj.type = attachment.type ? attachment.type : "";
    obj.mediaType = attachment.mediaType ? attachment.mediaType : "";
    obj.url = attachment.url ? attachment.url : "";
    obj.name = attachment.name ? encodeStr(attachment.name) : null;
    obj.blurhash = attachment.blurhash ? attachment.blurhash : null;
    obj.width = attachment.width ? attachment.width : null;
    obj.height = attachment.height ? attachment.height : null;
    return obj;
}

async function addAttachment(message_uri, attachment){
    return new Promise(async(resolve, reject) => {
        const parsedAttachment = parseAttachment(attachment)
        await Attachment.query().insert({
            message_uri: message_uri,
            ... parsedAttachment,
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

module.exports = { addAttachment };