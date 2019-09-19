"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const THREE = require("three");
const ActorComponent_1 = require("../ActorComponent");
class Camera extends ActorComponent_1.default {
    constructor(actor) {
        super(actor, "Camera");
        this.fov = 45;
        this.orthographicScale = 10;
        this.viewport = { x: 0, y: 0, width: 1, height: 1 };
        this.layers = [];
        this.depth = 0;
        this.nearClippingPlane = 0.1;
        this.farClippingPlane = 1000;
        this.computeAspectRatio = () => {
            const canvas = this.actor.gameInstance.threeRenderer.domElement;
            this.cachedRatio = (canvas.clientWidth * this.viewport.width) / (canvas.clientHeight * this.viewport.height);
            this.projectionNeedsUpdate = true;
        };
        this.unifiedThreeCamera = {
            type: "perspective",
            matrixWorld: null,
            projectionMatrix: null,
            updateMatrixWorld: () => { }
        };
        this.setOrthographicMode(false);
        this.computeAspectRatio();
        this.actor.gameInstance.on("resize", this.computeAspectRatio);
    }
    _destroy() {
        this.actor.gameInstance.removeListener("resize", this.computeAspectRatio);
        const index = this.actor.gameInstance.renderComponents.indexOf(this);
        if (index !== -1)
            this.actor.gameInstance.renderComponents.splice(index, 1);
        this.threeCamera = null;
        super._destroy();
    }
    setIsLayerActive(active) { }
    setOrthographicMode(isOrthographic) {
        this.isOrthographic = isOrthographic;
        if (this.isOrthographic) {
            this.threeCamera = new THREE.OrthographicCamera(-this.orthographicScale * this.cachedRatio / 2, this.orthographicScale * this.cachedRatio / 2, this.orthographicScale / 2, -this.orthographicScale / 2, this.nearClippingPlane, this.farClippingPlane);
        }
        else
            this.threeCamera = new THREE.PerspectiveCamera(this.fov, this.cachedRatio, this.nearClippingPlane, this.farClippingPlane);
        this.unifiedThreeCamera.type = isOrthographic ? "orthographic" : "perspective";
        this.unifiedThreeCamera.matrixWorld = this.threeCamera.matrixWorld;
        this.unifiedThreeCamera.projectionMatrix = this.threeCamera.projectionMatrix;
        this.projectionNeedsUpdate = true;
    }
    setFOV(fov) {
        this.fov = fov;
        if (!this.isOrthographic)
            this.projectionNeedsUpdate = true;
    }
    setOrthographicScale(orthographicScale) {
        this.orthographicScale = orthographicScale;
        if (this.isOrthographic)
            this.projectionNeedsUpdate = true;
    }
    setViewport(x, y, width, height) {
        this.viewport.x = x;
        this.viewport.y = y;
        this.viewport.width = width;
        this.viewport.height = height;
        this.projectionNeedsUpdate = true;
        this.computeAspectRatio();
    }
    setDepth(depth) {
        this.depth = depth;
    }
    setNearClippingPlane(nearClippingPlane) {
        this.nearClippingPlane = nearClippingPlane;
        this.threeCamera.near = this.nearClippingPlane;
        this.projectionNeedsUpdate = true;
    }
    setFarClippingPlane(farClippingPlane) {
        this.farClippingPlane = farClippingPlane;
        this.threeCamera.far = this.farClippingPlane;
        this.projectionNeedsUpdate = true;
    }
    start() { this.actor.gameInstance.renderComponents.push(this); }
    render() {
        this.threeCamera.position.copy(this.actor.threeObject.getWorldPosition());
        this.threeCamera.quaternion.copy(this.actor.threeObject.getWorldQuaternion());
        if (this.projectionNeedsUpdate) {
            this.projectionNeedsUpdate = false;
            if (this.isOrthographic) {
                const orthographicCamera = this.threeCamera;
                orthographicCamera.left = -this.orthographicScale * this.cachedRatio / 2;
                orthographicCamera.right = this.orthographicScale * this.cachedRatio / 2;
                orthographicCamera.top = this.orthographicScale / 2;
                orthographicCamera.bottom = -this.orthographicScale / 2;
                orthographicCamera.updateProjectionMatrix();
            }
            else {
                const perspectiveCamera = this.threeCamera;
                perspectiveCamera.fov = this.fov;
                perspectiveCamera.aspect = this.cachedRatio;
                perspectiveCamera.updateProjectionMatrix();
            }
        }
        const canvas = this.actor.gameInstance.threeRenderer.domElement;
        this.actor.gameInstance.threeRenderer.setViewport(this.viewport.x * canvas.width, (1 - this.viewport.y - this.viewport.height) * canvas.height, this.viewport.width * canvas.width, this.viewport.height * canvas.height);
        if (this.layers.length > 0) {
            for (const layer of this.layers) {
                this.actor.gameInstance.setActiveLayer(layer);
                this.actor.gameInstance.threeRenderer.render(this.actor.gameInstance.threeScene, this.threeCamera);
            }
        }
        else {
            for (let layer = 0; layer < this.actor.gameInstance.layers.length; layer++) {
                this.actor.gameInstance.setActiveLayer(layer);
                this.actor.gameInstance.threeRenderer.render(this.actor.gameInstance.threeScene, this.threeCamera);
            }
        }
        this.actor.gameInstance.setActiveLayer(null);
    }
}
exports.default = Camera;
