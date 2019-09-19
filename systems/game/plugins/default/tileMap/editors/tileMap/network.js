"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ui_1 = require("./ui");
const mapArea_1 = require("./mapArea");
const tileSetArea_1 = require("./tileSetArea");
const TileMapRenderer_1 = require("../../components/TileMapRenderer");
const TileMapRendererUpdater_1 = require("../../components/TileMapRendererUpdater");
const TileSet_1 = require("../../components/TileSet");
const TileSetRenderer_1 = require("../../components/TileSetRenderer");
const TileSetRendererUpdater_1 = require("../../components/TileSetRendererUpdater");
exports.data = {};
let socket;
SupClient.i18n.load([{ root: `${window.location.pathname}/../..`, name: "tileMapEditor" }], () => {
    socket = SupClient.connect(SupClient.query.project);
    socket.on("connect", onConnected);
    socket.on("disconnect", SupClient.onDisconnected);
});
const onEditCommands = {};
const onTileSetEditCommands = {};
function onConnected() {
    exports.data.projectClient = new SupClient.ProjectClient(socket, { subEntries: true });
    const tileMapActor = new SupEngine.Actor(mapArea_1.default.gameInstance, "Tile Map");
    const tileMapRenderer = new TileMapRenderer_1.default(tileMapActor);
    const config = { tileMapAssetId: SupClient.query.asset, tileSetAssetId: null, materialType: "basic" };
    const subscribers = {
        tileMap: {
            onAssetReceived: onTileMapAssetReceived,
            onAssetEdited: (assetId, command, ...args) => { if (onEditCommands[command] != null)
                onEditCommands[command](...args); },
            onAssetTrashed: SupClient.onAssetTrashed
        }
    };
    exports.data.tileMapUpdater = new TileMapRendererUpdater_1.default(exports.data.projectClient, tileMapRenderer, config, subscribers);
}
const setProperty = onEditCommands["setProperty"] = (path, value) => {
    ui_1.default.settings[path].value = value;
    if (path === "pixelsPerUnit" && exports.data.tileMapUpdater.tileSetAsset != null) {
        const tileSetPub = exports.data.tileMapUpdater.tileSetAsset.pub;
        const tileMapPub = exports.data.tileMapUpdater.tileMapAsset.pub;
        mapArea_1.default.cameraControls.setMultiplier(value / tileSetPub.grid.width / 1);
        mapArea_1.default.gridRenderer.setRatio({ x: tileMapPub.pixelsPerUnit / tileSetPub.grid.width, y: tileMapPub.pixelsPerUnit / tileSetPub.grid.height });
        mapArea_1.default.patternRenderer.refreshPixelsPerUnit(tileMapPub.pixelsPerUnit);
        mapArea_1.default.patternBackgroundRenderer.refreshScale(1 / tileMapPub.pixelsPerUnit);
    }
};
// Tile Map
function onTileMapAssetReceived() {
    const pub = exports.data.tileMapUpdater.tileMapAsset.pub;
    const tileSetActor = new SupEngine.Actor(tileSetArea_1.default.gameInstance, "Tile Set");
    const tileSetRenderer = new TileSetRenderer_1.default(tileSetActor);
    const config = { tileSetAssetId: pub.tileSetId };
    const subscriber = {
        onAssetReceived: onTileSetAssetReceived,
        onAssetEdited: (assetId, command, ...args) => { if (onTileSetEditCommands[command] != null)
            onTileSetEditCommands[command](...args); }
    };
    exports.data.tileSetUpdater = new TileSetRendererUpdater_1.default(exports.data.projectClient, tileSetRenderer, config, subscriber);
    updateTileSetInput();
    onEditCommands["resizeMap"]();
    for (const setting in ui_1.default.settings)
        setProperty(setting, pub[setting]);
    for (let index = pub.layers.length - 1; index >= 0; index--)
        ui_1.setupLayer(pub.layers[index], index);
    tileSetArea_1.default.selectedLayerId = pub.layers[0].id.toString();
    ui_1.default.layersTreeView.addToSelection(ui_1.default.layersTreeView.treeRoot.querySelector(`li[data-id="${pub.layers[0].id}"]`));
    mapArea_1.default.patternActor.setLocalPosition(new SupEngine.THREE.Vector3(0, 0, pub.layerDepthOffset / 2));
}
function updateTileSetInput() {
    const tileSetName = (exports.data.tileMapUpdater.tileMapAsset.pub.tileSetId != null) ?
        exports.data.projectClient.entries.getPathFromId(exports.data.tileMapUpdater.tileMapAsset.pub.tileSetId) : "";
    ui_1.default.tileSetInput.value = tileSetName;
    ui_1.default.openTileSetButton.disabled = exports.data.tileMapUpdater.tileMapAsset.pub.tileSetId == null;
}
onEditCommands["changeTileSet"] = () => {
    updateTileSetInput();
    exports.data.tileSetUpdater.changeTileSetId(exports.data.tileMapUpdater.tileMapAsset.pub.tileSetId);
};
onEditCommands["resizeMap"] = () => {
    const width = exports.data.tileMapUpdater.tileMapAsset.pub.width;
    const height = exports.data.tileMapUpdater.tileMapAsset.pub.height;
    ui_1.default.sizeInput.value = `${width} × ${height}`;
    mapArea_1.default.gridRenderer.resize(width, height);
};
onEditCommands["newLayer"] = (layerPub, index) => {
    ui_1.setupLayer(layerPub, index);
    const pub = exports.data.tileMapUpdater.tileMapAsset.pub;
    const layer = exports.data.tileMapUpdater.tileMapAsset.layers.byId[tileSetArea_1.default.selectedLayerId];
    const z = (pub.layers.indexOf(layer) + 0.5) * pub.layerDepthOffset;
    mapArea_1.default.patternActor.setLocalPosition(new SupEngine.THREE.Vector3(0, 0, z));
    ui_1.refreshLayersId();
};
onEditCommands["renameLayer"] = (id, newName) => {
    const layerElt = ui_1.default.layersTreeView.treeRoot.querySelector(`[data-id="${id}"]`);
    layerElt.querySelector(".name").textContent = newName;
};
onEditCommands["deleteLayer"] = (id) => {
    const layerElt = ui_1.default.layersTreeView.treeRoot.querySelector(`li[data-id="${id}"]`);
    ui_1.default.layersTreeView.remove(layerElt);
    if (id === tileSetArea_1.default.selectedLayerId) {
        tileSetArea_1.default.selectedLayerId = exports.data.tileMapUpdater.tileMapAsset.pub.layers[0].id;
        ui_1.default.layersTreeView.clearSelection();
        ui_1.default.layersTreeView.addToSelection(ui_1.default.layersTreeView.treeRoot.querySelector(`li[data-id="${tileSetArea_1.default.selectedLayerId}"]`));
    }
    const pub = exports.data.tileMapUpdater.tileMapAsset.pub;
    const layer = exports.data.tileMapUpdater.tileMapAsset.layers.byId[tileSetArea_1.default.selectedLayerId];
    const z = (pub.layers.indexOf(layer) + 0.5) * pub.layerDepthOffset;
    mapArea_1.default.patternActor.setLocalPosition(new SupEngine.THREE.Vector3(0, 0, z));
    ui_1.refreshLayersId();
};
onEditCommands["moveLayer"] = (id, newIndex) => {
    const pub = exports.data.tileMapUpdater.tileMapAsset.pub;
    const layerElt = ui_1.default.layersTreeView.treeRoot.querySelector(`li[data-id="${id}"]`);
    ui_1.default.layersTreeView.insertAt(layerElt, "item", pub.layers.length - newIndex);
    const layer = exports.data.tileMapUpdater.tileMapAsset.layers.byId[tileSetArea_1.default.selectedLayerId];
    const z = (pub.layers.indexOf(layer) + 0.5) * pub.layerDepthOffset;
    mapArea_1.default.patternActor.setLocalPosition(new SupEngine.THREE.Vector3(0, 0, z));
    ui_1.refreshLayersId();
};
// Tile Set
function onTileSetAssetReceived() {
    const tileMapPub = exports.data.tileMapUpdater.tileMapAsset.pub;
    const tileSetPub = exports.data.tileMapUpdater.tileSetAsset.pub;
    mapArea_1.default.cameraControls.setMultiplier(tileMapPub.pixelsPerUnit / tileSetPub.grid.width / 1);
    mapArea_1.default.gridRenderer.setRatio({ x: tileMapPub.pixelsPerUnit / tileSetPub.grid.width, y: tileMapPub.pixelsPerUnit / tileSetPub.grid.height });
    if (tileSetPub.texture != null) {
        mapArea_1.default.patternRenderer.setTileSet(new TileSet_1.default(tileSetPub));
        if (ui_1.default.brushToolButton.checked)
            ui_1.selectBrushTool(0, 0);
    }
    mapArea_1.default.patternBackgroundRenderer.setup(0x900090, 1 / tileMapPub.pixelsPerUnit, tileSetPub.grid.width);
}
onTileSetEditCommands["upload"] = () => {
    mapArea_1.default.patternRenderer.setTileSet(new TileSet_1.default(exports.data.tileMapUpdater.tileSetAsset.pub));
    if (ui_1.default.brushToolButton.checked)
        ui_1.selectBrushTool(0, 0);
};
onTileSetEditCommands["setProperty"] = () => {
    const tileMapPub = exports.data.tileMapUpdater.tileMapAsset.pub;
    const tileSetPub = exports.data.tileMapUpdater.tileSetAsset.pub;
    mapArea_1.default.cameraControls.setMultiplier(tileMapPub.pixelsPerUnit / tileSetPub.grid.width / 1);
    mapArea_1.default.gridRenderer.setRatio({ x: tileMapPub.pixelsPerUnit / tileSetPub.grid.width, y: tileMapPub.pixelsPerUnit / tileSetPub.grid.height });
    if (tileSetPub.texture != null)
        mapArea_1.default.patternRenderer.setTileSet(new TileSet_1.default(tileSetPub));
    mapArea_1.default.patternBackgroundRenderer.setup(0x900090, 1 / tileMapPub.pixelsPerUnit, tileSetPub.grid.width);
    if (ui_1.default.brushToolButton.checked)
        ui_1.selectBrushTool(0, 0);
};
