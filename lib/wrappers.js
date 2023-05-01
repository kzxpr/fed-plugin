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
      case 'Update': wrapped = wrapInUpdate(obj, actor, [], ref_url); break;
      case 'Flag': wrapped = wrapInFlag(obj, actor, domain, [], ref_url); break;
      case 'Undo': wrapped = wrapInUndo(obj, actor, domain, [], ref_url, { to, cc }); break;
      case 'Announce': wrapped = wrapInAnnounce(obj, actor, { to, cc }, ref_url); break;
      case 'Follow': wrapped = wrapInFollow(obj, actor, domain, [], ref_url); break;
      case 'Like': wrapped = wrapInLike(obj, actor, { to, cc }, ref_url); break;
      case 'Accept': wrapped = wrapInAccept(obj, actor, { to, cc }, ref_url); break;
      default: console.log(clc.red("ERROR"), "wrap for activity type not supported", activity)
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

function wrapInUpdate(object, actor, follower = [], guid = ""){
  //  actor | object | target | result | origin | instrument 
  var id;
  const random = crypto.randomBytes(16).toString('hex');
  if(typeof object == "object" && object.id){
    id = object.id;
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
      'published': object.published,
      'object': object
    };
    
    return updateMessage;
}

function wrapInDelete(object, actor, params, guid = ""){
  // Doesn't require to or cc
  //const { to, cc } = params;
    
    let message = {
      '@context': ['https://www.w3.org/ns/activitystreams'],
      'id': guid+"/delete",
      'type': 'Delete',
      'actor': actor,
      'published': object.published,
      'object': object
    };
    
    return message;
}

function wrapInAnnounce(object, actor, params, guid = ""){
  // This wrap requires to or cc...
  const { to, cc } = params;
    
  let wrap = {}
  wrap["@context"] = ['https://www.w3.org/ns/activitystreams'];
  wrap['id'] = guid+"/announce",
  wrap["type"] = 'Announce';
  wrap["actor"] = actor;
  wrap["to"] = [ ...to ];
  if(cc){
    wrap["cc"] = [ ...cc ];
  }
  wrap["object"] = object
  wrap['published'] = object.published;

  return wrap;
}

function wrapInFollow(object, actor, domain = "", follower = [], guid = ""){
  // This wrap DOESN'T require to or cc...
    
    let message = {
      '@context': ['https://www.w3.org/ns/activitystreams'],
      'id': guid+'/follow',
      'type': 'Follow',
      'actor': actor,
      'published': object.published,
      'object': object
    };
    
    return message;
}

function wrapInUndo(object, actor, domain = "", follower = [], guid = "", params){
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

function wrapInFlag(object, actor, domain = "", follower = [], guid = ""){
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
  const { to, cc } = params;
    let message = {
      '@context': ['https://www.w3.org/ns/activitystreams'],
      'id': guid+"/accept",
      'type': 'Accept',
      'actor': actor,
      'object': object,
      'to': to,
      'cc': cc,
      'published': params.published,
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
    "@content": content,
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
  tempActor["id"] = "https://"+domain+"/u/"+actor;
  tempActor["name"] = account.displayname ? account.displayname : actor;
  tempActor["summary"] = account.summary;
  tempActor["url"] = "https://"+domain+"/?user="+actor;
  tempActor["type"] = "Person";
  tempActor["preferredUsername"] = actor;
  tempActor["discoverable"] = true;

  /* LINKS */
  tempActor["followers"] = "https://"+domain+"/u/"+actor+"/followers"
  tempActor["following"] = "https://"+domain+"/u/"+actor+"/following"
  tempActor["featured"] = "https://"+domain+"/u/"+actor+"/collections/featured"
  tempActor["liked"] = "https://"+domain+"/u/"+actor+"/liked";
  tempActor["inbox"] = "https://"+domain+"/u/"+actor+"/inbox";
  tempActor["outbox"] = "https://"+domain+"/u/"+actor+"/outbox";
  // Added this followers URI for Pleroma compatibility, see https://github.com/dariusk/rss-to-activitypub/issues/11#issuecomment-471390881
  // New Actors should have this followers URI but in case of migration from an old version this will add it in on the fly
  if (tempActor.followers === undefined) {
      tempActor.followers = "https://"+domain+"/u/"+actor+"/followers";
  }

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
      if(account.icon.substr(-4)==".png"){
          tempActor["icon"].mediaType = "image/png";
          tempActor["icon"].url = account.icon;
      }else if(account.icon.substr(-4)==".jpg"){
          tempActor["icon"].mediaType = "image/jpg";
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
  if(account.homepage){
      attachment.push({
          "type": "PropertyValue",
          "name": "Homepage",
          "value": "<a href='"+account.homepage+"' rel='me nofollow noopener noreferrer' target='_blank'>"+account.homepage+"</a>"
      })
  }
          
  tempActor["attachment"] = attachment
  tempActor["publicKey"] = {};
  tempActor["publicKey"].id = "https://"+domain+"/u/"+actor+"#main-key";
  tempActor["publicKey"].owner = "https://"+domain+"/u/"+actor;
  tempActor["publicKey"].publicKeyPem = account.pubkey;
  return tempActor;
}

module.exports = { wrapInCreate, wrapInUpdate, wrapInDelete, wrapInFlag, wrapInUndo, wrapInAnnounce, wrapInFollow, wrapInLike, wrapInOrderedCollection, wrapInWebfinger, wrapInActor, wrapInOrderedCollectionPage, wrap, wrapInAccept }