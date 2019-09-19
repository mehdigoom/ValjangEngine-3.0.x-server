"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const THREE = require("three");
const ActorComponent_1 = require("../ActorComponent");
const tmpMovement = new THREE.Vector3();
const tmpQuaternion = new THREE.Quaternion();
const forwardVector = new THREE.Vector3(0, 1, 0);
class Camera3DControls extends ActorComponent_1.default {
    constructor(actor, camera) {
        super(actor, "Camera3DControls");
        this.movementSpeed = 0.2;
        this.camera = camera;
        this.rotation = actor.getLocalEulerAngles(new THREE.Euler());
    }
    setIsLayerActive(active) { }
    update() {
        const keyButtons = this.actor.gameInstance.input.keyboardButtons;
        const keyEvent = window.KeyEvent; // Workaround for unknown KeyEvent property on window object
        if (!keyButtons[keyEvent.DOM_VK_CONTROL].isDown) {
            tmpMovement.setX((keyButtons[keyEvent.DOM_VK_A].isDown || keyButtons[keyEvent.DOM_VK_Q].isDown) ? -this.movementSpeed :
                ((keyButtons[keyEvent.DOM_VK_D].isDown) ? this.movementSpeed :
                    0));
            tmpMovement.setZ((keyButtons[keyEvent.DOM_VK_W].isDown || keyButtons[keyEvent.DOM_VK_Z].isDown) ? -this.movementSpeed :
                ((keyButtons[keyEvent.DOM_VK_S].isDown) ? this.movementSpeed :
                    0));
            tmpMovement.setY((keyButtons[keyEvent.DOM_VK_SPACE].isDown) ? this.movementSpeed :
                ((keyButtons[keyEvent.DOM_VK_SHIFT].isDown) ? -this.movementSpeed :
                    0));
            tmpMovement.applyQuaternion(tmpQuaternion.setFromAxisAngle(forwardVector, this.rotation.y));
            this.actor.moveLocal(tmpMovement);
        }
        // Camera rotation
        if (this.actor.gameInstance.input.mouseButtons[1].isDown ||
            (this.actor.gameInstance.input.mouseButtons[0].isDown && keyButtons[keyEvent.DOM_VK_ALT].isDown)) {
            this.rotation.x = Math.min(Math.max(this.rotation.x - this.actor.gameInstance.input.mouseDelta.y / 250, -Math.PI / 2), Math.PI / 2);
            this.rotation.y -= this.actor.gameInstance.input.mouseDelta.x / 250;
            this.actor.setLocalEulerAngles(this.rotation);
        }
    }
}
exports.default = Camera3DControls;
