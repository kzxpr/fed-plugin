const { encodeImageToBlurhash } = require("./blurhash")

async function makeMessage(type, username, domain, guid, params){
    switch(type){
        case 'Note': obj = await makeNote(username, domain, guid, params); break;
        case 'Event': obj = await makeEvent(username, domain, guid, params); break;
        case 'Question': obj = await makeQuestion(username, domain, guid, params); break;
        case 'Image': obj = await makeImage(username, domain, guid, params); break;
        case 'Article': obj = await makeArticle(username, domain, guid, params); break;
        case 'Page': obj = await makePage(username, domain, guid, params); break;
    }
    return obj;
}

function handleAddress(params){
    const { to, cc, public, followshare, username, domain } = params;
    //console.log("RUN HANDLE with", params)
    var to_field, cc_field;
    if(to && to.length>0){
        to_field = to.split(" ")
    }else{
        to_field = new Array();
    }
    if(public){
        to_field.push("https://www.w3.org/ns/activitystreams#Public")
    }
    if(cc && cc.length>0){
        cc_field = cc.split(" ")
    }else{
        cc_field = new Array();
    }
    if(followshare){
        cc_field.push("https://"+domain+"/u/"+username+"/followers")
    }
    return { cc_field, to_field }
}

async function makeNote(username, domain, guid, params){
    const { published, name, content, sensitive, to, cc, url, n_attachs, href, mediaType, summary, inReplyTo, public, followshare, tags } = params;
    var url_link;
    if(!url){
        url_link = "https://"+domain+"/u/"+username+"/statuses/"+guid;
    }else{
        url_link = url;
    }
    var obj = {};
    obj["@context"] = ["https://www.w3.org/ns/activitystreams"]
    obj["id"] = "https://"+domain+"/u/"+username+"/statuses/"+guid;
    obj["type"] = "Note"
    obj["published"] = published;
    obj["attributedTo"] = "https://"+domain+"/u/"+username;
    const { to_field, cc_field } = handleAddress({ to, cc, public, followshare, username, domain });
    obj["to"] = to_field;
    obj["cc"] = cc_field;
    obj["sensitive"] = sensitive;
    obj["url"] = url_link;
    if(inReplyTo){
        obj["inReplyTo"] = inReplyTo;
    }
    obj["summary"] = summary;
    obj["content"] = content;
    obj["contentMap"] = { "en": summary };

    if(tags && tags != null){
        var tag_list = new Array();
        for(let i = 0; i < tags.length; i++){
            if(tags[i] !== undefined){
                var t = {};
                t.type = "Hashtag";
                t.href = "https://"+domain+"/tag/"+tags[i];
                t.name = tags[i]
                tag_list.push(t)
            }
        }
        obj["tag"] = tag_list;
    }
    if(href && href != null){
        var urls = href;
        var types = mediaType;
        if(!Array.isArray(href)){
            urls = new Array(href)
            types = new Array(mediaType)
        }
        attachments = new Array();
        for(let i = 0; i < n_attachs; i++){
            if(urls[i] !== undefined){
                var a = {};
                a.type = "Note";
                a.mediaType = types[i];
                a.url = urls[i];
                a.name = "Untitled"
                await encodeImageToBlurhash(a.url)
                .then((data) => {
                    a.blurhash = data.blurhash;
                    a.width = data.width;
                    a.height = data.height;
                })
                .catch((e) => {
                    console.error("ERROR encoding blurhash", e)
                })
                attachments.push(a)
            }
            
        }
        obj["attachment"] = attachments;
    }
    return obj;
}

