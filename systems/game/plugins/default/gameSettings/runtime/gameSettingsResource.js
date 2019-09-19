"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function loadResource(player, resourceName, callback) {
    player.getAssetData(`resources/${resourceName}/resource.json`, `json`, (err, data) => {
        if (err != null) {
            callback(err);
            return;
        }
        callback(null, data);
    });
}
exports.loadResource = loadResource;
