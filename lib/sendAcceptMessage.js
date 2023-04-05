const crypto = require('crypto');
const { signAndSend } = require("./signAndSend")
const { findInbox } = require("./addAccount");
const { Account } = require('../models/db');

async function sendAcceptMessage(thebody, local_uri, targetDomain, domain) {
    const guid = crypto.randomBytes(16).toString('hex');
    let message = {
      '@context': 'https://www.w3.org/ns/activitystreams',
      'id': "https://"+domain+"/accept/"+guid,
      'type': 'Accept',
      'actor': local_uri,
      'object': thebody,
    };
    let inbox = await findInbox(message.object.actor)
    const account = await Account.query().where("uri", "=", local_uri).select("apikey").first();
    const apikey = account.apikey;
    await signAndSend(message, local_uri, targetDomain, inbox, apikey)
    .then((data) => {
      console.log("SENT ACCEPT ID", guid, "on", local_uri, data)
      return {msg: data}
    })
    .catch((err) => {
      return {err}
    })
  }

module.exports = { sendAcceptMessage }