"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ui_1 = require("./ui");
const animationArea_1 = require("./animationArea");
const spritesheetArea_1 = require("./spritesheetArea");
const SpriteRenderer_1 = require("../../components/SpriteRenderer");
const SpriteRendererUpdater_1 = require("../../components/SpriteRendererUpdater");
SupClient.i18n.load([{ root: `${window.location.pathname}/../..`, name: "spriteEditor" }], () => {
    exports.socket = SupClient.connect(SupClient.query.project);
    exports.socket.on("connect", onConnected);
    exports.socket.on("disconnect", SupClient.onDisconnected);
});
const onEditCommands = {};
function onConnected() {
    exports.data = {};
    exports.data.projectClient = new SupClient.ProjectClient(exports.socket);
    const spriteActor = new SupEngine.Actor(animationArea_1.default.gameInstance, "Sprite");
    const spriteRenderer = new SpriteRenderer_1.default(spriteActor);
    const config = { spriteAssetId: SupClient.query.asset, materialType: "basic", color: "ffffff" };
    const subscriber = {
        onAssetReceived,
        onAssetEdited: (assetId, command, ...args) => { if (onEditCommands[command] != null)
            onEditCommands[command](...args); },
        onAssetTrashed: SupClient.onAssetTrashed
    };
    exports.data.spriteUpdater = new SpriteRendererUpdater_1.default(exports.data.projectClient, spriteRenderer, config, subscriber);
}
function onAssetReceived() {
    const pub = exports.data.spriteUpdater.spriteAsset.pub;
    const texture = pub.textures[pub.mapSlots["map"]];
    spritesheetArea_1.default.spritesheet = {
        textures: { map: texture },
        filtering: pub.filtering,
        wrapping: pub.wrapping,
        pixelsPerUnit: pub.pixelsPerUnit,
        framesPerSecond: pub.framesPerSecond,
        alphaTest: pub.alphaTest,
        mapSlots: { map: "map" },
        grid: { width: 0, height: 0 },
        origin: { x: 0, y: 1 },
        animations: []
    };
    if (texture != null) {
        spritesheetArea_1.default.spritesheet.grid.width = texture.size.width;
        spritesheetArea_1.default.spritesheet.grid.height = texture.size.height;
        spritesheetArea_1.default.spritesheet.textures["map"].needsUpdate = true;
        spritesheetArea_1.default.spriteRenderer.setSprite(spritesheetArea_1.default.spritesheet);
        ui_1.default.imageSize.value = `${texture.size.width} × ${texture.size.height}`;
    }
    animationArea_1.centerCamera();
    spritesheetArea_1.centerCamera();
    const width = texture != null ? texture.size.width / pub.grid.width : 1;
    const height = texture != null ? texture.size.height / pub.grid.height : 1;
    spritesheetArea_1.default.gridRenderer.setGrid({
        width, height,
        orthographicScale: 5,
        direction: -1,
        ratio: { x: pub.pixelsPerUnit / pub.grid.width, y: pub.pixelsPerUnit / pub.grid.height }
    });
    ui_1.default.allSettings.forEach((setting) => {
        const parts = setting.split(".");
        let obj = pub;
        parts.slice(0, parts.length - 1).forEach((part) => { obj = obj[part]; });
        ui_1.setupProperty(setting, obj[parts[parts.length - 1]]);
    });
    pub.animations.forEach((animation, index) => {
        ui_1.setupAnimation(animation, index);
    });
    for (const mapName in pub.maps)
        if (pub.maps[mapName] != null)
            ui_1.setupMap(mapName);
    for (const slotName in pub.mapSlots)
        ui_1.default.mapSlotsInput[slotName].value = pub.mapSlots[slotName] != null ? pub.mapSlots[slotName] : "";
}
onEditCommands["setProperty"] = (path, value) => {
    ui_1.setupProperty(path, value);
};
onEditCommands["newAnimation"] = (animation, index) => { ui_1.setupAnimation(animation, index); };
onEditCommands["deleteAnimation"] = (id) => {
    const animationElt = ui_1.default.animationsTreeView.treeRoot.querySelector(`li[data-id='${id}']`);
    ui_1.default.animationsTreeView.remove(animationElt);
    if (ui_1.default.selectedAnimationId === id)
        ui_1.updateSelectedAnimation();
};
onEditCommands["moveAnimation"] = (id, index) => {
    const animationElt = ui_1.default.animationsTreeView.treeRoot.querySelector(`li[data-id='${id}']`);
    ui_1.default.animationsTreeView.insertAt(animationElt, "item", index);
};
onEditCommands["setAnimationProperty"] = (id, key, value) => {
    const animationElt = ui_1.default.animationsTreeView.treeRoot.querySelector(`li[data-id='${id}']`);
    switch (key) {
        case "name":
            animationElt.querySelector(".name").textContent = value;
            break;
        case "startFrameIndex":
            animationElt.querySelector(".start-frame-index").value = value;
            if (id === ui_1.default.selectedAnimationId)
                spritesheetArea_1.updateSelection();
            break;
        case "endFrameIndex":
            animationElt.querySelector(".end-frame-index").value = value;
            if (id === ui_1.default.selectedAnimationId)
                ui_1.updateSelectedAnimation();
            break;
        case "speed":
            animationElt.querySelector(".speed").value = value;
            break;
    }
};
function updateSpritesheet() {
    const pub = exports.data.spriteUpdater.spriteAsset.pub;
    const texture = pub.textures[pub.mapSlots["map"]];
    if (texture == null)
        return;
    const asset = spritesheetArea_1.default.spritesheet;
    asset.textures["map"] = texture;
    asset.textures["map"].needsUpdate = true;
    asset.grid.width = texture.size.width;
    asset.grid.height = texture.size.height;
    asset.pixelsPerUnit = pub.pixelsPerUnit;
    spritesheetArea_1.default.spriteRenderer.setSprite(asset);
    const width = Math.floor(texture.size.width / pub.grid.width);
    const height = Math.floor(texture.size.height / pub.grid.height);
    spritesheetArea_1.default.gridRenderer.resize(width, height);
    ui_1.updateSelectedAnimation();
    ui_1.default.imageSize.value = `${texture.size.width} × ${texture.size.height}`;
}
onEditCommands["setMaps"] = () => { updateSpritesheet(); };
onEditCommands["newMap"] = (name) => { ui_1.setupMap(name); };
onEditCommands["renameMap"] = (oldName, newName) => {
    const pub = exports.data.spriteUpdater.spriteAsset.pub;
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
    const pub = exports.data.spriteUpdater.spriteAsset.pub;
    for (const slotName in pub.mapSlots)
        if (ui_1.default.mapSlotsInput[slotName].value === name)
            ui_1.default.mapSlotsInput[slotName].value = "";
};
onEditCommands["setMapSlot"] = (slot, map) => {
    ui_1.default.mapSlotsInput[slot].value = map != null ? map : "";
    if (slot === "map")
        updateSpritesheet();
};
