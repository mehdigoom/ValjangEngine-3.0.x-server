(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const THREE = SupEngine.THREE;
const tmpBoneMatrix = new THREE.Matrix4;
const tmpVec = new THREE.Vector3;
const tmpQuat = new THREE.Quaternion;
const ModelRendererUpdater_1 = require("./ModelRendererUpdater");
function getInterpolationData(keyFrames, time) {
    let prevKeyFrame = keyFrames[keyFrames.length - 1];
    // TODO: Use a cache to maintain most recently used key frames for each bone
    // and profit from temporal contiguity
    let nextKeyFrame;
    for (const keyFrame of keyFrames) {
        nextKeyFrame = keyFrame;
        if (keyFrame.time > time)
            break;
        prevKeyFrame = keyFrame;
    }
    if (prevKeyFrame === nextKeyFrame)
        nextKeyFrame = keyFrames[0];
    const timeSpan = nextKeyFrame.time - prevKeyFrame.time;
    const timeProgress = time - prevKeyFrame.time;
    const t = (timeSpan > 0) ? timeProgress / timeSpan : 0;
    return { prevKeyFrame, nextKeyFrame, t };
}
class ModelRenderer extends SupEngine.ActorComponent {
    constructor(actor) {
        super(actor, "ModelRenderer");
        this.color = { r: 1, g: 1, b: 1 };
        this.hasPoseBeenUpdated = false;
        this.materialType = "basic";
        this.castShadow = false;
        this.receiveShadow = false;
    }
    _clearMesh() {
        if (this.skeletonHelper != null) {
            this.actor.threeObject.remove(this.skeletonHelper);
            this.skeletonHelper = null;
        }
        this.actor.threeObject.remove(this.threeMesh);
        this.threeMesh.traverse((obj) => { if (obj.dispose != null)
            obj.dispose(); });
        this.threeMesh = null;
        this.material.dispose();
        this.material = null;
    }
    _destroy() {
        if (this.threeMesh != null)
            this._clearMesh();
        this.asset = null;
        super._destroy();
    }
    setModel(asset, materialType, customShader) {
        if (this.threeMesh != null)
            this._clearMesh();
        this.asset = asset;
        if (materialType != null)
            this.materialType = materialType;
        if (customShader != null)
            this.shaderAsset = customShader;
        this.animation = null;
        this.animationsByName = {};
        if (asset == null || asset.attributes["position"] == null)
            return;
        this.updateAnimationsByName();
        const geometry = new THREE.BufferGeometry;
        if (this.asset.attributes["position"] != null) {
            const buffer = new Float32Array(this.asset.attributes["position"]);
            geometry.addAttribute("position", new THREE.BufferAttribute(buffer, 3));
        }
        if (this.asset.attributes["index"] != null) {
            const buffer = new Uint16Array(this.asset.attributes["index"]);
            geometry.setIndex(new THREE.BufferAttribute(buffer, 1));
        }
        if (this.asset.attributes["uv"] != null) {
            const buffer = new Float32Array(this.asset.attributes["uv"]);
            geometry.addAttribute("uv", new THREE.BufferAttribute(buffer, 2));
        }
        if (this.asset.attributes["normal"] != null) {
            const buffer = new Float32Array(this.asset.attributes["normal"]);
            geometry.addAttribute("normal", new THREE.BufferAttribute(buffer, 3));
        }
        if (this.asset.attributes["color"] != null) {
            const buffer = new Float32Array(this.asset.attributes["color"]);
            geometry.addAttribute("color", new THREE.BufferAttribute(buffer, 3));
        }
        if (this.asset.attributes["skinIndex"] != null) {
            const buffer = new Float32Array(this.asset.attributes["skinIndex"]);
            geometry.addAttribute("skinIndex", new THREE.BufferAttribute(buffer, 4));
        }
        if (this.asset.attributes["skinWeight"] != null) {
            const buffer = new Float32Array(this.asset.attributes["skinWeight"]);
            geometry.addAttribute("skinWeight", new THREE.BufferAttribute(buffer, 4));
        }
        if (this.materialType === "shader") {
            this.material = SupEngine.componentClasses["Shader"].createShaderMaterial(this.shaderAsset, this.asset.textures, geometry);
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
            material.alphaTest = 0.1;
            this.material = material;
        }
        this.setColor(this.color.r, this.color.g, this.color.b);
        this.setOpacity(this.opacity);
        if (this.asset.bones != null) {
            this.threeMesh = new THREE.SkinnedMesh(geometry, this.material);
            if (this.asset.upAxisMatrix != null) {
                const upAxisMatrix = new THREE.Matrix4().fromArray(this.asset.upAxisMatrix);
                this.threeMesh.applyMatrix(upAxisMatrix);
            }
            const bones = [];
            this.bonesByName = {};
            for (const boneInfo of this.asset.bones) {
                const bone = new THREE.Bone(this.threeMesh);
                bone.name = boneInfo.name;
                this.bonesByName[bone.name] = bone;
                bone.applyMatrix(tmpBoneMatrix.fromArray(boneInfo.matrix));
                bones.push(bone);
            }
            for (let i = 0; i < this.asset.bones.length; i++) {
                const boneInfo = this.asset.bones[i];
                if (boneInfo.parentIndex != null)
                    bones[boneInfo.parentIndex].add(bones[i]);
                else
                    this.threeMesh.add(bones[i]);
            }
            this.threeMesh.updateMatrixWorld(true);
            const useVertexTexture = false;
            this.threeMesh.bind(new THREE.Skeleton(bones, undefined, useVertexTexture));
            this.material.skinning = true;
        }
        else
            this.threeMesh = new THREE.Mesh(geometry, this.material);
        this.setUnitRatio(asset.unitRatio);
        this.setCastShadow(this.castShadow);
        this.threeMesh.receiveShadow = this.receiveShadow;
        this.actor.threeObject.add(this.threeMesh);
        if (geometry.getAttribute("normal") == null)
            this.threeMesh.geometry.computeVertexNormals();
        this.threeMesh.updateMatrixWorld(false);
    }
    setCastShadow(castShadow) {
        this.castShadow = castShadow;
        this.threeMesh.castShadow = castShadow;
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
    setColor(r, g, b) {
        this.color.r = r;
        this.color.g = g;
        this.color.b = b;
        if (this.material instanceof THREE.ShaderMaterial) {
            const uniforms = this.material.uniforms;
            if (uniforms.color != null)
                uniforms.color.value.setRGB(r, g, b);
        }
        else
            this.material.color.setRGB(r, g, b);
    }
    setUnitRatio(unitRatio) {
        if (this.threeMesh == null)
            return;
        const ratio = 1 / unitRatio;
        this.threeMesh.scale.set(ratio, ratio, ratio);
        this.threeMesh.updateMatrixWorld(false);
    }
    setShowSkeleton(show) {
        if (show === (this.skeletonHelper != null))
            return;
        if (show) {
            this.skeletonHelper = new THREE.SkeletonHelper(this.threeMesh);
            if (this.asset.upAxisMatrix != null) {
                const upAxisMatrix = new THREE.Matrix4().fromArray(this.asset.upAxisMatrix);
                this.skeletonHelper.root = this.skeletonHelper;
                this.skeletonHelper.applyMatrix(upAxisMatrix);
                this.skeletonHelper.update();
            }
            this.skeletonHelper.material.linewidth = 3;
            this.actor.threeObject.add(this.skeletonHelper);
        }
        else {
            this.actor.threeObject.remove(this.skeletonHelper);
            this.skeletonHelper = null;
        }
        if (this.threeMesh != null)
            this.threeMesh.updateMatrixWorld(true);
    }
    updateAnimationsByName() {
        for (const animation of this.asset.animations) {
            this.animationsByName[animation.name] = animation;
        }
    }
    setAnimation(newAnimationName, newAnimationLooping = true) {
        if (newAnimationName != null) {
            const newAnimation = this.animationsByName[newAnimationName];
            if (newAnimation == null)
                throw new Error(`Animation ${newAnimationName} doesn't exist`);
            if (newAnimation === this.animation && this.isAnimationPlaying)
                return;
            this.animation = newAnimation;
            this.animationLooping = newAnimationLooping;
            this.animationTimer = 0;
            this.isAnimationPlaying = true;
        }
        else {
            this.animation = null;
            this.clearPose();
        }
        return;
    }
    getAnimation() { return (this.animation != null) ? this.animation.name : null; }
    setAnimationTime(time) {
        if (typeof time !== "number" || time < 0 || time > this.getAnimationDuration())
            throw new Error("Invalid time");
        this.animationTimer = time * this.actor.gameInstance.framesPerSecond;
        this.updatePose();
    }
    getAnimationTime() { return (this.animation != null) ? this.animationTimer / this.actor.gameInstance.framesPerSecond : 0; }
    getAnimationDuration() {
        if (this.animation == null || this.animation.duration == null)
            return 0;
        return this.animation.duration;
    }
    playAnimation(animationLooping = true) {
        this.animationLooping = animationLooping;
        this.isAnimationPlaying = true;
    }
    pauseAnimation() { this.isAnimationPlaying = false; }
    stopAnimation() {
        if (this.animation == null)
            return;
        this.isAnimationPlaying = false;
        this.animationTimer = 0;
        this.updatePose();
    }
    clearPose() {
        if (this.threeMesh == null)
            return;
        if (this.threeMesh.skeleton == null)
            return;
        for (let i = 0; i < this.threeMesh.skeleton.bones.length; i++) {
            const bone = this.threeMesh.skeleton.bones[i];
            bone.matrix.fromArray(this.asset.bones[i].matrix);
            bone.matrix.decompose(bone.position, bone.quaternion, bone.scale);
        }
        this.threeMesh.updateMatrixWorld(false);
        if (this.skeletonHelper != null)
            this.skeletonHelper.update();
    }
    getBoneTransform(name) {
        if (!this.hasPoseBeenUpdated)
            this._tickAnimation();
        const position = new THREE.Vector3;
        const orientation = new THREE.Quaternion;
        const scale = new THREE.Vector3;
        if (this.bonesByName == null || this.bonesByName[name] == null)
            return null;
        this.bonesByName[name].matrixWorld.decompose(position, orientation, scale);
        return { position, orientation, scale };
    }
    updatePose() {
        this.hasPoseBeenUpdated = true;
        // TODO: this.asset.speedMultiplier
        const speedMultiplier = 1;
        let time = this.animationTimer * speedMultiplier / this.actor.gameInstance.framesPerSecond;
        if (time > this.animation.duration) {
            if (this.animationLooping) {
                this.animationTimer -= this.animation.duration * this.actor.gameInstance.framesPerSecond / speedMultiplier;
                time -= this.animation.duration;
            }
            else {
                time = this.animation.duration;
                this.isAnimationPlaying = false;
            }
        }
        if (this.threeMesh.skeleton == null)
            return;
        for (let i = 0; i < this.threeMesh.skeleton.bones.length; i++) {
            const bone = this.threeMesh.skeleton.bones[i];
            const boneKeyFrames = this.animation.keyFrames[bone.name];
            if (boneKeyFrames == null)
                continue;
            if (boneKeyFrames.translation != null) {
                const { prevKeyFrame, nextKeyFrame, t } = getInterpolationData(boneKeyFrames.translation, time);
                bone.position.fromArray(prevKeyFrame.value);
                bone.position.lerp(tmpVec.fromArray(nextKeyFrame.value), t);
            }
            if (boneKeyFrames.rotation != null) {
                const { prevKeyFrame, nextKeyFrame, t } = getInterpolationData(boneKeyFrames.rotation, time);
                bone.quaternion.fromArray(prevKeyFrame.value);
                bone.quaternion.slerp(tmpQuat.fromArray(nextKeyFrame.value), t);
            }
            if (boneKeyFrames.scale != null) {
                const { prevKeyFrame, nextKeyFrame, t } = getInterpolationData(boneKeyFrames.scale, time);
                bone.scale.fromArray(prevKeyFrame.value);
                bone.scale.lerp(tmpVec.fromArray(nextKeyFrame.value), t);
            }
        }
        this.threeMesh.updateMatrixWorld(false);
        if (this.skeletonHelper != null)
            this.skeletonHelper.update();
    }
    update() {
        if (this.material != null) {
            const uniforms = this.material.uniforms;
            if (uniforms != null)
                uniforms.time.value += 1 / this.actor.gameInstance.framesPerSecond;
        }
        if (this.hasPoseBeenUpdated) {
            this.hasPoseBeenUpdated = false;
            return;
        }
        this._tickAnimation();
        this.hasPoseBeenUpdated = false;
    }
    _tickAnimation() {
        if (this.threeMesh == null || this.threeMesh.skeleton == null)
            return;
        if (this.animation == null || this.animation.duration === 0 || !this.isAnimationPlaying)
            return;
        this.animationTimer += 1;
        this.updatePose();
    }
    setIsLayerActive(active) { if (this.threeMesh != null)
        this.threeMesh.visible = active; }
}
/* tslint:disable:variable-name */
ModelRenderer.Updater = ModelRendererUpdater_1.default;
exports.default = ModelRenderer;

},{"./ModelRendererUpdater":2}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ModelRendererUpdater {
    constructor(client, modelRenderer, config, externalSubscriber) {
        this.client = client;
        this.modelRenderer = modelRenderer;
        this.externalSubscriber = externalSubscriber;
        this.overrideOpacity = false;
        this.modelAsset = null;
        this.onModelAssetReceived = (assetId, asset) => {
            if (this.modelRenderer.opacity == null)
                this.modelRenderer.opacity = asset.pub.opacity;
            this.prepareMaps(asset.pub.textures, () => {
                this.modelAsset = asset;
                this.setModel();
                if (this.externalSubscriber.onAssetReceived != null)
                    this.externalSubscriber.onAssetReceived(assetId, asset);
            });
        };
        this.onModelAssetEdited = (assetId, command, ...args) => {
            const commandFunction = this.onEditCommands[command];
            if (commandFunction != null)
                commandFunction.apply(this, args);
            if (this.externalSubscriber.onAssetEdited != null)
                this.externalSubscriber.onAssetEdited(assetId, command, ...args);
        };
        this.onEditCommands = {
            setModel: () => {
                this.setModel();
            },
            setMaps: (maps) => {
                // TODO: Only update the maps that changed, don't recreate the whole model
                this.prepareMaps(this.modelAsset.pub.textures, () => {
                    this.setModel();
                });
            },
            newAnimation: (animation, index) => {
                this.modelRenderer.updateAnimationsByName();
                this.playAnimation();
            },
            deleteAnimation: (id) => {
                this.modelRenderer.updateAnimationsByName();
                this.playAnimation();
            },
            setAnimationProperty: (id, key, value) => {
                this.modelRenderer.updateAnimationsByName();
                this.playAnimation();
            },
            setMapSlot: (slot, name) => { this.setModel(); },
            deleteMap: (name) => { this.setModel(); },
            setProperty: (path, value) => {
                switch (path) {
                    case "unitRatio":
                        this.modelRenderer.setUnitRatio(value);
                        break;
                    case "opacity":
                        if (!this.overrideOpacity)
                            this.modelRenderer.setOpacity(value);
                        break;
                }
            }
        };
        this.onModelAssetTrashed = () => {
            this.modelAsset = null;
            this.modelRenderer.setModel(null);
        };
        this.onShaderAssetReceived = (assetId, asset) => {
            this.shaderPub = asset.pub;
            this.setModel();
        };
        this.onShaderAssetEdited = (id, command, ...args) => {
            if (command !== "editVertexShader" && command !== "editFragmentShader")
                this.setModel();
        };
        this.onShaderAssetTrashed = () => {
            this.shaderPub = null;
            this.setModel();
        };
        if (this.externalSubscriber == null)
            this.externalSubscriber = {};
        this.modelAssetId = config.modelAssetId;
        this.animationId = config.animationId;
        this.materialType = config.materialType;
        this.shaderAssetId = config.shaderAssetId;
        if (config.castShadow != null)
            this.modelRenderer.castShadow = config.castShadow;
        if (config.receiveShadow != null)
            this.modelRenderer.receiveShadow = config.receiveShadow;
        if (config.overrideOpacity != null) {
            this.overrideOpacity = config.overrideOpacity;
            if (this.overrideOpacity)
                this.modelRenderer.opacity = config.opacity;
        }
        if (config.color != null) {
            const hex = parseInt(config.color, 16);
            this.modelRenderer.color.r = (hex >> 16 & 255) / 255;
            this.modelRenderer.color.g = (hex >> 8 & 255) / 255;
            this.modelRenderer.color.b = (hex & 255) / 255;
        }
        this.modelSubscriber = {
            onAssetReceived: this.onModelAssetReceived,
            onAssetEdited: this.onModelAssetEdited,
            onAssetTrashed: this.onModelAssetTrashed
        };
        this.shaderSubscriber = {
            onAssetReceived: this.onShaderAssetReceived,
            onAssetEdited: this.onShaderAssetEdited,
            onAssetTrashed: this.onShaderAssetTrashed
        };
        if (this.modelAssetId != null)
            this.client.subAsset(this.modelAssetId, "model", this.modelSubscriber);
        if (this.shaderAssetId != null)
            this.client.subAsset(this.shaderAssetId, "shader", this.shaderSubscriber);
    }
    destroy() {
        if (this.modelAssetId != null)
            this.client.unsubAsset(this.modelAssetId, this.modelSubscriber);
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
    setModel() {
        if (this.modelAsset == null || (this.materialType === "shader" && this.shaderPub == null)) {
            this.modelRenderer.setModel(null);
            return;
        }
        this.modelRenderer.setModel(this.modelAsset.pub, this.materialType, this.shaderPub);
        if (this.animationId != null)
            this.playAnimation();
    }
    playAnimation() {
        const animation = this.modelAsset.animations.byId[this.animationId];
        this.modelRenderer.setAnimation((animation != null) ? animation.name : null);
    }
    config_setProperty(path, value) {
        switch (path) {
            case "modelAssetId":
                if (this.modelAssetId != null)
                    this.client.unsubAsset(this.modelAssetId, this.modelSubscriber);
                this.modelAssetId = value;
                this.modelAsset = null;
                this.modelRenderer.setModel(null, null);
                if (this.modelAssetId != null)
                    this.client.subAsset(this.modelAssetId, "model", this.modelSubscriber);
                break;
            case "animationId":
                this.animationId = value;
                if (this.modelAsset != null)
                    this.playAnimation();
                break;
            case "castShadow":
                this.modelRenderer.setCastShadow(value);
                break;
            case "receiveShadow":
                this.modelRenderer.threeMesh.receiveShadow = value;
                this.modelRenderer.threeMesh.material.needsUpdate = true;
                break;
            case "overrideOpacity":
                this.overrideOpacity = value;
                this.modelRenderer.setOpacity(value ? null : this.modelAsset.pub.opacity);
                break;
            case "opacity":
                this.modelRenderer.setOpacity(value);
                break;
            case "color":
                const hex = parseInt(value, 16);
                this.modelRenderer.setColor((hex >> 16 & 255) / 255, (hex >> 8 & 255) / 255, (hex & 255) / 255);
                break;
            case "materialType":
                this.materialType = value;
                this.setModel();
                break;
            case "shaderAssetId":
                if (this.shaderAssetId != null)
                    this.client.unsubAsset(this.shaderAssetId, this.shaderSubscriber);
                this.shaderAssetId = value;
                this.shaderPub = null;
                this.modelRenderer.setModel(null);
                if (this.shaderAssetId != null)
                    this.client.subAsset(this.shaderAssetId, "shader", this.shaderSubscriber);
                break;
        }
    }
}
exports.default = ModelRendererUpdater;

},{}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ModelRenderer_1 = require("./ModelRenderer");
SupEngine.registerComponentClass("ModelRenderer", ModelRenderer_1.default);

},{"./ModelRenderer":1}]},{},[3]);
