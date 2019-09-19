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
