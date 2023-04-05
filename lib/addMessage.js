const { encodeStr, findFollowers } = require("./addAccount")
const { addAttachment } = require("./addAttachment")
const { addOption } = require("./addOption")
const { addTag } = require("./addTag")
const { Message, Vote, Addressee } = require("../models/db")
const { fn } = require('objection');

function unwrapMessage(obj){
    //console.log("UNWRAP", obj)
    if(typeof obj.object === "object"){
        console.log("UNWRAPPED")
        return obj.object;
    }else{
        return obj;
    }
}

function parseMessage(message){
    const uri = message.id;
    const type = message.type;
    const summary = message.summary
        ? encodeStr(message.summary)
        : null;
    const inReplyTo = message.inReplyTo
        ? message.inReplyTo
        : null;
    const publishedAt = message.published
        ? date2mysql(message.published)
        : null;
    const url = message.url
        ? message.url
        : null;
    const attributedTo = message.attributedTo;
    const content = message.content
        ? encodeStr(message.content)
        : null;
    const name = message.name
        ? encodeStr(message.name)
        : null;
    const replies_uri = ((message.replies) && (message.replies.id))
        ? message.replies.id
        : null;
    const anyOf = null;
    const oneOf = null;
    var optiontype = null;
    if(type=="Question"){
        if(message.oneOf){
            optiontype = "oneOf";
        }else if(message.anyOf){
            optiontype = "anyOf";
        }
    }
    return { uri, type, summary, inReplyTo, publishedAt, url, attributedTo, content, name, replies_uri, anyOf, oneOf, optiontype }
}

function parseAddressees(arr, field){
    var list = new Array();
    for(let user_uri of arr){
        list.push({
            account_uri: user_uri,
            field
        })
    }
    return list
}

function extractAddressee(message){
    var addressees = new Array();
    if(message.to && message.to.length>0){
        addressees = addressees.concat(parseAddressees(message.to, 'to'))
    }
    if(message.cc && message.cc.length>0){
        addressees = addressees.concat(parseAddressees(message.cc, 'cc'))
    }
    if(message.bcc && message.bcc.length>0){
        addressees = addressees.concat(parseAddressees(message.bcc, 'bcc'))
    }
    return addressees;
}

function date2mysql(d){
    return new Date(d).toISOString().slice(0, 19).replace('T', ' ');
}

