(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const THREE = SupEngine.THREE;
const TextRendererUpdater_1 = require("./TextRendererUpdater");
const TextRendererGeometry_1 = require("./TextRendererGeometry");
class TextRenderer extends SupEngine.ActorComponent {
    constructor(actor) {
        super(actor, "TextRenderer");
        this.threeMeshes = [];
    }
    setText(text) {
        this.text = text;
        this._createMesh();
    }
    setFont(font) {
        this.font = font;
        this._createMesh();
    }
    setOptions(options) {
        if (options.alignment == null)
            options.alignment = "center";
        if (options.verticalAlignment == null)
            options.verticalAlignment = "center";
        this.options = options;
        this._createMesh();
    }
    setOpacity(opacity) {
        this.opacity = opacity;
        for (const mesh of this.threeMeshes) {
            if (this.opacity != null) {
                mesh.material.transparent = true;
                mesh.material.opacity = this.opacity;
            }
            else {
                mesh.material.transparent = false;
                mesh.material.opacity = 1;
            }
            mesh.material.needsUpdate = true;
        }
    }
    _createMesh() {
        this.clearMesh();
        if (this.text == null || this.font == null)
            return;
        if (!this.font.isBitmap)
            this._createFontMesh();
        else if (this.font.texture != null)
            this._createBitmapMesh();
        for (const threeMesh of this.threeMeshes) {
            this.actor.threeObject.add(threeMesh);
            const scale = 1 / this.font.pixelsPerUnit;
            threeMesh.scale.set(scale, scale, scale);
            threeMesh.updateMatrixWorld(false);
        }
    }
    _createFontMesh() {
        const fontSize = (this.options.size != null) ? this.options.size : this.font.size;
        const texts = this.text.split("\n");
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        ctx.font = `${fontSize}px ${this.font.name}`;
        let width = 1;
        for (const text of texts)
            width = Math.max(width, ctx.measureText(text).width);
        // Arbitrary value that should be enough for most fonts
        // We might want to make it configurable in the future
        const heightBorder = fontSize * 0.3;
        const heightWithoutBorder = fontSize * texts.length;
        const height = heightWithoutBorder + heightBorder * 2;
        canvas.width = width;
        canvas.height = height;
        const color = (this.options.color != null) ? this.options.color : this.font.color;
        ctx.fillStyle = `#${color}`;
        ctx.font = `${fontSize}px ${this.font.name}`;
        ctx.textBaseline = "middle";
        ctx.textAlign = this.options.alignment;
        let x = width / 2;
        switch (this.options.alignment) {
            case "left":
                x = 0;
                break;
            case "right":
                x = width;
                break;
        }
        for (let index = 0; index < texts.length; index++) {
            ctx.fillText(texts[index], x, heightBorder + (0.5 + (index - (texts.length - 1) / 2) / texts.length) * heightWithoutBorder);
        }
        this.texture = new THREE.Texture(canvas);
        if (this.font.filtering === "pixelated") {
            this.texture.magFilter = SupEngine.THREE.NearestFilter;
            this.texture.minFilter = SupEngine.THREE.NearestFilter;
        }
        else {
            // See https://github.com/mrdoob/three.js/blob/4582bf1276c30c238e415cb79f4871e8560d102d/src/renderers/WebGLRenderer.js#L5664
            this.texture.minFilter = SupEngine.THREE.LinearFilter;
        }
        this.texture.needsUpdate = true;
        const geometry = new THREE.PlaneBufferGeometry(width, height);
        const material = new THREE.MeshBasicMaterial({
            map: this.texture,
            alphaTest: 0.01,
            side: THREE.DoubleSide
        });
        this.threeMeshes[0] = new THREE.Mesh(geometry, material);
        this.setOpacity(this.opacity);
        switch (this.options.alignment) {
            case "left":
                this.threeMeshes[0].position.setX(width / 2 / this.font.pixelsPerUnit);
                break;
            case "right":
                this.threeMeshes[0].position.setX(-width / 2 / this.font.pixelsPerUnit);
                break;
        }
        switch (this.options.verticalAlignment) {
            case "top":
                this.threeMeshes[0].position.setY(-height / 2 / this.font.pixelsPerUnit);
                break;
            case "bottom":
                this.threeMeshes[0].position.setY(height / 2 / this.font.pixelsPerUnit);
                break;
        }
    }
    _createBitmapMesh() {
        const texts = this.text.split("\n");
        for (let index = 0; index < texts.length; index++) {
            const text = texts[index];
            const geometry = new TextRendererGeometry_1.default(this.font.gridWidth * text.length, this.font.gridHeight, text.length, 1);
            const material = new THREE.MeshBasicMaterial({
                map: this.font.texture,
                alphaTest: 0.1,
                side: THREE.DoubleSide
            });
            const color = (this.options.color != null) ? this.options.color : this.font.color;
            material.color.setHex(parseInt(color, 16));
            this.threeMeshes[index] = new THREE.Mesh(geometry, material);
            switch (this.options.alignment) {
                case "center":
                    this.threeMeshes[index].position.setX(-geometry.width / 2 / this.font.pixelsPerUnit);
                    break;
                case "right":
                    this.threeMeshes[index].position.setX(-geometry.width / this.font.pixelsPerUnit);
                    break;
            }
            let y;
            switch (this.options.verticalAlignment) {
                case "center":
                    y = (0.5 + (index - (texts.length - 1) / 2)) * this.font.gridHeight / this.font.pixelsPerUnit;
                    break;
                case "top":
                    y = (1 + index) * this.font.gridHeight / this.font.pixelsPerUnit;
                    break;
                case "bottom":
                    y = (index - texts.length + 1) * this.font.gridHeight / this.font.pixelsPerUnit;
                    break;
            }
            this.threeMeshes[index].position.setY(-y);
            const uvs = geometry.getAttribute("uv");
            uvs.needsUpdate = true;
            const charsByRow = this.font.texture.image.width / this.font.gridWidth;
            for (let x = 0; x < text.length; x++) {
                let index;
                if (this.font.charset == null)
                    index = text.charCodeAt(x) - this.font.charsetOffset;
                else
                    index = this.font.charset.indexOf(text[x]);
                const tileX = index % charsByRow;
                const tileY = Math.floor(index / charsByRow);
                const left = (tileX * this.font.gridWidth + 0.2) / this.font.texture.image.width;
                const right = ((tileX + 1) * this.font.gridWidth - 0.2) / this.font.texture.image.width;
                const bottom = 1 - ((tileY + 1) * this.font.gridHeight - 0.2) / this.font.texture.image.height;
                const top = 1 - (tileY * this.font.gridHeight + 0.2) / this.font.texture.image.height;
                const uvsArray = uvs.array;
                uvsArray[x * 8 + 0] = left;
                uvsArray[x * 8 + 1] = bottom;
                uvsArray[x * 8 + 2] = right;
                uvsArray[x * 8 + 3] = bottom;
                uvsArray[x * 8 + 4] = right;
                uvsArray[x * 8 + 5] = top;
                uvsArray[x * 8 + 6] = left;
                uvsArray[x * 8 + 7] = top;
            }
        }
        this.setOpacity(this.opacity);
    }
    clearMesh() {
        for (const threeMesh of this.threeMeshes) {
            this.actor.threeObject.remove(threeMesh);
            threeMesh.geometry.dispose();
            threeMesh.material.dispose();
        }
        this.threeMeshes.length = 0;
        if (this.texture != null) {
            this.texture.dispose();
            this.texture = null;
        }
    }
    _destroy() {
        this.clearMesh();
        super._destroy();
    }
    setIsLayerActive(active) { for (const threeMesh of this.threeMeshes)
        threeMesh.visible = active; }
}
/* tslint:disable:variable-name */
TextRenderer.Updater = TextRendererUpdater_1.default;
exports.default = TextRenderer;

},{"./TextRendererGeometry":2,"./TextRendererUpdater":3}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const THREE = SupEngine.THREE;
class TextRendererGeometry extends THREE.BufferGeometry {
    constructor(width, height, widthSegments, heightSegments) {
        super();
        this.type = "TextRendererGeometry";
        this.width = width;
        this.height = height;
        const vertices = new Float32Array(widthSegments * heightSegments * 4 * 3);
        const normals = new Float32Array(widthSegments * heightSegments * 4 * 3);
        const uvs = new Float32Array(widthSegments * heightSegments * 4 * 2);
        let indices;
        if (vertices.length / 3 > 65535)
            indices = new Uint32Array(widthSegments * heightSegments * 6);
        else
            indices = new Uint16Array(widthSegments * heightSegments * 6);
        let offset = 0;
        let offset2 = 0;
        let offset3 = 0;
        for (let iy = 0; iy < heightSegments; iy++) {
            const y = iy * height / heightSegments;
            for (let ix = 0; ix < widthSegments; ix++) {
                const x = ix * width / widthSegments;
                // Left bottom
                vertices[offset + 0] = x;
                vertices[offset + 1] = y;
                normals[offset + 2] = 1;
                uvs[offset2 + 0] = ix / widthSegments;
                uvs[offset2 + 1] = iy / heightSegments;
                // Right bottom
                vertices[offset + 3] = x + width / widthSegments;
                vertices[offset + 4] = y;
                normals[offset + 5] = 1;
                uvs[offset2 + 2] = (ix + 1) / widthSegments;
                uvs[offset2 + 3] = iy / heightSegments;
                // Right top
                vertices[offset + 6] = x + width / widthSegments;
                vertices[offset + 7] = y + height / heightSegments;
                normals[offset + 8] = 1;
                uvs[offset2 + 4] = (ix + 1) / widthSegments;
                uvs[offset2 + 5] = (iy + 1) / heightSegments;
                // Left Top
                vertices[offset + 9] = x;
                vertices[offset + 10] = y + height / heightSegments;
                normals[offset + 11] = 1;
                uvs[offset2 + 6] = ix / widthSegments;
                uvs[offset2 + 7] = (iy + 1) / heightSegments;
                const ref = (ix + iy * widthSegments) * 4;
                // Bottom right corner
                indices[offset3 + 0] = ref + 0;
                indices[offset3 + 1] = ref + 1;
                indices[offset3 + 2] = ref + 2;
                // Top left corner
                indices[offset3 + 3] = ref + 0;
                indices[offset3 + 4] = ref + 3;
                indices[offset3 + 5] = ref + 2;
                offset += 4 * 3;
                offset2 += 4 * 2;
                offset3 += 6;
            }
        }
        this.setIndex(new THREE.BufferAttribute(indices, 1));
        this.addAttribute("position", new THREE.BufferAttribute(vertices, 3));
        this.addAttribute("normal", new THREE.BufferAttribute(normals, 3));
        this.addAttribute("uv", new THREE.BufferAttribute(uvs, 2));
    }
}
exports.default = TextRendererGeometry;

},{}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class TextRendererUpdater {
    constructor(client, textRenderer, config, externalSubscriber) {
        this.client = client;
        this.textRenderer = textRenderer;
        this.externalSubscriber = externalSubscriber;
        this.onFontAssetReceived = (assetId, asset) => {
            this.fontAsset = asset;
            this.textRenderer.setText(this.text);
            this.textRenderer.setOptions(this.options);
            if (!this.overrideOpacity)
                this.textRenderer.opacity = asset.pub.opacity;
            this.setupFont();
            if (this.externalSubscriber.onAssetReceived)
                this.externalSubscriber.onAssetReceived(assetId, asset);
        };
        this.onFontAssetEdited = (assetId, command, ...args) => {
            const commandFunction = this.onEditCommands[command];
            if (commandFunction != null)
                commandFunction.apply(this, args);
            if (this.externalSubscriber.onAssetEdited)
                this.externalSubscriber.onAssetEdited(assetId, command, ...args);
        };
        this.onEditCommands = {
            upload: () => { this.setupFont(); },
            setProperty: (path, value) => {
                switch (path) {
                    case "isBitmap":
                        this.setupFont();
                        break;
                    case "opacity":
                        if (!this.overrideOpacity)
                            this.textRenderer.setOpacity(value);
                        break;
                    default: this.textRenderer.setFont(this.fontAsset.pub);
                }
            }
        };
        this.onFontAssetTrashed = (assetId) => {
            this.textRenderer.clearMesh();
            if (this.externalSubscriber.onAssetTrashed != null)
                this.externalSubscriber.onAssetTrashed(assetId);
        };
        this.fontAssetId = config.fontAssetId;
        this.text = config.text;
        this.options = {
            alignment: config.alignment,
            verticalAlignment: config.verticalAlignment,
            size: config.size,
            color: config.color,
        };
        this.overrideOpacity = config.overrideOpacity;
        this.opacity = config.opacity;
        if (this.overrideOpacity)
            this.textRenderer.setOpacity(this.opacity);
        if (this.externalSubscriber == null)
            this.externalSubscriber = {};
        this.fontSubscriber = {
            onAssetReceived: this.onFontAssetReceived,
            onAssetEdited: this.onFontAssetEdited,
            onAssetTrashed: this.onFontAssetTrashed
        };
        if (this.fontAssetId != null)
            this.client.subAsset(this.fontAssetId, "font", this.fontSubscriber);
    }
    destroy() {
        if (this.fontAssetId != null)
            this.client.unsubAsset(this.fontAssetId, this.fontSubscriber);
    }
    config_setProperty(path, value) {
        switch (path) {
            case "fontAssetId":
                {
                    if (this.fontAssetId != null)
                        this.client.unsubAsset(this.fontAssetId, this.fontSubscriber);
                    this.fontAssetId = value;
                    this.fontAsset = null;
                    this.textRenderer.setFont(null);
                    if (this.fontAssetId != null)
                        this.client.subAsset(this.fontAssetId, "font", this.fontSubscriber);
                }
                break;
            case "text":
                {
                    this.text = value;
                    this.textRenderer.setText(this.text);
                }
                break;
            case "alignment":
            case "verticalAlignment":
            case "size":
            case "color":
                {
                    this.options[path] = (value !== "") ? value : null;
                    this.textRenderer.setOptions(this.options);
                }
                break;
            case "overrideOpacity":
            case "opacity":
                {
                    this[path] = value;
                    if (this.overrideOpacity)
                        this.textRenderer.setOpacity(this.opacity);
                    else if (this.fontAsset != null)
                        this.textRenderer.setOpacity(this.fontAsset.pub.opacity);
                }
                break;
        }
    }
    setupFont() {
        this.textRenderer.clearMesh();
        if (this.fontAsset.pub.isBitmap) {
            if (this.fontAsset.pub.texture != null) {
                const image = this.fontAsset.pub.texture.image;
                if (image.complete)
                    this.textRenderer.setFont(this.fontAsset.pub);
                else
                    image.addEventListener("load", () => { this.textRenderer.setFont(this.fontAsset.pub); });
            }
        }
        else {
            if (this.fontAsset.font == null)
                this.textRenderer.setFont(this.fontAsset.pub);
            else {
                this.fontAsset.font.load().then(() => { this.textRenderer.setFont(this.fontAsset.pub); }, () => { this.textRenderer.setFont(this.fontAsset.pub); });
            }
        }
    }
}
exports.default = TextRendererUpdater;

},{}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TextRenderer_1 = require("./TextRenderer");
SupEngine.registerComponentClass("TextRenderer", TextRenderer_1.default);

},{"./TextRenderer":1}]},{},[4]);
