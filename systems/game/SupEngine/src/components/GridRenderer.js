"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const THREE = require("three");
const ActorComponent_1 = require("../ActorComponent");
class GridRenderer extends ActorComponent_1.default {
    constructor(actor, data) {
        super(actor, "GridRenderer");
        if (data != null)
            this.setGrid(data);
    }
    setIsLayerActive(active) { if (this.mesh != null)
        this.mesh.visible = active; }
    setGrid(data) {
        this._clearMesh();
        this.width = data.width;
        this.height = data.height;
        this.direction = (data.direction) ? data.direction : 1;
        this.orthographicScale = data.orthographicScale;
        this.ratio = data.ratio;
        this._createMesh();
    }
    resize(width, height) {
        this.width = width;
        this.height = height;
        this._clearMesh();
        this._createMesh();
    }
    setOrthgraphicScale(orthographicScale) {
        this.orthographicScale = orthographicScale;
        this._clearMesh();
        this._createMesh();
    }
    setRatio(ratio) {
        this.ratio = ratio;
        this._clearMesh();
        this._createMesh();
    }
    _createMesh() {
        const geometry = new THREE.Geometry();
        // Vertical lines
        let x = 0;
        while (x <= this.width) {
            geometry.vertices.push(new THREE.Vector3(x / this.ratio.x, 0, 0));
            geometry.vertices.push(new THREE.Vector3(x / this.ratio.x, this.direction * this.height / this.ratio.y, 0));
            x += 1;
        }
        // Horizontal lines
        let y = 0;
        while (y <= this.height) {
            geometry.vertices.push(new THREE.Vector3(0, this.direction * y / this.ratio.y, 0));
            geometry.vertices.push(new THREE.Vector3(this.width / this.ratio.x, this.direction * y / this.ratio.y, 0));
            y += 1;
        }
        geometry.computeLineDistances();
        const material = new THREE.LineDashedMaterial({
            color: 0x000000, transparent: true, opacity: 0.4,
            dashSize: 5 / 1000, gapSize: 5 / 1000, scale: 1 / this.orthographicScale
        });
        this.mesh = new THREE.LineSegments(geometry, material);
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
exports.default = GridRenderer;
