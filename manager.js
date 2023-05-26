const express = require('express'),
      router = express.Router();

const { Message, Account, Follower, Like, Announce } = require('./models/db');
const { header } = require('./utils/autofields');
const { fn } = require('objection');
const { flatMapAddressees } = require('./utils/flatmapaddressees');

const composer_root = "/ap/composer";

router.route("/messages").all(async(req, res) => {
    const domain = req.app.get('domain');
    const username = res.locals.username;
    const account_uri = "https://"+domain+"/u/"+username;

    var body = header();
    body += "Hi "+username+".<br>";
    if (res.locals.msg){
        body += "<div style='border: 1px solid #000; padding: 10px; margin: 10px'>"+res.locals.msg+"</div>"
    }

    body += "<table>"
    body += "<tr><td></tr>"
    await Message.query().where("attributedTo", "=", account_uri)
    .orderBy("publishedAt", "desc")
    .withGraphFetched("[addressees_raw, attachments]")
    .then((messages) => {  
        for(let message of messages){
            body += "<tr class='bordtop'>";
            body += "<td>"+message.id;
            body += "<td>"+message.type+"<td>"+message.uri;
            body += "<td>"+(message.content ? message.content : "")
            body += "<td>"+message.attachments.length;
            body += "<td>"+new Date(message.publishedAt).toISOString();
            
            body += "<td>";

            /* DELETE FORM */
            body += "<form action='"+composer_root+"/"+username+"/Delete/Object' method='post'>";
            body += "<input type='hidden' name='obj_id' value='"+message.uri+"'>"
            body += "<input type='hidden' name='obj_object' value='"+message.uri+"'>"
            body += "<input type='hidden' name='obj_type' value='Note'>"
            body += "<input type='hidden' name='obj_actor' value='"+account_uri+"'>"
            //body += "<input type='hidden' name='pub' value='"+message.public+"'>"
            //body += "<input type='hidden' name='followshare' value='"+message.followshare+"'>"
            body += "<input type='submit' value='Delete'>"
            body += "</form>"

            /* UPDATE FORM */
            body += "<td>";
            const to = flatMapAddressees(message.addressees_raw, 'to', 0);
            const cc = flatMapAddressees(message.addressees_raw, 'cc', 0);
            const message_id = message.uri.split("/")
            const guid = message_id[(message_id.length-1)]
            body += "<form action='"+composer_root+"/"+username+"/Update/"+message.type+"' method='post'>";
            body += "<input type='hidden' name='to' value='"+(to.join(" "))+"'>"
            body += "<input type='hidden' name='cc' value='"+(cc.join(" "))+"'>"
            body += "<input type='hidden' name='content' value='"+(message.content ? message.content : "")+"'>"
            body += "<input type='hidden' name='summary' value='"+(message.summary ? message.summary : "")+"'>"
            body += "<input type='hidden' name='inreplyto' value='"+message.inReplyTo+"'>"
            body += "<input type='hidden' name='manual_guid' value='"+guid+"'>"
            body += "<input type='hidden' name='pub' value='"+message.public+"'>"
            body += "<input type='hidden' name='followshare' value='"+message.followshare+"'>"

            // HANDLE ATTACHMENTS
            body += "<input type='hidden' name='n_attachs' value='"+message.attachments.length+"'>"
            for(let attach of message.attachments){
                body += "<input type='hidden' name='href[]' value='"+attach.url+"'>"
                body += "<input type='hidden' name='mediaType[]' value='"+attach.mediaType+"'>"
                body += "<input type='hidden' name='blurhash[]' value='"+attach.blurhash+"'>"
                body += "<input type='hidden' name='attachname[]' value='"+attach.name+"'>"
                body += "<input type='hidden' name='width[]' value='"+attach.width+"'>"
                body += "<input type='hidden' name='height[]' value='"+attach.height+"'>"
            }
            body += "<input type='submit' value='Update'>"
            body += "</form>"

            /* CLOSE ROW */
            body += "</td>";
            body += "</tr>";
        }
    })
    .catch((e) => {
        console.error("ERROR looking up account", e)
        body += "No messages found!"
    })
    body += "</table>"
    res.send(body)
})

