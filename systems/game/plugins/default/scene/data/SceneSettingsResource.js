"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class SceneSettingsResource extends SupCore.Data.Base.Resource {
    constructor(id, pub, server) {
        super(id, pub, SceneSettingsResource.schema, server);
    }
    init(callback) {
        this.pub = {
            formatVersion: SceneSettingsResource.currentFormatVersion,
            defaultCameraMode: "3D",
            defaultVerticalAxis: "Y"
        };
        super.init(callback);
    }
    migrate(resourcePath, pub, callback) {
        if (pub.formatVersion === SceneSettingsResource.currentFormatVersion) {
            callback(false);
            return;
        }
        if (pub.formatVersion == null) {
            // NOTE: Vertical axis was introduced in Superpowers 0.13
            if (pub.defaultVerticalAxis == null)
                pub.defaultVerticalAxis = "Y";
            pub.formatVersion = 1;
        }
        callback(true);
    }
}
SceneSettingsResource.currentFormatVersion = 1;
SceneSettingsResource.schema = {
    formatVersion: { type: "integer" },
    defaultCameraMode: { type: "enum", items: ["3D", "2D"], mutable: true },
    defaultVerticalAxis: { type: "enum", items: ["Y", "Z"], mutable: true }
};
exports.default = SceneSettingsResource;
