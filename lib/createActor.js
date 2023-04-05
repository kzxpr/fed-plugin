'use strict';
const crypto = require('crypto');

async function createActor(username, domain){
    return new Promise(async (resolve, reject) => {
        if(username===undefined){
            reject({statusCode: 400, msg: 'Bad request. Please make sure "account" is a property in the POST body.'});
        }else if(username.trim()==""){
            reject({statusCode: 400, msg: 'Bad request. Username MUST have characters!.'});
        }else{
            // create keypair
            crypto.generateKeyPair('rsa', {
                modulusLength: 4096,
                publicKeyEncoding: {
                    type: 'spki',
                    format: 'pem'
                },
                privateKeyEncoding: {
                    type: 'pkcs8',
                    format: 'pem'
                }
            }, async (err, publicKey, privateKey) => {
                if(err){
                    reject({ statusCode: 500, msg: err})
                }else{
                    const apikey = crypto.randomBytes(16).toString('hex');
                    resolve({
                        username: username,
                        handle: username+"@"+domain,
                        apikey,
                        pubkey: publicKey,
                        privkey: privateKey,
                        uri: "https://"+domain+"/u/"+username,
                        inbox_uri: "https://"+domain+"/u/"+username+"/inbox",
                        outbox_uri: "https://"+domain+"/u/"+username+"/outbox",
                        followers_uri: "https://"+domain+"/u/"+username+"/followers",
                        following_uri: "https://"+domain+"/u/"+username+"/following",
                        featured_uri: "https://"+domain+"/u/"+username+"/collections/featured",
                        tags_uri: "https://"+domain+"/u/"+username+"/collections/tags",
                        icon: "https://"+domain+"/public/icon128.png"
                    })
                }
            })
        }
    })
}

module.exports = { createActor }