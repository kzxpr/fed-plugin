'use strict';
const express = require('express'),
      router = express.Router();

const { loadWebfingerByUsername } = require("./lib/loadWebfingerByUsername")
const { startAPLog, endAPLog } = require("./lib/aplog")

router.get('/', async function (req, res) {
    console.log("Hi webfinger")
    const aplog = await startAPLog(req)
    let resource = req.query.resource;
    if (!resource || !resource.includes('acct:')) {
        return res.status(400).send('Bad request. Please make sure "acct:USER@DOMAIN" is what you are sending as the "resource" query parameter.');
    } else {
        let account = resource.replace('acct:','');
        const parts = account.split("@");
        await loadWebfingerByUsername(parts[0], parts[1])
        .then(async (data) => {
            await endAPLog(aplog, data)
            res.json(data);
        })
        .catch(async(err) => {
            console.error(err)
            await endAPLog(aplog, err)
            res.status(err.statuscode).send(err.msg);
        })
    }
});

module.exports = router;