"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const P2BodyMarkerUpdater_1 = require("./P2BodyMarkerUpdater");
const THREE = SupEngine.THREE;
const tmpVector3 = new THREE.Vector3();
const tmpEulerAngles = new THREE.Euler();
class P2BodyMarker extends SupEngine.ActorComponent {
    constructor(actor) {
        super(actor, "P2BodyMarker");
        this.offset = new THREE.Vector3(0, 0, 0);
        this.angle = 0;
        this.markerActor = new SupEngine.Actor(this.actor.gameInstance, `Marker`, null, { layer: -1 });
    }
    setIsLayerActive(active) {
        if (this.mesh != null)
            this.mesh.visible = active;
    }
    update() {
        super.update();
        this.actor.getGlobalPosition(tmpVector3);
        this.markerActor.setGlobalPosition(tmpVector3);
        this.actor.getGlobalEulerAngles(tmpEulerAngles);
        tmpEulerAngles.x = tmpEulerAngles.y = 0;
        tmpEulerAngles.z += this.angle;
        this.markerActor.setGlobalEulerAngles(tmpEulerAngles);
    }
    setBox(width, height) {
        if (this.mesh != null)
            this._clearRenderer();
        const geometry = new THREE.Geometry();
        geometry.vertices.push(new THREE.Vector3(-width / 2, -height / 2, 0), new THREE.Vector3(width / 2, -height / 2, 0), new THREE.Vector3(width / 2, height / 2, 0), new THREE.Vector3(-width / 2, height / 2, 0), new THREE.Vector3(-width / 2, -height / 2, 0));
        const material = new THREE.LineBasicMaterial({ color: 0xf459e4 });
        this.mesh = new THREE.Line(geometry, material);
        this.markerActor.threeObject.add(this.mesh);
        this.mesh.position.copy(this.offset);
        this.mesh.updateMatrixWorld(false);
    }
    setCircle(radius) {
        if (this.mesh != null)
            this._clearRenderer();
        const geometry = new THREE.CircleGeometry(radius, 16);
        const material = new THREE.MeshBasicMaterial({ color: 0xf459e4, wireframe: true });
        this.mesh = new THREE.Mesh(geometry, material);
        this.markerActor.threeObject.add(this.mesh);
        this.mesh.position.copy(this.offset);
        this.mesh.updateMatrixWorld(false);
    }
    setOffset(xOffset, yOffset) {
        this.offset.set(xOffset, yOffset, 0);
        this.mesh.position.copy(this.offset);
        this.mesh.updateMatrixWorld(false);
    }
    setAngle(angle) {
        this.angle = angle * (Math.PI / 180);
    }
    _clearRenderer() {
        this.markerActor.threeObject.remove(this.mesh);
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();
        this.mesh = null;
    }
    _destroy() {
        if (this.mesh != null)
            this._clearRenderer();
        this.actor.gameInstance.destroyActor(this.markerActor);
        super._destroy();
    }
}
/* tslint:disable:variable-name */
P2BodyMarker.Updater = P2BodyMarkerUpdater_1.default;
exports.default = P2BodyMarker;
