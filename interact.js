const express = require('express');
const { getWebfinger, readLinkFromWebfinger } = require('./lib/ap-feed');
const router = express.Router();

router.get("/", async(req, res) => {
    const { follower, follow } = req.query;
    var follower_clean = follower;
    if(follower.substr(0, 1) == "@"){
        follower_clean = follower.substr(1);
    }
    if(follower_clean.search("@")>-1){
        await getWebfinger(follower_clean)
        .then(async(webfinger) => {
            const test = await readLinkFromWebfinger(webfinger, "http://ostatus.org/schema/1.0/subscribe")
            .then((subscribe) => {
                res.redirect(subscribe.template.replace("{uri}", follow))
            })
            .catch((e) => {
                console.log("ERROR in read", e)
                res.send("'" + follower_clean.split("@")[1] + "' doesn't have an interaction schema")
            })
        })
        .catch((e) => {
            console.log("ERROR", e)
            res.send("'" + follower_clean.split("@")[1] + "' is not a valid ActivityPub instance")
        })
    }else{
        res.send("'" + follower+"' is invalid as ActivityPub handle!")
    }
    
})


router.get("*", (req, res) => {
    res.sendStatus(404)
})

module.exports = router;