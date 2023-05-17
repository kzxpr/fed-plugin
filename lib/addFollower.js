const crypto = require('crypto');
const { Follower } = require("../models/db");
const { fn } = require('objection');

async function addFollower(username, follower){
    // Add the user to the DB of accounts that follow the account
    // get the followers JSON for the user
    // Check if user exists
    return new Promise(async(resolve, reject) => {
        if(username==follower){
            reject("Cannot add oneself as follower")
        }else{
            let newFollowers = await Follower.query()
                .insert({ username, "follower": follower, createdAt: fn.now() })
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

async function acceptFollower(username, follower){
    // Add the user to the DB of accounts that follow the account
    // get the followers JSON for the user
    // Check if user exists
    return new Promise(async(resolve, reject) => {
        await Follower.query()
            .update({ accepted: 1 })
            .where("username", "=", username)
            .andWhere("follower", "=", follower)
        .then((d) => {
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