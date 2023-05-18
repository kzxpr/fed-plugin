const express = require('express'),
      router = express.Router();

const { Message, Account } = require('./models/db');
const { header } = require('./utils/autofields');
const { fn } = require('objection');

const composer_root = "/ap/composer";

router.route("/messages").all(async(req, res) => {
    const domain = req.app.get('domain');
    const username = res.locals.username;
    const account_uri = "https://"+domain+"/u/"+username;
    console.log(res.locals.username, account_uri)

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