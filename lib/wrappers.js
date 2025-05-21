const clc = require('cli-color');

crypto = require('crypto');

function wrapInWebfinger(actor, domain = ""){
  let webfinger = {};
  webfinger.subject = "acct:"+actor+"@"+domain;
  webfinger.links = new Array();
  let selflink = {
    "rel": "self",
    "type": "application/activity+json",
    "href": "https://"+domain+"/u/"+actor
  }
  let profilelink = {
    "rel": "http://webfinger.net/rel/profile-page",
    "type": "text/html",
    "href": "https://"+domain+"/profile/"+actor
  }
  webfinger.links.push(selflink, profilelink);
  return webfinger;
}

function wrap(activity, obj, params){
  const { username, domain, ref_url, to, cc } = params;
  const actor = "https://"+domain+"/u/"+username;
  //console.log(obj, actor, domain, ref_url)
  switch(activity){
      case 'Create': wrapped = wrapInCreate(obj, actor, ref_url); break;
      case 'Delete': wrapped = wrapInDelete(obj, actor, { to, cc }, ref_url); break;
      case 'Update': wrapped = wrapInUpdate(obj, actor, { to, cc }, ref_url); break;
      case 'Flag': wrapped = wrapInFlag(obj, actor, { to, cc }, ref_url); break;
      case 'Undo': wrapped = wrapInUndo(obj, actor, { to, cc }, ref_url); break;
      case 'Announce': wrapped = wrapInAnnounce(obj, actor, { to, cc }, ref_url); break;
      case 'Follow': wrapped = wrapInFollow(obj, actor, {to, cc}, ref_url); break;
      case 'Like': wrapped = wrapInLike(obj, actor, { to, cc }, ref_url); break;
      case 'Accept': wrapped = wrapInAccept(obj, actor, { to, cc }, ref_url); break;
      case 'Reject': wrapped = wrapInReject(obj, actor, { to, cc }, ref_url); break;
      default: wrapped = null; console.log(clc.red("ERROR"), "wrap for activity type not supported", activity)
  }
  return wrapped
}

function wrapInCreate(obj, actor, guid = ""){
  // This wrap requires to or cc...
  var guidCreate;
  /*if(obj.id){
    //const cryptkey = crypto.randomBytes(16).toString('hex');
    guidCreate = obj.id + "/create"
  }else*/
  if(guid!=""){
    guidCreate = guid;
  }else{
    guidCreate = guid;
  }
    
    let createMessage = {
      '@context': ['https://www.w3.org/ns/activitystreams'],
      'id': guidCreate,
      'type': 'Create',
      'actor': actor,
      'published': obj.published,
      'to': obj.to,
      'cc': obj.cc,
      'object': obj
    };
    
    return createMessage;
}

function wrapInUpdate(object, actor, params, guid = ""){
  //  actor | object | target | result | origin | instrument 
  // Doesn't require to or cc
  const { to, cc } = params;
  var published = new Date().toISOString()
  if(object.published){
    published = object.published;
  }else if(params.published){
    published = params.published;
  }
  var id;
  const random = crypto.randomBytes(16).toString('hex');
  if(typeof object == "object" && object.id){
    id = object.id + "/update/"+random;
  }else if(guid!=""){
    id = guid + "/update/"+random;
  }else{
    const gid = crypto.randomBytes(16).toString('hex');
    id = actor+"/statuses/"+gid+"/update/"+random;
  }
    
    let updateMessage = {
      '@context': ['https://www.w3.org/ns/activitystreams'],
      'id': id,
      'type': 'Update',
      'actor': actor,
      'published': published,
      'to': to,
      'cc': cc,
      'object': object
    };
    
    return updateMessage;
}

function wrapInDelete(object, actor, params, guid = ""){
  // Doesn't require to or cc
  const { to, cc } = params;
    
    let message = {
      '@context': ['https://www.w3.org/ns/activitystreams'],
      'id': guid+"/delete",
      'type': 'Delete',
      'actor': actor,
      'published': object.published,
      'to': to,
      'cc': cc,
      'object': object
    };
    
    return message;
}

