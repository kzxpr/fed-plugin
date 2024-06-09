# FED plugin

This is a **prototype** and should only be used for experimental purposes

No gurantees - except that it wont be backwards compatible until version 1.0.0.

Eventually, this will become a npm module, but meanwhile it's used as a git submodule.

## To add this to your project

Add to existing project

    git submodule add git@github.com:kzxpr/fed-plugin.git

## Some dependencies

    npm install cli-color node-emoji blurhash canvas luxon cookie-parser feather-icons --save

## Nginx

To track IP addresses in nginx, add:

    //

## UFW firewall

Remember to allow traffic on the ports BEHIND the proxy:

    sudo ufw allow out 5013/tcp

## How to add to a project

ExpressJS example

### Configuration

Your ".env" should include these values:

    AP_USER=<username for admin panel>
    AP_PASS=<password for admin panel>
    DOMAIN=<your domain name>
    AP_USERNAME=<default username AFTER creating in admin panel>
    AP_KEY=<apikey for username AFTER creating in admin panel>

### Database migrations

Copy contents from /fed-plugin/import-migrations/ to your own migration folder.

### Stuff to include

Import body-parser and the class:

    /* BODY PARSER */
    var bodyParser = require('body-parser')
    app.use(bodyParser.json({type: 'application/activity+json'})); // support json encoded bodies
    app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

    /* FedPlugin */
    const fed = require("./server/fed-plugin/index")({ domain: <DOMAIN> })

    /* CORS */
    const cors = require('cors')

    /* PASS PROXY - TO GET IPs */
    app.set('trust proxy',true); 

Recommended import:

    /* CLC */
    const clc = require("cli-color");

Import routes:

    /* ACTIVITY PUB ENDPOINTS */
    const ap_webfinger = require("./server/fed-plugin/webfinger")
    const ap_user = require("./server/fed-plugin/user")
    const ap_admin_routes = require("./server/fed-plugin/admin")
    const ap_interact = require("./server/fed-plugin/interact")
    const ap_tags = require("./server/fed-plugin/tags")
    const imgpicker = require("./server/fed-plugin/imgpicker")

    app.use("/.well-known/webfinger/", cors(), ap_webfinger)
    app.use("/u", cors(), ap_user)
    app.use("/ap", ap_admin_routes);
    app.use("/interact", ap_interact)
    app.use("/tags", ap_tags)
    app.use("/imgpicker", imgpicker)

### TRIGGER: Auto accept follows

Requires clc, then looks up api_key in DB

    fed.eventHandler.on("follow:add", async function(follow_body){
        const from_uri = follow_body.actor;
        const to_uri = follow_body.object;
        console.log(clc.magenta("TRIGGER"), "Received FOLLOW from", from_uri, "to", to_uri)
        
        await Account.query()
            .whereNotNull("apikey")
            .andWhere("uri", "=", to_uri)
            .first()
            .then(async(row) => {
                if(row){
                    await fed.sendAccept(row.username, row.apikey, from_uri, follow_body)
                    .then((d) => {
                        console.log(clc.green("SUCCESS"), "accepted follow from", from_uri, "to", row.username)
                    })
                    .catch((e) => {
                        console.log(clc.red("ERROR"), "while sending accept message to", to_uri, e)
                    })
                }else{
                    console.log(clc.red("ERROR"), "no apikey found for", to_uri)
                }
            })
            .catch((e) => {
                console.log(clc.red("ERROR"), "while fetching APIkey for", to_uri, e)
            })
    })

### TRIGGER on create messages

Requires clc

    fed.eventHandler.on("create:add", async function(body){
        console.log(clc.magenta("TRIGGER create:add"), body.to)
    })

### Example of endpoint

    const { checkFeed } = require("./server/activitypub/lib/checkFeed")
    app.get("/checkfeed", checkFeed)

### How to include models

    const { Tag, Account, Message } = require("./server/fed-plugin/models/db")

## To make a "Follow" button

Add cookieParser to app:

    const cookieParser = require('cookie-parser');
    app.use(cookieParser());

    const cookieOptions = {
        expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
        httpOnly: true
    }

Then include middleware:

    const { interact } = require("./server/fed-plugin/interact")
    app.use("/interact", interact)

And make the endpoint:

    app.get("/interact", (req, res) => {
        if(res.locals.redirect){
            res.redirect(res.locals.redirect)
        }else{
            res.send(res.locals.output)
        }
    })

Then in HTML:

    <div style="border: 1px solid #fff; display: flex; align-items: center">
		<img src="/public/icons/activitypub.png" height="32">
		<a href="/interact?type=follow&object=@{{account.handle}}" title="ActivityPub handle: @{{account.handle}}">Follow</a>
	</div>

## Important endpoints

* **/.well-known/webfinger/** - initial verification of the user
* **/u/<user>** - the "profile" of the user, including links to endpoints and pubkey
    * **/u/<user>/followers**
* **/m/<message>** - endpoint where other servers look up messages
* **/api/inbox** - common endpoint for users where incoming requests to the server are handled
    * Follow request
* **/api[/outbox]** - all the routes for server's users to make requests - see https://docs.gotosocial.org/en/latest/federation/behaviors/outbox/
    * Send message
    * Make post
    * Send poll
    * Send event
* **/admin** - all administrative tasks are handled here, e.g. creating new users

## To appear on Mastodon

These MUST be present:

* /u/:username
* /api/inbox
* webfinger

## Troubleshooting

### If event handler doesn't trigger

Try sending a note from composer

### gyp error

Do:

    sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev

and

    sudo apt install pkg-config

Use:

    npm install node-canvas --save

### If sending HTTP request within the same server

Remember to allow outgoing traffic on the specific port that the proxy is runing on.

In UFW:

    sudo ufw allow out 3000/tcp

Where "3000" is the port!

I might need to look into RabbitMQ:

https://www.rabbitmq.com/tutorials/tutorial-one-javascript.html



# Some naming conventions

## Simple database operations

* **get**(uri) = gets object by id from DB, otherwise => **err**
* **insert**(obj) = inserts object. If CONFLICT => **err**
* **modify**(uri, obj) = modifies record by 'uri' to obj. If NONE => **err**
* **upsert**(uri, obj) = if exists, do **modify**, otherwise **insert**
* **remove**(uri) = removes uri from DB
* **purge**(uri) = deletes uri + related content

## Retrieving data

* **check**(uri) = checks if an uri exists, otherwise **false**
* **get**(uri) = gets an object identified by id from DB, otherwise => **err**
* **fetch**(uri) = fetches an uri by HTTP. If NOT FOUND => **err**
* **retrieve**(uri) = **get**, otherwise **fetch**, otherwise **err**
* **obtain**(uri) = **get**, otherwise **fetch** and **insert**, otherwise **err**
* **lookup**(obj, key) = retrieves value by key from obj, otherwise **err**
* **search**(value) = gets several objects by some criteria

## Complex

* **create**(obj) = parse obj, then **insert**
* **update**(uri) = **fetch** from URI, then **upsert** in DB
* **handle**(message_uri, array) = (e.g. *handleAttachments* in addMessage.js) - would this actually imply an event??? (*handleOutbox* in checkFeed.js?)
* **parse**(obj) = transform object into new convention
* **find**() = perhaps like *checkOrphans* in checkFeed.js???

* stuff with loops/crawls???

* REMEMBER: add with extra adds inside, e.g. *addTag* in addTag.js

## SSH Tunnel

To open it:

    ssh -R remoteport:127.0.0.1:localport user@ip.ip.ip.ip

Example:

    ssh -R 5011:127.0.0.1:3001 root@ip.ip.ip.ip