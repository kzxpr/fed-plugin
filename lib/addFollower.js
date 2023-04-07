const crypto = require('crypto');
const { Follower } = require("../models/db");
const { fn } = require('objection');

async function addFollower(username, follower){
    // Add the user to the DB of accounts that follow the account
    // get the followers JSON for the user
    // Check if user exists
    
    const guid = crypto.randomBytes(16).toString('hex');
    let newFollowers = await Follower.query()
        .insert({"guid": guid, username, "follower": follower, createdAt: fn.now() })
        .onConflict(['user', 'follower'])
        .ignore()
        .then((d) => {
            // void
        })
        .catch((e) => {
            console.error("Uncaught error inside addFollower", e)
        })
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

module.exports = { addFollower, removeFollower }