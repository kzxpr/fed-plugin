const crypto = require('crypto');
const axios = require('axios');
const { Account } = require("../models/db");

async function signAndSend(message, local_uri, targetDomain, inbox, apikey) { 
  return new Promise(async (resolve, reject) => {
    // get the URI of the actor object and append 'inbox' to it
    let inboxFragment = inbox.replace('https://'+targetDomain,''); // HARD-CODED
    //console.log("FRAG", inboxFragment)

    // get the private key
    const result = await Account.query().where("uri", "=", local_uri).andWhere("apikey", "=", apikey).select("privkey").first();
    if (result === undefined) {
      reject("No account found for "+local_uri);
    } else {
      //console.log("FOUND PRIVKEY")
      let privkey = result.privkey;
      const digestHash = crypto.createHash('sha256').update(JSON.stringify(message)).digest('base64');
      const signer = crypto.createSign('sha256');
      let d = new Date();
      let stringToSign = `(request-target): post ${inboxFragment}\nhost: ${targetDomain}\ndate: ${d.toUTCString()}\ndigest: SHA-256=${digestHash}`;
      signer.update(stringToSign);
      signer.end();
      const signature = signer.sign(privkey);
      const signature_b64 = signature.toString('base64');
      let header = 'keyId="'+local_uri+'",headers="(request-target) host date digest",signature="'+signature_b64+'"';
      //console.log("TARGET",targetDomain)
      const body = JSON.stringify(message)
      await axios.post(inbox, body, {
        headers: {
          'Host': targetDomain,
          'Date': d.toUTCString(),
          'Digest': `SHA-256=${digestHash}`,
          'Signature': header
        }
        
      }).then((response) => {
        resolve(response.status);
      }).catch((error) => {
        console.error("ERR",error)
          reject('Error:'+error);
      })
    }
    })
  }

  module.exports = { signAndSend };