"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class TransformMarker {
    constructor(root) {
        const geometry = new THREE.Geometry();
        geometry.vertices.push(new THREE.Vector3(-0.25, 0, 0), new THREE.Vector3(0.25, 0, 0), new THREE.Vector3(0, -0.25, 0), new THREE.Vector3(0, 0.25, 0), new THREE.Vector3(0, 0, -0.25), new THREE.Vector3(0, 0, 0.25));
        this.line = new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.25, transparent: true }));
        this.line.layers.set(1);
        root.add(this.line);
        this.line.updateMatrixWorld(false);
    }
    move(target) {
        this.line.visible = true;
        this.line.position.copy(target.getWorldPosition());
        this.line.quaternion.copy(target.getWorldQuaternion());
        this.line.updateMatrixWorld(false);
        return this;
    }
    hide() {
        this.line.visible = false;
        return this;
    }
}
exports.default = TransformMarker;
