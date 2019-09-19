"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function importActor(entry, projectClient, options, callback) {
    const subscriber = {
        onAssetReceived,
        onAssetEdited: null,
        onAssetTrashed: null
    };
    function onAssetReceived(assetId, asset) {
        projectClient.unsubAsset(entry.id, subscriber);
        if (asset.nodes.pub.length !== 1) {
            callback(SupClient.i18n.t("sceneEditor:errors.prefab.mustHaveSingleRootActor"), null);
            return;
        }
        let name = entry.name;
        if (name === "Prefab") {
            const parentNode = projectClient.entries.parentNodesById[entry.id];
            if (parentNode != null)
                name = parentNode.name;
        }
        options.prefab = true;
        projectClient.editAsset(SupClient.query.asset, "addNode", name, options, (nodeId) => {
            projectClient.editAsset(SupClient.query.asset, "setNodeProperty", nodeId, "prefab.sceneAssetId", entry.id, () => {
                callback(null, nodeId);
            });
        });
    }
    projectClient.subAsset(entry.id, "scene", subscriber);
}
exports.importActor = importActor;
exports.importComponent = null;