function wrapInAnnounce(object, actor, params, guid = ""){
  // This wrap requires to or cc...
  const { to, cc, published } = params;
    
  let wrap = {}
  wrap["@context"] = ['https://www.w3.org/ns/activitystreams'];
  wrap['id'] = guid+"/announce",
  wrap["type"] = 'Announce';
  wrap["actor"] = actor;
  wrap["to"] = [ ...to ];
  if(cc){
    wrap["cc"] = [ ...cc ];
  }
  wrap["object"] = object;
  if(published){
    wrap['published'] = object.published;
  }else if(object.published){
    wrap['published'] = object.published;
  }else{
    const dd = new Date();
    wrap['published'] = dd.toISOString();
  }

  return wrap;
}

function wrapInFollow(object, actor, params, ref_url = ""){
  // This wrap DOESN'T require to or cc...
  const { to, cc } = params;

  var published = new Date().toISOString();
  if(object.published){
    published = object.published
  }
    
    let message = {
      '@context': ['https://www.w3.org/ns/activitystreams'],
      'id': ref_url+'/follow',
      'type': 'Follow',
      'actor': actor,
      'published': published,
      'to': to,
      'cc': cc,
      'object': object
    };
    
    return message;
}

function wrapInUndo(object, actor, params, guid = ""){
  const { to, cc } = params;
    
    let message = {
      '@context': ['https://www.w3.org/ns/activitystreams'],
      'id': actor+'/activity/'+guid+'/undo',
      'type': 'Undo',
      'actor': actor,
      'to': to,
      'cc': cc,
      'published': object.published,
      'object': object
    };
    
    return message;
}

function wrapInFlag(object, actor, params, guid = ""){
  const { to, cc } = params;
    let message = {
      '@context': ['https://www.w3.org/ns/activitystreams'],
      'id': actor+'/activity/'+guid+'/flag',
      'type': 'Flag',
      'actor': actor,
      'published': object.published,
      'object': object
    };
    
    return message;
}

function wrapInLike(object, actor, params, guid = ""){    
  const { to, cc } = params;
    let message = {
      '@context': ['https://www.w3.org/ns/activitystreams'],
      'id': guid+"/like",
      'type': 'Like',
      'actor': actor,
      'object': object,
      'to': to,
      'cc': cc,
      'published': object.published,
    };
    
    return message;
}

function wrapInAccept(object, actor, params, guid = ""){
  var cc = "";
  if(params.cc){
    cc = params.cc;
  }

  var { to, cc, published } = params;

    let message = {
      '@context': ['https://www.w3.org/ns/activitystreams'],
      'id': guid+"/accept",
      'type': 'Accept',
      'actor': actor,
      'object': object,
      'to': to,
      'cc': cc
    };
    
    return message;
}

function wrapInReject(object, actor, params, guid = ""){
  var cc = "";
  if(params.cc){
    cc = params.cc;
  }

  var { to, cc, published } = params;

    let message = {
      '@context': ['https://www.w3.org/ns/activitystreams'],
      'id': guid+"/reject",
      'type': 'Reject',
      'actor': actor,
      'object': object,
      'to': to,
      'cc': cc
    };
    
    return message;
}

function wrapInOrderedCollectionPage(objs, actor, domain, id, params){
  const totalItems = params.totalItems ? params.totalItems : objs.length;
  const partOf = params.partOf ? params.partOf : id.split("?")[0];
  var data = {
    "@context": "https://www.w3.org/ns/activitystreams",
    "id": id,
    "type": "OrderedCollectionPage",
    "totalItems": totalItems,
    "partOf": partOf,
    "orderedItems": objs
  }
  
  return data;
  /*if(!page){
    "first": "https://"+domain+"/u/"+username+"/outbox?page=true"
    "partOf": "https://"+domain+"/u/"+username+"/outbox",
    "first": {
      "orderedItems": messages
    }
   "next": "https://"+domain+"/u/"+username+"/outbox?max_id=01FJC1Q0E3SSQR59TD2M1KP4V8&page=true",
    "prev": "https://"+domain+"/u/"+username+"/outbox?min_id=01FJC1Q0E3SSQR59TD2M1KP4V8&page=true", */
}

