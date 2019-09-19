(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

},{}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class SelectionBoxRenderer {
    constructor(root) {
        this.mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0x00ffff, side: THREE.BackSide }));
        root.add(this.mesh);
    }
    setTarget(target) {
        this.target = target;
        this.mesh.visible = true;
        this.move();
        this.resize();
        return this;
    }
    move() {
        this.mesh.position.copy(this.target.getWorldPosition());
        this.mesh.quaternion.copy(this.target.getWorldQuaternion());
        this.mesh.updateMatrixWorld(false);
        return this;
    }
    resize() {
        const vec = new THREE.Vector3();
        const box = new THREE.Box3();
        const inverseTargetMatrixWorld = new THREE.Matrix4().compose(this.target.getWorldPosition(), this.target.getWorldQuaternion(), { x: 1, y: 1, z: 1 });
        inverseTargetMatrixWorld.getInverse(inverseTargetMatrixWorld);
        this.target.traverse((node) => {
            const geometry = node.geometry;
            if (geometry != null) {
                node.updateMatrixWorld(false);
                if (geometry instanceof THREE.Geometry) {
                    const vertices = geometry.vertices;
                    for (let i = 0, il = vertices.length; i < il; i++) {
                        vec.copy(vertices[i]).applyMatrix4(node.matrixWorld).applyMatrix4(inverseTargetMatrixWorld);
                        box.expandByPoint(vec);
                    }
                }
                else if (geometry instanceof THREE.BufferGeometry && geometry.attributes["position"] != null) {
                    const positions = geometry.attributes["position"].array;
                    for (let i = 0, il = positions.length; i < il; i += 3) {
                        vec.set(positions[i], positions[i + 1], positions[i + 2]);
                        vec.applyMatrix4(node.matrixWorld).applyMatrix4(inverseTargetMatrixWorld);
                        box.expandByPoint(vec);
                    }
                }
            }
        });
        const size = box.getSize();
        const thickness = 0.1;
        this.mesh.scale.copy(size).add(new THREE.Vector3(thickness, thickness, thickness));
        this.mesh.updateMatrixWorld(false);
        return this;
    }
    hide() {
        this.mesh.visible = false;
        return this;
    }
}
exports.default = SelectionBoxRenderer;

},{}],3:[function(require,module,exports){
"use strict";
/**
 * https://github.com/mrdoob/three.js/blob/master/examples/js/controls/TransformControls.js
 * Rewritten in TypeScript and modified by bilou84
 */
Object.defineProperty(exports, "__esModule", { value: true });
const TransformGizmos_1 = require("./TransformGizmos");
const ray = new THREE.Raycaster();
const pointerVector = new THREE.Vector2();
const point = new THREE.Vector3();
const offset = new THREE.Vector3();
const rotation = new THREE.Vector3();
const offsetRotation = new THREE.Vector3();
const lookAtMatrix = new THREE.Matrix4();
const eye = new THREE.Vector3();
const tempMatrix = new THREE.Matrix4();
const tempVector = new THREE.Vector3();
const tempQuaternion = new THREE.Quaternion();
const unitX = new THREE.Vector3(1, 0, 0);
const unitY = new THREE.Vector3(0, 1, 0);
const unitZ = new THREE.Vector3(0, 0, 1);
const quaternionXYZ = new THREE.Quaternion();
const quaternionX = new THREE.Quaternion();
const quaternionY = new THREE.Quaternion();
const quaternionZ = new THREE.Quaternion();
const quaternionE = new THREE.Quaternion();
const oldPosition = new THREE.Vector3();
const oldScale = new THREE.Vector3();
const oldRotationMatrix = new THREE.Matrix4();
const parentRotationMatrix = new THREE.Matrix4();
const parentScale = new THREE.Vector3();
const worldPosition = new THREE.Vector3();
const worldRotation = new THREE.Euler();
const worldRotationMatrix = new THREE.Matrix4();
const camPosition = new THREE.Vector3();
const camRotation = new THREE.Euler();
class TransformControls extends THREE.Object3D {
    constructor(scene, camera, domElement) {
        super();
        this.camera = camera;
        this.domElement = domElement;
        this.visible = false;
        this.root = new THREE.Object3D();
        this.externVisible = true;
        this.size = 1;
        this.mode = "translate";
        this.space = "local";
        this.dragging = false;
        this.disabled = true;
        this.gizmo = {
            "translate": new TransformGizmos_1.TransformGizmoTranslate(),
            "rotate": new TransformGizmos_1.TransformGizmoRotate(),
            "scale": new TransformGizmos_1.TransformGizmoScale(),
            "resize": new TransformGizmos_1.TransformGizmoResize()
        };
        this.changeEvent = { type: "change", target: null };
        this.mouseDownEvent = { type: "mouseDown", target: null };
        this.mouseUpEvent = { type: "mouseUp", mode: this.mode, target: null };
        this.objectChangeEvent = { type: "objectChange", target: null };
        this.onPointerDown = (event) => {
            if (this.target == null || this.dragging || (event.button != null && event.button !== 0) || event.altKey)
                return;
            const pointer = event.changedTouches ? event.changedTouches[0] : event;
            if (pointer.button === 0 || pointer.button == null) {
                const intersect = this.intersectObjects(pointer, this.gizmo[this.mode].pickersRoot.children);
                if (intersect != null) {
                    event.preventDefault();
                    event.stopPropagation();
                    this.dispatchEvent(this.mouseDownEvent);
                    this.axis = intersect.object.name;
                    this.update();
                    eye.copy(camPosition).sub(worldPosition).normalize();
                    this.gizmo[this.mode].setActivePlane(this.axis, eye);
                    const planeIntersect = this.intersectObjects(pointer, [this.gizmo[this.mode].activePlane]);
                    if (planeIntersect != null) {
                        oldPosition.copy(this.root.position);
                        oldScale.copy(this.root.scale);
                        oldRotationMatrix.extractRotation(this.root.matrix);
                        worldRotationMatrix.extractRotation(this.root.matrixWorld);
                        parentRotationMatrix.extractRotation(this.root.parent.matrixWorld);
                        parentScale.setFromMatrixScale(tempMatrix.getInverse(this.root.parent.matrixWorld));
                        offset.copy(planeIntersect.point);
                    }
                }
            }
            this.dragging = true;
        };
        this.onPointerHover = (event) => {
            if (this.target == null || this.dragging || (event.button != null && event.button !== 0))
                return;
            const pointer = event.changedTouches ? event.changedTouches[0] : event;
            let newAxis;
            const intersect = this.intersectObjects(pointer, this.gizmo[this.mode].pickersRoot.children);
            if (intersect != null) {
                newAxis = intersect.object.name;
                event.preventDefault();
            }
            if (this.axis !== newAxis) {
                this.axis = newAxis;
                this.update();
                this.dispatchEvent(this.changeEvent);
            }
        };
        this.onPointerMove = (event) => {
            if (this.target == null || this.axis == null || !this.dragging || (event.button != null && event.button !== 0))
                return;
            const pointer = event.changedTouches ? event.changedTouches[0] : event;
            const planeIntersect = this.intersectObjects(pointer, [this.gizmo[this.mode].activePlane]);
            if (planeIntersect == null)
                return;
            event.preventDefault();
            event.stopPropagation();
            point.copy(planeIntersect.point);
            switch (this.mode) {
                case "translate":
                    {
                        point.sub(offset);
                        point.multiply(parentScale);
                        if (this.space === "local") {
                            point.applyMatrix4(tempMatrix.getInverse(worldRotationMatrix));
                            if (this.axis.search("X") === -1)
                                point.x = 0;
                            if (this.axis.search("Y") === -1)
                                point.y = 0;
                            if (this.axis.search("Z") === -1)
                                point.z = 0;
                            point.applyMatrix4(oldRotationMatrix);
                            this.root.position.copy(oldPosition);
                            this.root.position.add(point);
                        }
                        if (this.space === "world" || this.axis.search("XYZ") !== -1) {
                            if (this.axis.search("X") === -1)
                                point.x = 0;
                            if (this.axis.search("Y") === -1)
                                point.y = 0;
                            if (this.axis.search("Z") === -1)
                                point.z = 0;
                            point.applyMatrix4(tempMatrix.getInverse(parentRotationMatrix));
                            this.root.position.copy(oldPosition);
                            this.root.position.add(point);
                        }
                        if (this.translationSnap !== null) {
                            if (this.space === "local")
                                this.root.position.sub(worldPosition).applyMatrix4(tempMatrix.getInverse(worldRotationMatrix));
                            if (this.axis.search("X") !== -1)
                                this.root.position.x = Math.round(this.root.position.x / this.translationSnap) * this.translationSnap;
                            if (this.axis.search("Y") !== -1)
                                this.root.position.y = Math.round(this.root.position.y / this.translationSnap) * this.translationSnap;
                            if (this.axis.search("Z") !== -1)
                                this.root.position.z = Math.round(this.root.position.z / this.translationSnap) * this.translationSnap;
                            if (this.space === "local")
                                this.root.position.applyMatrix4(worldRotationMatrix).add(worldPosition);
                        }
                    }
                    break;
                case "scale":
                    {
                        point.sub(offset);
                        point.multiply(parentScale);
                        if (this.axis === "XYZ") {
                            const scale = 1 + ((point.y) / Math.max(oldScale.x, oldScale.y, oldScale.z));
                            this.root.scale.x = oldScale.x * scale;
                            this.root.scale.y = oldScale.y * scale;
                            this.root.scale.z = oldScale.z * scale;
                        }
                        else {
                            point.applyMatrix4(tempMatrix.getInverse(worldRotationMatrix));
                            if (this.axis === "X")
                                this.root.scale.x = oldScale.x * (1 + point.x / oldScale.x);
                            if (this.axis === "Y")
                                this.root.scale.y = oldScale.y * (1 + point.y / oldScale.y);
                            if (this.axis === "Z")
                                this.root.scale.z = oldScale.z * (1 + point.z / oldScale.z);
                        }
                    }
                    break;
                case "resize":
                    {
                        point.sub(offset);
                        point.multiply(parentScale);
                        const multiplier = 16;
                        if (this.axis === "XYZ") {
                            const scale = 1 + ((point.y) / Math.max(oldScale.x, oldScale.y, oldScale.z) * multiplier);
                            this.root.scale.x = oldScale.x * scale;
                            this.root.scale.y = oldScale.y * scale;
                            this.root.scale.z = oldScale.z * scale;
                        }
                        else {
                            point.applyMatrix4(tempMatrix.getInverse(worldRotationMatrix));
                            if (this.axis === "X")
                                this.root.scale.x = oldScale.x * (1 + point.x / oldScale.x * multiplier);
                            if (this.axis === "Y")
                                this.root.scale.y = oldScale.y * (1 + point.y / oldScale.y * multiplier);
                            if (this.axis === "Z")
                                this.root.scale.z = oldScale.z * (1 + point.z / oldScale.z * multiplier);
                        }
                        this.root.scale.x = Math.round(Math.max(1, this.root.scale.x));
                        this.root.scale.y = Math.round(Math.max(1, this.root.scale.y));
                        this.root.scale.z = Math.round(Math.max(1, this.root.scale.z));
                    }
                    break;
                case "rotate":
                    {
                        point.sub(worldPosition);
                        point.multiply(parentScale);
                        tempVector.copy(offset).sub(worldPosition);
                        tempVector.multiply(parentScale);
                        if (this.axis === "E") {
                            point.applyMatrix4(tempMatrix.getInverse(lookAtMatrix));
                            tempVector.applyMatrix4(tempMatrix.getInverse(lookAtMatrix));
                            rotation.set(Math.atan2(point.z, point.y), Math.atan2(point.x, point.z), Math.atan2(point.y, point.x));
                            offsetRotation.set(Math.atan2(tempVector.z, tempVector.y), Math.atan2(tempVector.x, tempVector.z), Math.atan2(tempVector.y, tempVector.x));
                            tempQuaternion.setFromRotationMatrix(tempMatrix.getInverse(parentRotationMatrix));
                            quaternionE.setFromAxisAngle(eye, rotation.z - offsetRotation.z);
                            quaternionXYZ.setFromRotationMatrix(worldRotationMatrix);
                            tempQuaternion.multiplyQuaternions(tempQuaternion, quaternionE);
                            tempQuaternion.multiplyQuaternions(tempQuaternion, quaternionXYZ);
                            this.root.quaternion.copy(tempQuaternion);
                        }
                        else if (this.axis === "XYZE") {
                            quaternionE.setFromEuler(point.clone().cross(tempVector).normalize()); // rotation axis
                            tempQuaternion.setFromRotationMatrix(tempMatrix.getInverse(parentRotationMatrix));
                            quaternionX.setFromAxisAngle(quaternionE, -point.clone().angleTo(tempVector));
                            quaternionXYZ.setFromRotationMatrix(worldRotationMatrix);
                            tempQuaternion.multiplyQuaternions(tempQuaternion, quaternionX);
                            tempQuaternion.multiplyQuaternions(tempQuaternion, quaternionXYZ);
                            this.root.quaternion.copy(tempQuaternion);
                        }
                        else if (this.space === "local") {
                            point.applyMatrix4(tempMatrix.getInverse(worldRotationMatrix));
                            tempVector.applyMatrix4(tempMatrix.getInverse(worldRotationMatrix));
                            rotation.set(Math.atan2(point.z, point.y), Math.atan2(point.x, point.z), Math.atan2(point.y, point.x));
                            offsetRotation.set(Math.atan2(tempVector.z, tempVector.y), Math.atan2(tempVector.x, tempVector.z), Math.atan2(tempVector.y, tempVector.x));
                            quaternionXYZ.setFromRotationMatrix(oldRotationMatrix);
                            if (this.rotationSnap !== null) {
                                quaternionX.setFromAxisAngle(unitX, Math.round((rotation.x - offsetRotation.x) / this.rotationSnap) * this.rotationSnap);
                                quaternionY.setFromAxisAngle(unitY, Math.round((rotation.y - offsetRotation.y) / this.rotationSnap) * this.rotationSnap);
                                quaternionZ.setFromAxisAngle(unitZ, Math.round((rotation.z - offsetRotation.z) / this.rotationSnap) * this.rotationSnap);
                            }
                            else {
                                quaternionX.setFromAxisAngle(unitX, rotation.x - offsetRotation.x);
                                quaternionY.setFromAxisAngle(unitY, rotation.y - offsetRotation.y);
                                quaternionZ.setFromAxisAngle(unitZ, rotation.z - offsetRotation.z);
                            }
                            if (this.axis === "X")
                                quaternionXYZ.multiplyQuaternions(quaternionXYZ, quaternionX);
                            if (this.axis === "Y")
                                quaternionXYZ.multiplyQuaternions(quaternionXYZ, quaternionY);
                            if (this.axis === "Z")
                                quaternionXYZ.multiplyQuaternions(quaternionXYZ, quaternionZ);
                            this.root.quaternion.copy(quaternionXYZ);
                        }
                        else if (this.space === "world") {
                            rotation.set(Math.atan2(point.z, point.y), Math.atan2(point.x, point.z), Math.atan2(point.y, point.x));
                            offsetRotation.set(Math.atan2(tempVector.z, tempVector.y), Math.atan2(tempVector.x, tempVector.z), Math.atan2(tempVector.y, tempVector.x));
                            tempQuaternion.setFromRotationMatrix(tempMatrix.getInverse(parentRotationMatrix));
                            if (this.rotationSnap !== null) {
                                quaternionX.setFromAxisAngle(unitX, Math.round((rotation.x - offsetRotation.x) / this.rotationSnap) * this.rotationSnap);
                                quaternionY.setFromAxisAngle(unitY, Math.round((rotation.y - offsetRotation.y) / this.rotationSnap) * this.rotationSnap);
                                quaternionZ.setFromAxisAngle(unitZ, Math.round((rotation.z - offsetRotation.z) / this.rotationSnap) * this.rotationSnap);
                            }
                            else {
                                quaternionX.setFromAxisAngle(unitX, rotation.x - offsetRotation.x);
                                quaternionY.setFromAxisAngle(unitY, rotation.y - offsetRotation.y);
                                quaternionZ.setFromAxisAngle(unitZ, rotation.z - offsetRotation.z);
                            }
                            quaternionXYZ.setFromRotationMatrix(worldRotationMatrix);
                            if (this.axis === "X")
                                tempQuaternion.multiplyQuaternions(tempQuaternion, quaternionX);
                            if (this.axis === "Y")
                                tempQuaternion.multiplyQuaternions(tempQuaternion, quaternionY);
                            if (this.axis === "Z")
                                tempQuaternion.multiplyQuaternions(tempQuaternion, quaternionZ);
                            tempQuaternion.multiplyQuaternions(tempQuaternion, quaternionXYZ);
                            this.root.quaternion.copy(tempQuaternion);
                        }
                    }
                    break;
            }
            this.update(false);
            this.dispatchEvent(this.changeEvent);
            this.dispatchEvent(this.objectChangeEvent);
        };
        this.onPointerUp = (event) => {
            if (event.button != null && event.button !== 0 || event.altKey)
                return;
            if (this.dragging && (this.axis !== null)) {
                this.mouseUpEvent.mode = this.mode;
                this.dispatchEvent(this.mouseUpEvent);
            }
            this.dragging = false;
            this.onPointerHover(event);
        };
        scene.add(this);
        scene.add(this.root);
        for (const type in this.gizmo) {
            const gizmoObj = this.gizmo[type];
            gizmoObj.visible = (type === this.mode);
            this.add(gizmoObj);
        }
        this.enable();
    }
    dispose() {
        this.disable();
    }
    setVisible(visible) {
        this.externVisible = visible;
        this.visible = this.externVisible && this.target != null;
        return this;
    }
    attach(object) {
        this.target = object;
        this.visible = this.externVisible;
        this.update();
        return this;
    }
    detach() {
        this.target = null;
        this.visible = false;
        this.axis = null;
        return this;
    }
    getMode() { return this.mode; }
    setMode(mode) {
        this.mode = mode;
        for (const type in this.gizmo)
            this.gizmo[type].visible = (type === mode);
        if (this.target == null)
            return this;
        this.update();
        this.dispatchEvent(this.changeEvent);
        return this;
    }
    setSize(size) {
        this.size = size;
        if (this.target == null)
            return this;
        this.update();
        this.dispatchEvent(this.changeEvent);
        return this;
    }
    setSpace(space) {
        this.space = space;
        if (this.target == null)
            return this;
        this.update();
        this.dispatchEvent(this.changeEvent);
        return this;
    }
    enable() {
        if (!this.disabled)
            return this;
        this.domElement.addEventListener("mousedown", this.onPointerDown, false);
        this.domElement.addEventListener("touchstart", this.onPointerDown, false);
        this.domElement.addEventListener("mousemove", this.onPointerHover, false);
        this.domElement.addEventListener("touchmove", this.onPointerHover, false);
        this.domElement.addEventListener("mousemove", this.onPointerMove, false);
        this.domElement.addEventListener("touchmove", this.onPointerMove, false);
        this.domElement.addEventListener("mouseup", this.onPointerUp, false);
        this.domElement.addEventListener("mouseout", this.onPointerUp, false);
        this.domElement.addEventListener("touchend", this.onPointerUp, false);
        this.domElement.addEventListener("touchcancel", this.onPointerUp, false);
        this.domElement.addEventListener("touchleave", this.onPointerUp, false);
        this.dragging = false;
        this.disabled = false;
        for (const gizmoName in this.gizmo)
            this.gizmo[gizmoName].setDisabled(false);
        return this;
    }
    disable() {
        if (this.disabled)
            return this;
        this.domElement.removeEventListener("mousedown", this.onPointerDown);
        this.domElement.removeEventListener("touchstart", this.onPointerDown);
        this.domElement.removeEventListener("mousemove", this.onPointerHover);
        this.domElement.removeEventListener("touchmove", this.onPointerHover);
        this.domElement.removeEventListener("mousemove", this.onPointerMove);
        this.domElement.removeEventListener("touchmove", this.onPointerMove);
        this.domElement.removeEventListener("mouseup", this.onPointerUp);
        this.domElement.removeEventListener("mouseout", this.onPointerUp);
        this.domElement.removeEventListener("touchend", this.onPointerUp);
        this.domElement.removeEventListener("touchcancel", this.onPointerUp);
        this.domElement.removeEventListener("touchleave", this.onPointerUp);
        this.dragging = false;
        this.disabled = true;
        for (const gizmoName in this.gizmo)
            this.gizmo[gizmoName].setDisabled(true);
        return this;
    }
    update(copyTarget = true) {
        if (this.target == null)
            return;
        if (copyTarget) {
            this.root.position.copy(this.target.getWorldPosition());
            this.root.quaternion.copy(this.target.getWorldQuaternion());
            const width = this.target.userData.width;
            const height = this.target.userData.height;
            const depth = this.target.userData.depth;
            if (this.mode === "resize") {
                this.root.scale.x = Math.abs(width);
                this.root.scale.y = Math.abs(height);
                this.root.scale.z = Math.abs(depth);
            }
            else {
                this.root.scale.x = (width < 0 ? -1 : 1) * this.target.scale.x;
                this.root.scale.y = (height < 0 ? -1 : 1) * this.target.scale.y;
                this.root.scale.z = (depth < 0 ? -1 : 1) * this.target.scale.z;
            }
        }
        this.root.updateMatrixWorld(false);
        worldPosition.setFromMatrixPosition(this.root.matrixWorld);
        // NOTE: Workaround for negative scales messing with extracted rotation — elisee
        const scaleX = this.root.scale.x / Math.abs(this.root.scale.x);
        const scaleY = this.root.scale.y / Math.abs(this.root.scale.y);
        const scaleZ = this.root.scale.z / Math.abs(this.root.scale.z);
        const negativeScaleFixMatrix = new THREE.Matrix4().makeScale(scaleX, scaleY, scaleZ);
        worldRotation.setFromRotationMatrix(tempMatrix.extractRotation(this.root.matrixWorld).multiply(negativeScaleFixMatrix));
        this.camera.threeCamera.updateMatrixWorld(false);
        camPosition.setFromMatrixPosition(this.camera.threeCamera.matrixWorld);
        camRotation.setFromRotationMatrix(tempMatrix.extractRotation(this.camera.threeCamera.matrixWorld));
        const scale = worldPosition.distanceTo(camPosition) / 8 * this.size;
        this.position.copy(worldPosition);
        this.scale.set(scale, scale, scale);
        eye.copy(camPosition).sub(worldPosition).normalize();
        if (this.space === "local" || this.mode === "scale" || this.mode === "resize")
            this.gizmo[this.mode].update(worldRotation, eye);
        else if (this.space === "world")
            this.gizmo[this.mode].update(new THREE.Euler(), eye);
        if (!this.disabled)
            this.gizmo[this.mode].highlight(this.axis);
        this.updateMatrixWorld(true);
    }
    intersectObjects(pointer, objects) {
        const rect = this.domElement.getBoundingClientRect();
        const viewport = this.camera.getViewport();
        pointerVector.x = ((pointer.clientX - rect.left) / rect.width * 2 - 1) / viewport.width;
        pointerVector.y = -((pointer.clientY - rect.top) / rect.height * 2 - 1) / viewport.height;
        ray.setFromCamera(pointerVector, this.camera.threeCamera);
        const intersections = ray.intersectObjects(objects, true);
        return intersections[0];
    }
}
exports.default = TransformControls;

},{"./TransformGizmos":4}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lineRadius = 0.015;
const colors = {
    white: { enabled: 0xffffff, disabled: 0xffffff },
    red: { enabled: 0xe5432e, disabled: 0x646464 },
    green: { enabled: 0x5bd72f, disabled: 0xb0b0b0 },
    blue: { enabled: 0x3961d4, disabled: 0x606060 },
    yellow: { enabled: 0xffff00, disabled: 0xececec },
    cyan: { enabled: 0x00ffff, disabled: 0xc8c8c8 },
    magenta: { enabled: 0xff00ff, disabled: 0x484848 }
};
class GizmoMaterial extends THREE.MeshBasicMaterial {
    constructor(parameters) {
        super(parameters);
        this.transparent = true;
        this.setValues(parameters);
        this.enabledColor = this.color.clone();
        this.disabledColor = this.color.clone();
        this.oldOpacity = this.opacity;
    }
    setColor(colorName) {
        this.color.setHex(colors[colorName].enabled);
        this.enabledColor.setHex(colors[colorName].enabled);
        this.disabledColor.setHex(colors[colorName].disabled);
    }
    highlight(highlighted) {
        if (highlighted) {
            this.color.setRGB(1, 1, 0);
            this.opacity = 1;
        }
        else {
            this.color.copy(this.enabledColor);
            this.opacity = this.oldOpacity;
        }
    }
    setDisabled(disabled) {
        this.color.copy(disabled ? this.disabledColor : this.enabledColor);
    }
}
exports.GizmoMaterial = GizmoMaterial;
const pickerMaterial = new GizmoMaterial({ visible: false, transparent: false, side: THREE.DoubleSide });
class TransformGizmo extends THREE.Object3D {
    constructor() {
        super();
        this.planes = {};
        this.handlesRoot = new THREE.Object3D();
        this.pickersRoot = new THREE.Object3D();
        this.planesRoot = new THREE.Object3D();
        this.add(this.handlesRoot);
        this.add(this.pickersRoot);
        this.add(this.planesRoot);
        // Planes
        const planeGeometry = new THREE.PlaneBufferGeometry(50, 50, 2, 2);
        const planeMaterial = new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide });
        const planes = {
            "XY": new THREE.Mesh(planeGeometry, planeMaterial),
            "YZ": new THREE.Mesh(planeGeometry, planeMaterial),
            "XZ": new THREE.Mesh(planeGeometry, planeMaterial),
            "XYZE": new THREE.Mesh(planeGeometry, planeMaterial)
        };
        this.activePlane = planes["XYZE"];
        planes["YZ"].rotation.set(0, Math.PI / 2, 0);
        planes["XZ"].rotation.set(-Math.PI / 2, 0, 0);
        for (const planeName in planes) {
            planes[planeName].name = planeName;
            this.planesRoot.add(planes[planeName]);
            this.planes[planeName] = planes[planeName];
        }
        // Handles and Pickers
        this.initGizmos();
        // Reset Transformations
        this.traverse((child) => {
            child.layers.set(1);
            if (child instanceof THREE.Mesh) {
                child.updateMatrix();
                const tempGeometry = child.geometry.clone();
                tempGeometry.applyMatrix(child.matrix);
                child.geometry = tempGeometry;
                child.position.set(0, 0, 0);
                child.rotation.set(0, 0, 0);
                child.scale.set(1, 1, 1);
            }
        });
    }
    highlight(axis) {
        this.traverse((child) => {
            if (child.material != null && child.material.highlight != null) {
                child.material.highlight(child.name === axis);
            }
        });
    }
    setDisabled(disabled) {
        this.traverse((child) => {
            if (child.material != null && child.material.setDisabled != null) {
                child.material.setDisabled(disabled);
            }
        });
    }
    setupGizmo(name, object, parent, position, rotation, colorName) {
        object.name = name;
        if (position != null)
            object.position.set(position[0], position[1], position[2]);
        if (rotation != null)
            object.rotation.set(rotation[0], rotation[1], rotation[2]);
        if (colorName != null)
            object.material.setColor(colorName);
        parent.add(object);
    }
    update(rotation, eye) {
        const vec1 = new THREE.Vector3(0, 0, 0);
        const vec2 = new THREE.Vector3(0, 1, 0);
        const lookAtMatrix = new THREE.Matrix4();
        this.traverse(function (child) {
            if (child.name.search("E") !== -1) {
                child.quaternion.setFromRotationMatrix(lookAtMatrix.lookAt(eye, vec1, vec2));
            }
            else if (child.name.search("X") !== -1 || child.name.search("Y") !== -1 || child.name.search("Z") !== -1) {
                child.quaternion.setFromEuler(rotation);
            }
        });
    }
}
exports.TransformGizmo = TransformGizmo;
class TransformGizmoTranslate extends TransformGizmo {
    initGizmos() {
        // Handles
        const geometry = new THREE.CylinderGeometry(0, 0.06, 0.2, 12, 1, false);
        const mesh = new THREE.Mesh(geometry);
        mesh.position.y = 0.5;
        mesh.updateMatrix();
        const arrowGeometry = new THREE.Geometry();
        arrowGeometry.merge(geometry, mesh.matrix);
        const lineGeometry = new THREE.CylinderGeometry(lineRadius, lineRadius, 1);
        this.setupGizmo("X", new THREE.Mesh(arrowGeometry, new GizmoMaterial()), this.handlesRoot, [0.5, 0, 0], [0, 0, -Math.PI / 2], "red");
        this.setupGizmo("X", new THREE.Mesh(lineGeometry, new GizmoMaterial()), this.handlesRoot, [0.5, 0, 0], [0, 0, -Math.PI / 2], "red");
        this.setupGizmo("Y", new THREE.Mesh(arrowGeometry, new GizmoMaterial()), this.handlesRoot, [0, 0.5, 0], null, "green");
        this.setupGizmo("Y", new THREE.Mesh(lineGeometry, new GizmoMaterial()), this.handlesRoot, [0, 0.5, 0], null, "green");
        this.setupGizmo("Z", new THREE.Mesh(arrowGeometry, new GizmoMaterial()), this.handlesRoot, [0, 0, 0.5], [Math.PI / 2, 0, 0], "blue");
        this.setupGizmo("Z", new THREE.Mesh(lineGeometry, new GizmoMaterial()), this.handlesRoot, [0, 0, 0.5], [Math.PI / 2, 0, 0], "blue");
        const handlePlaneGeometry = new THREE.PlaneBufferGeometry(0.29, 0.29);
        this.setupGizmo("XY", new THREE.Mesh(handlePlaneGeometry, new GizmoMaterial({ opacity: 0.5, side: THREE.DoubleSide })), this.handlesRoot, [0.15, 0.15, 0], null, "yellow");
        this.setupGizmo("YZ", new THREE.Mesh(handlePlaneGeometry, new GizmoMaterial({ opacity: 0.5, side: THREE.DoubleSide })), this.handlesRoot, [0, 0.15, 0.15], [0, Math.PI / 2, 0], "cyan");
        this.setupGizmo("XZ", new THREE.Mesh(handlePlaneGeometry, new GizmoMaterial({ opacity: 0.5, side: THREE.DoubleSide })), this.handlesRoot, [0.15, 0, 0.15], [-Math.PI / 2, 0, 0], "magenta");
        this.setupGizmo("XYZ", new THREE.Mesh(new THREE.OctahedronGeometry(0.1, 0), new GizmoMaterial({ opacity: 0.8 })), this.handlesRoot, [0, 0, 0], [0, 0, 0], "white");
        // Pickers
        this.setupGizmo("X", new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0, 1, 4, 1, false), pickerMaterial), this.pickersRoot, [0.6, 0, 0], [0, 0, -Math.PI / 2]);
        this.setupGizmo("Y", new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0, 1, 4, 1, false), pickerMaterial), this.pickersRoot, [0, 0.6, 0]);
        this.setupGizmo("Z", new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0, 1, 4, 1, false), pickerMaterial), this.pickersRoot, [0, 0, 0.6], [Math.PI / 2, 0, 0]);
        this.setupGizmo("XY", new THREE.Mesh(new THREE.PlaneBufferGeometry(0.4, 0.4), pickerMaterial), this.pickersRoot, [0.2, 0.2, 0]);
        this.setupGizmo("YZ", new THREE.Mesh(new THREE.PlaneBufferGeometry(0.4, 0.4), pickerMaterial), this.pickersRoot, [0, 0.2, 0.2], [0, Math.PI / 2, 0]);
        this.setupGizmo("XZ", new THREE.Mesh(new THREE.PlaneBufferGeometry(0.4, 0.4), pickerMaterial), this.pickersRoot, [0.2, 0, 0.2], [-Math.PI / 2, 0, 0]);
        this.setupGizmo("XYZ", new THREE.Mesh(new THREE.OctahedronGeometry(0.2, 0), pickerMaterial), this.pickersRoot);
    }
    setActivePlane(axis, eye) {
        const tempMatrix = new THREE.Matrix4();
        eye.applyMatrix4(tempMatrix.getInverse(tempMatrix.extractRotation(this.planes["XY"].matrixWorld)));
        switch (axis) {
            case "X":
                if (Math.abs(eye.y) > Math.abs(eye.z))
                    this.activePlane = this.planes["XZ"];
                else
                    this.activePlane = this.planes["XY"];
                break;
            case "Y":
                if (Math.abs(eye.x) > Math.abs(eye.z))
                    this.activePlane = this.planes["YZ"];
                else
                    this.activePlane = this.planes["XY"];
                break;
            case "Z":
                if (Math.abs(eye.x) > Math.abs(eye.y))
                    this.activePlane = this.planes["YZ"];
                else
                    this.activePlane = this.planes["XZ"];
                break;
            case "XYZ":
                this.activePlane = this.planes["XYZE"];
                break;
            case "XY":
            case "YZ":
            case "XZ":
                this.activePlane = this.planes[axis];
                break;
        }
    }
}
exports.TransformGizmoTranslate = TransformGizmoTranslate;
class TransformGizmoRotate extends TransformGizmo {
    initGizmos() {
        const radius = 0.7;
        const globalRadius = radius * 1.2;
        // Handles
        const ringGeometry = new THREE.TorusGeometry(radius, lineRadius, 4, 32);
        this.setupGizmo("X", new THREE.Mesh(ringGeometry, new GizmoMaterial({ side: THREE.DoubleSide })), this.handlesRoot, null, [0, -Math.PI / 2, -Math.PI / 2], "red");
        this.setupGizmo("Y", new THREE.Mesh(ringGeometry, new GizmoMaterial({ side: THREE.DoubleSide })), this.handlesRoot, null, [Math.PI / 2, 0, 0], "green");
        this.setupGizmo("Z", new THREE.Mesh(ringGeometry, new GizmoMaterial({ side: THREE.DoubleSide })), this.handlesRoot, null, [0, 0, -Math.PI / 2], "blue");
        const globalRingGeometry = new THREE.RingGeometry(globalRadius - lineRadius, globalRadius + lineRadius, 32, 8);
        this.setupGizmo("E", new THREE.Mesh(globalRingGeometry, new GizmoMaterial({ opacity: 0.8, side: THREE.DoubleSide })), this.handlesRoot, null, null, "white");
        // Pickers
        const pickerThickness = 0.08;
        const torusGeometry = new THREE.TorusGeometry(radius, lineRadius * 2, 4, 16);
        this.setupGizmo("X", new THREE.Mesh(torusGeometry, pickerMaterial), this.pickersRoot, null, [0, -Math.PI / 2, -Math.PI / 2]);
        this.setupGizmo("Y", new THREE.Mesh(torusGeometry, pickerMaterial), this.pickersRoot, null, [Math.PI / 2, 0, 0]);
        this.setupGizmo("Z", new THREE.Mesh(torusGeometry, pickerMaterial), this.pickersRoot, null, [0, 0, -Math.PI / 2]);
        const globalTorusGeometry = new THREE.RingGeometry(globalRadius - pickerThickness, globalRadius + pickerThickness, 16, 8);
        this.setupGizmo("E", new THREE.Mesh(globalTorusGeometry, pickerMaterial), this.pickersRoot);
    }
    setActivePlane(axis) {
        if (axis === "X")
            this.activePlane = this.planes["YZ"];
        else if (axis === "Y")
            this.activePlane = this.planes["XZ"];
        else if (axis === "Z")
            this.activePlane = this.planes["XY"];
        else if (axis === "E")
            this.activePlane = this.planes["XYZE"];
    }
}
exports.TransformGizmoRotate = TransformGizmoRotate;
class TransformGizmoScale extends TransformGizmo {
    initGizmos() {
        // Handles
        const geometry = new THREE.BoxGeometry(0.125, 0.125, 0.125);
        const mesh = new THREE.Mesh(geometry);
        mesh.position.y = 0.5;
        mesh.updateMatrix();
        const arrowGeometry = new THREE.Geometry();
        arrowGeometry.merge(geometry, mesh.matrix);
        const lineGeometry = new THREE.CylinderGeometry(lineRadius, lineRadius, 1);
        this.setupGizmo("X", new THREE.Mesh(arrowGeometry, new GizmoMaterial()), this.handlesRoot, [0.5, 0, 0], [0, 0, -Math.PI / 2], "red");
        this.setupGizmo("X", new THREE.Mesh(lineGeometry, new GizmoMaterial()), this.handlesRoot, [0.5, 0, 0], [0, 0, -Math.PI / 2], "red");
        this.setupGizmo("Y", new THREE.Mesh(arrowGeometry, new GizmoMaterial()), this.handlesRoot, [0, 0.5, 0], null, "green");
        this.setupGizmo("Y", new THREE.Mesh(lineGeometry, new GizmoMaterial()), this.handlesRoot, [0, 0.5, 0], null, "green");
        this.setupGizmo("Z", new THREE.Mesh(arrowGeometry, new GizmoMaterial()), this.handlesRoot, [0, 0, 0.5], [Math.PI / 2, 0, 0], "blue");
        this.setupGizmo("Z", new THREE.Mesh(lineGeometry, new GizmoMaterial()), this.handlesRoot, [0, 0, 0.5], [Math.PI / 2, 0, 0], "blue");
        this.setupGizmo("XYZ", new THREE.Mesh(new THREE.OctahedronGeometry(0.1, 0), new GizmoMaterial({ opacity: 0.8 })), this.handlesRoot, [0, 0, 0], [0, 0, 0], "white");
        // Pickers
        this.setupGizmo("X", new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0, 1, 4, 1, false), pickerMaterial), this.pickersRoot, [0.6, 0, 0], [0, 0, -Math.PI / 2]);
        this.setupGizmo("Y", new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0, 1, 4, 1, false), pickerMaterial), this.pickersRoot, [0, 0.6, 0]);
        this.setupGizmo("Z", new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0, 1, 4, 1, false), pickerMaterial), this.pickersRoot, [0, 0, 0.6], [Math.PI / 2, 0, 0]);
        this.setupGizmo("XYZ", new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), pickerMaterial), this.pickersRoot);
    }
    setActivePlane(axis, eye) {
        const tempMatrix = new THREE.Matrix4();
        eye.applyMatrix4(tempMatrix.getInverse(tempMatrix.extractRotation(this.planes["XY"].matrixWorld)));
        if (axis === "X") {
            if (Math.abs(eye.y) > Math.abs(eye.z))
                this.activePlane = this.planes["XZ"];
            else
                this.activePlane = this.planes["XY"];
        }
        else if (axis === "Y") {
            if (Math.abs(eye.x) > Math.abs(eye.z))
                this.activePlane = this.planes["YZ"];
            else
                this.activePlane = this.planes["XY"];
        }
        else if (axis === "Z") {
            if (Math.abs(eye.x) > Math.abs(eye.y))
                this.activePlane = this.planes["YZ"];
            else
                this.activePlane = this.planes["XZ"];
        }
        else if (axis === "XYZ")
            this.activePlane = this.planes["XYZE"];
    }
}
exports.TransformGizmoScale = TransformGizmoScale;
class TransformGizmoResize extends TransformGizmo {
    initGizmos() {
        // Handles
        const geometry = new THREE.BoxGeometry(0.2, 0.03, 0.2);
        const mesh = new THREE.Mesh(geometry);
        mesh.position.y = 0.5;
        mesh.updateMatrix();
        const arrowGeometry = new THREE.Geometry();
        arrowGeometry.merge(geometry, mesh.matrix);
        const lineGeometry = new THREE.CylinderGeometry(lineRadius, lineRadius, 1);
        this.setupGizmo("X", new THREE.Mesh(arrowGeometry, new GizmoMaterial()), this.handlesRoot, [0.5, 0, 0], [0, 0, -Math.PI / 2], "red");
        this.setupGizmo("X", new THREE.Mesh(lineGeometry, new GizmoMaterial()), this.handlesRoot, [0.5, 0, 0], [0, 0, -Math.PI / 2], "red");
        this.setupGizmo("Y", new THREE.Mesh(arrowGeometry, new GizmoMaterial()), this.handlesRoot, [0, 0.5, 0], null, "green");
        this.setupGizmo("Y", new THREE.Mesh(lineGeometry, new GizmoMaterial()), this.handlesRoot, [0, 0.5, 0], null, "green");
        this.setupGizmo("Z", new THREE.Mesh(arrowGeometry, new GizmoMaterial()), this.handlesRoot, [0, 0, 0.5], [Math.PI / 2, 0, 0], "blue");
        this.setupGizmo("Z", new THREE.Mesh(lineGeometry, new GizmoMaterial()), this.handlesRoot, [0, 0, 0.5], [Math.PI / 2, 0, 0], "blue");
        this.setupGizmo("XYZ", new THREE.Mesh(new THREE.OctahedronGeometry(0.1, 0), new GizmoMaterial({ opacity: 0.8 })), this.handlesRoot, [0, 0, 0], [0, 0, 0], "white");
        // Pickers
        this.setupGizmo("X", new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0, 1, 4, 1, false), pickerMaterial), this.pickersRoot, [0.6, 0, 0], [0, 0, -Math.PI / 2]);
        this.setupGizmo("Y", new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0, 1, 4, 1, false), pickerMaterial), this.pickersRoot, [0, 0.6, 0]);
        this.setupGizmo("Z", new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0, 1, 4, 1, false), pickerMaterial), this.pickersRoot, [0, 0, 0.6], [Math.PI / 2, 0, 0]);
        this.setupGizmo("XYZ", new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), pickerMaterial), this.pickersRoot);
    }
    setActivePlane(axis, eye) {
        const tempMatrix = new THREE.Matrix4();
        eye.applyMatrix4(tempMatrix.getInverse(tempMatrix.extractRotation(this.planes["XY"].matrixWorld)));
        if (axis === "X") {
            if (Math.abs(eye.y) > Math.abs(eye.z))
                this.activePlane = this.planes["XZ"];
            else
                this.activePlane = this.planes["XY"];
        }
        else if (axis === "Y") {
            if (Math.abs(eye.x) > Math.abs(eye.z))
                this.activePlane = this.planes["YZ"];
            else
                this.activePlane = this.planes["XY"];
        }
        else if (axis === "Z") {
            if (Math.abs(eye.x) > Math.abs(eye.y))
                this.activePlane = this.planes["YZ"];
            else
                this.activePlane = this.planes["XZ"];
        }
        else if (axis === "XYZ")
            this.activePlane = this.planes["XYZE"];
    }
}
exports.TransformGizmoResize = TransformGizmoResize;

},{}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class TransformMarker {
    constructor(root) {
        const geometry = new THREE.Geometry();
        geometry.vertices.push(new THREE.Vector3(-0.25, 0, 0), new THREE.Vector3(0.25, 0, 0), new THREE.Vector3(0, -0.25, 0), new THREE.Vector3(0, 0.25, 0), new THREE.Vector3(0, 0, -0.25), new THREE.Vector3(0, 0, 0.25));
        this.line = new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.25, transparent: true }));
        this.line.layers.set(1);
        root.add(this.line);
        this.line.updateMatrixWorld(false);
    }
    move(target) {
        this.line.visible = true;
        this.line.position.copy(target.getWorldPosition());
        this.line.quaternion.copy(target.getWorldQuaternion());
        this.line.updateMatrixWorld(false);
        return this;
    }
    hide() {
        this.line.visible = false;
        return this;
    }
}
exports.default = TransformMarker;

},{}],6:[function(require,module,exports){
(function (global){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const GridHelper_1 = require("./GridHelper");
const SelectionBoxRenderer_1 = require("./SelectionBoxRenderer");
const TransformControls_1 = require("./TransformControls");
const TransformMarker_1 = require("./TransformMarker");
const TransformGizmos_1 = require("./TransformGizmos");
global.SupTHREE.GridHelper = GridHelper_1.default;
global.SupTHREE.SelectionBoxRenderer = SelectionBoxRenderer_1.default;
global.SupTHREE.TransformControls = TransformControls_1.default;
global.SupTHREE.TransformMarker = TransformMarker_1.default;
global.SupTHREE.GizmoMaterial = TransformGizmos_1.GizmoMaterial;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./GridHelper":1,"./SelectionBoxRenderer":2,"./TransformControls":3,"./TransformGizmos":4,"./TransformMarker":5}]},{},[6]);
