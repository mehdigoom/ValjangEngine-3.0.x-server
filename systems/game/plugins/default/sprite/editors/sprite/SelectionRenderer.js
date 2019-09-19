"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const THREE = SupEngine.THREE;
class SelectionRenderer extends SupEngine.ActorComponent {
    constructor(actor) {
        super(actor, "SelectionRenderer");
        this.meshes = [];
    }
    setIsLayerActive(active) {
        for (const mesh of this.meshes)
            mesh.visible = active;
    }
    setup(width, height, start, end, frameOrder, framesPerDirection) {
        this.clearMesh();
        for (let i = start; i <= end; i++) {
            const geometry = new THREE.PlaneBufferGeometry(width, height);
            const material = new THREE.MeshBasicMaterial({
                color: 0x900090,
                alphaTest: 0.1,
                transparent: true,
                opacity: 0.5
            });
            const mesh = new THREE.Mesh(geometry, material);
            this.meshes.push(mesh);
            let x, y;
            if (frameOrder === "rows") {
                x = i % framesPerDirection;
                y = Math.floor(i / framesPerDirection);
            }
            else {
                x = Math.floor(i / framesPerDirection);
                y = i % framesPerDirection;
            }
            mesh.position.setX((x + 0.5) * width);
            mesh.position.setY(-(y + 0.5) * height);
            mesh.updateMatrixWorld(false);
            this.actor.threeObject.add(mesh);
        }
    }
    clearMesh() {
        for (const mesh of this.meshes) {
            mesh.geometry.dispose();
            mesh.material.dispose();
            this.actor.threeObject.remove(mesh);
        }
        this.meshes.length = 0;
    }
    _destroy() {
        this.clearMesh();
        super._destroy();
    }
}
exports.default = SelectionRenderer;
