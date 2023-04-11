const express = require('express'),
      router = express.Router();
      
const { createActor } = require("./lib/createActor")
const { wrapInCreate, wrapInUpdate, wrapInDelete, wrapInFlag, wrapInUndo, wrapInAnnounce, wrapInFollow, wrapInLike } = require("./lib/wrappers")
const { signAndSend } = require("./lib/signAndSend")
const { makeArticle, makeEvent, makeNote, makeQuestion, makeImage, handleAddress } = require("./lib/makeMessage")
const { findInbox } = require("./lib/addAccount")

const clc = require("cli-color")

const { Account, Message, Follower } = require("./models/db")

const { fn } = require('objection');
const { loadRecipients, loadRecipientsByList } = require('./lib/loadRecipientsByList');
const { handleActivity } = require('./lib/handleActivity');
const { makeObject } = require('./lib/makeObject');

const composer_root = "/ap/admin/composer";

function addName(options){
    const { name } = options;

    var body = "<tr><td>name</td><td><input type='text' name='name' value='"+name+"'></td></tr>"
    var hidden = "<input type='hidden' name='name' value='"+name+"'>";

    return { body, hidden }
}

function addContent(options){
    const { content } = options;

    var body = "<tr><td>content</td><td><input type='text' name='content' value='"+content+"'></td></tr>"
    var hidden = "<input type='hidden' name='content' value='"+content+"'>";

    return { body, hidden }
}

function addSummary(options){
    const { summary } = options;

    var body = "<tr><td>summary</td><td><input type='text' name='summary' value='"+summary+"'></td></tr>"
    var hidden = "<input type='hidden' name='summary' value='"+summary+"'>";

    return { body, hidden }
}

function addAttachments(options){
    const { mediaType, href, n_attachs } = options;
    var body = "<tr><td colspan='3'><u>Attachments:</u><td></tr>";
    body += "<tr><td>number of attachments</td><td><input type='number' name='n_attachs' value='"+n_attachs+"'></td></tr>"
    var hidden = "<input type='hidden' name='n_attachs' value='"+n_attachs+"'>";
    const attachment_types = new Array("image/png", "image/jpeg", "audio/mpeg")
    if(n_attachs>0){
        for(let n = 0; n < n_attachs; n++){
            body += "<tr>"
            body += "<td>attachment"+n+"</td>";
            body += "<td><input type='text' name='href' value='"+(href[n] ? href[n] : "")+"'></td>";
            body += "<td><select name='mediaType' value='"+mediaType[n]+"'>"
            for(let attachment_type of attachment_types){
                body += "<option value='"+attachment_type+"' ";
                if(attachment_type == mediaType[n]){
                    body += "selected"
                }
                body += ">"+attachment_type+"</option>"
            }
            body += "</select></td>"
            body += "</tr>"

            hidden += "<input type='hidden' name='mediaType' value='"+mediaType[n]+"'>";
            hidden += "<input type='hidden' name='href' value='"+href[n]+"'>";
        }
    }

    return { body, hidden };
}

function addTags(options){
    const { tags, n_tags } = options;
    var body = "<tr><td colspan='3'><u>Tags:</u><td></tr>";
    body += "<tr><td>number of tags</td><td><input type='number' name='n_tags' value='"+n_tags+"'></td></tr>"
    var hidden = "<input type='hidden' name='n_tags' value='"+n_tags+"'>";
    if(n_tags>0){
        for(let n = 0; n < n_tags; n++){
            body += "<tr>"
            body += "<td>tag"+n+"</td>";
            body += "<td><input type='text' name='tags' value='"+(tags[n] ? tags[n] : "")+"'></td>";
            body += "</td>"
            body += "</tr>"

            hidden += "<input type='hidden' name='tags' value='"+tags[n]+"'>";
        }
    }

    return { body, hidden };
}

function header(){
    var body = "<h1>Let's test ActivityPub</h1>"
    body += "LIKE (= favourite): Like > Id > Message as 'id' + author in 'to'<br>"
    body += "REPLY: Create > Note > Use 'inReplyTo' + author in 'to'<br>"
    body += "FOLLOW: Follow > Id > Account as 'id' + author in 'to'<br>"
    body += "ANNOUNCE (= boost): Announce > Id > Message as 'id' + author in 'to'<br>"
    body += "UPDATE PROFILE: Update it in database, then Update > Id > Profile as 'id'<br>"
    body += "UPDATE POST: Update it in database, then Update > Id > Message as 'id'<br>"
    body += "<hr>"
    return body;
}

