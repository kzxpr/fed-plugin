const crypto = require('crypto');
const { Follower } = require("../models/db");
const { fn } = require('objection');
const clc = require('cli-color');

async function addFollower(username, follower, follow_activity_uri){
    // Add the user to the DB of accounts that follow the account
    // get the followers JSON for the user
    // Check if user exists
    return new Promise(async(resolve, reject) => {
        if(username==follower){
            reject("Cannot add oneself as follower")
        }else{
            let newFollowers = await Follower.query()
                .insert({ username, "follower": follower, follow_activity_uri, createdAt: fn.now() })
                .onConflict(['user', 'follower'])
                .ignore()
            .then((d) => {
                resolve(d)
            })
            .catch((e) => {
                console.error("Uncaught error inside addFollower", e)
                reject(e)
            })
        }
    })
}

async function acceptFollower(username, follower, follow_activity_uri, accept_activity_uri){
    // Add the user to the DB of accounts that follow the account
    // get the followers JSON for the user
    // Check if user exists
    return new Promise(async(resolve, reject) => {
        await Follower.query()
            .update({ accepted: 1, accept_activity_uri })
            .where("username", "=", username)
            /*.andWhere((builder) => {
                builder.where("follower", "=", follower)
                    .orWhere("uri", "=", follower) // this happens in calckey!!
            })*/
            .andWhere("follow_activity_uri", "=", follow_activity_uri)
        .then((d) => {
            console.log("ACCEPT", d)
            if(d>0){ // one row was updated???
                console.log(clc.green("OK"), "Added Accept to db")
            }else{
                console.log("No match for Accept!", username, follower, follow_activity_uri, accept_activity_uri)
            }
            resolve(d)
        })
        .catch((e) => {
            console.error("Uncaught error inside addFollower", e)
            reject(e)
        })
    });
}


async function removeFollower(username, follower){
    return new Promise(async(resolve, reject) => {
        await Follower.query()
            .where("username", "=", username)
            .andWhere("follower", "=", follower)
            .delete()
            .then((d) => {
                resolve()
            })
            .catch((e) => {
                console.error("Uncaught error inside removeFollower", e)
                reject()
            })
    });
}

module.exports = { addFollower, removeFollower, acceptFollower }