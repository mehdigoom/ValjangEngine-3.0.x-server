"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const THREE = require("three");
const tmpMatrix = new THREE.Matrix4();
const tmpVector3 = new THREE.Vector3();
const tmpQuaternion = new THREE.Quaternion();
class Actor {
    constructor(gameInstance, name, parent, options) {
        this.children = [];
        this.components = [];
        this.layer = 0;
        this.pendingForDestruction = false;
        this.threeObject = new THREE.Object3D;
        this.gameInstance = gameInstance;
        this.name = name;
        if (parent != null && parent.pendingForDestruction)
            throw new Error("The parent passed to new SupEngine.Actor() has been destroyed and cannot be used as a parent.");
        this.parent = parent;
        this.threeObject.name = name;
        this.threeObject.userData.isActor = true;
        if (this.parent != null) {
            this.parent.children.push(this);
            this.parent.threeObject.add(this.threeObject);
            this.threeObject.updateMatrixWorld(false);
        }
        else {
            this.gameInstance.tree.root.push(this);
            this.gameInstance.threeScene.add(this.threeObject);
        }
        if (options != null) {
            if (options.visible === false)
                this.threeObject.visible = false;
            if (options.layer != null)
                this.layer = options.layer;
        }
    }
    awake() { for (const component of this.components.slice()) {
        component.awake();
    } }
    setActiveLayer(layer) {
        const active = layer == null || this.layer === layer;
        for (const component of this.components)
            component.setIsLayerActive(active);
    }
    update() {
        if (this.pendingForDestruction)
            return;
        for (const component of this.components.slice()) {
            if (!component.pendingForDestruction)
                component.update();
        }
    }
    // Transform
    getGlobalMatrix(matrix) { return matrix.copy(this.threeObject.matrixWorld); }
    getGlobalPosition(position) { return position.setFromMatrixPosition(this.threeObject.matrixWorld); }
    getGlobalOrientation(orientation) { return orientation.set(0, 0, 0, 1).multiplyQuaternions(this.getParentGlobalOrientation(tmpQuaternion), this.threeObject.quaternion); }
    getGlobalEulerAngles(angles) { return angles.setFromQuaternion(this.getGlobalOrientation(tmpQuaternion)); }
    getLocalPosition(position) { return position.copy(this.threeObject.position); }
    getLocalOrientation(orientation) { return orientation.copy(this.threeObject.quaternion); }
    getLocalEulerAngles(angles) { return angles.setFromQuaternion(this.threeObject.quaternion); }
    getLocalScale(scale) { return scale.copy(this.threeObject.scale); }
    getParentGlobalOrientation(orientation) {
        let ancestorOrientation = new THREE.Quaternion();
        let ancestorActor = this.threeObject;
        while (ancestorActor.parent != null) {
            ancestorActor = ancestorActor.parent;
            ancestorOrientation.multiplyQuaternions(ancestorActor.quaternion, ancestorOrientation);
        }
        return ancestorOrientation;
    }
    setGlobalMatrix(matrix) {
        matrix.multiplyMatrices(new THREE.Matrix4().getInverse(this.threeObject.parent.matrixWorld), matrix);
        matrix.decompose(this.threeObject.position, this.threeObject.quaternion, this.threeObject.scale);
        this.threeObject.updateMatrixWorld(false);
    }
    setGlobalPosition(pos) {
        this.threeObject.parent.worldToLocal(pos);
        this.threeObject.position.set(pos.x, pos.y, pos.z);
        this.threeObject.updateMatrixWorld(false);
    }
    setLocalPosition(pos) {
        this.threeObject.position.copy(pos);
        this.threeObject.updateMatrixWorld(false);
    }
    lookAt(target, up = this.threeObject.up) {
        const m = new THREE.Matrix4();
        m.lookAt(this.getGlobalPosition(tmpVector3), target, up);
        this.setGlobalOrientation(tmpQuaternion.setFromRotationMatrix(m));
    }
    lookTowards(direction, up) {
        this.lookAt(this.getGlobalPosition(tmpVector3).sub(direction), up);
    }
    setLocalOrientation(quaternion) {
        this.threeObject.quaternion.copy(quaternion);
        this.threeObject.updateMatrixWorld(false);
    }
    setGlobalOrientation(quaternion) {
        const inverseParentQuaternion = new THREE.Quaternion().setFromRotationMatrix(tmpMatrix.extractRotation(this.threeObject.parent.matrixWorld)).inverse();
        quaternion.multiplyQuaternions(inverseParentQuaternion, quaternion);
        this.threeObject.quaternion.copy(quaternion);
        this.threeObject.updateMatrixWorld(false);
    }
    setLocalEulerAngles(eulerAngles) {
        this.threeObject.quaternion.setFromEuler(eulerAngles);
        this.threeObject.updateMatrixWorld(false);
    }
    setGlobalEulerAngles(eulerAngles) {
        const globalQuaternion = new THREE.Quaternion().setFromEuler(eulerAngles);
        const inverseParentQuaternion = new THREE.Quaternion().setFromRotationMatrix(tmpMatrix.extractRotation(this.threeObject.parent.matrixWorld)).inverse();
        globalQuaternion.multiplyQuaternions(inverseParentQuaternion, globalQuaternion);
        this.threeObject.quaternion.copy(globalQuaternion);
        this.threeObject.updateMatrixWorld(false);
    }
    setLocalScale(scale) {
        this.threeObject.scale.copy(scale);
        this.threeObject.updateMatrixWorld(false);
    }
    setParent(newParent, keepLocal = false) {
        if (this.pendingForDestruction)
            throw new Error("Cannot set parent of destroyed actor");
        if (newParent != null && newParent.pendingForDestruction)
            throw new Error("Cannot reparent actor to destroyed actor");
        if (!keepLocal)
            this.getGlobalMatrix(tmpMatrix);
        const oldSiblings = (this.parent != null) ? this.parent.children : this.gameInstance.tree.root;
        oldSiblings.splice(oldSiblings.indexOf(this), 1);
        this.threeObject.parent.remove(this.threeObject);
        this.parent = newParent;
        const siblings = (newParent != null) ? newParent.children : this.gameInstance.tree.root;
        siblings.push(this);
        const threeParent = (newParent != null) ? newParent.threeObject : this.gameInstance.threeScene;
        threeParent.add(this.threeObject);
        if (!keepLocal)
            this.setGlobalMatrix(tmpMatrix);
        else
            this.threeObject.updateMatrixWorld(false);
    }
    rotateGlobal(quaternion) {
        this.getGlobalOrientation(tmpQuaternion);
        tmpQuaternion.multiplyQuaternions(quaternion, tmpQuaternion);
        this.setGlobalOrientation(tmpQuaternion);
    }
    rotateLocal(quaternion) {
        this.threeObject.quaternion.multiplyQuaternions(quaternion, this.threeObject.quaternion);
        this.threeObject.updateMatrixWorld(false);
    }
    rotateGlobalEulerAngles(eulerAngles) {
        const quaternion = new THREE.Quaternion().setFromEuler(eulerAngles);
        this.rotateGlobal(quaternion);
    }
    rotateLocalEulerAngles(eulerAngles) {
        const quaternion = new THREE.Quaternion().setFromEuler(eulerAngles);
        this.threeObject.quaternion.multiplyQuaternions(quaternion, this.threeObject.quaternion);
        this.threeObject.updateMatrixWorld(false);
    }
    moveGlobal(offset) {
        this.getGlobalPosition(tmpVector3).add(offset);
        this.setGlobalPosition(tmpVector3);
    }
    moveLocal(offset) {
        this.threeObject.position.add(offset);
        this.threeObject.updateMatrixWorld(false);
    }
    moveOriented(offset) {
        offset.applyQuaternion(this.threeObject.quaternion);
        this.threeObject.position.add(offset);
        this.threeObject.updateMatrixWorld(false);
    }
    _destroy() {
        while (this.components.length > 0)
            this.components[0]._destroy();
        this.components = null;
        if (this.parent != null) {
            this.parent.threeObject.remove(this.threeObject);
            this.parent.children.splice(this.parent.children.indexOf(this), 1);
            this.parent = null;
        }
        else {
            this.gameInstance.tree.root.splice(this.gameInstance.tree.root.indexOf(this), 1);
            this.gameInstance.threeScene.remove(this.threeObject);
        }
        this.threeObject = null;
        const outer = this.__outer;
        if (outer != null)
            outer.__inner = null;
        this.gameInstance = null;
    }
    _markDestructionPending() {
        this.pendingForDestruction = true;
        for (const child of this.children)
            child._markDestructionPending();
    }
}
exports.default = Actor;
