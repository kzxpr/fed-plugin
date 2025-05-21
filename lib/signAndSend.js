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
      reject("signAndSend: No account found for "+local_uri);
    } else {
      let privkey = result.privkey;
      //console.log("FOUND PRIVKEY", privkey)
      const digestHash = crypto.createHash('sha256').update(JSON.stringify(message)).digest('base64');
      const signer = crypto.createSign('rsa-sha256');
      let d = new Date();
      let stringToSign = `(request-target): post ${inboxFragment}\nhost: ${targetDomain}\ndate: ${d.toUTCString()}\ndigest: SHA-256=${digestHash}`;
      signer.update(stringToSign);
      signer.end();
      const signature = signer.sign(privkey);
      const signature_b64 = signature.toString('base64');
      let header = 'keyId="'+local_uri+'",headers="(request-target) host date digest",algorithm="rsa-sha256",signature="'+signature_b64+'"';
      //console.log("Just before sending", message, inbox, digestHash)
      await axios.post(inbox, JSON.stringify(message), {
        headers: {
          'Content-Type': 'application/activity+json',
          'Host': targetDomain,
          'Date': d.toUTCString(),
          'Digest': `SHA-256=${digestHash}`,
          'Signature': header
        }
      }).then((response) => {
        //console.log("OK", response)
        resolve(response.status);
      }).catch((error) => {
        console.error("ERROR inside signAndSend", error.data)
          reject('Error:'+error);
      })
    }
    })
  }

  module.exports = { signAndSend };