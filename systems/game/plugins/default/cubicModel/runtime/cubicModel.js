"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const async = require("async");
function loadAsset(player, entry, callback) {
    player.getAssetData(`assets/${entry.storagePath}/cubicModel.json`, "json", (err, data) => {
        data.textures = {};
        const mapsList = data.maps;
        data.textures = {};
        async.each(mapsList, (key, cb) => {
            const canvas = document.createElement("canvas");
            canvas.width = data.textureWidth;
            canvas.height = data.textureHeight;
            const ctx = canvas.getContext("2d");
            const texture = data.textures[key] = new SupEngine.THREE.Texture(canvas);
            texture.needsUpdate = true;
            texture.magFilter = SupEngine.THREE.NearestFilter;
            texture.minFilter = SupEngine.THREE.NearestFilter;
            player.getAssetData(`assets/${entry.storagePath}/map-${key}.dat`, "arraybuffer", (err, map) => {
                const imageData = new ImageData(new Uint8ClampedArray(map), data.textureWidth, data.textureHeight);
                ctx.putImageData(imageData, 0, 0);
                cb();
            });
        }, () => { callback(null, data); });
    });
}
exports.loadAsset = loadAsset;
function createOuterAsset(player, asset) { return new window.Sup.CubicModel(asset); }
exports.createOuterAsset = createOuterAsset;
