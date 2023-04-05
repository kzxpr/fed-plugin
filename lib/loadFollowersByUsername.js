const { Follower } = require("../models/db");

const { wrapInOrderedCollection } = require("./wrappers")

async function loadFollowersByUri(account_uri, page = 0){
    return new Promise(async (resolve, reject) => {
        var limit = 100;
        var offset = 0;
        var id = account_uri + "/followers"
        if(page && page!=0){
            limit = 10;
            offset = limit*(page-1);
            id = id+"?page="+page;
        }

        const followers = await Follower.query()
            .where("username", "=", account_uri).select("follower")
            .limit(limit).offset(offset)
        .then(function(rows){
            const followers = rows.map(function(v){
                return v.follower;
            })
            const followersCollection = wrapInOrderedCollection(id, followers, { wrapInFirst: true })
            resolve(followersCollection)
        })
        .catch((e) => {
            console.log(e)
            reject({ statuscode: 500, msg: "DB Error in loadFollowersByUri"})
        })
    })
}

async function loadFollowingByUri(account_uri, page){
    return new Promise(async (resolve, reject) => {
        var limit = 100;
        var offset = 0;
        var id = account_uri + "/following"
        if(page && page!=0){
            limit = 10;
            offset = limit*(page-1);
            id = id+"?page="+page;
        }

        const followers = await Follower.query().where("follower", "=", account_uri).select("username")
        .then(function(rows){
            const followings = rows.map(function(v){
                return v.username;
            })
            const followingCollection = wrapInOrderedCollection(id, followings, { wrapInFirst: true })
            resolve(followingCollection)
            /*let followingCollection = {
                "@context":["https://www.w3.org/ns/activitystreams"],
                "type":"OrderedCollection",
                "totalItems":followings.length,
                "id": uri+"/following",
                "first": {
                    "type":"OrderedCollectionPage",
                    "totalItems":followings.length,
                    "partOf": uri+"/following",
                    "orderedItems": followings,
                    "id": uri+"/following?page=1"
                }
            };
            resolve(followingCollection)*/
        })
    })
}

module.exports = { loadFollowersByUri, loadFollowingByUri }