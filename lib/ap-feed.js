const axios = require('axios');

async function getWebfinger(address){
    const parts = address.split("@");
    const url = "https://"+parts[1]+"/.well-known/webfinger/?resource=acct:"+address;
    console.log("Webfinger lookup:", url)
    return new Promise((resolve, reject) => {
        axios
            .get(url)
            .then(res => {
                resolve(res.data);
            })
            .catch(error => {
                if(error.response){
                    console.log("Received "+error.response.status)
                }
                reject("Error in /getWebfinger in axios"+error)
            });
    });
}

function readLinkFromWebfinger(webfinger, rel){
    return new Promise((resolve, reject) => {
        for(let link of webfinger.links){
            if(link.rel==rel){
                resolve(link);
            }
        }
        reject("Could not find "+link+" in webfinger")
    })
}

async function getObjectItem(url, headers){
    if(url && url != "https://www.w3.org/ns/activitystreams#Public"){
        console.log("RUnning getObjectItem", url, headers)
        return new Promise((resolve, reject) => {
            axios({
                method: 'GET',
                headers,
                url
            })
                .then(res => {
                        resolve(res.data);
                })
                .catch(error => {
                    if(error.response){
                        console.log("Received "+error.response.status)
                    }
                    reject("Error with axios in /getObjectItem"+error.status)
                });
        });
    }
}

module.exports = { getWebfinger, readLinkFromWebfinger, getObjectItem }