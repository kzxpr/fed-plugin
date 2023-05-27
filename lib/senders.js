/* SENDERS for client-to-server interaction */
const crypto = require('crypto');
const { default: axios } = require("axios");
const { wrap } = require("./wrappers");
const clc = require("cli-color");
const { makeObject } = require("./makeObject");

async function sendLike(from_username, ap_key, to_uri, object_id){
    return new Promise(async(resolve, reject) => {
        const DOMAIN = this.getDomain();

        /* GENERATE ID AND URI */
        const guid = crypto.randomBytes(16).toString('hex');
        const user_uri = "https://"+DOMAIN+"/u/"+from_username;
        const ref_url = user_uri+"/statuses/"+guid;

        /* GENERATE PUBLISHED */
        const dd = new Date();
        const published = dd.toISOString();

        /* MAKE ACTIVITY */
        const body = await wrap("Like",
            object_id,
            { username: from_username, domain: DOMAIN, ref_url, to: [ to_uri ] });
        
        /* SEND TO OUTBOX */
        await axios
        .post(
            "https://"+DOMAIN+"/u/"+from_username+"/outbox",
            body,
            // params
            {
                headers: {
                  'Content-Type': 'application/activity+json',
                  "Authorization": "Bearer "+ap_key
                }
            }
        )
        .then((d) => {
            resolve(d)
        })
        .catch((e) => {
            reject(e)
        })
    })
}

async function sendAnnounce(from_username, ap_key, to_uri, object_id){
    return new Promise(async(resolve, reject) => {
        console.log("TRIGGER på sendAnnounce")
        const DOMAIN = this.getDomain();

        /* GENERATE ID AND URI */
        const guid = crypto.randomBytes(16).toString('hex');
        const user_uri = "https://"+DOMAIN+"/u/"+from_username;
        const ref_url = user_uri+"/statuses/"+guid;

        /* GENERATE PUBLISHED */
        const dd = new Date();
        const published = dd.toISOString();

        /* MAKE ACTIVITY */
        const body = await wrap("Announce",
            object_id,
            { username: from_username, domain: DOMAIN, ref_url, to: [ "https://www.w3.org/ns/activitystreams#Public", to_uri ], cc: [ user_uri + "/followers" ] });
        
        /* SEND TO OUTBOX */
        await axios
        .post(
            "https://"+DOMAIN+"/u/"+from_username+"/outbox",
            body,
            {
                headers: {
                  'Content-Type': 'application/activity+json',
                  "Authorization": "Bearer "+ap_key
                }
            }
        )
        .then((d) => {
            //console.log("SJOV", d.data)
            resolve(d)
        })
        .catch((e) => {
            reject(e)
        })
    })
}

async function sendCreate(from_username, ap_key, obj, guid = ""){
    return new Promise(async(resolve, reject) => {
        const DOMAIN = this.getDomain();

        const to_field = obj.to;
        const cc_field = obj.cc;
        const ref_url = obj.id;

        const wrapped = wrap("Create",
            obj,
            {
                username: from_username,
                domain: DOMAIN,
                ref_url,
                to: to_field,
                cc: cc_field
            });
        await axios
        .post(
            "https://"+DOMAIN+"/u/"+from_username+"/outbox",
            wrapped,
            {
                headers: {
                  'Content-Type': 'application/activity+json',
                  "Authorization": "Bearer "+ap_key
                }
            }
        )
        .then((d) => {
            resolve(d)
        })
        .catch((e) => {
            reject(e)
        })
    })
}

async function sendNote(from_username, ap_key, object, guid = ""){
    return new Promise(async(resolve, reject) => {
        const DOMAIN = this.getDomain();

        /* GENERATE ID AND URI */
        if(guid == "" || guid == null){
            guid = crypto.randomBytes(16).toString('hex');
        }
        const user_uri = "https://"+DOMAIN+"/u/"+from_username;
        const ref_url = user_uri+"/statuses/"+guid;

        /* GENERATE PUBLISH DATE */
        const dd = new Date();
        const published = dd.toISOString();

        /* MAKE OBJECT */
        var data = object;
        data.manual_guid = guid;
        const { obj } = await makeObject("Note",
            {
                username: from_username,
                domain: DOMAIN,
                published,
                activity: "Create"
            },
            data
        )
        const to_field = obj.to;
        const cc_field = obj.cc;
        const wrapped = wrap("Create", obj, { username: from_username, domain: DOMAIN, ref_url, to: to_field, cc: cc_field });
        await axios
        .post(
            "https://"+DOMAIN+"/u/"+from_username+"/outbox",
            wrapped,
            {
                headers: {
                  'Content-Type': 'application/activity+json',
                  "Authorization": "Bearer "+ap_key
                }
            }
        )
        .then((d) => {
            resolve(d)
        })
        .catch((e) => {
            reject(e)
        })
    })
}

async function sendAccept(from_username, ap_key, to_uri, follow_object){
    return new Promise(async(resolve, reject) => {
        if(from_username=="" || ap_key==""){
            console.log(clc.red("WARNING"), " no username and/or key defined for sendAccept!!!")
            reject("sendAccept received no username and/or key!!!")
            return;
        }
        const DOMAIN = this.getDomain();

        /* GENERATE ID AND URI */
        const guid = crypto.randomBytes(16).toString('hex');
        const user_uri = "https://"+DOMAIN+"/u/"+from_username;
        const ref_url = user_uri+"/statuses/"+guid;

        /* GENERATE PUBLISHED */
        const dd = new Date();
        const published = dd.toISOString();

        /* MAKE ACTIVITY */
        const body = await wrap("Accept",
            follow_object,
            { username: from_username, domain: DOMAIN, ref_url, to: [ to_uri ], published });

        /* SEND TO OUTBOX */
        await axios
        .post(
            "https://"+DOMAIN+"/u/"+from_username+"/outbox",
            body,
            // params
            {
                headers: {
                  'Content-Type': 'application/activity+json',
                  "Authorization": "Bearer "+ap_key
                }
            }
        )
        .then((d) => {
            resolve(d)
        })
        .catch((e) => {
            reject(e)
        })
    })
}

async function sendFollow(from_username, ap_key, to_uri){
    return new Promise(async(resolve, reject) => {
        if(from_username=="" || ap_key==""){
            console.log(clc.red("WARNING"), " no username and/or key defined for sendFollow!!!")
            reject("sendFollow received no username and/or key!!!")
            return;
        }
        const DOMAIN = this.getDomain();

        /* GENERATE ID AND URI */
        const guid = crypto.randomBytes(16).toString('hex');
        const user_uri = "https://"+DOMAIN+"/u/"+from_username;
        const ref_url = user_uri+"/statuses/"+guid;

        /* GENERATE PUBLISHED */
        const dd = new Date();
        const published = dd.toISOString();

        /* MAKE ACTIVITY */
        const body = await wrap("Follow",
            to_uri,
            { username: from_username, domain: DOMAIN, ref_url, to: [ to_uri ], published });

        /* SEND TO OUTBOX */
        await axios
        .post(
            "https://"+DOMAIN+"/u/"+from_username+"/outbox",
            body,
            // params
            {
                headers: {
                  'Content-Type': 'application/activity+json',
                  "Authorization": "Bearer "+ap_key
                }
            }
        )
        .then((d) => {
            resolve(d)
        })
        .catch((e) => {
            reject(e)
        })
    })
}

module.exports = { sendLike, sendAnnounce, sendNote, sendAccept, sendFollow, sendCreate }