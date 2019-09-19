"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CannonBodyMarkerUpdater {
    constructor(client, bodyRenderer, config) {
        this.client = client;
        this.bodyRenderer = bodyRenderer;
        this.config = config;
        switch (this.config.shape) {
            case "box":
                this.bodyRenderer.setBox(this.config.orientationOffset, this.config.halfSize);
                break;
            case "sphere":
                this.bodyRenderer.setSphere(this.config.radius);
                break;
            case "cylinder":
                this.bodyRenderer.setCylinder(this.config.orientationOffset, this.config.radius, this.config.height, this.config.segments);
                break;
        }
        this.bodyRenderer.setPositionOffset(this.config.positionOffset);
    }
    destroy() { }
    config_setProperty(path, value) {
        if ((path.indexOf("orientationOffset") !== -1 && this.config.shape === "box") || path.indexOf("halfSize") !== -1 || (path === "shape" && value === "box")) {
            this.bodyRenderer.setBox(this.config.orientationOffset, this.config.halfSize);
            this.bodyRenderer.setPositionOffset(this.config.positionOffset);
        }
        if ((path === "radius" && this.config.shape === "sphere") || (path === "shape" && value === "sphere")) {
            this.bodyRenderer.setSphere(this.config.radius);
            this.bodyRenderer.setPositionOffset(this.config.positionOffset);
        }
        if ((path.indexOf("orientationOffset") !== -1 && this.config.shape === "cylinder") ||
            (path === "radius" && this.config.shape === "cylinder") ||
            (path === "shape" && value === "cylinder") || path === "height" || path === "segments") {
            this.bodyRenderer.setCylinder(this.config.orientationOffset, this.config.radius, this.config.height, this.config.segments);
            this.bodyRenderer.setPositionOffset(this.config.positionOffset);
        }
        if (path.indexOf("positionOffset") !== -1) {
            this.bodyRenderer.setPositionOffset(this.config.positionOffset);
        }
    }
}
exports.default = CannonBodyMarkerUpdater;
