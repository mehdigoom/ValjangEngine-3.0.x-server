"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function loadResource(player, resourceName, callback) {
    player.getAssetData(`resources/${resourceName}/resource.json`, "json", (err, data) => {
        if (err != null) {
            callback(err);
            return;
        }
        for (const behaviorName in data.behaviors) {
            const behavior = data.behaviors[behaviorName];
            behavior.propertiesByName = {};
            for (const property of behavior.properties)
                behavior.propertiesByName[property.name] = property;
        }
        callback(null, data);
    });
}
exports.loadResource = loadResource;
