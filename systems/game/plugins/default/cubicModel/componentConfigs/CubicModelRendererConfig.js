"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CubicModelRendererConfig extends SupCore.Data.Base.ComponentConfig {
    constructor(pub) { super(pub, CubicModelRendererConfig.schema); }
    static create() {
        const emptyConfig = {
            cubicModelAssetId: null // , animationId: null,
            // horizontalFlip: false, verticalFlip: false,
            // castShadow: false, receiveShadow: false,
            // color: "ffffff",
            // overrideOpacity: false, opacity: null,
            // materialType: "basic", shaderAssetId: null
        };
        return emptyConfig;
    }
    restore() {
        if (this.pub.cubicModelAssetId != null)
            this.emit("addDependencies", [this.pub.cubicModelAssetId]);
        // if (this.pub.shaderAssetId != null) this.emit("addDependencies", [ this.pub.shaderAssetId ]);
    }
    destroy() {
        if (this.pub.cubicModelAssetId != null)
            this.emit("removeDependencies", [this.pub.cubicModelAssetId]);
        // if (this.pub.shaderAssetId != null) this.emit("removeDependencies", [ this.pub.shaderAssetId ]);
    }
    setProperty(path, value, callback) {
        let oldDepId;
        if (path === "cubicModelAssetId")
            oldDepId = this.pub.cubicModelAssetId;
        // if (path === "shaderAssetId") oldDepId = this.pub.shaderAssetId;
        super.setProperty(path, value, (err, actualValue) => {
            if (err != null) {
                callback(err);
                return;
            }
            if (path === "cubicModelAssetId" || path === "shaderAssetId") {
                if (oldDepId != null)
                    this.emit("removeDependencies", [oldDepId]);
                if (actualValue != null)
                    this.emit("addDependencies", [actualValue]);
            }
            // if (path === "overrideOpacity") this.pub.opacity = null;
            callback(null, actualValue);
        });
    }
}
CubicModelRendererConfig.schema = {
    cubicModelAssetId: { type: "string?", min: 0, mutable: true },
};
exports.default = CubicModelRendererConfig;
