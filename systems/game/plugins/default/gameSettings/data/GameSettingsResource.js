"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
class GameSettingsResource extends SupCore.Data.Base.Resource {
    constructor(id, pub, server) {
        super(id, pub, GameSettingsResource.schema, server);
    }
    init(callback) {
        this.pub = {
            formatVersion: GameSettingsResource.currentFormatVersion,
            startupSceneId: null,
            framesPerSecond: 60,
            ratioNumerator: null, ratioDenominator: null,
            customLayers: []
        };
        super.init(callback);
    }
    migrate(resourcePath, pub, callback) {
        if (pub.formatVersion === GameSettingsResource.currentFormatVersion) {
            callback(false);
            return;
        }
        if (pub.formatVersion == null) {
            // NOTE: Custom layers were introduced in Superpowers 0.8
            if (pub.customLayers == null)
                pub.customLayers = [];
            this.server.data.entries.walk((node) => {
                const path = this.server.data.entries.getPathFromId(node.id);
                if (path === pub.startupScene)
                    pub.startupSceneId = node.id;
            });
            delete pub.startupScene;
            pub.formatVersion = 1;
        }
        callback(true);
    }
    restore() {
        if (this.pub.startupSceneId != null && this.server.data.entries.byId[this.pub.startupSceneId] != null) {
            this.emit("setAssetBadge", this.pub.startupSceneId, "startupScene", "info");
        }
    }
    clientExport(outputPath, callback) {
        SupApp.writeFile(path.join(outputPath, "resource.json"), JSON.stringify(this.pub), callback);
    }
    server_setProperty(client, path, value, callback) {
        let oldSceneId;
        if (path === "startupSceneId")
            oldSceneId = this.pub.startupSceneId;
        this.setProperty(path, value, (err, actualValue) => {
            if (err != null) {
                callback(err);
                return;
            }
            if (path === "startupSceneId") {
                if (oldSceneId != null && this.server.data.entries.byId[oldSceneId] != null)
                    this.emit("clearAssetBadge", oldSceneId, "startupScene");
                if (actualValue != null && this.server.data.entries.byId[actualValue] != null)
                    this.emit("setAssetBadge", actualValue, "startupScene", "info");
            }
            callback(null, null, path, actualValue);
        });
    }
}
GameSettingsResource.currentFormatVersion = 1;
GameSettingsResource.schema = {
    formatVersion: { type: "integer" },
    startupSceneId: { type: "string?", mutable: true },
    framesPerSecond: { type: "integer", minExcluded: 0, mutable: true },
    ratioNumerator: { type: "integer?", mutable: true },
    ratioDenominator: { type: "integer?", mutable: true },
    customLayers: {
        type: "array", mutable: true, minLength: 0, maxLength: 8,
        items: { type: "string", minLength: 1, maxLength: 80 }
    }
};
exports.default = GameSettingsResource;
