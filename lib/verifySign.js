const crypto = require('crypto');

function makeDigest(object){
    const input = JSON.stringify(object);

    var crypto = require('crypto');
    const hash = crypto.createHash('sha256').update(input).digest('base64');

    return "SHA-256="+hash;
}

function verifySign(header, publicKey) {
  try{
    // 1. Normalize incoming headers
    const raw = header;  // e.g. from Express req.headers + method + url
    const hdrs = {};
    Object.entries(raw).forEach(([k,v]) => hdrs[k.toLowerCase()] = v);

    // 2. Parse Signature parameters
    const sig = raw.signature;  // e.g. req.get('Signature')
    const params = sig.split(',')
      .map(p => p.trim().split('='))
      .reduce((acc,[k,v]) => (
        acc[k] = v.replace(/"/g,''), acc
      ), {});

    // 3. Build signing string based exactly on params.headers
    const algo = params.algorithm || 'rsa-sha256';
    const want = params.headers.split(' ');  
    const lines = want.map(name => {
      if (name === '(request-target)') {
        const url = new URL(raw.url, `https://${hdrs.host}`);
        return `(request-target): ${raw.method.toLowerCase()} ${url.pathname}${url.search}`;
      }
      return `${name}: ${hdrs[name]}`;
    });
    const signingString = lines.join('\n');

    // 4. Verify
    const sigBuf = Buffer.from(params.signature, 'base64');
    const verifier = crypto.createVerify(algo);
    verifier.update(signingString);
    const ok = verifier.verify(publicKey, sigBuf);

    console.log('Signing string:\n', signingString);
    console.log('Verified?', ok);
    return ok;
  }catch(e){
    console.log("SOME VERIFY ERROR", e)
    return false;
  }
}

module.exports = { verifySign, makeDigest }