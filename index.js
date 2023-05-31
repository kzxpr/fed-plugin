const { EventEmitter } = require("events")
const { sendAnnounce, sendLike, sendAccept, sendNote, sendFollow, sendUpdate, sendCreate, sendDelete } = require("./lib/senders");

// singleton
let instance = null;

class FedPlugin{
    constructor(config){
        this.eventHandler = new EventEmitter();
        if(config && config.domain){
            this.domain = config.domain;
        }else{
            throw new Error("Please set domain when initiating FedPlugin")
        }
        this.sendLike = sendLike;
        this.sendAnnounce = sendAnnounce;
        this.sendAccept = sendAccept;
        this.sendNote = sendNote;
        this.sendCreate = sendCreate;
        this.sendUpdate = sendUpdate;
        this.sendDelete = sendDelete;
        this.sendFollow = sendFollow;
    }

    setDomain(domain){
        this.domain = domain;
    }

    getDomain(){
        return this.domain;
    }

    // singleton
    static getInstance(config){
        if(!instance){
            instance = new FedPlugin(config)
        }
        return instance;
    }
}

module.exports = function(config){
    return FedPlugin.getInstance(config);
};