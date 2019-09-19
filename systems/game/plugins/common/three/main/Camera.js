"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Camera {
    constructor(root, canvas) {
        this.canvas = canvas;
        this.fov = 45;
        this.orthographicScale = 10;
        this.viewport = { x: 0, y: 0, width: 1, height: 1 };
        this.layers = [];
        this.depth = 0;
        this.nearClippingPlane = 0.1;
        this.farClippingPlane = 1000;
        this.setOrthographicMode(false);
        this.computeAspectRatio();
    }
    computeAspectRatio() {
        this.cachedRatio = (this.canvas.clientWidth * this.viewport.width) / (this.canvas.clientHeight * this.viewport.height);
        this.projectionNeedsUpdate = true;
        return this;
    }
    setOrthographicMode(isOrthographic) {
        this.isOrthographic = isOrthographic;
        if (this.isOrthographic) {
            this.threeCamera = new THREE.OrthographicCamera(-this.orthographicScale * this.cachedRatio / 2, this.orthographicScale * this.cachedRatio / 2, this.orthographicScale / 2, -this.orthographicScale / 2, this.nearClippingPlane, this.farClippingPlane);
        }
        else
            this.threeCamera = new THREE.PerspectiveCamera(this.fov, this.cachedRatio, this.nearClippingPlane, this.farClippingPlane);
        this.projectionNeedsUpdate = true;
        return this;
    }
    setFOV(fov) {
        this.fov = fov;
        if (!this.isOrthographic)
            this.projectionNeedsUpdate = true;
        return this;
    }
    setOrthographicScale(orthographicScale) {
        this.orthographicScale = orthographicScale;
        if (this.isOrthographic) {
            // NOTE: Apply immediately because it's used for ray calculation
            const orthographicCamera = this.threeCamera;
            orthographicCamera.left = -this.orthographicScale * this.cachedRatio / 2;
            orthographicCamera.right = this.orthographicScale * this.cachedRatio / 2;
            orthographicCamera.top = this.orthographicScale / 2;
            orthographicCamera.bottom = -this.orthographicScale / 2;
            this.threeCamera.updateProjectionMatrix();
        }
        return this;
    }
    getOrthographicScale() { return this.orthographicScale; }
    setViewport(x, y, width, height) {
        this.viewport.x = x;
        this.viewport.y = y;
        this.viewport.width = width;
        this.viewport.height = height;
        this.projectionNeedsUpdate = true;
        this.computeAspectRatio();
        return this;
    }
    getViewport() { return { x: this.viewport.x, y: this.viewport.y, width: this.viewport.width, height: this.viewport.height }; }
    setDepth(depth) {
        this.depth = depth;
        return this;
    }
    setNearClippingPlane(nearClippingPlane) {
        this.nearClippingPlane = nearClippingPlane;
        this.threeCamera.near = this.nearClippingPlane;
        this.projectionNeedsUpdate = true;
        return this;
    }
    setFarClippingPlane(farClippingPlane) {
        this.farClippingPlane = farClippingPlane;
        this.threeCamera.far = this.farClippingPlane;
        this.projectionNeedsUpdate = true;
        return this;
    }
    render(renderer, scene, channels) {
        if (this.projectionNeedsUpdate) {
            this.projectionNeedsUpdate = false;
            if (this.isOrthographic) {
                const orthographicCamera = this.threeCamera;
                orthographicCamera.left = -this.orthographicScale * this.cachedRatio / 2;
                orthographicCamera.right = this.orthographicScale * this.cachedRatio / 2;
                orthographicCamera.top = this.orthographicScale / 2;
                orthographicCamera.bottom = -this.orthographicScale / 2;
            }
            else {
                const perspectiveCamera = this.threeCamera;
                perspectiveCamera.fov = this.fov;
                perspectiveCamera.aspect = this.cachedRatio;
            }
            this.threeCamera.updateProjectionMatrix();
        }
        renderer.setViewport(this.viewport.x * this.canvas.width, (1 - this.viewport.y - this.viewport.height) * this.canvas.height, this.viewport.width * this.canvas.width, this.viewport.height * this.canvas.height);
        for (const channel of channels) {
            renderer.clearDepth();
            this.threeCamera.layers.set(channel);
            renderer.render(scene, this.threeCamera);
        }
    }
}
exports.default = Camera;