function prettyTest(obj){
    return "<pre style='border: 1px solid #ccc; margin: 10px; padding: 10px;'>"+JSON.stringify(obj, undefined, 4)+"</pre>";
}

router.get("/", async(req, res) => {
    let domain = req.app.get('domain');
    var msg = "";
    if(req.query.username){
        const username = req.query.username;
        await createActor(username, domain)
            .then(async (account) => {
                await Account.query().insert({
                    ...account,
                    createdAt: fn.now()
                })
                .then(() => {
                    msg = "Created actor: "+username+"@"+domain;
                })
                .catch((e) => {
                    console.error("ERROR while creating new actor", e)
                    msg = "ERROR adding actor: "+username+"@"+domain;
                })
            })
            .catch((e) => {
                msg = "ERROR while creating actor: "+username+"@"+domain;
            })
    }
    
    
    var body = header();
    body += "Who are you?!<br>"
    if(msg!=""){
        body += "<i>"+msg+"</i><br>"
    }
    body += "<ul>"
    await Account.query().where("handle", "like", "%@"+domain).then((users) => {
        for(let user of users){
            let username = user.username
            body += "<li><a href='"+composer_root+"/"+username+"'>"+username+"</a></li>"
        }
    })
    body += "</ul>"
    body += "<b>Create new actor</b><br>";
    body += "<form action='"+composer_root+"/' method='get'>";
    body += "<input type='text' name='username' placeholder='username'>"
    body += "<input type='submit' value='Create actor'>"
    body += "</form>"
    res.send(body)
})

router.get("/:username", (req, res) => {
    const { username } = req.params;
    var body = header();
    body += "Hi "+username+".<br>";
    body += "What should we do?"
    const options = ["Create", "Update", "Undo", "Delete", "Follow", "Like", "Announce", "Flag"]
    body += "<ul>"
    for(let option of options){
        body += "<li><a href='"+composer_root+"/"+username+"/"+option+"'>"+option+"</a></li>"
    }
    body += "</ul>"
    body += "Additional stuff"
    body += "<ul>"
    body += "<li><a href='"+composer_root+"/"+username+"/edit/account'>Update account</a></li>"
    body += "<li><a href='"+composer_root+"/"+username+"/edit/messages'>Update messages</a></li>"
    body += "</ul>"
    res.send(body)
})

router.route("/:username/edit/account")
    .post(async (req, res, next) => {
        const domain = req.app.get('domain');
        const { username } = req.params;
        const account_uri = "https://"+domain+"/u/"+username;
        if(req.body){
            // THIS IS POST
            const { displayname, summary, icon } = req.body;
            const upd = await Account.query().update({ displayname, summary, icon }).where("uri", "=", account_uri)
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
        const { username } = req.params;
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
            body += "<tr><td>Display name<td><input type='text' name='displayname' value='"+account.displayname+"'><td>name displayed</tr>"
            body += "<tr><td>Summary<td><input type='text' name='summary' value='"+account.summary+"'><td>name displayed</tr>"
            body += "<tr><td>Icon<td><input type='text' name='icon' value='"+account.icon+"'><td>name displayed</tr>"
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

router.route("/:username/edit/messages")
    /*.post(async (req, res, next) => {
        const domain = req.app.get('domain');
        const { username } = req.params;
        const account_uri = "https://"+domain+"/u/"+username;
        if(req.body){
            // THIS IS POST
            const { displayname, summary, icon } = req.body;
            const upd = await Account.query().update({ displayname, summary, icon }).where("uri", "=", account_uri)
            .then((d) => {
                res.locals.msg = "SUCCESS - <a href='"+composer_root+"/"+username+"/Update/Id'>send notification!</a>"
            })
            .catch((e) => {
                res.locals.msg = "ERROR updating profile"
                console.error("ERROR updating profile", e)
            })
        }
        next();
    })*/
    .all(async(req, res) => {
        const domain = req.app.get('domain');
        const { username } = req.params;
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
                body += "<tr>";
                body += "<td>"+message.guid+"<td>"+message.uri+"<td>"+message.content+"<td>"+message.publishedAt;
                body += "<td><a href='"+composer_root+"/"+username+"/Delete/Id?guid="+message.uri+"'>Delete</a>"
                body += "</tr>";
            }
            //body += "<input type='submit' value='Update'>";
        })
        .catch((e) => {
            console.error("ERROR looking up account")
            body += "No messages found!"
        })
        body += "</table>"
        res.send(body)
})

