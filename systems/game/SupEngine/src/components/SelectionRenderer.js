"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const THREE = require("three");
const ActorComponent_1 = require("../ActorComponent");
class SelectionRenderer extends ActorComponent_1.default {
    constructor(actor) {
        super(actor, "SelectionRenderer");
    }
    setIsLayerActive(active) { if (this.mesh != null)
        this.mesh.visible = active; }
    setSize(width, height) {
        if (this.mesh != null)
            this._clearMesh();
        this.width = width;
        this.height = height;
        this._createMesh();
    }
    _createMesh() {
        const geometry = new THREE.Geometry();
        geometry.vertices.push(new THREE.Vector3(-this.width / 2, -this.height / 2, 0), new THREE.Vector3(this.width / 2, -this.height / 2, 0), new THREE.Vector3(this.width / 2, this.height / 2, 0), new THREE.Vector3(-this.width / 2, this.height / 2, 0), new THREE.Vector3(-this.width / 2, -this.height / 2, 0));
        geometry.verticesNeedUpdate = true;
        const material = new THREE.LineBasicMaterial({ color: 0x000000, opacity: 1, depthTest: false, depthWrite: false, transparent: true });
        this.mesh = new THREE.Line(geometry, material);
        this.actor.threeObject.add(this.mesh);
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
exports.default = SelectionRenderer;
