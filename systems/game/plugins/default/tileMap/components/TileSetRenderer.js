"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const THREE = SupEngine.THREE;
const TileSetRendererUpdater_1 = require("./TileSetRendererUpdater");
class TileSetRenderer extends SupEngine.ActorComponent {
    constructor(actor, asset) {
        super(actor, "TileSetRenderer");
        this.material = new THREE.MeshBasicMaterial({ alphaTest: 0.1, side: THREE.DoubleSide, transparent: true });
        const gridActor = new SupEngine.Actor(this.actor.gameInstance, "Grid");
        gridActor.setLocalPosition(new THREE.Vector3(0, 0, 1));
        this.gridRenderer = new SupEngine.editorComponentClasses["GridRenderer"](gridActor, {
            width: 1, height: 1,
            direction: -1, orthographicScale: 10,
            ratio: { x: 1, y: 1 }
        });
        this.selectedTileActor = new SupEngine.Actor(this.actor.gameInstance, "Selection", null, { visible: false });
        new SupEngine.editorComponentClasses["FlatColorRenderer"](this.selectedTileActor, 0x900090, 1, 1);
        this.setTileSet(asset);
    }
    setTileSet(asset) {
        this._clearMesh();
        this.asset = asset;
        if (this.asset == null)
            return;
        const geometry = new THREE.PlaneBufferGeometry(asset.data.texture.image.width, asset.data.texture.image.height);
        this.material.map = asset.data.texture;
        this.mesh = new THREE.Mesh(geometry, this.material);
        this.actor.threeObject.add(this.mesh);
        this.refreshScaleRatio();
        this.selectedTileActor.threeObject.visible = true;
    }
    select(x, y, width = 1, height = 1) {
        const ratio = this.asset.data.grid.width / this.asset.data.grid.height;
        this.selectedTileActor.setLocalPosition(new THREE.Vector3(x, -y / ratio, 2));
        this.selectedTileActor.setLocalScale(new THREE.Vector3(width, -height / ratio, 1));
    }
    refreshScaleRatio() {
        const scaleX = 1 / this.asset.data.grid.width;
        const scaleY = 1 / this.asset.data.grid.height;
        const scale = Math.max(scaleX, scaleY);
        this.mesh.scale.set(scale, scale, 1);
        const material = this.mesh.material;
        this.mesh.position.setX(material.map.image.width / 2 * scale);
        this.mesh.position.setY(-material.map.image.height / 2 * scale);
        this.mesh.updateMatrixWorld(false);
        this.select(0, 0);
    }
    _clearMesh() {
        if (this.mesh == null)
            return;
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();
        this.actor.threeObject.remove(this.mesh);
        this.mesh = null;
        this.selectedTileActor.threeObject.visible = false;
    }
    _destroy() {
        this._clearMesh();
        this.actor.gameInstance.destroyActor(this.gridRenderer.actor);
        this.actor.gameInstance.destroyActor(this.selectedTileActor);
        this.asset = null;
        super._destroy();
    }
    setIsLayerActive(active) { if (this.mesh != null)
        this.mesh.visible = active; }
}
/* tslint:disable:variable-name */
TileSetRenderer.Updater = TileSetRendererUpdater_1.default;
exports.default = TileSetRenderer;