router.route("/likes").all(async(req, res) => {
    const domain = req.app.get('domain');
    const username = res.locals.username;
    const account_uri = "https://"+domain+"/u/"+username;

    var body = header();
    body += "Hi "+username+".<br>";
    if (res.locals.msg){
        body += "<div style='border: 1px solid #000; padding: 10px; margin: 10px'>"+res.locals.msg+"</div>"
    }

    body += "<h3>"+username+" has liked...</h3>"
    body += "<table>"
    body += "<thead>"
    body += "<tr><td>id<td>message_uri<td>date</tr>"
    body += "</thead>"
    await Like.query().where("account_uri", "=", account_uri)
    .orderBy("createdAt", "desc")
    .then((likes) => {  
        for(let like of likes){
            body += "<tr class='bordtop'>";
            body += "<td>"+like.id+"<td>"+like.message_uri+"<td>"+new Date(like.createdAt).toISOString();
            body += "<td>";
            body += "<form action='"+composer_root+"/"+username+"/Undo/Object' method='post'>";
            body += "<input type='hidden' name='obj_id' value='"+like.activity_uri+"'>"
            body += "<input type='hidden' name='obj_type' value='Like'>"
            body += "<input type='hidden' name='obj_actor' value='"+like.account_uri+"'>"
            body += "<input type='hidden' name='obj_object' value='"+like.message_uri+"'>"
            body += "<input type='submit' value='Unlike'>"
            body += "</form>"
            body += "</td>";
            body += "</tr>";
        }
    })
    .catch((e) => {
        console.error("ERROR looking up likes", e)
        body += "No likes found!"
    })
    body += "</table>"
    res.send(body)
})

router.route("/announces").all(async(req, res) => {
    const domain = req.app.get('domain');
    const username = res.locals.username;
    const account_uri = "https://"+domain+"/u/"+username;

    var body = header();
    body += "Hi "+username+".<br>";
    if (res.locals.msg){
        body += "<div style='border: 1px solid #000; padding: 10px; margin: 10px'>"+res.locals.msg+"</div>"
    }

    body += "<h3>"+username+" has boosted...</h3>"
    body += "<table>"
    body += "<thead>"
    body += "<tr><td>id<td>message_uri<td>date</tr>"
    body += "</thead>"
    await Announce.query().where("account_uri", "=", account_uri)
    .orderBy("createdAt", "desc")
    .then((announces) => {  
        for(let announce of announces){
            body += "<tr class='bordtop'>";
            body += "<td>"+announce.id+"<td>"+announce.message_uri+"<td>"+new Date(announce.createdAt).toISOString();
            body += "<td>";
            body += "<form action='"+composer_root+"/"+username+"/Undo/Object' method='post'>";
            body += "<input type='hidden' name='obj_id' value='"+announce.activity_uri+"'>"
            body += "<input type='hidden' name='obj_type' value='Announce'>"
            body += "<input type='hidden' name='obj_actor' value='"+announce.account_uri+"'>"
            body += "<input type='hidden' name='obj_object' value='"+announce.message_uri+"'>"
            body += "<input type='submit' value='Unboost'>"
            body += "</form>"
            body += "</td>";
            body += "</tr>";
        }
    })
    .catch((e) => {
        console.error("ERROR looking up likes", e)
        body += "No likes found!"
    })
    body += "</table>"
    res.send(body)
})

