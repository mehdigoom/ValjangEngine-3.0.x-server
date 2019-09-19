"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const async = require("async");
function loadAsset(player, entry, callback) {
    player.getAssetData(`assets/${entry.storagePath}/model.json`, "json", (err, data) => {
        const attributesList = data.attributes;
        data.attributes = {};
        async.each(attributesList, (key, cb) => {
            player.getAssetData(`assets/${entry.storagePath}/attr-${key}.dat`, "arraybuffer", (err, buffer) => {
                data.attributes[key] = buffer;
                cb();
            });
        }, () => {
            const mapsList = data.maps;
            data.textures = {};
            async.each(mapsList, (key, cb) => {
                const image = new Image();
                image.onload = () => {
                    const texture = data.textures[key] = new SupEngine.THREE.Texture(image);
                    texture.needsUpdate = true;
                    if (data.filtering === "pixelated") {
                        texture.magFilter = SupEngine.THREE.NearestFilter;
                        texture.minFilter = SupEngine.THREE.NearestFilter;
                    }
                    if (data.wrapping === "repeat") {
                        texture.wrapS = SupEngine.THREE.RepeatWrapping;
                        texture.wrapT = SupEngine.THREE.RepeatWrapping;
                    }
                    else if (data.wrapping === "mirroredRepeat") {
                        texture.wrapS = SupEngine.THREE.MirroredRepeatWrapping;
                        texture.wrapT = SupEngine.THREE.MirroredRepeatWrapping;
                    }
                    cb();
                };
                image.onerror = () => { cb(); };
                image.src = `${player.dataURL}assets/${entry.storagePath}/map-${key}.dat`;
            }, () => { callback(null, data); });
        });
    });
}
exports.loadAsset = loadAsset;
function createOuterAsset(player, asset) { return new window.Sup.Model(asset); }
exports.createOuterAsset = createOuterAsset;
