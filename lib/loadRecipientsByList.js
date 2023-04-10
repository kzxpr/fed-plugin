const { Follower } = require("../models/db");

async function loadRecipientsByList(recipient_list, user_uri){
    var recipients = new Array();
    for(let r of recipient_list){
        if(r == user_uri+"/followers"){
            const followers = await Follower.query()
            .where("username", "=", user_uri).select("follower")
            .then((users) => {
                return users.map((user) => {
                    return user.follower;
                })
            })
            .catch((e) => {
                console.error("ERROR while getting followers", uri)
            })
            recipients = recipients.concat(followers);
        }else if(r != "" && r != "https://www.w3.org/ns/activitystreams#Public"){
            recipients.push(r)
        }
    }
    return recipients;
}

module.exports = { loadRecipientsByList }