router.route("/followings").all(async(req, res) => {
    const domain = req.app.get('domain');
    const username = res.locals.username;
    const account_uri = "https://"+domain+"/u/"+username;

    var body = header();
    body += "Hi "+username+".<br>";
    if (res.locals.msg){
        body += "<div style='border: 1px solid #000; padding: 10px; margin: 10px'>"+res.locals.msg+"</div>"
    }

    body += "<h3>Add follower by User URI:</h3>";
    body += "<form action='"+composer_root+"/"+username+"/Follow/Id' method='post'>";
    body += "<input type='text' value='' name='stringobj'>"
    body += "<input type='submit' value='Send follow'>"
    body += "</form>"

    body += "<h3>"+username+" follows:</h3>"
    body += "<table>"
    body += "<thead><tr><td>username<td>Accepted?<td>Timestamp<td>Actions</tr></thead>"
    body += "<tr><td></tr>"
    await Follower.query().where("follower", "=", account_uri)
        //.withGraphFetched("follow_activity")
        .orderBy("createdAt", "desc")
    .then((followings) => {  
        for(let following of followings){
            body += "<tr class='bordtop'>";
            body += "<td>"+following.username+"<td>"+following.accepted+"<td>"+new Date(following.createdAt).toISOString();
            body += "<td>";
            body += "<form action='"+composer_root+"/"+username+"/Undo/Object' method='post'>";
            body += "<input type='hidden' name='to' value='"+following.username+"'>"
            body += "<input type='hidden' name='obj_id' value='"+following.follow_activity_uri+"'>"
            body += "<input type='hidden' name='obj_type' value='Follow'>"
            body += "<input type='hidden' name='obj_actor' value='"+following.follower+"'>"
            body += "<input type='hidden' name='obj_object' value='"+following.username+"'>"
            body += "<input type='submit' value='Unfollow'>"
            body += "</form>"
            body += "</td>";
            body += "<td>";
            body += "<button><a href='/ap/crawl?uri="+following.username+"'>Crawl their feed and boost (for ALL users)!</a></button>"
            body += "</td>";
            body += "</tr>";
        }
    })
    .catch((e) => {
        console.error("ERROR looking up account", e)
        body += "No messages found!"
    })
    body += "</table>"

    body += "<h3>They follow "+username+":</h3>"
    body += "<table>"
    body += "<thead><tr><td>username<td>Accepted?<td>Timestamp<td>Actions</tr></thead>"
    body += "<tr><td></tr>"
    await Follower.query().where("username", "=", account_uri)
        .orderBy("createdAt", "desc")
    .then((followers) => {  
        for(let follower of followers){
            body += "<tr class='bordtop'>";
            body += "<td>"+follower.follower+"<td>"+follower.accepted+"<td>"+new Date(follower.createdAt).toISOString();
            body += "<td>";
            body += "<form action='"+composer_root+"/"+username+"/Reject/Object' method='post'>";
            body += "<input type='hidden' name='to' value='"+follower.follower+"'>"
            body += "<input type='hidden' name='obj_id' value='"+follower.follow_activity_uri+"'>"
            body += "<input type='hidden' name='obj_type' value='Follow'>"
            body += "<input type='hidden' name='obj_actor' value='"+follower.username+"'>"
            body += "<input type='hidden' name='obj_object' value='"+follower.follower+"'>"
            body += "<input type='submit' value='Reject'>"
            body += "</form>"
            body += "</td>";
            body += "<td>"
            if(follower.accepted==0){
                body += "<form action='"+composer_root+"/"+username+"/Accept/Object' method='post'>"
                body += "<input type='hidden' name='to' value='"+follower.follower+"'>"
                body += "<input type='hidden' name='obj_id' value='"+follower.follow_activity_uri+"'>"
                body += "<input type='hidden' name='obj_type' value='Follow'>"
                body += "<input type='hidden' name='obj_actor' value='"+follower.username+"'>"
                body += "<input type='hidden' name='obj_object' value='"+follower.follower+"'>"
                body += "<input type='submit' value='Accept'>"
            }
            body += "</td>"
            body += "</tr>";
        }
    })
    .catch((e) => {
        console.error("ERROR looking up account", e)
        body += "No messages found!"
    })
    body += "</table>"
    res.send(body)
})

router.route("/account")
    .post(async (req, res, next) => {
        const domain = req.app.get('domain');
        const username = res.locals.username; // get from middleware
        const account_uri = "https://"+domain+"/u/"+username;
        if(req.body){
            // THIS IS POST
            const { displayname, summary, icon, image, profile_link } = req.body;
            const upd = await Account.query()
                .update({ displayname, summary, icon, image, profile_link, updatedAt: fn.now() })
                .where("uri", "=", account_uri)
            .then((d) => {
                res.locals.msg = "SUCCESS - <a href='"+composer_root+"/"+username+"/Update/Id'>send notification!</a>"
            })
            .catch((e) => {
                res.locals.msg = "ERROR updating profile"
                console.error("ERROR updating profile", e)
            })
        }
        next();
    })
    .all(async(req, res) => {
        const domain = req.app.get('domain');
        const username = res.locals.username; // get from middleware
        const account_uri = "https://"+domain+"/u/"+username;

        await Account.query().where("uri", "=", account_uri).first()
        .then((account) => {
            var body = header();
            body += "Hi "+username+".<br>";
            if (res.locals.msg){
                body += "<div style='border: 1px solid #000; padding: 10px; margin: 10px'>"+res.locals.msg+"</div>"
            }
            body += "<form action='"+composer_root+"/"+username+"/edit/account' method='post'>"
            body += "<table>"
            body += "<tr><td>Handle<td>"+account.handle+"</tr>"
            body += "<tr><td>Display name<td><input type='text' name='displayname' value='"+(account.displayname ? account.displayname : "")+"'><td>name displayed</tr>"
            body += "<tr><td>Summary<td><textarea cols='35' rows='5' name='summary'>"+(account.summary ? account.summary : "")+"</textarea><td>profile text</tr>"
            body += "<tr><td>Icon<td><input type='text' name='icon' value='"+(account.icon ? account.icon : "")+"'><td>URL to profile picture</tr>"
            body += "<tr><td>Banner image<td><input type='text' name='image' value='"+(account.image ? account.image : "")+"'><td>URL to profile banner</tr>"
            body += "<tr><td>Profile link<td><input type='text' name='profile_link' value='"+(account.profile_link ? account.profile_link : "")+"'><td>URL to profile</tr>"
            body += "</table>"
            body += "<input type='submit' value='Update'>";
            body += "</form>"
            res.send(body)
        })
        .catch((e) => {
            console.error("ERROR looking up account")
            res.send("Error looking up account")
        })
})


module.exports = router