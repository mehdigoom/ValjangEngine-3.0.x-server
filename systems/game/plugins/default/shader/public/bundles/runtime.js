(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const shader = require("./shader");
SupRuntime.registerPlugin("shader", shader);

},{"./shader":2}],2:[function(require,module,exports){
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

},{}]},{},[1]);
