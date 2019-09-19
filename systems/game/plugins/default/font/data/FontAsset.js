"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs");
// Reference to THREE, client-side only
let THREE;
if (global.window != null && global.window.SupEngine != null)
    THREE = global.window.SupEngine.THREE;
class FontAsset extends SupCore.Data.Base.Asset {
    constructor(id, pub, server) {
        super(id, pub, FontAsset.schema, server);
    }
    init(options, callback) {
        this.pub = {
            formatVersion: FontAsset.currentFormatVersion,
            isBitmap: false,
            filtering: "pixelated",
            pixelsPerUnit: 20,
            font: new Buffer(0),
            size: 32,
            color: "ffffff",
            opacity: null,
            bitmap: new Buffer(0),
            gridWidth: 16,
            gridHeight: 16,
            charset: null,
            charsetOffset: 32,
        };
        super.init(options, callback);
    }
    load(assetPath) {
        fs.readFile(path.join(assetPath, "asset.json"), { encoding: "utf8" }, (err, json) => {
            const pub = JSON.parse(json);
            fs.readFile(path.join(assetPath, "font.dat"), (err, buffer) => {
                pub.font = buffer;
                fs.readFile(path.join(assetPath, "bitmap.dat"), (err, buffer) => {
                    pub.bitmap = buffer;
                    this._onLoaded(assetPath, pub);
                });
            });
        });
    }
    migrate(assetPath, pub, callback) {
        if (pub.formatVersion === FontAsset.currentFormatVersion) {
            callback(false);
            return;
        }
        if (pub.formatVersion == null) {
            if (pub.color == null || pub.color.length !== 6)
                pub.color = "ffffff";
            pub.formatVersion = 1;
        }
        if (pub.formatVersion === 1) {
            pub.opacity = null;
            pub.formatVersion = 2;
        }
        callback(true);
    }
    client_load() { this.loadFont(); }
    client_unload() { this.unloadFont(); }
    save(outputPath, callback) {
        this.write(fs.writeFile, outputPath, callback);
    }
    clientExport(outputPath, callback) {
        this.write(SupApp.writeFile, outputPath, callback);
    }
    write(writeFile, outputPath, callback) {
        let font = this.pub.font;
        let bitmap = this.pub.bitmap;
        const texture = this.pub.texture;
        delete this.pub.font;
        delete this.pub.bitmap;
        delete this.pub.texture;
        const json = JSON.stringify(this.pub, null, 2);
        this.pub.font = font;
        this.pub.bitmap = bitmap;
        this.pub.texture = texture;
        if (font instanceof ArrayBuffer)
            font = new Buffer(font);
        if (bitmap instanceof ArrayBuffer)
            bitmap = new Buffer(bitmap);
        writeFile(path.join(outputPath, "asset.json"), json, { encoding: "utf8" }, () => {
            writeFile(path.join(outputPath, "font.dat"), font, () => {
                writeFile(path.join(outputPath, "bitmap.dat"), bitmap, callback);
            });
        });
    }
    loadFont() {
        this.unloadFont();
        if (this.pub.isBitmap)
            this.loadBitmapFont();
        else
            this.loadTTFont();
    }
    unloadFont() {
        if (this.url != null)
            URL.revokeObjectURL(this.url);
        if (this.font != null)
            delete this.font;
        if (this.pub.texture != null) {
            this.pub.texture.dispose();
            this.pub.texture = null;
        }
    }
    loadTTFont() {
        if (this.pub.font.byteLength === 0)
            return;
        const typedArray = new Uint8Array(this.pub.font);
        const blob = new Blob([typedArray], { type: "font/*" });
        this.url = URL.createObjectURL(blob);
        this.pub.name = `Font${this.id}`;
        this.font = new FontFace(this.pub.name, `url(${this.url})`);
        document.fonts.add(this.font);
    }
    loadBitmapFont() {
        if (this.pub.bitmap.byteLength === 0)
            return;
        const image = new Image();
        const typedArray = new Uint8Array(this.pub.bitmap);
        const blob = new Blob([typedArray], { type: "image/*" });
        this.url = URL.createObjectURL(blob);
        image.src = this.url;
        this.pub.texture = new THREE.Texture(image);
        if (this.pub.filtering === "pixelated") {
            this.pub.texture.magFilter = THREE.NearestFilter;
            this.pub.texture.minFilter = THREE.NearestFilter;
        }
        if (!image.complete)
            image.addEventListener("load", () => { this.pub.texture.needsUpdate = true; });
    }
    setupFiltering() {
        if (this.pub.texture != null) {
            if (this.pub.filtering === "pixelated") {
                this.pub.texture.magFilter = THREE.NearestFilter;
                this.pub.texture.minFilter = THREE.NearestFilter;
            }
            else {
                this.pub.texture.magFilter = THREE.LinearFilter;
                this.pub.texture.minFilter = THREE.LinearFilter;
            }
            this.pub.texture.needsUpdate = true;
        }
    }
    server_upload(client, font, callback) {
        if (!(font instanceof Buffer)) {
            callback("Image must be an ArrayBuffer");
            return;
        }
        if (this.pub.isBitmap)
            this.pub.bitmap = font;
        else
            this.pub.font = font;
        callback(null, null, font);
        this.emit("change");
    }
    client_upload(font) {
        if (this.pub.isBitmap)
            this.pub.bitmap = font;
        else
            this.pub.font = font;
        this.loadFont();
    }
    client_setProperty(path, value) {
        super.client_setProperty(path, value);
        if (path === "isBitmap")
            this.loadFont();
        if (path === "filtering")
            this.setupFiltering();
    }
}
FontAsset.currentFormatVersion = 2;
FontAsset.schema = {
    formatVersion: { type: "integer" },
    isBitmap: { type: "boolean", mutable: true },
    filtering: { type: "enum", items: ["pixelated", "smooth"], mutable: true },
    pixelsPerUnit: { type: "number", minExcluded: 0, mutable: true },
    font: { type: "buffer" },
    size: { type: "number", min: 1, mutable: true },
    color: { type: "string", length: 6, mutable: true },
    opacity: { type: "number?", min: 0, max: 1, mutable: true },
    bitmap: { type: "buffer" },
    gridWidth: { type: "number", min: 1, mutable: true },
    gridHeight: { type: "number", min: 1, mutable: true },
    charset: { type: "string?", mutable: true },
    charsetOffset: { type: "number", min: 0, mutable: true },
};
exports.default = FontAsset;
