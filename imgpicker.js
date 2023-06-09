const express = require('express');
const router = express.Router();

const fs = require("fs");

function getFiles(dir){
    const files = fs.readdirSync(dir, { withFileTypes: true })
    .flatMap((file) => {
        if (file.isDirectory()) {
            return getFiles(dir+"/"+file.name)
        }else if(file.name==".gitkeep"){
            return [];
        }else{
            return dir + "/" + file.name;
        }
    });
    return files;
}

router.get("/", async(req, res) => {
    let domain = req.app.get('domain');
    var body = "<h2>Img picker</h2><table>";
    const path = require("path").join(__dirname, "..", "..", "public", "img");
    const files = getFiles(path);
    for(let file of files){
        const url = file.replace(path, "https://" + domain + "/public/img");
        body += "<tr><td><img src='"+url+"' height='40' alt='"+file+"'>";
        body += "<td>"+url;
        body += "</tr>"
    }
    
    body += "</table>"
    res.send(body)
})

router.get("*", (req, res) => {
    res.sendStatus(404)
})

module.exports = router;