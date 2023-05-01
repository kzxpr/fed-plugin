const { Request } = require("../models/db");
const { fn } = require('objection');
const { encodeStr } = require("../utils/encodeStr");

async function startAPLog(req){
    const ip = req.ip;
    const body = JSON.stringify(req.body);
    const encodedBody = encodeStr(body)
    const url = req.originalUrl;
    const method = req.method;
    return new Promise(async(resolve, reject) => {
        await Request.query().insert({
            ip,
            timestamp: fn.now(),
            url,
            method,
            body: encodedBody,
            statuscode: -1
        })
        .then((d) => {
            resolve(d.id)
        })
        .catch((e) => {
            console.error("ERROR logging AP request", e)
            reject(e)
        })
    });
}

async function endAPLog(log_id, response, statuscode = 200){
    const resp = JSON.stringify(response)
    await Request.query()
    .update({
        response: resp,
        statuscode
    })
    .where("id", "=", log_id)
    .then((e) => {
        //SILENT
    })
    .catch((e) => {
        console.error("ERROR logging AP end", e)
    })
}

module.exports = { startAPLog, endAPLog }