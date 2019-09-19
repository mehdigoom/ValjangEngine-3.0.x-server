"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class P2BodyConfig extends SupCore.Data.Base.ComponentConfig {
    constructor(pub) { super(pub, P2BodyConfig.schema); }
    static create() {
        const emptyConfig = {
            formatVersion: P2BodyConfig.currentFormatVersion,
            mass: 0,
            fixedRotation: false,
            offsetX: 0,
            offsetY: 0,
            shape: "box",
            width: 1,
            height: 1,
            angle: 0,
            radius: 1,
            length: 1
        };
        return emptyConfig;
    }
    static migrate(pub) {
        if (pub.formatVersion === P2BodyConfig.currentFormatVersion)
            return false;
        if (pub.formatVersion == null) {
            pub.formatVersion = 1;
            // NOTE: "rectangle" was renamed to "box" in p2.js v0.7
            if (pub.shape === "rectangle")
                pub.shape = "box";
        }
        if (pub.formatVersion === 1) {
            pub.formatVersion = 2;
            pub.angle = 0;
        }
        return true;
    }
}
P2BodyConfig.schema = {
    formatVersion: { type: "integer" },
    mass: { type: "number", min: 0, mutable: true },
    fixedRotation: { type: "boolean", mutable: true },
    offsetX: { type: "number", mutable: true },
    offsetY: { type: "number", mutable: true },
    shape: { type: "enum", items: ["box", "circle"], mutable: true },
    width: { type: "number", min: 0, mutable: true },
    height: { type: "number", min: 0, mutable: true },
    angle: { type: "number", min: -360, max: 360, mutable: true },
    radius: { type: "number", min: 0, mutable: true }
};
P2BodyConfig.currentFormatVersion = 2;
exports.default = P2BodyConfig;
