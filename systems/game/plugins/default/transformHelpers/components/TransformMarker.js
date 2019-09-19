"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const THREE = SupEngine.THREE;
class TransformMarker extends SupEngine.ActorComponent {
    constructor(actor) {
        super(actor, "TransformMarker");
        this.visible = true;
        const geometry = new THREE.Geometry();
        geometry.vertices.push(new THREE.Vector3(-0.25, 0, 0), new THREE.Vector3(0.25, 0, 0), new THREE.Vector3(0, -0.25, 0), new THREE.Vector3(0, 0.25, 0), new THREE.Vector3(0, 0, -0.25), new THREE.Vector3(0, 0, 0.25));
        this.line = new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.25, transparent: true }));
        this.actor.threeObject.add(this.line);
        this.line.updateMatrixWorld(false);
    }
    setIsLayerActive(active) { this.line.visible = active && this.visible; }
    move(target) {
        this.visible = this.line.visible = true;
        this.actor.threeObject.position.copy(target.getWorldPosition());
        this.actor.threeObject.quaternion.copy(target.getWorldQuaternion());
        this.actor.threeObject.updateMatrixWorld(false);
    }
    hide() {
        this.visible = this.line.visible = false;
    }
    _destroy() {
        this.actor.threeObject.remove(this.line);
        this.line.geometry.dispose();
        this.line.material.dispose();
        this.line = null;
        super._destroy();
    }
}
exports.default = TransformMarker;
