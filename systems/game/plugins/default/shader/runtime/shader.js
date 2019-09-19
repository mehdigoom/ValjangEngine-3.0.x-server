"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function loadAsset(player, entry, callback) {
    player.getAssetData(`assets/${entry.storagePath}/shader.json`, "json", (err, data) => {
        player.getAssetData(`assets/${entry.storagePath}/vertexShader.txt`, "text", (err, vertexShader) => {
            data.vertexShader = { text: vertexShader };
            player.getAssetData(`assets/${entry.storagePath}/fragmentShader.txt`, "text", (err, fragmentShader) => {
                data.fragmentShader = { text: fragmentShader };
                callback(null, data);
            });
        });
    });
}
exports.loadAsset = loadAsset;
function createOuterAsset(player, asset) { return new window.Sup.Shader(asset); }
exports.createOuterAsset = createOuterAsset;
