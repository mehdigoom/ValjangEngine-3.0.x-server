"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const network_1 = require("./network");
const ui_1 = require("./ui");
const SpriteOriginMarker_1 = require("./SpriteOriginMarker");
const ResizeHandle = require("resize-handle");
const animationArea = {};
exports.default = animationArea;
new ResizeHandle(document.querySelector(".animation-container"), "bottom");
animationArea.gameInstance = new SupEngine.GameInstance(document.querySelector(".animation-container canvas"));
animationArea.gameInstance.threeRenderer.setClearColor(0xbbbbbb);
const cameraActor = new SupEngine.Actor(animationArea.gameInstance, "Camera");
cameraActor.setLocalPosition(new SupEngine.THREE.Vector3(0, 0, 10));
const cameraComponent = new SupEngine.componentClasses["Camera"](cameraActor);
cameraComponent.setOrthographicMode(true);
cameraComponent.setOrthographicScale(10);
animationArea.cameraControls = new SupEngine.editorComponentClasses["Camera2DControls"](cameraActor, cameraComponent, { zoomSpeed: 1.5, zoomMin: 0.1, zoomMax: 10000 });
const originActor = new SupEngine.Actor(animationArea.gameInstance, "Origin");
originActor.setLocalPosition(new SupEngine.THREE.Vector3(0, 0, 1));
animationArea.originMakerComponent = new SpriteOriginMarker_1.default(originActor);
function centerCamera() {
    if (network_1.data.spriteUpdater.spriteRenderer.asset == null)
        return;
    const pub = network_1.data.spriteUpdater.spriteAsset.pub;
    const scaleRatio = 1 / cameraComponent.orthographicScale;
    cameraActor.setLocalPosition(new SupEngine.THREE.Vector3((0.5 - pub.origin.x) * pub.grid.width * scaleRatio, (0.5 - pub.origin.y) * pub.grid.height * scaleRatio, 10));
}
exports.centerCamera = centerCamera;
function handleAnimationArea() {
    if (network_1.data != null && ui_1.default.selectedAnimationId != null) {
        if (!network_1.data.spriteUpdater.spriteRenderer.isAnimationPlaying) {
            ui_1.default.animationPlay.textContent = "▶";
        }
        else {
            ui_1.default.animationSlider.value = network_1.data.spriteUpdater.spriteRenderer.getAnimationFrameIndex().toString();
        }
    }
}
exports.handleAnimationArea = handleAnimationArea;