router.get("/:username/:activity", (req, res) => {
    const domain = req.app.get('domain');
    const { username, activity } = req.params;
    const guid = "";
    const ref_url = "https://"+domain+"/u/"+username+"/statuses/"+guid;
    var body = header();
    body += "Hi "+req.params.username+"<br>So you want to <b>"+req.params.activity+"</b> an activity?<br>";
    body += "Which object would you like to use?"
    const options = ["Note", "Question", "Article", "Page", "Event", "Image", "Audio", "Video", "Id", "Object"]
    body += "<ul>"
    for(let option of options){
        body += "<li><a href='"+composer_root+"/"+username+"/"+activity+"/"+option+"'>"+option+"</a></li>"
    }
    body += "</ul>"
    const preview = wrap(activity, {}, { username, domain, ref_url, to: [], cc: [] });
    body += prettyTest(preview)
    res.send(body)
})

function wrap(activity, obj, params){
    const { username, domain, ref_url, to, cc } = params;
    const actor = "https://"+domain+"/u/"+username;
    //console.log(obj, actor, domain, ref_url)
    switch(activity){
        case 'Create': wrapped = wrapInCreate(obj, actor, "guid"); break;
        case 'Delete': wrapped = wrapInDelete(obj, actor, [], { to, cc }); break;
        case 'Update': wrapped = wrapInUpdate(obj, actor, [], ref_url); break;
        case 'Flag': wrapped = wrapInFlag(obj, actor, domain, [], ref_url); break;
        case 'Undo': wrapped = wrapInUndo(obj, actor, domain, [], ref_url, { to, cc }); break;
        case 'Announce': wrapped = wrapInAnnounce(obj, actor, { to, cc }, ref_url); break;
        case 'Follow': wrapped = wrapInFollow(obj, actor, domain, [], ref_url); break;
        case 'Like': wrapped = wrapInLike(obj, actor, { to, cc }, ref_url); break;
    }
    return wrapped
}

router.all("/:username/:activity/:object", async (req, res) => {
    const { username, activity, object } = req.params;
    const domain = req.app.get('domain');
    
    var guid = "";
    if(req.query.guid){
        //guid = req.query.guid;
        //console.log(guid)
        //req.body.manual_guid = guid;
        req.body.stringobj = req.query.guid;
    }
    const dd = new Date();
    const published = dd.toISOString();

    const to = req.body.to !== undefined ? req.body.to : "";
    const cc = req.body.cc !== undefined ? req.body.cc : "";
    const pub = ((req.body.pub !== undefined) && (req.body.pub!="false"))
        ? true : false;
    const followshare = ((req.body.followshare !== undefined) && (req.body.followshare!="false"))
        ? true : false;

    /* HERE - it should check for followshare and public */
    const { cc_field, to_field } = handleAddress({
        to, cc, pub, followshare, username, domain
    })

    /* BODY AND STUFF */
    var body = header();
    body += "Hi "+username+"<br>So you want to "+activity+" an <b>"+object+"</b>?<br><br>";
    body += "<b>Parameters</b><br>"

    hidden = "<form action='"+composer_root+"/"+username+"/"+activity+"/"+object+"/sign' method='post'>";
    body += "<form action='"+composer_root+"/"+username+"/"+activity+"/"+object+"' method='post'>"
    
    const { form_append, hidden_append, obj } = await makeObject(object, { username, domain, published, guid }, req.body)
    body += form_append;
    hidden += hidden_append;
    body += "<br><input type='submit' value='Update preview'>"
    body += "</form>"
    hidden += "<br><input type='submit' value='Go to sign and send!'>"
    hidden += "</form>"
    const ref_url = "https://"+domain+"/u/"+username+"/statuses/"+guid;
    const preview = wrap(activity, obj, { username, domain, ref_url, to: to_field, cc: cc_field });
    body += prettyTest(preview)
    body += hidden;
    res.send(body)
})

