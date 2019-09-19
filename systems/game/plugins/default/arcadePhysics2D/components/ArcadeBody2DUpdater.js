"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ArcadeBody2DUpdater {
    constructor(projectClient, bodyRenderer, config) {
        this.projectClient = projectClient;
        this.bodyRenderer = bodyRenderer;
        this.config = config;
        this.setType();
    }
    destroy() { }
    config_setProperty(path, value) {
        if (path === "width" || path === "height")
            this.bodyRenderer.setBox(this.config.width, this.config.height);
        if (path === "offset.x" || path === "offset.y")
            this.bodyRenderer.setOffset(this.config.offset.x, this.config.offset.y);
        if (path === "type")
            this.setType();
    }
    setType() {
        if (this.config.type === "box") {
            this.bodyRenderer.setBox(this.config.width, this.config.height);
            this.bodyRenderer.setOffset(this.config.offset.x, this.config.offset.y);
        }
        else
            this.bodyRenderer.setTileMap();
    }
}
exports.default = ArcadeBody2DUpdater;
