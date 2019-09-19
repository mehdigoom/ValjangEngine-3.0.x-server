"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const THREE = SupEngine.THREE;
class SpriteOriginMarker extends SupEngine.ActorComponent {
    constructor(actor) {
        super(actor, "SpriteOriginMarker");
        const geometry = new THREE.Geometry();
        geometry.vertices.push(new THREE.Vector3(-0.2, 0, 0), new THREE.Vector3(0.2, 0, 0), new THREE.Vector3(0, -0.2, 0), new THREE.Vector3(0, 0.2, 0));
        this.line = new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color: 0x333333, opacity: 0.25, transparent: true }));
        this.actor.threeObject.add(this.line);
        this.line.updateMatrixWorld(false);
    }
    setIsLayerActive(active) {
        this.line.visible = active;
    }
    setScale(scale) {
        this.line.scale.set(scale, scale, scale);
        this.line.updateMatrixWorld(false);
    }
    _destroy() {
        this.actor.threeObject.remove(this.line);
        this.line.geometry.dispose();
        this.line.material.dispose();
        this.line = null;
        super._destroy();
    }
}
exports.default = SpriteOriginMarker;
