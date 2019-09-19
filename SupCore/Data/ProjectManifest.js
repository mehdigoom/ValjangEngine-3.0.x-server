"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Hash_1 = require("./Base/Hash");
class ProjectManifest extends Hash_1.default {
    constructor(pub) {
        const migratedFromFormatVersion = ProjectManifest.migrate(pub);
        super(pub, ProjectManifest.schema);
        this.migratedFromFormatVersion = migratedFromFormatVersion;
    }
    static migrate(pub) {
        if (pub.formatVersion === ProjectManifest.currentFormatVersion)
            return null;
        if (pub.formatVersion == null)
            pub.formatVersion = 0;
        if (pub.formatVersion > ProjectManifest.currentFormatVersion) {
            throw new Error("This project was created using a more recent version of ValjangEngine and cannot be loaded. " +
                `Format version is ${pub.formatVersion} but this version of ValjangEngine only supports up to ${ProjectManifest.currentFormatVersion}.`);
        }
        const oldFormatVersion = pub.formatVersion;
        if (oldFormatVersion === 0) {
            // Nothing to migrate here, the manifest itself didn't change
            // The on-disk project format did though, and will be updated
            // by ProjectServer based on oldFormatVersion
        }
        if (oldFormatVersion <= 1) {
            pub.systemId = "game";
        }
        else if (oldFormatVersion <= 3) {
            pub.systemId = pub.system;
            delete pub.system;
            switch (pub.systemId) {
                case "supGame":
                    pub.systemId = "game";
                    break;
                case "supWeb":
                    pub.systemId = "web";
                    break;
                case "markSlide":
                    pub.systemId = "markslide";
                    break;
            }
        }
        else if (oldFormatVersion <= 4) {
            pub.systemId = pub.system;
            delete pub.system;
        }
        pub.formatVersion = ProjectManifest.currentFormatVersion;
        return oldFormatVersion;
    }
}
ProjectManifest.schema = {
    id: { type: "string" },
    name: { type: "string", minLength: 1, maxLength: 80, mutable: true },
    description: { type: "string", maxLength: 300, mutable: true },
    systemId: { type: "string" },
    formatVersion: { type: "integer" }
};
ProjectManifest.currentFormatVersion = 6;
exports.default = ProjectManifest;
