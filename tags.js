const express = require('express');
const { Tag } = require('./models/db');
const { wrapInOrderedCollection } = require('./lib/wrappers');
const router = express.Router();

router.get("/:tagname", async(req, res) => {
    const { tagname } = req.params;
    let domain = req.app.get('domain');
    await Tag.query()
        .select("message_uri")
        .where("type", "=", "Hashtag")
        .andWhere("name", "=", "#"+tagname)
    .then((messages) => {
        const items = messages.map((v) => {
            return v.message_uri;
        })
        const p = wrapInOrderedCollection("https://"+domain+"/tags/"+tagname, items)
        res.send(p)
    })
    .catch((e) => {
        res.sendStatus(500)
    })
})

router.get("*", (req, res) => {
    res.sendStatus(404)
})

module.exports = router;