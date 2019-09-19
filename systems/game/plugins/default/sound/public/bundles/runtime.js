(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sound = require("./sound");
SupRuntime.registerPlugin("sound", sound);

},{"./sound":2}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function loadAsset(player, entry, callback) {
    const sound = { buffer: null };
    if (player.gameInstance.audio.getContext() == null) {
        setTimeout(() => { callback(null, sound); }, 0);
        return;
    }
    player.getAssetData(`assets/${entry.storagePath}/sound.json`, "json", (err, data) => {
        player.getAssetData(`assets/${entry.storagePath}/sound.dat`, "arraybuffer", (err, soundData) => {
            if (err != null) {
                callback(err);
                return;
            }
            if (data.streaming) {
                const typedArray = new Uint8Array(soundData);
                const blob = new Blob([typedArray], { type: "audio/*" });
                sound.buffer = URL.createObjectURL(blob);
                setTimeout(() => { callback(null, sound); }, 0);
            }
            else {
                const onLoad = (buffer) => { sound.buffer = buffer; callback(null, sound); };
                const onError = () => { callback(null, sound); };
                player.gameInstance.audio.getContext().decodeAudioData(soundData, onLoad, onError);
            }
        });
    });
}
exports.loadAsset = loadAsset;
function createOuterAsset(player, asset) { return new window.Sup.Sound(asset); }
exports.createOuterAsset = createOuterAsset;

},{}]},{},[1]);
