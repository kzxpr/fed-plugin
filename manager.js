const express = require('express'),
      router = express.Router();

const { Message, Account, Follower, Like, Announce } = require('./models/db');
const { header } = require('./utils/autofields');
const { fn } = require('objection');

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
    .then((messages) => {  
        for(let message of messages){
            body += "<tr class='bordtop'>";
            body += "<td>"+message.id+"<td>"+message.uri+"<td>"+message.content+"<td>"+new Date(message.publishedAt).toISOString();
            body += "<td>";
            body += "<form action='"+composer_root+"/"+username+"/Delete/Object' method='post'>";
            body += "<input type='hidden' name='obj_id' value='"+message.uri+"'>"
            body += "<input type='hidden' name='obj_object' value='"+message.uri+"'>"
            body += "<input type='hidden' name='obj_type' value='Note'>"
            body += "<input type='hidden' name='obj_actor' value='"+account_uri+"'>"
            //body += "<input type='hidden' name='pub' value='"+message.public+"'>"
            //body += "<input type='hidden' name='followshare' value='"+message.followshare+"'>"
            body += "<input type='submit' value='Delete'>"
            body += "</form>"
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