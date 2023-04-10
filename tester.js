const express = require('express'),
      router = express.Router();
      
const { createActor } = require("./lib/createActor")
const { wrapInCreate, wrapInUpdate, wrapInDelete, wrapInFlag, wrapInUndo, wrapInAnnounce, wrapInFollow, wrapInLike } = require("./lib/wrappers")
const { signAndSend } = require("./lib/signAndSend")
const { makeArticle, makeEvent, makeNote, makeQuestion, makeImage, handleAddress } = require("./lib/makeMessage")
const { findInbox } = require("./lib/addAccount")
const { addMessage } = require("./lib/addMessage")

const { Account, Message, Follower } = require("./models/db")

const { fn } = require('objection');
const { loadRecipients, loadRecipientsByList } = require('./lib/loadRecipientsByList');
const { handleActivity } = require('./lib/handleActivity');

const tester_root = "/ap/admin/tester";

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
            body += "<li><a href='"+tester_root+"/"+username+"'>"+username+"</a></li>"
        }
    })
    body += "</ul>"
    body += "<b>Create new actor</b><br>";
    body += "<form action='"+tester_root+"/' method='get'>";
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
        body += "<li><a href='"+tester_root+"/"+username+"/"+option+"'>"+option+"</a></li>"
    }
    body += "</ul>"
    body += "Additional stuff"
    body += "<ul>"
    body += "<li><a href='"+tester_root+"/"+username+"/edit/account'>Update account</a></li>"
    body += "<li><a href='"+tester_root+"/"+username+"/edit/messages'>Update messages</a></li>"
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
                res.locals.msg = "SUCCESS - <a href='"+tester_root+"/"+username+"/Update/Id'>send notification!</a>"
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
            body += "<form action='"+tester_root+"/"+username+"/edit/account' method='post'>"
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
                res.locals.msg = "SUCCESS - <a href='"+tester_root+"/"+username+"/Update/Id'>send notification!</a>"
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
                body += "<td><a href='"+tester_root+"/"+username+"/Delete/Id?guid="+message.uri+"'>Delete</a>"
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
        body += "<li><a href='"+tester_root+"/"+username+"/"+activity+"/"+option+"'>"+option+"</a></li>"
    }
    body += "</ul>"
    const preview = wrap(activity, {}, { username, domain, ref_url });
    body += prettyTest(preview)
    res.send(body)
})

