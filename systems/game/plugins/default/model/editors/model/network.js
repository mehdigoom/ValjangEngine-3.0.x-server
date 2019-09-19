"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ui_1 = require("./ui");
const engine_1 = require("./engine");
const ModelRenderer_1 = require("../../components/ModelRenderer");
const ModelRendererUpdater_1 = require("../../components/ModelRendererUpdater");
SupClient.i18n.load([{ root: `${window.location.pathname}/../..`, name: "modelEditor" }], () => {
    exports.socket = SupClient.connect(SupClient.query.project);
    exports.socket.on("connect", onConnected);
    exports.socket.on("disconnect", SupClient.onDisconnected);
});
const onEditCommands = {};
function onConnected() {
    exports.data = {};
    exports.data.projectClient = new SupClient.ProjectClient(exports.socket, { subEntries: false });
    const modelActor = new SupEngine.Actor(engine_1.default.gameInstance, "Model");
    const modelRenderer = new ModelRenderer_1.default(modelActor);
    const config = { modelAssetId: SupClient.query.asset, materialType: "phong", color: "ffffff" };
    const subscriber = {
        onAssetReceived,
        onAssetEdited: (assetId, command, ...args) => { if (onEditCommands[command] != null)
            onEditCommands[command](...args); },
        onAssetTrashed: SupClient.onAssetTrashed
    };
    exports.data.modelUpdater = new ModelRendererUpdater_1.default(exports.data.projectClient, modelRenderer, config, subscriber);
}
function onAssetReceived() {
    const pub = exports.data.modelUpdater.modelAsset.pub;
    for (let index = 0; index < pub.animations.length; index++) {
        const animation = pub.animations[index];
        ui_1.setupAnimation(animation, index);
    }
    ui_1.default.filteringSelect.value = pub.filtering;
    ui_1.default.wrappingSelect.value = pub.wrapping;
    ui_1.default.unitRatioInput.value = pub.unitRatio.toString();
    ui_1.setupOpacity(pub.opacity);
    for (const mapName in pub.maps)
        if (pub.maps[mapName] != null)
            ui_1.setupMap(mapName);
    for (const slotName in pub.mapSlots)
        ui_1.default.mapSlotsInput[slotName].value = pub.mapSlots[slotName] != null ? pub.mapSlots[slotName] : "";
}
onEditCommands["setProperty"] = (path, value) => {
    switch (path) {
        case "filtering":
            ui_1.default.filteringSelect.value = value;
            break;
        case "wrapping":
            ui_1.default.wrappingSelect.value = value;
            break;
        case "unitRatio":
            ui_1.default.unitRatioInput.value = value.toString();
            break;
        case "opacity":
            ui_1.setupOpacity(value);
            break;
    }
};
onEditCommands["newAnimation"] = (animation, index) => {
    ui_1.setupAnimation(animation, index);
};
onEditCommands["deleteAnimation"] = (id) => {
    const animationElt = ui_1.default.animationsTreeView.treeRoot.querySelector(`li[data-id="${id}"]`);
    ui_1.default.animationsTreeView.remove(animationElt);
    if (ui_1.default.selectedAnimationId === id)
        ui_1.updateSelectedAnimation();
};
onEditCommands["moveAnimation"] = (id, index) => {
    const animationElt = ui_1.default.animationsTreeView.treeRoot.querySelector(`li[data-id="${id}"]`);
    ui_1.default.animationsTreeView.insertAt(animationElt, "item", index);
};
onEditCommands["setAnimationProperty"] = (id, key, value) => {
    const animationElt = ui_1.default.animationsTreeView.treeRoot.querySelector(`li[data-id="${id}"]`);
    switch (key) {
        case "name":
            animationElt.querySelector(".name").textContent = value;
            break;
    }
};
onEditCommands["newMap"] = (name) => {
    ui_1.setupMap(name);
};
onEditCommands["renameMap"] = (oldName, newName) => {
    const pub = exports.data.modelUpdater.modelAsset.pub;
    const textureElt = ui_1.default.texturesTreeView.treeRoot.querySelector(`[data-name="${oldName}"]`);
    textureElt.dataset["name"] = newName;
    textureElt.querySelector("span").textContent = newName;
    for (const slotName in pub.mapSlots)
        if (ui_1.default.mapSlotsInput[slotName].value === oldName)
            ui_1.default.mapSlotsInput[slotName].value = newName;
};
onEditCommands["deleteMap"] = (name) => {
    const textureElt = ui_1.default.texturesTreeView.treeRoot.querySelector(`li[data-name="${name}"]`);
    ui_1.default.texturesTreeView.remove(textureElt);
    const pub = exports.data.modelUpdater.modelAsset.pub;
    for (const slotName in pub.mapSlots)
        if (ui_1.default.mapSlotsInput[slotName].value === name)
            ui_1.default.mapSlotsInput[slotName].value = "";
};
onEditCommands["setMapSlot"] = (slot, map) => {
    ui_1.default.mapSlotsInput[slot].value = map != null ? map : "";
};
