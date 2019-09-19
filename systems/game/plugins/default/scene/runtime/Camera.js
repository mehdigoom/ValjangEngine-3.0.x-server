"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function setupComponent(player, component, config) {
    component.setOrthographicMode(config.mode === "orthographic");
    component.setFOV(config.fov);
    component.setOrthographicScale(config.orthographicScale);
    component.setDepth(config.depth);
    component.setNearClippingPlane(config.nearClippingPlane);
    component.setFarClippingPlane(config.farClippingPlane);
    component.setViewport(config.viewport.x, config.viewport.y, config.viewport.width, config.viewport.height);
}
exports.setupComponent = setupComponent;