router.post("/:username/:activity/:object/sign", async (req, res) => {
    const { username, activity, object } = req.params;
    const domain = req.app.get('domain');
    
    const to = req.body.to !== undefined ? req.body.to : "";
    const cc = req.body.cc !== undefined ? req.body.cc : "";

    const pub = ((req.body.pub !== undefined) && (req.body.pub!="false"))
        ? true : false;
    const followshare = ((req.body.followshare !== undefined) && (req.body.followshare!="false"))
        ? true : false;

    /* HERE - it should check for followshare and public */
    const { cc_field, to_field } = handleAddress({
        to, cc, pub, followshare, username, domain
    })

    const guid = "";
    const dd = new Date();
    const published = dd.toISOString();
    var body = header();
    const { body_append, hidden_append, obj } = await makeObject(object, { username, domain, published, guid }, req.body)

    body += "Review one last time...<br>"
    body += "<form action='"+composer_root+"/"+username+"/"+activity+"/"+object+"/sign/send' method='post'>"
    body += hidden_append;
    const ref_url = "https://"+domain+"/u/"+username+"/statuses/"+guid;
    const preview = wrap(activity, obj, { username, domain, ref_url, to: to_field, cc: cc_field });
    body += prettyTest(preview)
    body += "To: "+req.body.to+"<br>";
    body += "CC: "+req.body.cc+"<br>";
    body += "<input type='submit' value='Send'>"
    body += "</form>"
    res.send(body);
});

router.post("/:username/:activity/:object/sign/send", async (req, res) => {
    const { username, activity, object } = req.params;
    const domain = req.app.get('domain');

    const to = req.body.to !== undefined ? req.body.to : "";
    const cc = req.body.cc !== undefined ? req.body.cc : "";
    const pub = ((req.body.pub !== undefined) && (req.body.pub!="false"))
        ? true : false;
    const followshare = ((req.body.followshare !== undefined) && (req.body.followshare!="false"))
        ? true : false;
    
    // TEMPORARY:
    const account_uri = "https://"+domain+"/u/"+username;
    const account = await Account.query().where("uri", "=", account_uri).select("apikey").first();
    const apikey = account.apikey;
    
    const { to_field, cc_field } = handleAddress({ to, cc, pub, followshare, username, domain })
    const recipient_list = to_field.concat(cc_field)

    const guid = crypto.randomBytes(16).toString('hex');
    const dd = new Date();
    const published = dd.toISOString();
    var body = header();
    const { body_append, hidden_append, obj } = await makeObject(object, { username, domain, published, guid }, req.body)

    const uri = "https://"+domain+"/u/"+username;
    const ref_url = uri+"/statuses/"+guid;
    const wrapped = wrap(activity, obj, { username, domain, ref_url, to: to_field, cc: cc_field });
    
    body += prettyTest(wrapped)

    /* Resolve all recipients */
    const recipients = await loadRecipientsByList(recipient_list, uri)

    /* ADD ACTIVITY TO DATABASE */
    try {
        await handleActivity(activity, wrapped)
    } catch(e) {
        console.log(e)
    }
    
    for(let recipient of recipients){
        await findInbox(recipient)
        .then(async(inbox) => {
            let recipient_url = new URL(recipient);
            let targetDomain = recipient_url.hostname;
            await signAndSend(wrapped, uri, targetDomain, inbox, apikey)
                .then((data) => {
                    console.log(clc.green("SUCCESS:"), "Sent to ",recipient,":",data)
                    body += "To: "+recipient+" = OK<br>";
                })
                .catch((err) => {
                    console.error(err)
                    body += "To: "+recipient+" = ERROR<br>";
                })
        })
        .catch((e) => {
            console.error("Could not findInbox for "+recipient, e)
            body += "To: "+recipient+" = ERROR<br>";
        })
        
    }

    body += "<a href='"+composer_root+"'>BACK!</a>"
    res.send(body);
});

router.get("*", (req, res) => {
    res.sendStatus(404)
})

module.exports = router;