"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function importActor(entry, projectClient, options, callback) {
    getBehaviorName(projectClient, entry.id, (err, behaviorName) => {
        if (err != null) {
            callback(err, null);
            return;
        }
        let name = entry.name;
        if (name === "Behavior" || name === "Behaviour") {
            const parentNode = projectClient.entries.parentNodesById[entry.id];
            if (parentNode != null)
                name = parentNode.name;
        }
        projectClient.editAsset(SupClient.query.asset, "addNode", name, options, (nodeId) => {
            importComponent(entry, projectClient, nodeId, (err) => { callback(err, nodeId); });
        });
    });
}
exports.importActor = importActor;
function importComponent(entry, projectClient, nodeId, callback) {
    getBehaviorName(projectClient, entry.id, (err, behaviorName) => {
        if (err != null) {
            callback(err, null);
            return;
        }
        projectClient.editAsset(SupClient.query.asset, "addComponent", nodeId, "Behavior", null, (componentId) => {
            projectClient.editAsset(SupClient.query.asset, "editComponent", nodeId, componentId, "setProperty", "behaviorName", behaviorName, callback);
        });
    });
}
exports.importComponent = importComponent;
function getBehaviorName(projectClient, scriptId, callback) {
    const subscriber = {
        onResourceReceived,
        onResourceEdited: null
    };
    function onResourceReceived(resourceId, resource) {
        projectClient.unsubResource("behaviorProperties", subscriber);
        if (resource.behaviorNamesByScriptId[scriptId] == null) {
            callback(SupClient.i18n.t("sceneEditor:errors.script.noBehaviorsFound"), null);
            return;
        }
        callback(null, resource.behaviorNamesByScriptId[scriptId][0]);
    }
    projectClient.subResource("behaviorProperties", subscriber);
}
