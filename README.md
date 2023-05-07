# FED plugin

## To add this to your project

Add to existing project

    git submodule add git@github.com:kzxpr/fed-plugin.git

## Some dependencies

    npm install cli-color node-emoji blurhash canvas luxon --save

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

    app.use("/.well-known/webfinger/", cors(), ap_webfinger)
    app.use("/u", cors(), ap_user)
    app.use("/ap/admin", ap_admin_routes);

### Example of trigger - auto accept follows

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