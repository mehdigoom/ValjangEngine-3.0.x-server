(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function setupComponent(player, component, config) {
    if (config.type === "box")
        component.setupBox(config);
    else if (config.type === "tileMap") {
        config.tileMapAsset = player.getOuterAsset(config.tileMapAssetId);
        if (config.tileMapAsset == null)
            throw new Error("Arcade Physics Body doesn't have a tile map associated.");
        config.tileSetAsset = player.getOuterAsset(config.tileMapAsset.__inner.data.tileSetId);
        component.setupTileMap(config);
    }
}
exports.setupComponent = setupComponent;

},{}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ArcadeBody2D = require("./ArcadeBody2D");
SupRuntime.registerPlugin("ArcadeBody2D", ArcadeBody2D);

},{"./ArcadeBody2D":1}]},{},[2]);
