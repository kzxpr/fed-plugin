# FED plugin

## To add this to your project

Add to existing project

    git submodule add git@github.com:kzxpr/fed-plugin.git

## How to add to a project

ExpressJS example

**Stuff to include**

    /* BODY PARSER */
    var bodyParser = require('body-parser')
    app.use(bodyParser.json({type: 'application/activity+json'})); // support json encoded bodies
    app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
    
    app.set('domain', <my_domain>);

    /* CORS */
    const cors = require('cors')

    /* ACTIVITY PUB ENDPOINTS */
    const ap_webfinger = require("./server/fed-plugin/webfinger")
    const ap_user = require("./server/fed-plugin/user")
    const ap_admin_routes = require("./server/fed-plugin/admin")

    app.use("/.well-known/webfinger/", cors(), ap_webfinger)
    app.use("/u", cors(), ap_user)
    app.use("/ap/admin", ap_admin_routes);


**Example of endpoint**

    const { checkFeed } = require("./server/activitypub/lib/checkFeed")
    app.get("/checkfeed", checkFeed)

**How to include models**

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