"use strict";
/// <reference path="../../../SupCore/SupCore.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const async = require("async");
const mkdirp = require("mkdirp");
SupCore.system.serverBuild = (server, buildPath, callback) => {
    const exportedProject = { name: server.data.manifest.pub.name, assets: server.data.entries.getForStorage() };
    fs.mkdirSync(`${buildPath}/assets`);
    const assetIdsToExport = [];
    server.data.entries.walk((entry, parent) => {
        if (entry.type != null)
            assetIdsToExport.push(entry.id);
    });
    async.each(assetIdsToExport, (assetId, cb) => {
        server.data.assets.acquire(assetId, null, (err, asset) => {
            const folderPath = `${buildPath}/assets/${server.data.entries.getStoragePathFromId(assetId)}`;
            mkdirp(folderPath, (err) => {
                asset.save(folderPath, (err) => {
                    server.data.assets.release(assetId, null);
                    cb();
                });
            });
        });
    }, (err) => {
        if (err != null) {
            callback("Could not export all assets");
            return;
        }
        fs.mkdirSync(`${buildPath}/resources`);
        async.each(Object.keys(server.system.data.resourceClasses), (resourceId, cb) => {
            server.data.resources.acquire(resourceId, null, (err, resource) => {
                const folderPath = `${buildPath}/resources/${resourceId}`;
                fs.mkdir(folderPath, (err) => {
                    resource.save(folderPath, (err) => {
                        server.data.resources.release(resourceId, null);
                        cb();
                    });
                });
            });
        }, (err) => {
            if (err != null) {
                callback("Could not export all resources");
                return;
            }
            const json = JSON.stringify(exportedProject, null, 2);
            fs.writeFile(`${buildPath}/project.json`, json, { encoding: "utf8" }, (err) => {
                if (err != null) {
                    callback("Could not save project.json");
                    return;
                }
                callback(null);
            });
        });
    });
};
