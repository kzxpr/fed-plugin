
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
    body += "ANNOUNCE (= boost): Announce > Id > Message as 'id' + author in 'to' + 'public' is on<br>"
    body += "UPDATE PROFILE: Update it in database, then Update > Id > Profile as 'id'<br>"
    body += "UPDATE POST: Update it in database, then Update > Id > Message as 'id'<br>"
    body += "DELETE ANNOUNCE: Undo > Object > activity_id as object_id, type = announce, actor = user, object = boosted_post_id";
    body += "<hr>"
    return body;
}

module.exports = { header, addName, addContent, addSummary, addAttachments, addTags }