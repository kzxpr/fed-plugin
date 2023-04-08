const express = require('express')
const { Model } = require("objection")
const Knex = require('knex')
const { Tag, Account, Message, Attachment, Like, Announce, Option, Request, Follower, Activity, Vote, Addressee } = require("./ultraModels")
const { EventEmitter } = require("events")

// singleton
let instance = null;

function writeMessage(body){
    return {
        "@context": "her",
        "body": body,
        "domain": "https://"+this.domain+"/u/sjov"
    }
}

function showDomain(k){
    console.log(k)
    return k+this.domain;
}


class ActivityHub{
    constructor(config){
        if(!config.db){
            throw new Error("Please specify db in ActivityHub")
        }

        if(!config.domain){
            throw new Error("Please specify domain in ActivityHub")
        }
        this.db = config.db;
        this.domain = config.domain;

        const knex = Knex(config.db)
        Model.knex(knex);

        this.eventHandler = new EventEmitter();

        this.Tag = Tag;
        this.Account = Account;
        this.Message = Message;
        this.writeMessage = writeMessage;
        this.showDomain = showDomain;
    }

    async getMessages(){
        this.eventHandler.emit("getMessages")
        return await this.Message.query()
        .then((data) => {
            return data;
        })
        .catch((e) => {
            return e;
        })
    }

    async getAccounts(){
        this.eventHandler.emit("getAccounts")
        return await this.Account.query()
        .then((data) => {
            return data;
        })
        .catch((e) => {
            return e;
        })
    }

    async showAccounts(req, res){
        this.eventHandler.emit("showAccounts")
        await this.getAccounts()
        .then((data) => {
            res.send(data)
        })
        .catch((e) => {
            res.send(e)
        })
    }

    setRoutes(app) {
        const router = express.Router();
    
        router.get('/users', this.showAccounts.bind(this));
    
        app.use('/api', router);
    }

    static getInstance(config){
        if(!instance){
            instance = new ActivityHub(config)
        }
        return instance;
    }
}

module.exports = function(config){
    return ActivityHub.getInstance(config);
};