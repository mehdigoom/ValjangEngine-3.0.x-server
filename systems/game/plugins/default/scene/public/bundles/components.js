(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const THREE = SupEngine.THREE;
const CameraUpdater_1 = require("./CameraUpdater");
class CameraMarker extends SupEngine.ActorComponent {
    constructor(actor) {
        super(actor, "Marker");
        this.viewport = { x: 0, y: 0, width: 1, height: 1 };
        this.projectionNeedsUpdate = true;
        const geometry = new THREE.Geometry();
        for (let i = 0; i < 24; i++)
            geometry.vertices.push(new THREE.Vector3(0, 0, 0));
        this.line = new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.5, transparent: true }));
        this.actor.threeObject.add(this.line);
        this.line.updateMatrixWorld(false);
    }
    setIsLayerActive(active) { this.line.visible = active; }
    setConfig(config) {
        this.setOrthographicMode(config.mode === "orthographic");
        this.setFOV(config.fov);
        this.setOrthographicScale(config.orthographicScale);
        this.setViewport(config.viewport.x, config.viewport.y, config.viewport.width, config.viewport.height);
        this.setNearClippingPlane(config.nearClippingPlane);
        this.setFarClippingPlane(config.farClippingPlane);
        this.projectionNeedsUpdate = false;
        this._resetGeometry();
    }
    setOrthographicMode(isOrthographic) {
        this.isOrthographic = isOrthographic;
        this.projectionNeedsUpdate = true;
    }
    setFOV(fov) {
        this.fov = fov;
        if (!this.isOrthographic)
            this.projectionNeedsUpdate = true;
    }
    setOrthographicScale(orthographicScale) {
        this.orthographicScale = orthographicScale;
        if (this.isOrthographic)
            this.projectionNeedsUpdate = true;
    }
    setViewport(x, y, width, height) {
        this.viewport.x = x;
        this.viewport.y = y;
        this.viewport.width = width;
        this.viewport.height = height;
        this.projectionNeedsUpdate = true;
    }
    setNearClippingPlane(nearClippingPlane) {
        this.nearClippingPlane = nearClippingPlane;
        this.projectionNeedsUpdate = true;
    }
    setFarClippingPlane(farClippingPlane) {
        this.farClippingPlane = farClippingPlane;
        this.projectionNeedsUpdate = true;
    }
    setRatio(ratio) {
        this.ratio = ratio;
        this.projectionNeedsUpdate = true;
    }
    _resetGeometry() {
        const near = this.nearClippingPlane;
        const far = this.farClippingPlane;
        let farTopRight;
        let nearTopRight;
        if (this.isOrthographic) {
            let right = this.orthographicScale / 2 * this.viewport.width / this.viewport.height;
            if (this.ratio != null)
                right *= this.ratio;
            farTopRight = new THREE.Vector3(right, this.orthographicScale / 2, far);
            nearTopRight = new THREE.Vector3(right, this.orthographicScale / 2, near);
        }
        else {
            const tan = Math.tan(THREE.Math.degToRad(this.fov / 2));
            farTopRight = new THREE.Vector3(far * tan, far * tan, far);
            nearTopRight = farTopRight.clone().normalize().multiplyScalar(near);
        }
        const vertices = this.line.geometry.vertices;
        // Near plane
        vertices[0].set(-nearTopRight.x, nearTopRight.y, -near);
        vertices[1].set(nearTopRight.x, nearTopRight.y, -near);
        vertices[2].set(nearTopRight.x, nearTopRight.y, -near);
        vertices[3].set(nearTopRight.x, -nearTopRight.y, -near);
        vertices[4].set(nearTopRight.x, -nearTopRight.y, -near);
        vertices[5].set(-nearTopRight.x, -nearTopRight.y, -near);
        vertices[6].set(-nearTopRight.x, -nearTopRight.y, -near);
        vertices[7].set(-nearTopRight.x, nearTopRight.y, -near);
        // Far plane
        vertices[8].set(-farTopRight.x, farTopRight.y, -far);
        vertices[9].set(farTopRight.x, farTopRight.y, -far);
        vertices[10].set(farTopRight.x, farTopRight.y, -far);
        vertices[11].set(farTopRight.x, -farTopRight.y, -far);
        vertices[12].set(farTopRight.x, -farTopRight.y, -far);
        vertices[13].set(-farTopRight.x, -farTopRight.y, -far);
        vertices[14].set(-farTopRight.x, -farTopRight.y, -far);
        vertices[15].set(-farTopRight.x, farTopRight.y, -far);
        // Lines
        vertices[16].set(-nearTopRight.x, nearTopRight.y, -near);
        vertices[17].set(-farTopRight.x, farTopRight.y, -far);
        vertices[18].set(nearTopRight.x, nearTopRight.y, -near);
        vertices[19].set(farTopRight.x, farTopRight.y, -far);
        vertices[20].set(nearTopRight.x, -nearTopRight.y, -near);
        vertices[21].set(farTopRight.x, -farTopRight.y, -far);
        vertices[22].set(-nearTopRight.x, -nearTopRight.y, -near);
        vertices[23].set(-farTopRight.x, -farTopRight.y, -far);
        this.line.geometry.verticesNeedUpdate = true;
    }
    _destroy() {
        this.actor.threeObject.remove(this.line);
        this.line.geometry.dispose();
        this.line.material.dispose();
        this.line = null;
        super._destroy();
    }
    update() {
        if (this.projectionNeedsUpdate) {
            this.projectionNeedsUpdate = false;
            this._resetGeometry();
        }
    }
}
/* tslint:disable:variable-name */
CameraMarker.Updater = CameraUpdater_1.default;
exports.default = CameraMarker;

},{"./CameraUpdater":2}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CameraUpdater {
    constructor(client, camera, config) {
        this.onResourceReceived = (resourceId, resource) => {
            this.resource = resource;
            this.updateRatio();
        };
        this.onResourceEdited = (resourceId, command, propertyName) => {
            this.updateRatio();
        };
        this.client = client;
        this.camera = camera;
        this.config = config;
        this.camera.setConfig(this.config);
        this.camera.setRatio(5 / 3);
        this.client.subResource("gameSettings", this);
    }
    destroy() {
        if (this.resource != null)
            this.client.unsubResource("gameSettings", this);
    }
    config_setProperty(path, value) {
        this.camera.setConfig(this.config);
    }
    updateRatio() {
        if (this.resource.pub.ratioNumerator != null && this.resource.pub.ratioDenominator != null)
            this.camera.setRatio(this.resource.pub.ratioNumerator / this.resource.pub.ratioDenominator);
        else
            this.camera.setRatio(5 / 3);
    }
}
exports.default = CameraUpdater;

},{}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CameraMarker_1 = require("./CameraMarker");
SupEngine.registerEditorComponentClass("CameraMarker", CameraMarker_1.default);

},{"./CameraMarker":1}]},{},[3]);
