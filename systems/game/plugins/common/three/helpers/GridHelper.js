"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class GridHelper {
    constructor(root, size, step) {
        this.root = root;
        this.setup(size, step);
    }
    setup(size, step) {
        if (this.gridHelper != null) {
            this.root.remove(this.gridHelper);
            this.gridHelper.geometry.dispose();
            this.gridHelper.material.dispose();
        }
        const divisions = Math.ceil(size / step);
        const actualSize = divisions * step;
        this.gridHelper = new THREE.GridHelper(actualSize, divisions, 0xffffff, 0xffffff);
        this.gridHelper.material.transparent = true;
        this.gridHelper.material.opacity = 0.25;
        this.root.add(this.gridHelper);
        this.gridHelper.updateMatrixWorld(false);
        return this;
    }
    setVisible(visible) {
        this.gridHelper.visible = visible;
        return this;
    }
}
exports.default = GridHelper;
