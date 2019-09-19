"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const THREE = SupEngine.THREE;
require("./TransformControls");
class TransformHandle extends SupEngine.ActorComponent {
    constructor(actor, threeCamera) {
        super(actor, "TransformHandle");
        this.mode = "translate";
        this.space = "world";
        this.controlVisible = false;
        this.control = new THREE.TransformControls(threeCamera, actor.gameInstance.threeRenderer.domElement);
        this.actor.gameInstance.threeScene.add(this.control);
    }
    setIsLayerActive(active) { this.control.visible = active && this.controlVisible; }
    update() {
        this.control.update();
        this.control.updateMatrixWorld(true);
    }
    setMode(mode) {
        this.mode = mode;
        if (this.target != null) {
            this.control.setMode(mode);
            this.control.setSpace(this.mode === "scale" ? "local" : this.space);
        }
    }
    setSpace(space) {
        this.space = space;
        if (this.target != null && this.mode !== "scale")
            this.control.setSpace(space);
    }
    setTarget(target) {
        this.target = target;
        if (this.target != null) {
            this.controlVisible = true;
            this.control.attach(this.actor.threeObject);
            this.control.setSpace(this.mode === "scale" ? "local" : this.space);
            this.control.setMode(this.mode);
            this.move();
        }
        else {
            this.controlVisible = false;
            this.control.detach();
        }
    }
    move() {
        this.actor.threeObject.position.copy(this.target.getWorldPosition());
        this.actor.threeObject.quaternion.copy(this.target.getWorldQuaternion());
        this.actor.threeObject.scale.copy(this.target.scale);
        this.actor.threeObject.updateMatrixWorld(false);
        this.control.update();
        this.control.updateMatrixWorld(true);
    }
    _destroy() {
        this.controlVisible = false;
        this.control.detach();
        this.actor.gameInstance.threeScene.remove(this.control);
        super._destroy();
    }
}
exports.default = TransformHandle;
