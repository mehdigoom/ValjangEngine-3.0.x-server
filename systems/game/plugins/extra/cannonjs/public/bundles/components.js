(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const THREE = SupEngine.THREE;
class CannonBody extends SupEngine.ActorComponent {
    constructor(actor) {
        super(actor, "CannonBody");
        this.actorPosition = new THREE.Vector3();
        this.actorOrientation = new THREE.Quaternion();
        this.body = new window.CANNON.Body();
        SupEngine.Cannon.World.addBody(this.body);
    }
    setIsLayerActive(active) { }
    setup(config) {
        this.mass = config.mass != null ? config.mass : 0;
        this.fixedRotation = config.fixedRotation != null ? config.fixedRotation : false;
        this.positionOffset = config.positionOffset != null ? config.positionOffset : { x: 0, y: 0, z: 0 };
        this.group = config.group != null ? config.group : 1;
        this.mask = config.mask != null ? config.mask : 1;
        this.actor.getGlobalPosition(this.actorPosition);
        this.actor.getGlobalOrientation(this.actorOrientation);
        this.body.mass = this.mass;
        this.body.type = this.mass === 0 ? window.CANNON.Body.STATIC : window.CANNON.Body.DYNAMIC;
        this.body.material = SupEngine.Cannon.World.defaultMaterial;
        this.body.fixedRotation = this.fixedRotation;
        this.body.collisionFilterGroup = this.group;
        this.body.collisionFilterMask = this.mask;
        this.body.updateMassProperties();
        if (config.orientationOffset != null) {
            this.orientationOffset = {
                x: THREE.Math.degToRad(config.orientationOffset.x),
                y: THREE.Math.degToRad(config.orientationOffset.y),
                z: THREE.Math.degToRad(config.orientationOffset.z)
            };
        }
        else {
            this.orientationOffset = { x: 0, y: 0, z: 0 };
        }
        this.shape = config.shape;
        switch (this.shape) {
            case "box":
                this.halfSize = config.halfSize != null ? config.halfSize : { x: 0.5, y: 0.5, z: 0.5 };
                this.body.addShape(new window.CANNON.Box(new window.CANNON.Vec3().copy(this.halfSize)));
                break;
            case "sphere":
                this.radius = config.radius != null ? config.radius : 1;
                this.body.addShape(new window.CANNON.Sphere(this.radius));
                break;
            case "cylinder":
                this.radius = config.radius != null ? config.radius : 1;
                this.height = config.height != null ? config.height : 1;
                this.segments = config.segments != null ? config.segments : 16;
                this.body.addShape(new window.CANNON.Cylinder(this.radius, this.radius, this.height, this.segments));
                break;
        }
        this.body.position.set(this.actorPosition.x, this.actorPosition.y, this.actorPosition.z);
        this.body.shapeOffsets[0].copy(this.positionOffset);
        this.body.shapeOrientations[0].setFromEuler(this.orientationOffset.x, this.orientationOffset.y, this.orientationOffset.z);
        this.body.quaternion.set(this.actorOrientation.x, this.actorOrientation.y, this.actorOrientation.z, this.actorOrientation.w);
    }
    update() {
        this.actorPosition.set(this.body.position.x, this.body.position.y, this.body.position.z);
        this.actor.setGlobalPosition(this.actorPosition);
        this.actorOrientation.set(this.body.quaternion.x, this.body.quaternion.y, this.body.quaternion.z, this.body.quaternion.w);
        this.actor.setGlobalOrientation(this.actorOrientation);
    }
    _destroy() {
        SupEngine.Cannon.World.remove(this.body);
        this.body = null;
        super._destroy();
    }
}
exports.default = CannonBody;

},{}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CannonBodyMarkerUpdater_1 = require("./CannonBodyMarkerUpdater");
const THREE = SupEngine.THREE;
const tmpVector3 = new THREE.Vector3();
const tmpEulerAngles = new THREE.Euler();
class CannonBodyMarker extends SupEngine.ActorComponent {
    constructor(actor) {
        super(actor, "CannonBodyMarker");
        this.markerActor = new SupEngine.Actor(this.actor.gameInstance, `Marker`, null, { layer: -1 });
    }
    setIsLayerActive(active) { if (this.mesh != null)
        this.mesh.visible = active; }
    update() {
        super.update();
        this.actor.getGlobalPosition(tmpVector3);
        this.markerActor.setGlobalPosition(tmpVector3);
        this.actor.getGlobalEulerAngles(tmpEulerAngles);
        this.markerActor.setGlobalEulerAngles(tmpEulerAngles);
    }
    setBox(orientationOffset, halfSize) {
        if (this.mesh != null)
            this._clearRenderer();
        const geometry = new THREE.BoxGeometry(halfSize.x * 2, halfSize.y * 2, halfSize.z * 2);
        const material = new THREE.MeshBasicMaterial({ wireframe: true, color: 0xf459e4, transparent: true, opacity: 0.2 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.quaternion.setFromEuler(new THREE.Euler(THREE.Math.degToRad(orientationOffset.x), THREE.Math.degToRad(orientationOffset.y), THREE.Math.degToRad(orientationOffset.z)));
        this.markerActor.threeObject.add(this.mesh);
        this.mesh.updateMatrixWorld(false);
    }
    setSphere(radius) {
        if (this.mesh != null)
            this._clearRenderer();
        const geometry = new THREE.SphereGeometry(radius);
        const material = new THREE.MeshBasicMaterial({ wireframe: true, color: 0xf459e4, transparent: true, opacity: 0.2 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.markerActor.threeObject.add(this.mesh);
        this.mesh.updateMatrixWorld(false);
    }
    setCylinder(orientationOffset, radius, height, segments) {
        if (this.mesh != null)
            this._clearRenderer();
        const geometry = new THREE.CylinderGeometry(radius, radius, height, segments);
        const material = new THREE.MeshBasicMaterial({ wireframe: true, color: 0xf459e4, transparent: true, opacity: 0.2 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.quaternion.setFromEuler(new THREE.Euler(THREE.Math.degToRad((orientationOffset.x + 90)), THREE.Math.degToRad(orientationOffset.y), THREE.Math.degToRad(orientationOffset.z)));
        this.markerActor.threeObject.add(this.mesh);
        this.mesh.updateMatrixWorld(false);
    }
    setPositionOffset(positionOffset) {
        this.mesh.position.copy(positionOffset);
        this.mesh.updateMatrixWorld(false);
    }
    _clearRenderer() {
        this.markerActor.threeObject.remove(this.mesh);
        this.mesh.traverse((obj) => {
            if (obj.dispose != null)
                obj.dispose();
        });
        this.mesh = null;
    }
    _destroy() {
        if (this.mesh != null)
            this._clearRenderer();
        super._destroy();
    }
}
/* tslint:disable:variable-name */
CannonBodyMarker.Updater = CannonBodyMarkerUpdater_1.default;
exports.default = CannonBodyMarker;

},{"./CannonBodyMarkerUpdater":3}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CannonBodyMarkerUpdater {
    constructor(client, bodyRenderer, config) {
        this.client = client;
        this.bodyRenderer = bodyRenderer;
        this.config = config;
        switch (this.config.shape) {
            case "box":
                this.bodyRenderer.setBox(this.config.orientationOffset, this.config.halfSize);
                break;
            case "sphere":
                this.bodyRenderer.setSphere(this.config.radius);
                break;
            case "cylinder":
                this.bodyRenderer.setCylinder(this.config.orientationOffset, this.config.radius, this.config.height, this.config.segments);
                break;
        }
        this.bodyRenderer.setPositionOffset(this.config.positionOffset);
    }
    destroy() { }
    config_setProperty(path, value) {
        if ((path.indexOf("orientationOffset") !== -1 && this.config.shape === "box") || path.indexOf("halfSize") !== -1 || (path === "shape" && value === "box")) {
            this.bodyRenderer.setBox(this.config.orientationOffset, this.config.halfSize);
            this.bodyRenderer.setPositionOffset(this.config.positionOffset);
        }
        if ((path === "radius" && this.config.shape === "sphere") || (path === "shape" && value === "sphere")) {
            this.bodyRenderer.setSphere(this.config.radius);
            this.bodyRenderer.setPositionOffset(this.config.positionOffset);
        }
        if ((path.indexOf("orientationOffset") !== -1 && this.config.shape === "cylinder") ||
            (path === "radius" && this.config.shape === "cylinder") ||
            (path === "shape" && value === "cylinder") || path === "height" || path === "segments") {
            this.bodyRenderer.setCylinder(this.config.orientationOffset, this.config.radius, this.config.height, this.config.segments);
            this.bodyRenderer.setPositionOffset(this.config.positionOffset);
        }
        if (path.indexOf("positionOffset") !== -1) {
            this.bodyRenderer.setPositionOffset(this.config.positionOffset);
        }
    }
}
exports.default = CannonBodyMarkerUpdater;

},{}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CannonBody_1 = require("./CannonBody");
const CannonBodyMarker_1 = require("./CannonBodyMarker");
SupEngine.registerComponentClass("CannonBody", CannonBody_1.default);
SupEngine.registerEditorComponentClass("CannonBodyMarker", CannonBodyMarker_1.default);

},{"./CannonBody":1,"./CannonBodyMarker":2}]},{},[4]);