function makeArticle(username, domain, guid, params){
    const { published, content, name, url, to, cc, public, followshare, sensitive, tags } = params;
    var url_link;
    if(!url){
        url_link = "https://"+domain+"/u/"+username+"/statuses/"+guid;
    }else{
        url_link = url;
    }
    const { to_field, cc_field } = handleAddress({ to, cc, public, followshare, username, domain });
    if(tags && tags != null){
        var tag_list = new Array();
        for(let i = 0; i < tags.length; i++){
            if(tags[i] !== undefined){
                var t = {};
                t.type = "Hashtag";
                t.href = "https://"+domain+"/tag/"+tags[i];
                t.name = tags[i]
                tag_list.push(t)
            }
        }
    }
    return {
        "@context": ["https://www.w3.org/ns/activitystreams"],
        "id": "https://"+domain+"/u/"+username+"/statuses/"+guid,
        "type": "Article",
        "published": published,
        "attributedTo": "https://"+domain+"/u/"+username,
        "to": to_field,
        "cc": cc_field,
        "sensitive": sensitive,
        "url": url_link,
        "name": name,
        "tag": tag_list,
        "content": content,
        "contentMap": {
            "en": content
        }
    }
}

function makePage(username, domain, guid, params){
    const { published, content, url, public, followshare, tags, sensitive, to, cc } = params;
    var url_link;
    if(!url){
        url_link = "https://"+domain+"/u/"+username+"/statuses/"+guid;
    }else{
        url_link = url;
    }
    const { to_field, cc_field } = handleAddress({ to, cc, public, followshare, username, domain });
    if(tags && tags != null){
        var tag_list = new Array();
        for(let i = 0; i < tags.length; i++){
            if(tags[i] !== undefined){
                var t = {};
                t.type = "Hashtag";
                t.href = "https://"+domain+"/tag/"+tags[i];
                t.name = tags[i]
                tag_list.push(t)
            }
        }
        //obj["tag"] = tag_list;
    }
    return {
        "@context": ["https://www.w3.org/ns/activitystreams"],
        "id": "https://"+domain+"/u/"+username+"/statuses/"+guid,
        "type": "Page",
        "published": published,
        "attributedTo": "https://"+domain+"/u/"+username,
        "to": to_field,
        "cc": cc_field,
        "tag": tag_list,
        "sensitive": sensitive,
        "url": url_link,
        "content": content,
    }
}

async function makeEvent(username, domain, guid, params){
    const { startTime, endTime, name, published, url, summary, tags, to, cc, sensitive, public, followshare } = params;
    var url_link;
    if(!url){
        url_link = "https://"+domain+"/u/"+username+"/statuses/"+guid;
    }else{
        url_link = url;
    }
    const { to_field, cc_field } = handleAddress({ to, cc, public, followshare, username, domain });
    if(tags && tags != null){
        var tag_list = new Array();
        for(let i = 0; i < tags.length; i++){
            if(tags[i] !== undefined){
                var t = {};
                t.type = "Hashtag";
                t.href = "https://"+domain+"/tag/"+tags[i];
                t.name = tags[i]
                tag_list.push(t)
            }
        }
        //obj["tag"] = tag_list;
    }
    return {
        "@context": ["https://www.w3.org/ns/activitystreams"],
        "id": "https://"+domain+"/u/"+username+"/statuses/"+guid,
        "type": "Event",
        "published": published,
        "startTime": startTime,
        "endTime": endTime,
        "attributedTo": "https://"+domain+"/u/"+username,
        "to": to_field,
        "cc": cc_field,
        "sensitive": sensitive,
        "tag": tag_list,
        "url": url_link,
        "name": name,
        "summary": summary
    }
}

