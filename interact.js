const { getWebfinger, readLinkFromWebfinger } = require('./lib/ap-feed');

function displayFollowInfo(handle = "", msg = ""){
    var html = "<div style='margin: auto; width: 100%; max-width: 700px;'>"
    html += "<h1>FediFollow</h1>";
    if(msg){
        html += "<b>ERROR</b>: "+msg+"<br>"
    }
    html += "You are about to follow <i>"+handle+"</i> on the fediverse using ActivityPub.<br><br>"
    html += "<b>If you already have an account</b><br>"
    html += "Enter your instance here:<br>"
    html += "<form action='/interact/' method='get'>"
    html += "<input type='hidden' name='object' value='"+handle+"'>"
    html += "<input type='hidden' name='type' value='follow'>"
    html += "<input type='text' name='actor'><br>";
    html += "<input type='checkbox' name='remember' value='true'> Remember my instance (this sets a necessary cookie, obviously!)<br>"
    html += "<input type='submit' value='Follow!'>"
    html += "</form>"
    html += "<br>"
    html += "<b>If you don't have an Account</b><br>"
    html += "<a href='https://fed-it.nu'>Find an instance to join now!</a><br><br>"
    if(handle){
        html += "<b>If nothing works</b><br>"
        html += "Copy/paste this handle on your instance:<br>"
        html += "<input type='text' value='"+handle+"'>";
        html += "<input type='button' value='COPY'>"
        html += "<br>"
    }
    html += "</div>"
    return html;
}

/**
 * This returns the subscribe object (including template) from a webfinger
 * @param {object} webfinger 
 * @returns promise
 *  resolves as subscribe {object}
 *  rejects with error {string}
 */
async function findSubscribeInWebfinger(webfinger){
    return new Promise(async(resolve, reject) => {
        await readLinkFromWebfinger(webfinger, "http://ostatus.org/schema/1.0/subscribe")
            .then((subscribe) => {
                resolve(subscribe)
                //res.redirect(subscribe.template.replace("{uri}", follow))
            })
            .catch((e) => {
                console.log("ERROR in read", e)
                reject("'" + follower_clean.split("@")[1] + "' doesn't have an interaction schema")
            })
    })
}


/**
 * 
 * @param {string} handle 
 * @returns Promise
 *  resolves webfinger as object if correct
 *  rejects with string
 */
async function validateHandle(handle){
    return new Promise(async(resolve, reject) => {
        var handle_clean = handle;
        if(handle.substr(0, 1) == "@"){
            handle_clean = handle.substr(1);
        }
        if(handle_clean.search("@")>-1){
            await getWebfinger(handle_clean)
            .then(async(webfinger) => {
                resolve(webfinger)
            })
            .catch((e) => {
                console.log("ERROR", e)
                reject("'" + follower_clean.split("@")[1] + "' is not a valid ActivityPub instance")
            })
        }else{
            reject("'" + follower+"' is invalid as ActivityPub handle!")
        }
    })
    
}

//router.get("/", async(req, res) => {
async function interact(req, res, next){
    var output;
    var redirect = "";
    try{
        var { type, object, actor, remember } = req.query;

        // If no actor is set, get from cookie if it exists
        if(!actor && req.cookies && req.cookies.actor){
            actor = req.cookies.actor
        }
        
        // Check is actor is set
        if(!actor){
            // Display everything, if no actor
            output = displayFollowInfo(object);
        }else{
            // Actor was found - validate actor and find template
            const webfinger = await validateHandle(actor)
            if(type=="follow"){
                const subscribe = await findSubscribeInWebfinger(webfinger)
                if(subscribe.template){
                    if(remember){
                        res.cookie("actor", actor)
                    }
                    redirect = subscribe.template.replace("{uri}", object)
                }else{
                    output = displayFollowInfo(object, "No 'template' on your webfinger")
                }                
            }else{
                output = displayFollowInfo(object, "Internal error - type not recognized")
            }            
        }

        if(redirect!=""){
            res.locals.redirect = redirect;
            //res.redirect(redirect)
        }else{
            //res.send(output)
            res.locals.output = output;
        }
    }catch(e){
        console.log("ERROR inside /interact", e)
        output = displayFollowInfo(object, e)
        //res.send(output)
        res.locals.output = output;
    }
    next()
}


/*router.get("*", (req, res) => {
    res.sendStatus(404)
})*/

module.exports = { interact, displayFollowInfo }