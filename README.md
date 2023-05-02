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
    
    /* CORS */
    const cors = require('cors')

    /* ACTIVITY PUB ENDPOINTS */
    const ap_webfinger = require("./server/fed-plugin/webfinger")
    const ap_user = require("./server/fed-plugin/user")
    const ap_admin_routes = require("./server/fed-plugin/index")

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
