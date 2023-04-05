# ActivityPub

## How to add to a project

ExpressJS example

**Stuff to include**
    require("dotenv").config();

    const path = require("path")

    /* CORS */
    const cors = require('cors')

    /* BODY PARSER */
    var bodyParser = require('body-parser')
    app.use(bodyParser.json({type: 'application/activity+json'})); // support json encoded bodies
    app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

    /* BASIC AUTH FOR ACTIVITY PUB */
    basicAuth = require('express-basic-auth');
    let basicUserAuth = basicAuth({
        authorizer: asyncAuthorizer,
        authorizeAsync: true,
        challenge: true
    });

    function asyncAuthorizer(username, password, cb) {
        let isAuthorized = false;
        const isPasswordAuthorized = username === process.env.AP_USER;
        const isUsernameAuthorized = password === process.env.AP_PASS;
        isAuthorized = isPasswordAuthorized && isUsernameAuthorized;
        if (isAuthorized) {
            return cb(null, true);
        }
        else {
            return cb(null, false);
        }
    }

**How to implement to router**
    /* ACTIVITY PUB */
    const ap_webfinger = require("./server/activitypub/webfinger")
    const ap_user = require("./server/activitypub/user")
    app.use("/ap/admin", cors({ credentials: true, origin: true }), basicUserAuth);
    app.use("/.well-known/webfinger/", cors(), ap_webfinger)
    app.use("/u", cors(), ap_user)

    const tester_routes = require("./server/activitypub/tester")
    app.use("/ap/admin/tester", tester_routes);

    app.get("/ap/admin/logs", async(req, res) => {
        await knex("aprequests").where("timestamp", ">", knex.raw("now() - interval 72 hour")).orderBy("timestamp", "desc")
        .then((logs) => {
            res.render("logs", { logs })
        })
        .catch((e) => {
            res.sendStatus(404)
        })
    })

    app.get("/ap/admin/logs/:logid", async(req, res) => {
        const { logid } = req.params;
        await knex("aprequests").where("id", "=", logid).first()
        .then((log) => {
            res.render("logitem", { log })
        })
        .catch((e) => {
            res.sendStatus(404)
        })
    })

    app.get("/ap/admin", (req, res) => {
        res.sendFile(path.join(__dirname, "server", "activitypub", "admin.html"))
    })

**Example of endpoint**

    const { checkFeed } = require("./server/activitypub/lib/checkFeed")

    app.get("/checkfeed", checkFeed)

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

## To test - use SSH tunnel

    ssh -R 3000:127.0.0.1:3000 olympus