async function makeQuestion(username, domain, guid, params){
    const { questiontype, options, content, sensitive, published, url, tags, closed, to, cc, public, followshare, mediaType, href, n_attachs } = params;
    var url_link;
    if(!url){
        url_link = "https://"+domain+"/u/"+username+"/statuses/"+guid;
    }else{
        url_link = url;
    }
    const { to_field, cc_field } = handleAddress({ to, cc, public, followshare, username, domain });
    var obj = {
        "@context": ["https://www.w3.org/ns/activitystreams"],
        "id": "https://"+domain+"/u/"+username+"/statuses/"+guid,
        "type": "Question",
        "published": published,
        "attributedTo": "https://"+domain+"/u/"+username,
        "to": to_field,
        "cc": cc_field,
        "sensitive": sensitive,
        "content": content
    }
    if(closed){
        obj["closed"] = closed;
    }

    var parsed_options;
    if(options && options != null){
        var opts = options;
        if(!Array.isArray(options)){
            opts = new Array(options)
        }
        parsed_options = new Array();
        for(let i = 0; i < opts.length; i++){
            if(opts[i] !== undefined){
                var o = {};
                o.type = "Note";
                o.name = opts[i];
                parsed_options.push(o)
            }
        }
    }

    if(questiontype == "anyOf"){
        obj["anyOf"] = parsed_options;
    }else if(questiontype == "oneOf"){
        obj["oneOf"] = parsed_options;
    }

    if(href && href != null){
        console.log("NU", href)
        var urls = href;
        var types = mediaType;
        if(!Array.isArray(href)){
            urls = new Array(href)
            types = new Array(mediaType)
        }
        attachments = new Array();
        for(let i = 0; i < n_attachs; i++){
            if(urls[i] !== undefined){
                var a = {};
                a.type = "Note";
                a.mediaType = types[i];
                a.url = urls[i];
                a.name = "Untitled"
                await encodeImageToBlurhash(a.url)
                .then((data) => {
                    a.blurhash = data.blurhash;
                    a.width = data.width;
                    a.height = data.height;
                })
                .catch((e) => {
                    console.error("ERROR encoding blurhash", e)
                })
                attachments.push(a)
            }
            
        }
        obj["attachment"] = attachments;
    }

    if(tags && tags != null){
        var tag_list = new Array();
        for(let i = 0; i < tags.length; i++){
            if(tags[i] !== undefined){
                var t = {};
                t.type = "Hashtag";
                t.href = "https://"+domain+"/tag/"+tags[i];
                t.name = tags[i]
                tag_list.push(t)
            }
        }
        obj["tag"] = tag_list;
    }

    return obj;
}

async function makeImage(username, domain, guid, params){
    const { name, href, to, cc, tags, mediaType, inReplyTo, sensitive, url, public, followshare, n_attachs } = params;
    var url_link;
    if(!url){
        url_link = "https://"+domain+"/u/"+username+"/statuses/"+guid;
    }else{
        url_link = url;
    }
    var obj = {};
    obj["@context"] = ["https://www.w3.org/ns/activitystreams"]
    obj["id"] = "https://"+domain+"/u/"+username+"/statuses/"+guid;
    obj["type"] = "Image"
    obj["attributedTo"] = "https://"+domain+"/u/"+username;
    const { to_field, cc_field } = handleAddress({ to, cc, public, followshare, username, domain });
    obj["to"] = to_field;
    obj["cc"] = cc_field;
    obj["sensitive"] = sensitive;
    if(inReplyTo){
        obj["inReplyTo"] = inReplyTo;
    }
    obj["name"] = name;
    
    if(href && href != null){
        var urls = href;
        var types = mediaType;
        if(!Array.isArray(href)){
            urls = new Array(href)
            types = new Array(mediaType)
        }
        attachments = new Array();
        for(let i = 0; i < n_attachs; i++){
            if(urls[i] !== undefined){
                var a = {};
                a.type = "Link";
                a.mediaType = types[i];
                a.url = urls[i];
                a.name = "Untitled"
                await encodeImageToBlurhash(a.url)
                .then((data) => {
                    a.blurhash = data.blurhash;
                    a.width = data.width;
                    a.height = data.height;
                })
                .catch((e) => {
                    console.error("ERROR encoding blurhash", e)
                })
                attachments.push(a)
            }
            
        }
        obj["attachment"] = attachments;
    }

    if(tags && tags != null){
        var tag_list = new Array();
        for(let i = 0; i < tags.length; i++){
            if(tags[i] !== undefined){
                var t = {};
                t.type = "Hashtag";
                t.href = "https://"+domain+"/tag/"+tags[i];
                t.name = tags[i]
                tag_list.push(t)
            }
        }
        obj["tag"] = tag_list;
    }

    return obj;
}

module.exports = { makeMessage, makeArticle, makeEvent, makeNote, makeQuestion, makeImage, makePage, handleAddress }