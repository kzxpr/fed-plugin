const express = require('express'),
    router = express.Router();

/* CORS */
const cors = require('cors')

/* PATH */
const path = require("path")

/* BODY PARSER */
var bodyParser = require('body-parser')
router.use(bodyParser.json({type: 'application/activity+json'})); // support json encoded bodies
router.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

/* MODELS */
const { Tag, Account, Message, Request } = require("./models/db")
const { raw } = require('objection');

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

/* ROUTES */
router.use(cors({ credentials: true, origin: true }), basicUserAuth);

const tester_routes = require("./tester")
router.use("/tester", tester_routes);

const { pageLogs, logItem } = require("./pages")

router.get("/logs", async(req, res) => {
    await Request.query().where("timestamp", ">", raw("now() - interval 72 hour")).orderBy("timestamp", "desc")
    .then((logs) => {
        res.send(pageLogs(logs))
    })
    .catch((e) => {
        res.sendStatus(404)
    })
})

router.get("/logs/:logid", async(req, res) => {
    const { logid } = req.params;
    await Request.query().where("id", "=", logid).first()
    .then((log) => {
        res.send(logItem(log))
    })
    .catch((e) => {
        res.sendStatus(404)
    })
})

router.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "admin.html"))
})

module.exports = router;