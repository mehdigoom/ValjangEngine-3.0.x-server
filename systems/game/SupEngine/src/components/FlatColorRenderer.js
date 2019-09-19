"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const THREE = require("three");
const ActorComponent_1 = require("../ActorComponent");
class FlatColorRenderer extends ActorComponent_1.default {
    constructor(actor, color, scaleRatio, width, height) {
        super(actor, "GridRenderer");
        this.setup(color, scaleRatio, width, height);
    }
    setIsLayerActive(active) { if (this.mesh != null)
        this.mesh.visible = active; }
    setup(color, scaleRatio, width, height) {
        if (color == null || scaleRatio == null || width == null)
            return;
        this._clearMesh();
        this.width = width;
        this.height = (height) ? height : this.width;
        const geometry = new THREE.PlaneBufferGeometry(this.width, this.height);
        const material = new THREE.MeshBasicMaterial({
            color: color,
            alphaTest: 0.1,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.5
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.actor.threeObject.add(this.mesh);
        this.refreshScale(scaleRatio);
    }
    refreshScale(scaleRatio) {
        this.mesh.scale.set(scaleRatio, scaleRatio, scaleRatio);
        this.mesh.position.set(this.width / 2 * scaleRatio, this.height / 2 * scaleRatio, -0.01);
        this.mesh.updateMatrixWorld(false);
    }
    _clearMesh() {
        if (this.mesh == null)
            return;
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();
        this.actor.threeObject.remove(this.mesh);
        this.mesh = null;
    }
    _destroy() {
        this._clearMesh();
        super._destroy();
    }
}
exports.default = FlatColorRenderer;
