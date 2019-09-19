(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function setupComponent(player, component, config) {
    component.setText(config.text);
    component.setOptions({ alignment: config.alignment, verticalAlignment: config.verticalAlignment, size: config.size, color: config.color });
    if (config.overrideOpacity)
        component.opacity = config.opacity;
    if (config.fontAssetId != null) {
        const font = player.getOuterAsset(config.fontAssetId).__inner;
        if (!config.overrideOpacity)
            component.opacity = font.opacity;
        component.setFont(font);
    }
}
exports.setupComponent = setupComponent;

},{}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function loadAsset(player, entry, callback) {
    player.getAssetData(`assets/${entry.storagePath}/asset.json`, "json", (err, data) => {
        if (data.isBitmap) {
            const img = new Image();
            img.onload = () => {
                data.texture = new SupEngine.THREE.Texture(img);
                data.texture.needsUpdate = true;
                if (data.filtering === "pixelated") {
                    data.texture.magFilter = SupEngine.THREE.NearestFilter;
                    data.texture.minFilter = SupEngine.THREE.NearestFilter;
                }
                callback(null, data);
            };
            img.onerror = () => { callback(null, data); };
            img.src = `${player.dataURL}assets/${entry.storagePath}/bitmap.dat`;
        }
        else {
            data.name = `Font${entry.id}`;
            let font /* FontFace */;
            try {
                font = new FontFace(data.name, `url(${player.dataURL}assets/${fixedEncodeURIComponent(entry.storagePath)}/font.dat)`);
                document.fonts.add(font);
            }
            catch (e) { /* Ignore */ }
            if (font != null)
                font.load().then(() => { callback(null, data); }, () => { callback(null, data); });
            else
                callback(null, data);
        }
    });
}
exports.loadAsset = loadAsset;
function fixedEncodeURIComponent(str) {
    return str.split("/").map((part) => encodeURIComponent(part).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16)}`)).join("/");
}
function createOuterAsset(player, asset) { return new window.Sup.Font(asset); }
exports.createOuterAsset = createOuterAsset;

},{}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TextRenderer = require("./TextRenderer");
const font = require("./font");
SupRuntime.registerPlugin("TextRenderer", TextRenderer);
SupRuntime.registerPlugin("font", font);

},{"./TextRenderer":1,"./font":2}]},{},[3]);
