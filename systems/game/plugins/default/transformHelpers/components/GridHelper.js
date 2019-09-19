"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const THREE = SupEngine.THREE;
class GridHelper extends SupEngine.ActorComponent {
    constructor(actor, size, step) {
        super(actor, "GridHelper");
        this.visible = true;
        this.setup(size, step);
    }
    setIsLayerActive(active) { this.gridHelper.visible = active && this.visible; }
    setup(size, step) {
        if (this.gridHelper != null) {
            this.actor.threeObject.remove(this.gridHelper);
            this.gridHelper.geometry.dispose();
            this.gridHelper.material.dispose();
        }
        const actualSize = Math.ceil(size / step) * step;
        this.gridHelper = new THREE.GridHelper(actualSize, actualSize / step * 2, new THREE.Color(1, 1, 1), new THREE.Color(1, 1, 1));
        this.gridHelper.material.transparent = true;
        this.gridHelper.material.opacity = 0.25;
        this.actor.threeObject.add(this.gridHelper);
        this.gridHelper.visible = this.visible;
        this.gridHelper.updateMatrixWorld(false);
    }
    setVisible(visible) {
        this.gridHelper.visible = this.visible = visible;
    }
}
exports.default = GridHelper;