function wrapInOrderedCollection(id, objs, params = {}){
  const content = new Array("https://www.w3.org/ns/activitystreams");
  const wrapInFirst = params.wrapInFirst ? params.wrapInFirst : false;
  const data = {
    "@context": "https://www.w3.org/ns/activitystreams",
    "id": id,
    "type": "OrderedCollection",
    "totalItems": objs.length
  }
  if(wrapInFirst){
    data.first = {
      "orderedItems": objs
    }
  }else{
    data.orderedItems = objs
  }
  /*
    Alternatively:
    "first": id+"?page=1"
  */
  return data;
}

function wrapInActor(account, actor, domain){
  // THIS IS DESCRIBED FOR MASTODON AS "PROFILE":
  // SEE https://docs.joinmastodon.org/spec/activitypub/#profile
  //
  // See example here: https://www.w3.org/TR/activitypub/#liked

  let tempActor = {};
  const context_featured = {
    "toot": "http://joinmastodon.org/ns#",
    "featured": {
      "@id": "toot:featured",
      "@type": "@id"
    }
  };
  tempActor["@context"] = new Array("https://www.w3.org/ns/activitystreams", "https://w3id.org/security/v1", context_featured);
  tempActor["id"] = account.uri;
  tempActor["name"] = account.displayname ? account.displayname : actor;
  tempActor["summary"] = account.summary;
  tempActor["url"] = account.profile_link ? account.profile_link : account.uri;
  tempActor["type"] = "Person";
  tempActor["preferredUsername"] = actor;
  tempActor["discoverable"] = true;
  tempActor["indexable"] = true;
  tempActor["memorial"] = false;

  /* LINKS */
  tempActor["followers"] = account.followers_uri;
  tempActor["following"] = account.following_uri;
  tempActor["featured"] = account.featured_uri;
  tempActor["liked"] = "https://"+domain+"/u/"+actor+"/liked";
  tempActor["inbox"] = account.inbox_uri;
  tempActor["outbox"] = account.outbox_uri;

  tempActor["endpoints"] = {
    "sharedInbox": "https://"+domain+"/u/inbox"
  }

  /* EXTENDED */
  tempActor["icon"] = {};
  tempActor["icon"].type = "Image";
  if(!account.icon){
      tempActor["icon"].mediaType = "image/png";
      tempActor["icon"].url = "https://"+domain+"/public/icon128.png"
  }else{
    if(account.icon.substr(-1)==".png"){
      tempActor["icon"].mediaType = "image/png";
      tempActor["icon"].url = account.icon;
    }else if(account.icon.substr(-4)==".jpg"){
      tempActor["icon"].mediaType = "image/jpg";
      tempActor["icon"].url = account.icon;
    }else{
      //console.log(clc.cyan("WARNING"), "No recognized filetype for profile icon - using png")
      tempActor["icon"].mediaType = "image/png";
      tempActor["icon"].url = account.icon;
    }
  }


  if(!account.image){

  }else{
      tempActor["image"] = {};
      tempActor["image"].type = "Image";
      tempActor["image"].mediaType = "image/jpeg";
      tempActor["image"].url = account.image;
  }

  var attachment = new Array();

  if(Array.isArray(account.links)){
    for(let link of account.links){
      attachment.push({
        "type": link.type,
        "name": link.name,
        "value": link.value
      })
    }
  }
          
  tempActor["attachment"] = attachment
  tempActor["publicKey"] = {};
  tempActor["publicKey"].id = "https://"+domain+"/u/"+actor+"#main-key";
  tempActor["publicKey"].owner = "https://"+domain+"/u/"+actor;
  tempActor["publicKey"].publicKeyPem = account.pubkey;
  return tempActor;
}

module.exports = { wrapInCreate, wrapInUpdate, wrapInDelete, wrapInFlag, wrapInUndo, wrapInAnnounce, wrapInFollow, wrapInLike, wrapInOrderedCollection, wrapInWebfinger, wrapInActor, wrapInOrderedCollectionPage, wrap, wrapInAccept }