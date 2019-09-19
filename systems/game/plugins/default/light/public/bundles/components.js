(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const THREE = SupEngine.THREE;
const LightUpdater_1 = require("./LightUpdater");
class Light extends SupEngine.ActorComponent {
    constructor(actor) {
        super(actor, "Light");
        this.color = 0xffffff;
        this.intensity = 1;
        this.distance = 0;
        this.angle = Math.PI / 3;
        this.target = new THREE.Vector3(0, 0, 0);
        this.castShadow = false;
        this.shadow = {
            mapSize: new THREE.Vector2(512, 512),
            bias: 0,
            camera: {
                near: 0.1,
                far: 100,
                fov: 50,
                left: -100,
                right: 100,
                top: 100,
                bottom: -100
            }
        };
        this.actor.gameInstance.threeRenderer.shadowMap.enabled = true;
    }
    setType(type) {
        if (this.light != null)
            this.actor.threeObject.remove(this.light);
        this.type = type;
        switch (type) {
            case "ambient":
                this.light = new THREE.AmbientLight(this.color);
                break;
            case "point":
                this.light = new THREE.PointLight(this.color, this.intensity, this.distance);
                break;
            case "spot":
                const spotLight = new THREE.SpotLight(this.color, this.intensity, this.distance, this.angle * Math.PI / 180);
                spotLight.target.position.copy(this.target);
                spotLight.target.updateMatrixWorld(false);
                spotLight.shadow.mapSize.copy(this.shadow.mapSize);
                spotLight.shadow.bias = this.shadow.bias;
                spotLight.shadow.camera = new THREE.PerspectiveCamera(this.shadow.camera.fov, this.shadow.mapSize.x / this.shadow.mapSize.y, this.shadow.camera.near, this.shadow.camera.far);
                this.light = spotLight;
                this.setCastShadow(this.castShadow);
                break;
            case "directional":
                const directionalLight = new THREE.DirectionalLight(this.color, this.intensity);
                directionalLight.target.position.copy(this.target);
                directionalLight.target.updateMatrixWorld(false);
                directionalLight.shadow.mapSize.copy(this.shadow.mapSize);
                directionalLight.shadow.bias = this.shadow.bias;
                directionalLight.shadow.camera = new THREE.OrthographicCamera(this.shadow.camera.left, this.shadow.camera.right, this.shadow.camera.top, this.shadow.camera.bottom, this.shadow.camera.near, this.shadow.camera.far);
                this.light = directionalLight;
                this.setCastShadow(this.castShadow);
                break;
        }
        this.actor.threeObject.add(this.light);
        this.light.updateMatrixWorld(false);
        this.actor.gameInstance.threeScene.traverse((object) => {
            const material = object.material;
            if (material != null)
                material.needsUpdate = true;
        });
    }
    setColor(color) {
        this.color = color;
        this.light.color.setHex(this.color);
    }
    setIntensity(intensity) {
        this.intensity = intensity;
        if (this.type !== "ambient")
            this.light.intensity = intensity;
    }
    setDistance(distance) {
        this.distance = distance;
        if (this.type === "point" || this.type === "spot")
            this.light.distance = distance;
    }
    setAngle(angle) {
        this.angle = angle;
        if (this.type === "spot")
            this.light.angle = this.angle * Math.PI / 180;
    }
    setTarget(x, y, z) {
        if (x != null)
            this.target.setX(x);
        if (y != null)
            this.target.setY(y);
        if (z != null)
            this.target.setZ(z);
        if (this.type === "spot" || this.type === "directional") {
            this.light.target.position.copy(this.target);
            this.light.target.updateMatrixWorld(true);
        }
    }
    setCastShadow(castShadow) {
        this.castShadow = castShadow;
        if (this.type !== "spot" && this.type !== "directional")
            return;
        this.light.castShadow = this.castShadow;
        this.actor.gameInstance.threeScene.traverse((object) => {
            const material = object.material;
            if (material != null)
                material.needsUpdate = true;
        });
    }
    setShadowMapSize(width, height) {
        if (width != null)
            this.shadow.mapSize.x = width;
        if (height != null)
            this.shadow.mapSize.y = height;
        if (this.type !== "spot" && this.type !== "directional")
            return;
        const shadow = this.light.shadow;
        shadow.mapSize.copy(this.shadow.mapSize);
        this.setType(this.type);
    }
    setShadowBias(bias) {
        this.shadow.bias = bias;
        if (this.type !== "spot" && this.type !== "directional")
            return;
        const shadow = this.light.shadow;
        shadow.bias = this.shadow.bias;
    }
    setShadowCameraNearPlane(near) {
        this.shadow.camera.near = near;
        if (this.type !== "spot" && this.type !== "directional")
            return;
        const shadow = this.light.shadow;
        const camera = shadow.camera;
        camera.near = this.shadow.camera.near;
        camera.updateProjectionMatrix();
    }
    setShadowCameraFarPlane(far) {
        this.shadow.camera.far = far;
        if (this.type !== "spot" && this.type !== "directional")
            return;
        const shadow = this.light.shadow;
        const camera = shadow.camera;
        camera.far = this.shadow.camera.far;
        camera.updateProjectionMatrix();
    }
    setShadowCameraFov(fov) {
        this.shadow.camera.fov = fov;
        if (this.type !== "spot")
            return;
        const shadow = this.light.shadow;
        const camera = shadow.camera;
        camera.fov = this.shadow.camera.fov;
        camera.updateProjectionMatrix();
    }
    setShadowCameraSize(top, bottom, left, right) {
        if (top != null)
            this.shadow.camera.top = top;
        if (bottom != null)
            this.shadow.camera.bottom = bottom;
        if (left != null)
            this.shadow.camera.left = left;
        if (right != null)
            this.shadow.camera.right = right;
        if (this.type !== "directional")
            return;
        const camera = this.light.shadow.camera;
        camera.top = this.shadow.camera.top;
        camera.bottom = this.shadow.camera.bottom;
        camera.left = this.shadow.camera.left;
        camera.right = this.shadow.camera.right;
        camera.updateProjectionMatrix();
    }
    _destroy() {
        this.actor.threeObject.remove(this.light);
        if (this.castShadow) {
            this.actor.gameInstance.threeScene.traverse((object) => {
                const material = object.material;
                if (material != null)
                    material.needsUpdate = true;
            });
        }
        super._destroy();
    }
    setIsLayerActive(active) { this.light.visible = active; }
}
/* tslint:disable:variable-name */
Light.Updater = LightUpdater_1.default;
exports.default = Light;

},{"./LightUpdater":3}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const THREE = SupEngine.THREE;
const Light_1 = require("./Light");
class LightMarker extends Light_1.default {
    setType(type) {
        if (this.lightMarker != null)
            this.actor.gameInstance.threeScene.remove(this.lightMarker);
        if (this.cameraHelper != null) {
            this.actor.gameInstance.threeScene.remove(this.cameraHelper);
            this.cameraHelper = null;
        }
        super.setType(type);
        switch (type) {
            case "ambient":
                this.lightMarker = null;
                break;
            case "point":
                this.lightMarker = new THREE.PointLightHelper(this.light, 1);
                break;
            case "spot":
                this.lightMarker = new THREE.SpotLightHelper(this.light);
                // if (this.castShadow) this.cameraHelper = new THREE.CameraHelper((<THREE.SpotLight>this.light).shadowCamera);
                break;
            case "directional":
                this.lightMarker = new THREE.DirectionalLightHelper(this.light, 1);
                // if (this.castShadow) this.cameraHelper = new THREE.CameraHelper((<THREE.DirectionalLight>this.light).shadowCamera);
                break;
        }
        if (this.lightMarker != null) {
            this.actor.gameInstance.threeScene.add(this.lightMarker);
            this.lightMarker.updateMatrixWorld(true);
        }
        // if (type === "spot" && this.cameraHelper != null && this.castShadow) this.actor.gameInstance.threeScene.add(this.cameraHelper);
    }
    setColor(color) {
        super.setColor(color);
        if (this.lightMarker != null)
            this.lightMarker.update();
    }
    setIntensity(intensity) {
        super.setIntensity(intensity);
        if (this.lightMarker != null)
            this.lightMarker.update();
    }
    setDistance(distance) {
        super.setDistance(distance);
        if (this.lightMarker != null)
            this.lightMarker.update();
    }
    setAngle(angle) {
        super.setAngle(angle);
        if (this.lightMarker != null)
            this.lightMarker.update();
    }
    setTarget(x, y, z) {
        super.setTarget(x, y, z);
        if (this.lightMarker != null)
            this.lightMarker.update();
    }
    setCastShadow(castShadow) {
        super.setCastShadow(castShadow);
        if (castShadow) {
            this.cameraHelper = new THREE.CameraHelper(this.light.shadow.camera);
            this.actor.gameInstance.threeScene.add(this.cameraHelper);
        }
        else {
            this.actor.gameInstance.threeScene.remove(this.cameraHelper);
            this.cameraHelper = null;
        }
    }
    setShadowCameraNearPlane(near) {
        super.setShadowCameraNearPlane(near);
        if (this.cameraHelper != null)
            this.cameraHelper.update();
    }
    setShadowCameraFarPlane(far) {
        super.setShadowCameraFarPlane(far);
        if (this.cameraHelper != null)
            this.cameraHelper.update();
    }
    setShadowCameraFov(fov) {
        super.setShadowCameraFov(fov);
        if (this.cameraHelper != null)
            this.cameraHelper.update();
    }
    setShadowCameraSize(top, bottom, left, right) {
        super.setShadowCameraSize(top, bottom, left, right);
        if (this.cameraHelper != null)
            this.cameraHelper.update();
    }
    update() {
        // TODO: Only do that when the transform has changed
        if (this.lightMarker != null) {
            this.lightMarker.updateMatrixWorld(true);
            this.lightMarker.update();
        }
        this.actor.gameInstance.threeScene.updateMatrixWorld(false);
    }
    _destroy() {
        if (this.lightMarker != null)
            this.actor.gameInstance.threeScene.remove(this.lightMarker);
        if (this.cameraHelper != null)
            this.actor.gameInstance.threeScene.remove(this.cameraHelper);
        super._destroy();
    }
}
exports.default = LightMarker;

},{"./Light":1}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const THREE = SupEngine.THREE;
class LightUpdater {
    constructor(client, light, config) {
        this.client = client;
        this.light = light;
        this.onLightResourceReceived = (resourceId, resource) => {
            this.lightSettings = resource;
            this.updateLightShadowMap();
        };
        this.onLightResourceEdited = (resourceId, command, propertyName) => {
            if (command === "setProperty" && propertyName === "shadowMapType")
                this.updateLightShadowMap();
        };
        this.light.color = parseInt(config.color, 16);
        this.light.intensity = config.intensity;
        this.light.distance = config.distance;
        this.light.angle = config.angle;
        this.light.target.set(config.target.x, config.target.y, config.target.z);
        this.light.castShadow = config.castShadow;
        this.light.shadow.mapSize.set(config.shadowMapSize.width, config.shadowMapSize.height);
        this.light.shadow.bias = config.shadowBias;
        this.light.shadow.camera.near = config.shadowCameraNearPlane;
        this.light.shadow.camera.far = config.shadowCameraFarPlane;
        this.light.shadow.camera.fov = config.shadowCameraFov;
        this.light.shadow.camera.left = config.shadowCameraSize.left;
        this.light.shadow.camera.right = config.shadowCameraSize.right;
        this.light.shadow.camera.top = config.shadowCameraSize.top;
        this.light.shadow.camera.bottom = config.shadowCameraSize.bottom;
        this.light.setType(config.type);
        this.lightSettingsSubscriber = {
            onResourceReceived: this.onLightResourceReceived,
            onResourceEdited: this.onLightResourceEdited
        };
        this.client.subResource("lightSettings", this.lightSettingsSubscriber);
    }
    destroy() {
        this.client.unsubResource("lightSettings", this.lightSettingsSubscriber);
    }
    config_setProperty(path, value) {
        switch (path) {
            case "type":
                this.light.setType(value);
                break;
            case "color":
                this.light.setColor(parseInt(value, 16));
                break;
            case "intensity":
                this.light.setIntensity(value);
                break;
            case "distance":
                this.light.setDistance(value);
                break;
            case "angle":
                this.light.setAngle(value);
                break;
            case "target.x":
                this.light.setTarget(value, null, null);
                break;
            case "target.y":
                this.light.setTarget(null, value, null);
                break;
            case "target.z":
                this.light.setTarget(null, null, value);
                break;
            case "castShadow":
                this.light.setCastShadow(value);
                break;
            case "shadowMapSize.width":
                this.light.setShadowMapSize(value, null);
                break;
            case "shadowMapSize.height":
                this.light.setShadowMapSize(null, value);
                break;
            case "shadowBias":
                this.light.setShadowBias(value);
                break;
            case "shadowCameraNearPlane":
                this.light.setShadowCameraNearPlane(value);
                break;
            case "shadowCameraFarPlane":
                this.light.setShadowCameraFarPlane(value);
                break;
            case "shadowCameraFov":
                this.light.setShadowCameraFov(value);
                break;
            case "shadowCameraSize.top":
                this.light.setShadowCameraSize(value, null, null, null);
                break;
            case "shadowCameraSize.bottom":
                this.light.setShadowCameraSize(null, value, null, null);
                break;
            case "shadowCameraSize.left":
                this.light.setShadowCameraSize(null, null, value, null);
                break;
            case "shadowCameraSize.right":
                this.light.setShadowCameraSize(null, null, null, value);
                break;
        }
    }
    updateLightShadowMap() {
        switch (this.lightSettings.pub.shadowMapType) {
            case "basic":
                this.light.actor.gameInstance.threeRenderer.shadowMap.type = THREE.BasicShadowMap;
                break;
            case "pcf":
                this.light.actor.gameInstance.threeRenderer.shadowMap.type = THREE.PCFShadowMap;
                break;
            case "pcfSoft":
                this.light.actor.gameInstance.threeRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
                break;
        }
        this.light.actor.gameInstance.threeScene.traverse((object) => {
            const material = object.material;
            if (material != null)
                material.needsUpdate = true;
        });
    }
}
exports.default = LightUpdater;

},{}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Light_1 = require("./Light");
const LightMarker_1 = require("./LightMarker");
SupEngine.registerComponentClass("Light", Light_1.default);
SupEngine.registerEditorComponentClass("LightMarker", LightMarker_1.default);

},{"./Light":1,"./LightMarker":2}]},{},[4]);
