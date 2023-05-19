const express = require('express');
const router = express.Router();

const fs = require("fs");

router.get("/", async(req, res) => {
    let domain = req.app.get('domain');
    var body = "<h2>Img picker</h2><table>";
    const path = require("path").join(__dirname, "..", "..", "public", "img");
    fs.readdirSync(path).forEach((file) => {
        const url = "https://" + domain + "/public/img/" + file;
        body += "<tr><td><img src='"+url+"' height='40' alt='"+file+"'>";
        body += "<td>"+url;
        body += "</tr>"
    });
    body += "</table>"
    res.send(body)
})

module.exports = router;