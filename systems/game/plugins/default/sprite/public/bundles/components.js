(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const THREE = SupEngine.THREE;
const SpriteRendererUpdater_1 = require("./SpriteRendererUpdater");
class SpriteRenderer extends SupEngine.ActorComponent {
    constructor(actor) {
        super(actor, "SpriteRenderer");
        this.color = { r: 1, g: 1, b: 1 };
        this.hasFrameBeenUpdated = false;
        this.materialType = "basic";
        this.horizontalFlip = false;
        this.verticalFlip = false;
        this.castShadow = false;
        this.receiveShadow = false;
        this.playbackSpeed = 1;
    }
    setSprite(asset, materialType, customShader) {
        this._clearMesh();
        this.asset = asset;
        if (materialType != null)
            this.materialType = materialType;
        if (customShader != null)
            this.shaderAsset = customShader;
        this.animationName = null;
        this.animationsByName = {};
        if (this.asset == null || this.asset.textures[this.asset.mapSlots["map"]] == null)
            return;
        this.frameToSecond = this.actor.gameInstance.framesPerSecond / this.asset.framesPerSecond;
        this.updateAnimationsByName();
        this.geometry = new THREE.PlaneBufferGeometry(this.asset.grid.width, this.asset.grid.height);
        if (this.materialType === "shader") {
            this.material = SupEngine.componentClasses["Shader"].createShaderMaterial(this.shaderAsset, this.asset.textures, this.geometry);
            this.material.map = this.asset.textures[this.asset.mapSlots["map"]];
        }
        else {
            let material;
            if (this.materialType === "basic")
                material = new THREE.MeshBasicMaterial();
            else if (this.materialType === "phong") {
                material = new THREE.MeshPhongMaterial();
                material.lightMap = this.asset.textures[this.asset.mapSlots["light"]];
            }
            material.map = this.asset.textures[this.asset.mapSlots["map"]];
            material.specularMap = this.asset.textures[this.asset.mapSlots["specular"]];
            material.alphaMap = this.asset.textures[this.asset.mapSlots["alpha"]];
            if (this.materialType === "phong")
                material.normalMap = this.asset.textures[this.asset.mapSlots["normal"]];
            material.alphaTest = this.asset.alphaTest;
            this.material = material;
            this.setOpacity(this.opacity);
        }
        this.material.side = THREE.DoubleSide;
        this.setColor(this.color.r, this.color.g, this.color.b);
        // TEMP
        // this.asset.textures["map"].wrapS = THREE.RepeatWrapping;
        // this.asset.textures["map"].wrapT = THREE.RepeatWrapping;
        this.threeMesh = new THREE.Mesh(this.geometry, this.material);
        this.setCastShadow(this.castShadow);
        this.threeMesh.receiveShadow = this.receiveShadow;
        this.setFrame(0);
        this.actor.threeObject.add(this.threeMesh);
        this.updateShape();
    }
    setColor(r, g, b) {
        this.color.r = r;
        this.color.g = g;
        this.color.b = b;
        if (this.material == null)
            return;
        if (this.material instanceof THREE.ShaderMaterial) {
            const uniforms = this.material.uniforms;
            if (uniforms.color != null)
                uniforms.color.value.setRGB(r, g, b);
        }
        else
            this.material.color.setRGB(r, g, b);
        this.material.needsUpdate = true;
    }
    updateShape() {
        if (this.threeMesh == null)
            return;
        const scaleRatio = 1 / this.asset.pixelsPerUnit;
        this.threeMesh.scale.set(scaleRatio, scaleRatio, scaleRatio);
        let x;
        if (this.horizontalFlip)
            x = this.asset.origin.x - 0.5;
        else
            x = 0.5 - this.asset.origin.x;
        let y;
        if (this.verticalFlip)
            y = this.asset.origin.y - 0.5;
        else
            y = 0.5 - this.asset.origin.y;
        this.threeMesh.position.setX(x * this.asset.grid.width * scaleRatio);
        this.threeMesh.position.setY(y * this.asset.grid.height * scaleRatio);
        this.threeMesh.updateMatrixWorld(false);
    }
    setOpacity(opacity) {
        this.opacity = opacity;
        if (this.material == null)
            return;
        if (this.opacity != null) {
            this.material.transparent = true;
            this.material.opacity = this.opacity;
        }
        else {
            this.material.transparent = false;
            this.material.opacity = 1;
        }
        this.material.needsUpdate = true;
    }
    setHorizontalFlip(horizontalFlip) {
        this.horizontalFlip = horizontalFlip;
        if (this.asset == null)
            return;
        this.updateShape();
        if (this.animationName == null)
            this.setFrame(0);
        else
            this.updateFrame(false);
    }
    setVerticalFlip(verticalFlip) {
        this.verticalFlip = verticalFlip;
        if (this.asset == null)
            return;
        this.updateShape();
        if (this.animationName == null)
            this.setFrame(0);
        else
            this.updateFrame(false);
    }
    updateAnimationsByName() {
        this.animationsByName = {};
        for (const animation of this.asset.animations) {
            this.animationsByName[animation.name] = animation;
        }
    }
    _clearMesh() {
        if (this.threeMesh == null)
            return;
        this.actor.threeObject.remove(this.threeMesh);
        this.threeMesh.geometry.dispose();
        this.threeMesh.material.dispose();
        this.threeMesh = null;
        this.material = null;
    }
    setCastShadow(castShadow) {
        this.castShadow = castShadow;
        this.threeMesh.castShadow = castShadow;
        if (!castShadow)
            return;
        this.actor.gameInstance.threeScene.traverse((object) => {
            const material = object.material;
            if (material != null)
                material.needsUpdate = true;
        });
    }
    _destroy() {
        this._clearMesh();
        this.asset = null;
        super._destroy();
    }
    setFrame(frame) {
        const map = this.material.map;
        let frameX, frameY;
        if (this.asset.frameOrder === "rows") {
            const framesPerRow = Math.floor(map.size.width / this.asset.grid.width);
            frameX = frame % framesPerRow;
            frameY = Math.floor(frame / framesPerRow);
        }
        else {
            const framesPerColumn = Math.floor(map.size.height / this.asset.grid.height);
            frameX = Math.floor(frame / framesPerColumn);
            frameY = frame % framesPerColumn;
        }
        let left = (frameX * this.asset.grid.width) / map.size.width;
        let right = ((frameX + 1) * this.asset.grid.width) / map.size.width;
        let bottom = (map.size.height - (frameY + 1) * this.asset.grid.height) / map.size.height;
        let top = (map.size.height - frameY * this.asset.grid.height) / map.size.height;
        if (this.horizontalFlip)
            [left, right] = [right, left];
        if (this.verticalFlip)
            [top, bottom] = [bottom, top];
        const uvs = this.geometry.getAttribute("uv");
        uvs.needsUpdate = true;
        const uvsArray = uvs.array;
        uvsArray[0] = left;
        uvsArray[1] = top;
        uvsArray[2] = right;
        uvsArray[3] = top;
        uvsArray[4] = left;
        uvsArray[5] = bottom;
        uvsArray[6] = right;
        uvsArray[7] = bottom;
    }
    setAnimation(newAnimationName, newAnimationLooping = true) {
        if (newAnimationName != null) {
            const animation = this.animationsByName[newAnimationName];
            if (animation == null)
                throw new Error(`Animation ${newAnimationName} doesn't exist`);
            this.animationLooping = newAnimationLooping;
            if (newAnimationName === this.animationName && this.isAnimationPlaying)
                return;
            this.animation = animation;
            this.animationName = newAnimationName;
            if (this.playbackSpeed * animation.speed >= 0)
                this.animationTimer = 0;
            else
                this.animationTimer = this.getAnimationFrameCount() / this.frameToSecond - 1;
            this.isAnimationPlaying = true;
            this.updateFrame();
        }
        else {
            this.animation = null;
            this.animationName = null;
            this.setFrame(0);
        }
    }
    getAnimation() { return this.animationName; }
    setAnimationFrameTime(frameTime) {
        if (this.animationName == null)
            return;
        if (frameTime < 0 || frameTime > this.getAnimationFrameCount())
            throw new Error(`Frame time must be >= 0 and < ${this.getAnimationFrameCount()}`);
        this.animationTimer = frameTime * this.frameToSecond;
        this.updateFrame();
    }
    getAnimationFrameTime() {
        if (this.animationName == null)
            return 0;
        return this.computeAbsoluteFrameTime() - this.animation.startFrameIndex;
    }
    getAnimationFrameIndex() {
        if (this.animationName == null)
            return 0;
        return Math.floor(this.computeAbsoluteFrameTime()) - this.animation.startFrameIndex;
    }
    getAnimationFrameCount() {
        if (this.animationName == null)
            return 0;
        return this.animation.endFrameIndex - this.animation.startFrameIndex + 1;
    }
    playAnimation(animationLooping = true) {
        this.animationLooping = animationLooping;
        this.isAnimationPlaying = true;
        if (this.animationLooping)
            return;
        if (this.playbackSpeed * this.animation.speed > 0 && this.getAnimationFrameIndex() === this.getAnimationFrameCount() - 1)
            this.animationTimer = 0;
        else if (this.playbackSpeed * this.animation.speed < 0 && this.getAnimationFrameIndex() === 0)
            this.animationTimer = (this.getAnimationFrameCount() - 0.01) * this.frameToSecond;
    }
    pauseAnimation() { this.isAnimationPlaying = false; }
    stopAnimation() {
        if (this.animationName == null)
            return;
        this.isAnimationPlaying = false;
        this.animationTimer = 0;
        this.updateFrame();
    }
    computeAbsoluteFrameTime() {
        let frame = this.animation.startFrameIndex;
        frame += this.animationTimer / this.frameToSecond;
        return frame;
    }
    updateFrame(flagFrameUpdated = true) {
        if (flagFrameUpdated)
            this.hasFrameBeenUpdated = true;
        let frame = Math.floor(this.computeAbsoluteFrameTime());
        if (frame > this.animation.endFrameIndex) {
            if (this.animationLooping) {
                frame = this.animation.startFrameIndex;
                this.animationTimer = this.playbackSpeed * this.animation.speed;
            }
            else {
                frame = this.animation.endFrameIndex;
                this.animationTimer = (this.getAnimationFrameCount() - 0.01) * this.frameToSecond;
                this.isAnimationPlaying = false;
            }
        }
        else if (frame < this.animation.startFrameIndex) {
            if (this.animationLooping) {
                frame = this.animation.endFrameIndex;
                this.animationTimer = (this.getAnimationFrameCount() - 0.01) * this.frameToSecond + this.playbackSpeed * this.animation.speed;
            }
            else {
                frame = this.animation.startFrameIndex;
                this.animationTimer = 0;
                this.isAnimationPlaying = false;
            }
        }
        this.setFrame(frame);
    }
    update() {
        if (this.material != null) {
            const uniforms = this.material.uniforms;
            if (uniforms != null)
                uniforms.time.value += 1 / this.actor.gameInstance.framesPerSecond;
        }
        if (this.hasFrameBeenUpdated) {
            this.hasFrameBeenUpdated = false;
            return;
        }
        this._tickAnimation();
        this.hasFrameBeenUpdated = false;
    }
    _tickAnimation() {
        if (this.animationName == null || !this.isAnimationPlaying)
            return;
        this.animationTimer += this.playbackSpeed * this.animation.speed;
        this.updateFrame();
    }
    setIsLayerActive(active) { if (this.threeMesh != null)
        this.threeMesh.visible = active; }
}
/* tslint:disable:variable-name */
SpriteRenderer.Updater = SpriteRendererUpdater_1.default;
exports.default = SpriteRenderer;

},{"./SpriteRendererUpdater":2}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class SpriteRendererUpdater {
    constructor(client, spriteRenderer, config, externalSubscriber) {
        this.client = client;
        this.spriteRenderer = spriteRenderer;
        this.externalSubscriber = externalSubscriber;
        this.looping = true;
        this.overrideOpacity = false;
        this.onSpriteAssetReceived = (assetId, asset) => {
            if (!this.overrideOpacity)
                this.spriteRenderer.opacity = asset.pub.opacity;
            this.prepareMaps(asset.pub.textures, () => {
                this.spriteAsset = asset;
                this.setSprite();
                if (this.externalSubscriber.onAssetReceived != null)
                    this.externalSubscriber.onAssetReceived(assetId, asset);
            });
        };
        this.onSpriteAssetEdited = (assetId, command, ...args) => {
            let callEditCallback = true;
            const commandFunction = this.onEditCommands[command];
            if (commandFunction != null && commandFunction.apply(this, args) === false)
                callEditCallback = false;
            if (callEditCallback && this.externalSubscriber.onAssetEdited != null) {
                this.externalSubscriber.onAssetEdited(assetId, command, ...args);
            }
        };
        this.onEditCommands = {
            setMaps: (maps) => {
                // TODO: Only update the maps that changed, don't recreate the whole model
                this.prepareMaps(this.spriteAsset.pub.textures, () => {
                    this.setSprite();
                    if (this.externalSubscriber.onAssetEdited != null) {
                        this.externalSubscriber.onAssetEdited(this.spriteAsset.id, "setMaps");
                    }
                });
                return false;
            },
            setMapSlot: (slot, name) => { this.setSprite(); },
            deleteMap: (name) => { this.setSprite(); },
            setProperty: (path, value) => {
                switch (path) {
                    case "filtering":
                        break;
                    case "opacity":
                        if (!this.overrideOpacity)
                            this.spriteRenderer.setOpacity(value);
                        break;
                    case "alphaTest":
                        this.spriteRenderer.material.alphaTest = value;
                        this.spriteRenderer.material.needsUpdate = true;
                        break;
                    case "pixelsPerUnit":
                    case "origin.x":
                    case "origin.y":
                        this.spriteRenderer.updateShape();
                        break;
                    default:
                        this.setSprite();
                        break;
                }
            },
            newAnimation: () => {
                this.spriteRenderer.updateAnimationsByName();
                this.playAnimation();
            },
            deleteAnimation: () => {
                this.spriteRenderer.updateAnimationsByName();
                this.playAnimation();
            },
            setAnimationProperty: () => {
                this.spriteRenderer.updateAnimationsByName();
                this.playAnimation();
            }
        };
        this.onSpriteAssetTrashed = (assetId) => {
            this.spriteAsset = null;
            this.spriteRenderer.setSprite(null);
            if (this.externalSubscriber.onAssetTrashed != null)
                this.externalSubscriber.onAssetTrashed(assetId);
        };
        this.onShaderAssetReceived = (assetId, asset) => {
            this.shaderPub = asset.pub;
            this.setSprite();
        };
        this.onShaderAssetEdited = (id, command, ...args) => {
            if (command !== "editVertexShader" && command !== "editFragmentShader")
                this.setSprite();
        };
        this.onShaderAssetTrashed = () => {
            this.shaderPub = null;
            this.setSprite();
        };
        this.spriteAssetId = config.spriteAssetId;
        this.animationId = config.animationId;
        this.materialType = config.materialType;
        this.shaderAssetId = config.shaderAssetId;
        if (this.externalSubscriber == null)
            this.externalSubscriber = {};
        this.spriteRenderer.horizontalFlip = config.horizontalFlip;
        this.spriteRenderer.verticalFlip = config.verticalFlip;
        this.spriteRenderer.castShadow = config.castShadow;
        this.spriteRenderer.receiveShadow = config.receiveShadow;
        this.overrideOpacity = config.overrideOpacity;
        this.opacity = config.opacity;
        if (this.overrideOpacity)
            this.spriteRenderer.setOpacity(this.opacity);
        const hex = parseInt(config.color, 16);
        const r = (hex >> 16 & 255) / 255;
        const g = (hex >> 8 & 255) / 255;
        const b = (hex & 255) / 255;
        this.spriteRenderer.setColor(r, g, b);
        this.spriteSubscriber = {
            onAssetReceived: this.onSpriteAssetReceived,
            onAssetEdited: this.onSpriteAssetEdited,
            onAssetTrashed: this.onSpriteAssetTrashed
        };
        this.shaderSubscriber = {
            onAssetReceived: this.onShaderAssetReceived,
            onAssetEdited: this.onShaderAssetEdited,
            onAssetTrashed: this.onShaderAssetTrashed
        };
        if (this.spriteAssetId != null)
            this.client.subAsset(this.spriteAssetId, "sprite", this.spriteSubscriber);
        if (this.shaderAssetId != null)
            this.client.subAsset(this.shaderAssetId, "shader", this.shaderSubscriber);
    }
    destroy() {
        if (this.spriteAssetId != null)
            this.client.unsubAsset(this.spriteAssetId, this.spriteSubscriber);
        if (this.shaderAssetId != null)
            this.client.unsubAsset(this.shaderAssetId, this.shaderSubscriber);
    }
    prepareMaps(textures, callback) {
        const textureNames = Object.keys(textures);
        let texturesToLoad = textureNames.length;
        if (texturesToLoad === 0) {
            callback();
            return;
        }
        function onTextureLoaded() {
            texturesToLoad--;
            if (texturesToLoad === 0)
                callback();
        }
        textureNames.forEach((key) => {
            const image = textures[key].image;
            if (!image.complete)
                image.addEventListener("load", onTextureLoaded);
            else
                onTextureLoaded();
        });
    }
    setSprite() {
        if (this.spriteAsset == null || (this.materialType === "shader" && this.shaderPub == null)) {
            this.spriteRenderer.setSprite(null);
            return;
        }
        this.spriteRenderer.setSprite(this.spriteAsset.pub, this.materialType, this.shaderPub);
        if (this.animationId != null)
            this.playAnimation();
    }
    playAnimation() {
        const animation = this.spriteAsset.animations.byId[this.animationId];
        if (animation == null)
            return;
        this.spriteRenderer.setAnimation(animation.name, this.looping);
    }
    config_setProperty(path, value) {
        switch (path) {
            case "spriteAssetId":
                if (this.spriteAssetId != null)
                    this.client.unsubAsset(this.spriteAssetId, this.spriteSubscriber);
                this.spriteAssetId = value;
                this.spriteAsset = null;
                this.spriteRenderer.setSprite(null);
                if (this.spriteAssetId != null)
                    this.client.subAsset(this.spriteAssetId, "sprite", this.spriteSubscriber);
                break;
            case "animationId":
                this.animationId = value;
                this.setSprite();
                break;
            case "looping":
                this.looping = value;
                if (this.animationId != null)
                    this.playAnimation();
                break;
            case "horizontalFlip":
                this.spriteRenderer.setHorizontalFlip(value);
                break;
            case "verticalFlip":
                this.spriteRenderer.setVerticalFlip(value);
                break;
            case "castShadow":
                this.spriteRenderer.setCastShadow(value);
                break;
            case "receiveShadow":
                this.spriteRenderer.receiveShadow = value;
                this.spriteRenderer.threeMesh.receiveShadow = value;
                this.spriteRenderer.threeMesh.material.needsUpdate = true;
                break;
            case "color":
                const hex = parseInt(value, 16);
                const r = (hex >> 16 & 255) / 255;
                const g = (hex >> 8 & 255) / 255;
                const b = (hex & 255) / 255;
                this.spriteRenderer.setColor(r, g, b);
                break;
            case "overrideOpacity":
                this.overrideOpacity = value;
                this.spriteRenderer.setOpacity(value ? this.opacity : (this.spriteAsset != null ? this.spriteAsset.pub.opacity : null));
                break;
            case "opacity":
                this.opacity = value;
                this.spriteRenderer.setOpacity(value);
                break;
            case "materialType":
                this.materialType = value;
                this.setSprite();
                break;
            case "shaderAssetId":
                if (this.shaderAssetId != null)
                    this.client.unsubAsset(this.shaderAssetId, this.shaderSubscriber);
                this.shaderAssetId = value;
                this.shaderPub = null;
                this.spriteRenderer.setSprite(null);
                if (this.shaderAssetId != null)
                    this.client.subAsset(this.shaderAssetId, "shader", this.shaderSubscriber);
                break;
        }
    }
}
exports.default = SpriteRendererUpdater;

},{}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const SpriteRenderer_1 = require("./SpriteRenderer");
SupEngine.registerComponentClass("SpriteRenderer", SpriteRenderer_1.default);

},{"./SpriteRenderer":1}]},{},[3]);
