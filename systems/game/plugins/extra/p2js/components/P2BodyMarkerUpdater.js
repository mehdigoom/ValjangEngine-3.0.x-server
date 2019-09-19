"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class P2BodyMarkerUpdater {
    constructor(client, bodyRenderer, config) {
        this.bodyRenderer = bodyRenderer;
        this.config = config;
        switch (this.config.shape) {
            case "box":
                {
                    this.bodyRenderer.setBox(this.config.width, this.config.height);
                }
                break;
            case "circle":
                {
                    this.bodyRenderer.setCircle(this.config.radius);
                }
                break;
        }
        this.bodyRenderer.setOffset(this.config.offsetX, this.config.offsetY);
        this.bodyRenderer.setAngle(this.config.angle);
    }
    destroy() { }
    config_setProperty(path, value) {
        if (path === "width" || path === "height" || (path === "shape" && value === "box")) {
            this.bodyRenderer.setBox(this.config.width, this.config.height);
        }
        if (path === "radius" || (path === "shape" && value === "circle")) {
            this.bodyRenderer.setCircle(this.config.radius);
        }
        if (path === "offsetX" || path === "offsetY") {
            this.bodyRenderer.setOffset(this.config.offsetX, this.config.offsetY);
        }
        if (path === "angle") {
            this.bodyRenderer.setAngle(this.config.angle);
        }
    }
}
exports.default = P2BodyMarkerUpdater;
