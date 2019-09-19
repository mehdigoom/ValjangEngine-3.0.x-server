"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function importActor(entry, projectClient, options, callback) {
    let name = entry.name;
    if (name === "Model") {
        const parentNode = projectClient.entries.parentNodesById[entry.id];
        if (parentNode != null)
            name = parentNode.name;
    }
    projectClient.editAsset(SupClient.query.asset, "addNode", name, options, (nodeId) => {
        importComponent(entry, projectClient, nodeId, (err) => { callback(err, nodeId); });
    });
}
exports.importActor = importActor;
function importComponent(entry, projectClient, nodeId, callback) {
    projectClient.editAsset(SupClient.query.asset, "addComponent", nodeId, "ModelRenderer", null, (componentId) => {
        projectClient.editAsset(SupClient.query.asset, "editComponent", nodeId, componentId, "setProperty", "modelAssetId", entry.id, callback);
    });
}
exports.importComponent = importComponent;