async function makeObject(object, params, body){
    const { domain, username, guid, published } = params;
    const stringobj = body.stringobj !== undefined ? body.stringobj : "https://"+domain+"/u/"+username;
    const content = body.content !== undefined ? body.content : "This is the content of the message <i>including</i> HTML";
    const summary = body.summary !== undefined ? body.summary : "This is the summary text...";
    const name = body.name !== undefined ? body.name : "This is name - no HTML here";
    const to = body.to !== undefined ? body.to : "https://todon.eu/users/kzxpr";
    const cc = body.cc !== undefined ? body.cc : "";
    const sensitive = ((body.sensitive !== undefined) && (body.sensitive=="true")) ? true : false;
    const startTime = body.startTime !== undefined ? body.startTime : "2023-12-31T23:00:00-08:00";
    const endTime = body.endTime !== undefined ? body.endTime : "2024-01-01T06:00:00-08:00";
    const inReplyTo = body.inReplyTo !== undefined ? body.inReplyTo : "";
    const questiontype = body.questiontype !== undefined ? body.questiontype : "oneOf";
    const n_options = body.n_options !== undefined ? body.n_options : 2;
    const closed = body.closed !== undefined ? body.closed : "";

    // object type
    const obj_id = body.obj_id !== undefined ? body.obj_id : "";
    const obj_type = body.obj_type !== undefined ? body.obj_type : "";
    const obj_actor = body.obj_actor !== undefined ? body.obj_actor : "";
    const obj_object = body.obj_object !== undefined ? body.obj_object : "";

    var tags = new Array();
    const found_tags = content.toLowerCase().match(/#(([a-z_]+)([\w_]+)?)/g);  
    if(found_tags){
        tags = found_tags;
    }

    var href = new Array();
    var mediaType = new Array();
    var options = new Array();
    
    if(body.href !== undefined){
        if(Array.isArray(body.href)){
            href = body.href;
            mediaType = body.mediaType;
        }else{
            href = new Array(body.href)
            mediaType = new Array(body.mediaType)
        }
    }
    if(body.options !== undefined){
        if(Array.isArray(body.options)){
            options = body.options;
        }else{
            options = new Array(body.options)
        }
    }
    /*if(body.tags !== undefined){
        if(Array.isArray(body.tags)){
            tags = body.tags;
        }else{
            tags = new Array(body.tags)
        }
    }*/
    
    const manual_guid = body.manual_guid != "" ? body.manual_guid : guid;
    const url = body.url !== undefined ? body.url : "https://"+domain+"/post/"+manual_guid;
    const pub = ((body.pub !== undefined) && (body.pub != "false"))
        ? true : false;
    const followshare = ((body.followshare !== undefined) && (body.followshare != "false"))
        ? true : false;
    const n_attachs = body.n_attachs !== undefined ? body.n_attachs : 0;
    //const n_tags = body.n_tags !== undefined ? body.n_tags : 0;
    const n_tags = tags.length;
    var body = "";
    var hidden = "";
    var obj;
    attributedTo = "https://"+domain+"/u/"+username+"/";
    body += "<table>"
    body += "<tr><td colspan='3'><u>Common parameters</u></tr>"
    //body += "<tr><td width='120'>guid:<td> "+guid+"<td>(generated later)</tr>"
    body += "<tr><td width='120'>guid:<td> <input type='text' name='manual_guid' value='"+manual_guid+"' style='width: 100%; max-width: 300px;'><td>(leave blank to generate later)</tr>";
    body += "<tr><td>attributed:<td> "+attributedTo+"<td></tr>"
    body += "<tr><td>published:<td> "+published+"<td>(updates automatically)</tr>"
    body += "<tr><td>to:<td> <input type='text' name='to' value='"+to+"' style='width: 100%; max-width: 300px;'><td>(url - separate with space)</tr>";
    body += "<tr><td>pub:<td> <input type='checkbox' name='pub' value='yes'";
    if(pub){
        body += "checked"
    }
    body += "><td>(include pub)</tr>";
    body += "<tr><td>cc:<td> <input type='text' name='cc' value='"+cc+"' style='width: 100%; max-width: 300px;'><td>(url - separate with space)</tr>";
    body += "<tr><td>follower:<td> <input type='checkbox' name='followshare' value='yes' ";
    if(followshare){
        body += "checked"
    }
    body += "><td>(include user's follower)</tr>";
    body += "<tr><td>inReplyTo:<td> <input type='text' name='inReplyTo' value='"+inReplyTo+"' style='width: 100%; max-width: 300px;'><td>(url - if using this remember to include owner in 'to')</tr>";
    body += "<tr><td>sensitive:<td><input type='checkbox' name='sensitive' value='true'";
    if(sensitive){
        body += " checked";
    }
    body += "><td>(message cannot be boosted)</tr>"
    
    hidden += "<input type='hidden' name='to' value='"+to+"'>";
    hidden += "<input type='hidden' name='pub' value='"+pub+"'>";
    hidden += "<input type='hidden' name='cc' value='"+cc+"'>";
    hidden += "<input type='hidden' name='followshare' value='"+followshare+"'>";
    hidden += "<input type='hidden' name='inReplyTo' value='"+inReplyTo+"'>";
    hidden += "<input type='hidden' name='manual_guid' value='"+manual_guid+"'>";
    hidden += "<input type='hidden' name='sensitive' value='"+sensitive+"'>";
    
    body += "<tr><td colspan='3'><u>Special parameters</u></tr>"
    
    if(object=="Id"){
        body += "<tr><td>string:</td><td><input type='text' name='stringobj' value='"+stringobj+"' style='width: 100%; max-width: 300px;'> (url)</td></tr>";
        hidden += "<input type='hidden' name='stringobj' value='"+stringobj+"'>";
        obj = stringobj;
    }else if(object=="Note"){
        const content_field = addContent({content})
        const summary_field = addSummary({summary})
        const attachment_field = addAttachments({ mediaType, href, n_attachs });
        const tags_field = addTags({ tags, n_tags })

        body += content_field.body + summary_field.body + attachment_field.body + tags_field.body;
        hidden += content_field.hidden + summary_field.hidden + attachment_field.hidden + tags_field.hidden;

        obj = await makeNote(username, domain, manual_guid, { published, name, n_attachs, href, mediaType, tags, content, to, cc, sensitive, url, summary, inReplyTo, pub, followshare })
    }else if(object=="Image"){
        const name_field = addName({name})
        const attachment_field = addAttachments({ mediaType, href, n_attachs });
        const tags_field = addTags({ tags, n_tags })

        body += name_field.body + attachment_field.body + tags_field.body;
        hidden += name_field.hidden + attachment_field.hidden + tags_field.hidden;
        obj = await makeImage(username, domain, manual_guid, { name, to, cc, tags, href, mediaType, inReplyTo, sensitive, pub, followshare, href, n_attachs })
    }else if(object=="Event"){
        const name_field = addName({name})
        const attachment_field = addAttachments({ mediaType, href, n_attachs });
        const tags_field = addTags({ tags, n_tags })
        body += name_field.body + attachment_field.body + tags_field.body;
        hidden += name_field.hidden + attachment_field.hidden + tags_field.hidden;
        body += "<tr><td>summary</td><td><input type='text' name='summary' value='"+summary+"'></td></tr>"
        body += "<tr><td>startTime</td><td><input type='text' name='startTime' value='"+startTime+"'></td></tr>"
        body += "<tr><td>endTime</td><td><input type='text' name='endTime' value='"+endTime+"'></td></tr>"
        hidden += "<input type='hidden' name='startTime' value='"+startTime+"'>";
        hidden += "<input type='hidden' name='endTime' value='"+endTime+"'>";
        //hidden += "<input type='hidden' name='content' value='"+content+"'>";
        hidden += "<input type='hidden' name='summary' value='"+summary+"'>";
        obj = await makeEvent(username, domain, manual_guid, { published, name, content, tags, to, cc, sensitive, startTime, endTime, url, summary, pub, followshare, mediaType, href, n_attachs })
    }else if(object=="Question"){
        const content_field = addContent({content})
        const attachment_field = addAttachments({ mediaType, href, n_attachs });
        const tags_field = addTags({ tags, n_tags })
        body += content_field.body;
        hidden += content_field.hidden;
        body += "<tr><td>question type</td><td><select name='questiontype'>";
        const questiontypes = new Array("anyOf", "oneOf");
        for(let t of questiontypes){
            body += "<option value='"+t+"'";
            if(t == questiontype){
                body += " selected"
            }
            body += ">"+t+"</option>";
        }
        body += "</select></td></tr>"
        body += "<tr><td>n_options</td><td><input type='number' name='n_options' value='"+n_options+"'></td></tr>"
        if(n_options>0){
            for(let n = 0; n < n_options; n++){
                body += "<tr>"
                body += "<td>option"+n+"</td>";
                body += "<td><input type='text' name='options' value='"+(options[n] ? options[n] : "")+"'></td>";
                body += "</tr>"
            }
        }
        body += "<tr><td>closed</td><td><input type='text' name='closed' value='"+closed+"'></td></tr>"
        body += "<tr><td>endTime</td><td><input type='text' name='endTime' value='"+endTime+"'></td></tr>"
        hidden += "<input type='hidden' name='questiontype' value='"+questiontype+"'>";
        hidden += "<input type='hidden' name='n_options' value='"+n_options+"'>";
        if(n_options>0){
            for(let n = 0; n < n_options; n++){
                hidden += "<input type='hidden' name='options' value='"+options[n]+"'>";
            }
        }
        hidden += "<input type='hidden' name='endTime' value='"+endTime+"'>";
        hidden += "<input type='hidden' name='closed' value='"+closed+"'>";
        body += attachment_field.body + tags_field.body;
        hidden += attachment_field.hidden + tags_field.hidden;
        obj = await makeQuestion(username, domain, manual_guid, { published, content, tags, to, cc, sensitive, questiontype, options, endTime, closed, pub, followshare, n_attachs, mediaType, href })
    }else if(object=="Object"){
        body += "<tr><td>object_id</td><td><input type='text' name='obj_id' value='"+obj_id+"'></td></tr>"
        body += "<tr><td>object_type</td><td><input type='text' name='obj_type' value='"+obj_type+"'></td></tr>"
        body += "<tr><td>object_actor</td><td><input type='text' name='obj_actor' value='"+obj_actor+"'></td></tr>"
        body += "<tr><td>object_object</td><td><input type='text' name='obj_object' value='"+obj_object+"'></td></tr>"
        hidden += "<input type='hidden' name='obj_id' value='"+obj_id+"'>";
        hidden += "<input type='hidden' name='obj_type' value='"+obj_type+"'>";
        hidden += "<input type='hidden' name='obj_actor' value='"+obj_actor+"'>";
        hidden += "<input type='hidden' name='obj_object' value='"+obj_object+"'>";
        obj = { id: obj_id, type: obj_type, actor: obj_actor, object: obj_object }
    }
    body += "</table>"
    return { form_append: body, hidden_append: hidden, obj }
}

function wrap(activity, obj, params){
    const { username, domain, ref_url, to, cc } = params;
    const actor = "https://"+domain+"/u/"+username;
    //console.log(obj, actor, domain, ref_url)
    switch(activity){
        case 'Create': wrapped = wrapInCreate(obj, actor, "guid"); break;
        case 'Delete': wrapped = wrapInDelete(obj, actor, domain, [], { to, cc }); break;
        case 'Update': wrapped = wrapInUpdate(obj, actor, domain, [], ref_url); break;
        case 'Flag': wrapped = wrapInFlag(obj, actor, domain, [], ref_url); break;
        case 'Undo': wrapped = wrapInUndo(obj, actor, domain, [], ref_url, { to, cc }); break;
        case 'Announce': wrapped = wrapInAnnounce(obj, actor, domain, { to, cc }, ref_url); break;
        case 'Follow': wrapped = wrapInFollow(obj, actor, domain, [], ref_url); break;
        case 'Like': wrapped = wrapInLike(obj, actor, domain, [], ref_url); break;
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

    /* BODY AND STUFF */
    var body = header();
    body += "Hi "+username+"<br>So you want to "+activity+" an <b>"+object+"</b>?<br><br>";
    body += "<b>Parameters</b><br>"

    hidden = "<form action='"+tester_root+"/"+username+"/"+activity+"/"+object+"/sign' method='post'>";
    body += "<form action='"+tester_root+"/"+username+"/"+activity+"/"+object+"' method='post'>"
    
    const { form_append, hidden_append, obj } = await makeObject(object, { username, domain, published, guid }, req.body)
    body += form_append;
    hidden += hidden_append;
    body += "<br><input type='submit' value='Update preview'>"
    body += "</form>"
    hidden += "<br><input type='submit' value='Go to sign and send!'>"
    hidden += "</form>"
    const ref_url = "https://"+domain+"/u/"+username+"/statuses/"+guid;
    const preview = wrap(activity, obj, { username, domain, ref_url, to, cc });
    body += prettyTest(preview)
    body += hidden;
    res.send(body)
})

router.post("/:username/:activity/:object/sign", async (req, res) => {
    const { username, activity, object } = req.params;
    const domain = req.app.get('domain');
    
    const to = req.body.to !== undefined ? req.body.to : "";
    const cc = req.body.cc !== undefined ? req.body.cc : "";

    const guid = "";
    const dd = new Date();
    const published = dd.toISOString();
    var body = header();
    const { body_append, hidden_append, obj } = await makeObject(object, { username, domain, published, guid }, req.body)

    body += "Review one last time...<br>"
    body += "<form action='"+tester_root+"/"+username+"/"+activity+"/"+object+"/sign/send' method='post'>"
    body += hidden_append;
    const ref_url = "https://"+domain+"/u/"+username+"/statuses/"+guid;
    const preview = wrap(activity, obj, { username, domain, ref_url, to, cc });
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
    const wrapped = wrap(activity, obj, { username, domain, ref_url, to, cc });
    
    body += prettyTest(wrapped)

    /* Resolve all recipients */
    const recipients = await loadRecipientsByList(recipient_list, uri)

    /* ADD ACTIVITY TO DATABASE */
    await handleActivity(activity, wrapped)
    /*if(activity == "Create" && typeof obj === 'object'){
        await addMessage(obj)
        .then(async(ok) => {
            //console.log("Added message to DB")
        })
        .catch((e) => {
            console.error("ERROR in addMessage")
            res.sendStatus(500)
        })
    }*/
    
    for(let recipient of recipients){
        console.log("RECIPIENT", recipient)
        await findInbox(recipient)
        .then(async(inbox) => {
            let recipient_url = new URL(recipient);
            let targetDomain = recipient_url.hostname;
            await signAndSend(wrapped, uri, targetDomain, inbox, apikey)
                .then((data) => {
                    console.log("SEND NOTE RESPONSE",data)
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

    body += "<a href='"+tester_root+"'>BACK!</a>"
    res.send(body);
});

router.get("*", (req, res) => {
    res.sendStatus(404)
})

module.exports = router;