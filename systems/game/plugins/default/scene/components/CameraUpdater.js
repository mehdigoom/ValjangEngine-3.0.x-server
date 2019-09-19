"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CameraUpdater {
    constructor(client, camera, config) {
        this.onResourceReceived = (resourceId, resource) => {
            this.resource = resource;
            this.updateRatio();
        };
        this.onResourceEdited = (resourceId, command, propertyName) => {
            this.updateRatio();
        };
        this.client = client;
        this.camera = camera;
        this.config = config;
        this.camera.setConfig(this.config);
        this.camera.setRatio(5 / 3);
        this.client.subResource("gameSettings", this);
    }
    destroy() {
        if (this.resource != null)
            this.client.unsubResource("gameSettings", this);
    }
    config_setProperty(path, value) {
        this.camera.setConfig(this.config);
    }
    updateRatio() {
        if (this.resource.pub.ratioNumerator != null && this.resource.pub.ratioDenominator != null)
            this.camera.setRatio(this.resource.pub.ratioNumerator / this.resource.pub.ratioDenominator);
        else
            this.camera.setRatio(5 / 3);
    }
}
exports.default = CameraUpdater;
