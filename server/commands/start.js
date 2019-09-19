"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const http = require("http");
const express = require("express");
const url = require("url");
const socketio = require("socket.io");
const basicAuth = require("basic-auth");
const tsscmp = require("tsscmp");
const RateLimiter = require("express-rate-limit");
const passportMiddleware_1 = require("../passportMiddleware");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const expressSession = require("express-session");
const passportSocketIo = require("passport.socketio");
const config = require("../config");
const schemas = require("../schemas");
const getLocalizedFilename_1 = require("../getLocalizedFilename");
const SupCore = require("../../SupCore");
const loadSystems_1 = require("../loadSystems");
const ProjectHub_1 = require("../ProjectHub");
// NOTE: We explicitly add core path to NODE_PATH so systems can load modules from core
process.env["NODE_PATH"] = path.resolve(`${__dirname}/../../node_modules`);
/* tslint:disable */
require("module").Module._initPaths();
/* tslint:enable */
let dataPath;
let hub = null;
let mainApp = null;
let mainHttpServer;
let io;
let buildApp = null;
let buildHttpServer;
let languageIds;
let isQuitting = false;
let memoryStore;
function onUncaughtException(err) {
    if (hub != null && hub.loadingProjectFolderName != null) {
        SupCore.log(`The server crashed while loading project "${hub.loadingProjectFolderName}".\n${err.stack}`);
    }
    else {
        SupCore.log(`The server crashed.\n${err.stack}`);
    }
    process.exit(1);
}
function start(serverDataPath) {
    dataPath = serverDataPath;
    SupCore.log(`Using data from ${dataPath}.`);
    process.on("uncaughtException", onUncaughtException);
    loadConfig();
    const { version, ValjangEngine: { appApiVersion: appApiVersion } } = JSON.parse(fs.readFileSync(`${__dirname}/../../package.json`, { encoding: "utf8" }));
    SupCore.log(`Server v${version} starting...`);
    fs.writeFileSync(`${__dirname}/../../public/ValjangEngine.json`, JSON.stringify({
        serverName: config.server.serverName, buildPort: config.server.buildPort,
        version, appApiVersion
    }, null, 2));
    // SupCore
    global.SupCore = SupCore;
    SupCore.setSystemsPath(path.join(dataPath, "systems"));
    // List available languages
    languageIds = fs.readdirSync(`${__dirname}/../../public/locales`);
    languageIds.unshift("none");
    // Main HTTP server
    mainApp = express();
    if (typeof config.server.sessionSecret !== "string")
        throw new Error("serverConfig.sessionSecret is null");
    memoryStore = new expressSession.MemoryStore();
    try {
        const sessionFileJson = fs.readFileSync(`${__dirname}/../../sessions.json`, { encoding: "utf8" });
        const sessionFile = JSON.parse(sessionFileJson);
        if (sessionFile.password === config.server.password) {
            memoryStore.sessions = sessionFile.sessions;
        }
    }
    catch (err) {
        // Ignore
    }
    const sessionSettings = {
        name: "supSession",
        secret: config.server.sessionSecret,
        store: memoryStore,
        resave: false,
        saveUninitialized: false,
        cookie: { maxAge: 1000 * 60 * 60 * 24 * 30 }
    };
    const authLimiter = new RateLimiter({ windowMs: 5 * 60 * 1000, max: 5 });
    function doHttpBasicAuth(req, res, next) {
        authLimiter(req, res, () => {
            const credentials = basicAuth(req);
            if (credentials == null || !tsscmp(credentials.pass, config.server.password)) {
                res.status(401);
                res.setHeader("WWW-Authenticate", `Basic realm="ValjangEngine server"`);
                res.end("Access denied.");
                return;
            }
            authLimiter.resetKey(req.ip);
            next();
        });
    }
    if (config.server.password.length > 0)
        mainApp.use(doHttpBasicAuth);
    mainApp.use(cookieParser());
    mainApp.use(bodyParser.urlencoded({ extended: false }));
    mainApp.use(handleLanguage);
    mainApp.use(expressSession(sessionSettings));
    mainApp.use(passportMiddleware_1.default.initialize());
    mainApp.use(passportMiddleware_1.default.session());
    mainApp.get("/", (req, res) => { res.redirect("/hub"); });
    mainApp.post("/login", ensurePasswordFieldIsntEmpty, passportMiddleware_1.default.authenticate("local", { successReturnToOrRedirect: "/", failureRedirect: "/login" }));
    mainApp.get("/login", serveLoginIndex);
    mainApp.get("/logout", (req, res) => { req.logout(); res.redirect("/"); });
    mainApp.get("/hub", enforceAuth, serveHubIndex);
    mainApp.get("/project", enforceAuth, serveProjectIndex);
    mainApp.get("/build", enforceAuth, serveBuildIndex);
    mainApp.get("/serverBuild", enforceAuth, serveServerBuildIndex);
    mainApp.use("/projects/:projectId/*", serveProjectWildcard);
    mainApp.use("/", express.static(`${__dirname}/../../public`));
    mainHttpServer = http.createServer(mainApp);
    mainHttpServer.on("error", onHttpServerError.bind(null, config.server.mainPort));
    io = socketio(mainHttpServer, { transports: ["websocket"] });
    io.use(passportSocketIo.authorize({
        cookieParser: cookieParser,
        key: sessionSettings.name,
        secret: sessionSettings.secret,
        store: sessionSettings.store
    }));
    // Build HTTP server or use the existing main one when the ports are the same
    if (config.server.mainPort !== config.server.buildPort) {
        buildApp = express();
        if (config.server.password.length > 0)
            buildApp.use(doHttpBasicAuth);
        buildApp.get("/", redirectToHub);
        buildApp.use("/", express.static(`${__dirname}/../../public`));
        buildHttpServer = http.createServer(buildApp);
        buildHttpServer.on("error", onHttpServerError.bind(null, config.server.buildPort));
    }
    else {
        buildApp = mainApp;
    }
    buildApp.get("/systems/:systemId/SupCore.js", serveSystemSupCore);
    buildApp.use((req, res, next) => {
        const originValue = req.get("origin");
        if (originValue == null) {
            next();
            return;
        }
        const origin = url.parse(originValue);
        if (origin.hostname === req.hostname && origin.port === config.server.mainPort.toString()) {
            res.header("Access-Control-Allow-Origin", originValue);
        }
        next();
    });
    buildApp.get("/builds/:projectId/:buildId/*", (req, res) => {
        const projectServer = hub.serversById[req.params.projectId];
        if (projectServer == null) {
            res.status(404).end("No such project");
            return;
        }
        let buildId = req.params.buildId;
        if (buildId === "latest")
            buildId = (projectServer.nextBuildId - 1).toString();
        res.sendFile(path.join(projectServer.buildsPath, buildId, req.params[0]));
    });
    loadSystems_1.default(mainApp, buildApp, onSystemsLoaded);
    // Save on exit and handle crashes
    process.on("SIGTERM", onExit);
    process.on("SIGINT", onExit);
    process.on("message", (msg) => { if (msg === "stop")
        onExit(); });
}
exports.default = start;
function loadConfig() {
    let mustWriteConfig = false;
    const serverConfigPath = `${dataPath}/config.json`;
    if (fs.existsSync(serverConfigPath)) {
        config.setServerConfig(JSON.parse(fs.readFileSync(serverConfigPath, { encoding: "utf8" })));
        schemas.validate(config, "config");
        for (const key in config.defaults) {
            if (config.server[key] == null)
                config.server[key] = config.defaults[key];
        }
    }
    else {
        mustWriteConfig = true;
        config.setServerConfig({});
        for (const key in config.defaults)
            config.server[key] = config.defaults[key];
    }
    if (config.server.sessionSecret == null) {
        config.server.sessionSecret = crypto.randomBytes(48).toString("hex");
        mustWriteConfig = true;
    }
    if (mustWriteConfig) {
        fs.writeFileSync(serverConfigPath, JSON.stringify(config.server, null, 2) + "\n", { encoding: "utf8" });
    }
}
function handleLanguage(req, res, next) {
    if (req.cookies["supLanguage"] == null) {
        let languageCode = req.header("Accept-Language");
        if (languageCode != null) {
            languageCode = languageCode.split(",")[0];
            if (languageIds.indexOf(languageCode) === -1 && languageCode.indexOf("-") !== -1) {
                languageCode = languageCode.split("-")[0];
            }
        }
        if (languageIds.indexOf(languageCode) === -1)
            languageCode = "en";
        res.cookie("supLanguage", languageCode);
    }
    next();
}
function enforceAuth(req, res, next) {
    if (!req.isAuthenticated()) {
        req.session["returnTo"] = req.originalUrl;
        res.redirect(`/login`);
        return;
    }
    next();
}
function serveHubIndex(req, res) {
    const localizedIndex = getLocalizedFilename_1.default("index.html", req.cookies["supLanguage"]);
    res.sendFile(path.resolve(`${__dirname}/../../public/hub/${localizedIndex}`));
}
function serveProjectIndex(req, res) {
    const localizedIndex = getLocalizedFilename_1.default("index.html", req.cookies["supLanguage"]);
    res.sendFile(path.resolve(`${__dirname}/../../public/project/${localizedIndex}`));
}
function ensurePasswordFieldIsntEmpty(req, res, next) {
    // This is required so that passport-local doesn't reject logins
    req.body.password = "_";
    next();
}
function serveLoginIndex(req, res) {
    const localizedIndex = getLocalizedFilename_1.default("index.html", req.cookies["supLanguage"]);
    res.sendFile(path.resolve(`${__dirname}/../../public/login/${localizedIndex}`));
}
function serveBuildIndex(req, res) {
    const localizedIndex = getLocalizedFilename_1.default("index.html", req.cookies["supLanguage"]);
    res.sendFile(path.resolve(`${__dirname}/../../public/build/${localizedIndex}`));
}
function serveServerBuildIndex(req, res) {
    const localizedIndex = getLocalizedFilename_1.default("index.html", req.cookies["supLanguage"]);
    res.sendFile(path.resolve(`${__dirname}/../../public/serverBuild/${localizedIndex}`));
}
function serveProjectWildcard(req, res) {
    const projectPath = hub.serversById[req.params.projectId].projectPath;
    res.sendFile(req.params[0], { root: `${projectPath}/public` }, (err) => {
        if (req.params[0] === "icon.png")
            res.sendFile("/images/default-project-icon.png", { root: `${__dirname}/../../public` });
    });
}
function onHttpServerError(port, err) {
    if (err.code === "EADDRINUSE") {
        SupCore.log(`Could not start the server: another application is already listening on port ${port}.`);
        process.exit(1);
    }
    else
        throw (err);
}
function redirectToHub(req, res) {
    res.redirect(`http://${req.hostname}:${config.server.mainPort}/hub/`);
}
function serveSystemSupCore(req, res) {
    res.sendFile("SupCore.js", { root: `${__dirname}/../../public` });
}
function logServerStart(hostname) {
    SupCore.log(`Main server started on port ${config.server.mainPort}, build server started on port ${config.server.buildPort}.`);
    if (hostname === "localhost")
        SupCore.log("NOTE: Setup a password to allow other people to connect to your server.");
    if (process != null && process.send != null)
        process.send({ type: "started" });
}
function onSystemsLoaded() {
    mainApp.use(handle404);
    if (buildApp !== mainApp)
        buildApp.use(handle404);
    // Project hub
    hub = new ProjectHub_1.default(io, dataPath, (err) => {
        if (err != null) {
            SupCore.log(`Failed to start server:\n${err.stack}`);
            return;
        }
        SupCore.log(`Loaded ${Object.keys(hub.serversById).length} projects from ${hub.projectsPath}.`);
        const hostname = (config.server.password.length === 0) ? "localhost" : "";
        mainHttpServer.listen(config.server.mainPort, hostname, () => {
            if (buildHttpServer != null) {
                buildHttpServer.listen(config.server.buildPort, hostname, () => {
                    logServerStart(hostname);
                });
            }
            else {
                logServerStart(hostname);
            }
        });
    });
}
function handle404(err, req, res, next) {
    if (err.status === 404) {
        res.status(404).end("File not found");
        return;
    }
    next();
}
function onExit() {
    if (isQuitting)
        return;
    isQuitting = true;
    mainHttpServer.close();
    if (buildHttpServer != null)
        buildHttpServer.close();
    if (hub == null) {
        process.exit(0);
        return;
    }
    SupCore.log("Saving all projects...");
    hub.saveAll((err) => {
        let hadError = false;
        if (err != null) {
            SupCore.log(`Error while exiting:\n${err.stack}`);
            hadError = true;
        }
        SupCore.log("Saving sessions...");
        try {
            const sessionsFileJSON = JSON.stringify({ password: config.server.password, sessions: memoryStore.sessions }, null, 2);
            fs.writeFileSync(`${__dirname}/../../sessions.json`, sessionsFileJSON);
        }
        catch (err) {
            SupCore.log(`Failed to save sessions:\n${err.stack}`);
            hadError = true;
        }
        if (!hadError)
            SupCore.log("Exited cleanly.");
        process.exit(0);
    });
}
