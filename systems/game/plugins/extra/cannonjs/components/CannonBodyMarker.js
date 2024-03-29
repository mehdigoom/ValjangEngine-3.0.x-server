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
