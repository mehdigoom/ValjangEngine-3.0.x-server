"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TileMap_1 = require("../components/TileMap");
function loadAsset(player, entry, callback) {
    player.getAssetData(`assets/${entry.storagePath}/tilemap.json`, "json", (err, data) => {
        callback(null, new TileMap_1.default(data));
    });
}
exports.loadAsset = loadAsset;
function createOuterAsset(player, asset) {
    return new window.Sup.TileMap(asset);
}
exports.createOuterAsset = createOuterAsset;
