const emoji = require('node-emoji');

function encodeStr(rawStr){
    /*var encodedStr = rawStr.replace(/[\u00A0-\u9999<>\&]/g, function(i) {
        //return '&#'+i.charCodeAt(0)+';';
        return '&#'+i.codePointAt(0)+';';
    });*/
    const encodedStr = emoji.unemojify(rawStr)
    const strip_apos = encodedStr.replace(/\'/g, "&quot;");
    return strip_apos;
}

module.exports = { encodeStr }