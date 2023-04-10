const { EventEmitter } = require("events")

// singleton
let instance = null;

class FedPlugin{
    constructor(config){
        this.eventHandler = new EventEmitter();
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