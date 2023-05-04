const crypto = require('crypto');

function makeDigest(object){
    const input = JSON.stringify(object);

    var crypto = require('crypto');
    const hash = crypto.createHash('sha256').update(input).digest('base64');

    return "SHA-256="+hash;
}

function verifySign(header, publicKey) {
    const { signature } = header;
  
    const signatureParams = signature.split(',').reduce((params, param) => {
      const [key, value] = param.split('=');
      params[key.trim()] = value.replace(/"/g, '').trim();
      return params;
    }, {});
  
    const { algorithm, headers, signature: signatureValue } = signatureParams;
    //const  = "RSA-SHA256"
    const signingHeaders = headers.split(' ');
  
    const signingStringHeaders = signingHeaders.reduce((str, signingHeader) => {
      const headerValue = header[signingHeader.toLowerCase()];
      if (headerValue) {
        return `${str}${signingHeader.toLowerCase()}: ${headerValue}\n`;
      }
      return str;
    }, '');
  
    const signingString = `(request-target): ${header.method.toLowerCase()} ${header.url}\n${signingStringHeaders.substr(0, (signingStringHeaders.length-1))}`;
  
    const signatureBuffer = Buffer.from(signatureValue, 'base64');
    //const pubkeyBuffer = Buffer.from(publicKey, 'ascii');
  
    const verifier = crypto.createVerify(algorithm);
    verifier.update(signingString);
  
    const verified = verifier.verify(publicKey, signatureBuffer);

    return verified;
}

module.exports = { verifySign, makeDigest }