async function addMessage(message){
    //console.log("Triggered addMessage with", message)
    return new Promise(async(resolve, reject) => {
        if(message){
            await Message.query().where("uri", "=", message.id).select("id")
            .then(async(rows) => {
                if(rows.length==0){
                    const guid = crypto.randomBytes(16).toString('hex');
                    const parsedMessage = parseMessage(message);
                    if(parsedMessage.type=="Announce"){
                        console.warn("WAS SENT ANNONCE - IT WAS IGNORED")
                        reject("THIS IS AN ANNOUNCE!!!!")
                    }
                    if(parsedMessage.publishedAt===null){
                        parsedMessage.publishedAt=fn.now();
                    }
                    
                    // Extract the URIs in 'to', 'cc' and 'bcc' into one array (addressees)
                    const addressees = extractAddressee(message)
                    const address_list = addressees.map((addr) => {
                        return addr.account_uri;
                    })
                    //console.log("FOUND ADDR", address_list)

                    // check for public group addressees
                    const public_test = address_list.includes("https://www.w3.org/ns/activitystreams#Public")

                    // find the creator's follower_uri, save it to "followshare_addr" and check for follower group in addressees
                    const { followshare_test, followshare_addr } = await findFollowers(parsedMessage.attributedTo)
                    .then((follower_uri) => {
                        console.log("addMessage resolved follower_uri as:",follower_uri)
                        return {
                            followshare_test: address_list.includes(follower_uri),
                            followshare_addr: follower_uri
                        };
                    })
                    .catch((e) => {
                        console.error("ERROR in addMessage resolving follower_uri")
                        return {
                            followshare_test: false,
                            followshare_addr: ""
                        }
                    })

                    // Validate results of public_test and followshare_test
                    var public = 0;
                    var followshare = 0;
                    if(public_test){
                        public = 1;
                    }
                    if(followshare_test){
                        followshare = 1;
                    }

                    /* CHECK IF THIS IS A 'VOTE' TO A 'QUESTION' */
                    var isVote = false;
                    if(message.inReplyTo && message.name && message.content===undefined && message.summary===undefined){
                        console.log("So far so good....", message)
                        const inReplyTo = message.inReplyTo;
                        await Message.query().where({ "uri": inReplyTo }).first()
                        .withGraphFetched("[options]")
                        .then(async(org_message) => {
                            console.log("Found message", org_message)
                            if(org_message && org_message.type=="Question"){
                                // check if it matches options
                                const vote = org_message.options.filter((v) => {
                                    return v.name == message.name;
                                })
                                console.log("FILTERED TO:", vote)
                                if(vote.length==1){
                                    const option_id = vote[0].id;
                                    const account_uri = message.attributedTo;
                                    console.log("This is a vote for ",vote)
                                    isVote = true;
                                    await Vote.query()
                                        .insert({
                                            message_uri: inReplyTo,
                                            option_id,
                                            account_uri,
                                            created_at: fn.now()
                                        })
                                        .onConflict(["message_uri", "option_id", "account_uri"]).ignore()
                                        .then((ids) => {
                                            resolve(ids)
                                        })
                                        .catch((e) => {
                                            console.error("ERROR in adding option_vote", e)
                                            reject(e)
                                        })
                                }
                            }
                        })
                        .catch((e) => {
                            console.error("ERROR looking up inReplyTo", e)
                        })
                    }

                    if(!isVote){
                        console.log("NOT a vote!!!!!")
                    }
                    // Insert parsed message into apmessage
                    await Message.query().insert({
                        guid,
                        ... parsedMessage,
                        public,
                        followshare,
                        createdAt: fn.now()
                    })
                    .onConflict("uri").ignore()
                    .then(async(ids) => {
                        // I'm wrapping in this in if(ids), because I think a MySQL "unique/ignore" would actually also trigger a "then"
                        if(ids){
                            console.log("Added message "+message.id)

                            // ADDRESSEES
                            for(let addr of addressees){
                                // evaluate the type of address (0 = normal, 1 = public group, 2 = follower group)
                                var type = 0;
                                if(addr.account_uri=="https://www.w3.org/ns/activitystreams#Public"){
                                    type = 1;
                                }else if(addr.account_uri==followshare_addr){
                                    type = 2;
                                }
                                await Addressee.query().insert({ ...addr, type, message_uri: message.id, createdAt: fn.now() })
                                    .onConflict(["message_uri", "account_uri"]).ignore()
                                    .then((data) => {
                                        console.log("Added addressees for message",message.id+"!")
                                    })
                                    .catch((e) => {
                                        console.error("ERROR on inserting apaddressee", addr)
                                    })
                            }

                            // ATTACHMENTS
                            if(message.attachment && message.attachment.length>0){
                                for(let attachment of message.attachment){
                                    await addAttachment(message.id, attachment)
                                        .then((data) => {
                                            //console.log("Added attachment")
                                        })
                                        .catch((e) => {
                                            console.error("ERROR in adding attachment", attachment)
                                        })
                                }
                            }

                            // TAGS
                            if(message.tag && message.tag.length>0){
                                for(let tag of message.tag){
                                    await addTag(message.id, tag)
                                        .then((data) => {
                                            //console.log("Added tag")
                                        })
                                        .catch((e) => {
                                            console.error("ERROR in adding tag", tag)
                                        })
                                }
                            }

                            // EXTRACT OPTIONS (if "Question")
                            if(parsedMessage.type == "Question" && parsedMessage.optiontype!=null){
                                if(parsedMessage.optiontype=="anyOf" && message.anyOf){
                                    for(let option of message.anyOf){
                                        await addOption(message.id, option)
                                            .then((data) => {
                                                console.log("Added anyOf option", option)
                                            })
                                            .catch((e) => {
                                                console.error("ERROR in adding anyOf option", option)
                                            })
                                    }
                                }else if(parsedMessage.optiontype=="oneOf" && message.oneOf){
                                    for(let option of message.oneOf){
                                        await addOption(message.id, option)
                                            .then((data) => {
                                                console.log("Added oneOf option", option)
                                            })
                                            .catch((e) => {
                                                console.error("ERROR in adding oneOf option", option)
                                            })
                                    }
                                }
                            }
                        }
                        resolve(ids)
                    })
                    .catch((e) => {
                        console.error("ERROR in addMessage", e)
                        reject("ERROR in addMessage")
                    })
                }else{
                    resolve(rows)
                }
            })
            .catch((e) => {
                console.error("ERROR in addMessage looking up", e)
                reject("ERR in addMessage")
            })
            
        }else{
            reject("No message sent to addMessage!")
        }
    })
}

async function removeMessage(message_uri, creator_uri){
    console.log("TRIGGER removeMessage", message_uri, creator_uri)
    return new Promise(async(resolve, reject) => {
        await Message.query()
        .where("attributedTo", "=", creator_uri)
        .andWhere("uri", "=", message_uri)
        .first()
        .delete()
        .then((rows) => {
            resolve("removeMessage: "+rows+" row removed for "+message_uri)
        })
        .catch((e) => {
            reject(e);
        })
    });
}

async function updateMessage(message){
    return new Promise(async(resolve, reject) => {
        const message_uri = message.id;
        await Message.query()
            .where("uri", "=", message_uri)
            .select("id")
            .first()
            .then(async(message_id) => {
                if(message_id){
                    const parsedMessage = parseMessage(message)
                    await Message.query()
                    .update({
                        ... parsedMessage,
                        updated: fn.now()
                    })
                    .where("id", "=", message_id.id)
                    .andWhere("attributedTo", "=", parsedMessage.attributedTo)
                    .then(async(msg) => {
                        resolve("UPDATED message "+message_uri+": "+msg)
                    })
                    .catch((e) => {
                        reject("ERROR in updateMessage"+e)
                    })
                }else{
                    await addMessage(message)
                        .then((msg) => {
                            console.log("Update object not found. Adding message "+message_uri)
                            resolve("Update object not found. Adding message "+message_uri)
                        })
                        .catch((e) => {
                            reject("Update object not found. ERROR adding message to DB")
                        })
                }
            })
    })
}

module.exports = { addMessage, parseMessage, unwrapMessage, removeMessage, updateMessage }