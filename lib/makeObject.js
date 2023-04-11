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

module.exports = { makeObject }