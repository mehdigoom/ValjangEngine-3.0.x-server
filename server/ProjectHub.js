"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const async = require("async");
const ProjectServer_1 = require("./ProjectServer");
const RemoteHubClient_1 = require("./RemoteHubClient");
class ProjectHub {
    constructor(globalIO, dataPath, callback) {
        this.data = {
            projects: null
        };
        this.serversById = {};
        this.onAddSocket = (socket) => {
            /* const client = */ new RemoteHubClient_1.default(this, socket);
            // this.clients.push(client);
        };
        this.globalIO = globalIO;
        this.projectsPath = path.join(dataPath, "projects");
        this.buildsPath = path.join(dataPath, "builds");
        const serveProjects = (callback) => {
            async.eachSeries(fs.readdirSync(this.projectsPath), (folderName, cb) => {
                if (folderName.indexOf(".") !== -1) {
                    cb(null);
                    return;
                }
                this.loadingProjectFolderName = folderName;
                this.loadProject(folderName, cb);
            }, (err) => {
                if (err != null)
                    throw err;
                this.loadingProjectFolderName = null;
                callback();
            });
        };
        const setupProjectsList = (callback) => {
            const data = [];
            for (const id in this.serversById)
                data.push(this.serversById[id].data.manifest.pub);
            data.sort(SupCore.Data.Projects.sort);
            this.data.projects = new SupCore.Data.Projects(data);
            callback();
        };
        const serve = (callback) => {
            this.io = this.globalIO.of("/hub");
            this.io.on("connection", this.onAddSocket);
            callback();
        };
        async.waterfall([serveProjects, setupProjectsList, serve], callback);
    }
    saveAll(callback) {
        async.each(Object.keys(this.serversById), (id, cb) => {
            this.serversById[id].save(cb);
        }, callback);
    }
    loadProject(folderName, callback) {
        const server = new ProjectServer_1.default(this.globalIO, `${this.projectsPath}/${folderName}`, this.buildsPath, (err) => {
            if (err != null) {
                callback(err);
                return;
            }
            if (this.serversById[server.data.manifest.pub.id] != null) {
                callback(new Error(`There's already a project with this ID: ${server.data.manifest.pub.id} ` +
                    `(${server.projectPath} and ${this.serversById[server.data.manifest.pub.id].projectPath})`));
                return;
            }
            this.serversById[server.data.manifest.pub.id] = server;
            callback(null);
        });
    }
    removeRemoteClient(socketId) {
        // this.clients.splice ...
    }
}
exports.default = ProjectHub;
