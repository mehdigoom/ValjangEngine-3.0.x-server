"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ArcadeBody2DUpdater_1 = require("./ArcadeBody2DUpdater");
const THREE = SupEngine.THREE;
const tmpVector3 = new THREE.Vector3();
class ArcadeBody2DMarker extends SupEngine.ActorComponent {
    constructor(actor) {
        super(actor, "ArcadeBody2DMarker");
        this.offset = new THREE.Vector3(0, 0, 0);
        this.markerActor = new SupEngine.Actor(this.actor.gameInstance, `Marker`, null, { layer: -1 });
    }
    setIsLayerActive(active) {
        if (this.line != null)
            this.line.visible = active;
    }
    update() {
        super.update();
        this.markerActor.setGlobalPosition(this.actor.getGlobalPosition(tmpVector3));
    }
    setBox(width, height) {
        if (this.line != null)
            this._clearRenderer();
        const geometry = new THREE.Geometry();
        geometry.vertices.push(new THREE.Vector3(-width / 2, -height / 2, 0.01), new THREE.Vector3(width / 2, -height / 2, 0.01), new THREE.Vector3(width / 2, height / 2, 0.01), new THREE.Vector3(-width / 2, height / 2, 0.01), new THREE.Vector3(-width / 2, -height / 2, 0.01));
        const material = new THREE.LineBasicMaterial({ color: 0xf459e4 });
        this.line = new THREE.Line(geometry, material);
        this.markerActor.threeObject.add(this.line);
        this.setOffset();
    }
    setOffset(x, y) {
        if (x != null && y != null)
            this.offset.set(x, y, 0);
        this.line.position.set(this.offset.x, this.offset.y, 0);
        this.line.updateMatrixWorld(false);
    }
    setTileMap() {
        if (this.line != null)
            this._clearRenderer();
        // TODO ?
    }
    _clearRenderer() {
        this.markerActor.threeObject.remove(this.line);
        this.line.geometry.dispose();
        this.line.material.dispose();
        this.line = null;
    }
    _destroy() {
        if (this.line != null)
            this._clearRenderer();
        this.actor.gameInstance.destroyActor(this.markerActor);
        this.markerActor = null;
        super._destroy();
    }
}
/* tslint:disable:variable-name */
ArcadeBody2DMarker.Updater = ArcadeBody2DUpdater_1.default;
exports.default = ArcadeBody2DMarker;
