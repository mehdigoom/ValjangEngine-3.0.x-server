"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Camera2DControls {
    constructor(camera, canvas, options) {
        this.camera = camera;
        this.canvas = canvas;
        this.mousePosition = new THREE.Vector3(0, 0, 0);
        this.multiplier = 1;
        this.isMoving = false;
        this.onMouseDown = (event) => {
            if (event.button === 1 || (event.button === 0 && event.altKey))
                this.isMoving = true;
        };
        this.onMouseUp = (event) => {
            if (event.button === 0 || event.button === 1)
                this.isMoving = false;
        };
        this.onMouseMove = (event) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mousePosition.x = (event.clientX - rect.left) / this.canvas.clientWidth * 2 - 1;
            this.mousePosition.y = -((event.clientY - rect.top) / this.canvas.clientHeight * 2 - 1);
            if (this.isMoving) {
                const cameraZ = this.camera.threeCamera.position.z;
                this.camera.threeCamera.position
                    .set(-event.movementX / this.canvas.clientWidth * 2, event.movementY / this.canvas.clientHeight * 2, 0)
                    .unproject(this.camera.threeCamera)
                    .z = cameraZ;
                this.camera.threeCamera.updateMatrixWorld(false);
                if (this.options.moveCallback != null)
                    this.options.moveCallback();
            }
        };
        this.onWheel = (event) => {
            if (event.ctrlKey)
                return;
            let newOrthographicScale;
            if (event.deltaY > 0)
                newOrthographicScale = Math.min(this.options.zoomMax, this.camera.orthographicScale * this.multiplier * this.options.zoomSpeed);
            else if (event.deltaY < 0)
                newOrthographicScale = Math.max(this.options.zoomMin, this.camera.orthographicScale * this.multiplier / this.options.zoomSpeed);
            else
                return;
            this.changeOrthographicScale(newOrthographicScale, this.mousePosition);
        };
        this.onKeyPress = (event) => {
            if (SupClient.Dialogs.BaseDialog.activeDialog != null)
                return;
            if (event.keyCode === 43 /* Ctrl+Numpad+ */) {
                const newOrthographicScale = Math.max(this.options.zoomMin, this.camera.orthographicScale * this.multiplier / this.options.zoomSpeed);
                this.changeOrthographicScale(newOrthographicScale);
            }
            if (event.keyCode === 45 /* Ctrl+Numpad- */) {
                const newOrthographicScale = Math.min(this.options.zoomMax, this.camera.orthographicScale * this.multiplier * this.options.zoomSpeed);
                this.changeOrthographicScale(newOrthographicScale);
            }
        };
        this.options = options != null ? options : {};
        if (this.options.zoomSpeed == null)
            this.options.zoomSpeed = 1.5;
        if (this.options.zoomMin == null)
            this.options.zoomMin = 0.1;
        if (this.options.zoomMax == null)
            this.options.zoomMax = 10000;
        canvas.addEventListener("mousedown", this.onMouseDown);
        canvas.addEventListener("mousemove", this.onMouseMove);
        canvas.addEventListener("wheel", this.onWheel);
        canvas.addEventListener("keypress", this.onKeyPress);
        document.addEventListener("mouseup", this.onMouseUp);
        canvas.addEventListener("mouseout", this.onMouseUp);
        canvas.addEventListener("contextmenu", (event) => { event.preventDefault(); });
    }
    setMultiplier(newMultiplier) {
        this.multiplier = newMultiplier;
        const newOrthographicScale = this.camera.orthographicScale * this.multiplier;
        this.changeOrthographicScale(newOrthographicScale);
    }
    changeOrthographicScale(newOrthographicScale, mousePosition = { x: 0, y: 0 }) {
        const startPosition = new THREE.Vector3(mousePosition.x, mousePosition.y, 0).unproject(this.camera.threeCamera);
        this.camera.setOrthographicScale(newOrthographicScale / this.multiplier);
        const endPosition = new THREE.Vector3(mousePosition.x, mousePosition.y, 0).unproject(this.camera.threeCamera);
        this.camera.threeCamera.position.x += startPosition.x - endPosition.x;
        this.camera.threeCamera.position.y += startPosition.y - endPosition.y;
        this.camera.threeCamera.updateMatrixWorld(false);
        if (this.options.zoomCallback != null)
            this.options.zoomCallback();
    }
}
exports.default = Camera2DControls;
