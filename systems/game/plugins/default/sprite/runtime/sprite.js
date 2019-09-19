"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const async = require("async");
function loadAsset(player, entry, callback) {
    player.getAssetData(`assets/${entry.storagePath}/sprite.json`, "json", (err, data) => {
        data.textures = {};
        const mapsList = data.maps;
        data.textures = {};
        async.each(mapsList, (key, cb) => {
            const image = new Image();
            image.onload = () => {
                const texture = data.textures[key] = new SupEngine.THREE.Texture(image);
                // Three.js might resize our texture to make its dimensions power-of-twos
                // because of WebGL limitations (see https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Using_textures_in_WebGL#Non_power-of-two_textures)
                // so we store its original, non-power-of-two size for later use
                texture.size = { width: image.width, height: image.height };
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
}
exports.loadAsset = loadAsset;
function createOuterAsset(player, asset) { return new window.Sup.Sprite(asset); }
exports.createOuterAsset = createOuterAsset;
