"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ui_1 = require("./ui");
const tileSetArea_1 = require("./tileSetArea");
const network_1 = require("./network");
const _ = require("lodash");
const TileMap_1 = require("../../components/TileMap");
const TileMapRenderer_1 = require("../../components/TileMapRenderer");
const tmpVector3 = new SupEngine.THREE.Vector3();
// Map Area
const mapArea = {};
exports.default = mapArea;
mapArea.gameInstance = new SupEngine.GameInstance(document.querySelector("canvas.map"));
mapArea.gameInstance.threeRenderer.setClearColor(0xbbbbbb);
const cameraActor = new SupEngine.Actor(mapArea.gameInstance, "Camera");
cameraActor.setLocalPosition(new SupEngine.THREE.Vector3(0, 0, 100));
mapArea.cameraComponent = new SupEngine.componentClasses["Camera"](cameraActor);
mapArea.cameraComponent.setOrthographicMode(true);
mapArea.cameraControls = new SupEngine.editorComponentClasses["Camera2DControls"](cameraActor, mapArea.cameraComponent, { zoomSpeed: 1.5, zoomMin: 0.1, zoomMax: 10000 }, () => { mapArea.gridRenderer.setOrthgraphicScale(mapArea.cameraComponent.orthographicScale); });
mapArea.gridActor = new SupEngine.Actor(mapArea.gameInstance, "Grid");
mapArea.gridActor.setLocalPosition(new SupEngine.THREE.Vector3(0, 0, 90));
mapArea.gridRenderer = new SupEngine.editorComponentClasses["GridRenderer"](mapArea.gridActor, {
    width: 1, height: 1, ratio: { x: 1, y: 1 },
    orthographicScale: mapArea.cameraComponent.orthographicScale
});
mapArea.patternData = [];
mapArea.patternDataWidth = 1;
mapArea.patternActor = new SupEngine.Actor(mapArea.gameInstance, "Pattern");
mapArea.patternRenderer = new TileMapRenderer_1.default(mapArea.patternActor);
mapArea.patternBackgroundActor = new SupEngine.Actor(mapArea.gameInstance, "Pattern Background");
mapArea.patternBackgroundRenderer = new SupEngine.editorComponentClasses["FlatColorRenderer"](mapArea.patternBackgroundActor);
mapArea.duplicatingSelection = false;
mapArea.cursorPoint = { x: -1, y: -1 };
function setupPattern(layerData, width = 1, startX, startY) {
    mapArea.patternData = layerData;
    mapArea.patternDataWidth = width;
    const pub = network_1.data.tileMapUpdater.tileMapAsset.pub;
    const height = layerData.length / width;
    if (startX == null)
        startX = mapArea.cursorPoint.x;
    if (startY == null)
        startY = mapArea.cursorPoint.y;
    const patternLayerData = [];
    for (let y = 0; y < pub.height; y++) {
        for (let x = 0; x < pub.width; x++) {
            let localX = x - startX;
            let localY = y - startY;
            if (localX < 0 || localX >= width || localY < 0 || localY >= height)
                patternLayerData.push(0);
            else
                patternLayerData.push(layerData[localY * width + localX]);
        }
    }
    const patternData = {
        tileSetId: null,
        width: pub.width, height: pub.height,
        pixelsPerUnit: pub.pixelsPerUnit,
        layerDepthOffset: pub.layerDepthOffset,
        layers: [{ id: "0", name: "pattern", data: patternLayerData }]
    };
    mapArea.patternRenderer.setTileMap(new TileMap_1.default(patternData));
}
exports.setupPattern = setupPattern;
function setupFillPattern(newTileData) {
    const pub = network_1.data.tileMapUpdater.tileMapAsset.pub;
    const layerData = network_1.data.tileMapUpdater.tileMapAsset.layers.byId[tileSetArea_1.default.selectedLayerId].data;
    const patternLayerData = [];
    for (let y = 0; y < pub.height; y++) {
        for (let x = 0; x < pub.width; x++) {
            patternLayerData.push(0);
        }
    }
    const refTileData = layerData[mapArea.cursorPoint.y * pub.width + mapArea.cursorPoint.x];
    function checkTile(x, y) {
        if (x < 0 || x >= pub.width || y < 0 || y >= pub.height)
            return;
        const index = y * pub.width + x;
        // Skip if target tile on pattern isn't empty
        const patternTile = patternLayerData[index];
        if (patternTile !== 0)
            return;
        // Skip if target tile on layer is different from the base tile
        const layerTile = layerData[index];
        if (layerTile === 0) {
            if (refTileData !== 0)
                return;
        }
        else {
            for (let i = 0; i < layerTile.length; i++)
                if (layerTile[i] !== refTileData[i])
                    return;
        }
        patternLayerData[index] = _.cloneDeep(newTileData);
        checkTile(x - 1, y);
        checkTile(x + 1, y);
        checkTile(x, y - 1);
        checkTile(x, y + 1);
    }
    if (mapArea.cursorPoint.x >= 0 && mapArea.cursorPoint.x < pub.width && mapArea.cursorPoint.y >= 0 && mapArea.cursorPoint.y < pub.height)
        checkTile(mapArea.cursorPoint.x, mapArea.cursorPoint.y);
    const patternData = {
        tileSetId: null,
        width: pub.width, height: pub.height,
        pixelsPerUnit: pub.pixelsPerUnit,
        layerDepthOffset: pub.layerDepthOffset,
        layers: [{ id: "0", name: "pattern", data: patternLayerData }]
    };
    mapArea.patternRenderer.setTileMap(new TileMap_1.default(patternData));
}
exports.setupFillPattern = setupFillPattern;
function flipTilesHorizontally() {
    if (!mapArea.patternActor.threeObject.visible)
        return;
    const width = mapArea.patternDataWidth;
    const height = mapArea.patternData.length / mapArea.patternDataWidth;
    const layerData = [];
    for (let y = 0; y < height; y++) {
        for (let x = width - 1; x >= 0; x--) {
            const tileValue = mapArea.patternData[y * width + x];
            if (typeof tileValue === "number")
                layerData.push(0);
            else {
                tileValue[2] = !tileValue[2];
                if (tileValue[4] === 90)
                    tileValue[4] = 270;
                else if (tileValue[4] === 270)
                    tileValue[4] = 90;
                layerData.push(tileValue);
            }
        }
    }
    setupPattern(layerData, width);
}
exports.flipTilesHorizontally = flipTilesHorizontally;
function flipTilesVertically() {
    if (!mapArea.patternActor.threeObject.visible)
        return;
    const width = mapArea.patternDataWidth;
    const height = mapArea.patternData.length / mapArea.patternDataWidth;
    const layerData = [];
    for (let y = height - 1; y >= 0; y--) {
        for (let x = 0; x < width; x++) {
            const tileValue = mapArea.patternData[y * width + x];
            if (typeof tileValue === "number")
                layerData.push(0);
            else {
                tileValue[3] = !tileValue[3];
                if (tileValue[4] === 90)
                    tileValue[4] = 270;
                else if (tileValue[4] === 270)
                    tileValue[4] = 90;
                layerData.push(tileValue);
            }
        }
    }
    setupPattern(layerData, width);
}
exports.flipTilesVertically = flipTilesVertically;
function rotateTiles() {
    if (!mapArea.patternActor.threeObject.visible)
        return;
    const width = mapArea.patternDataWidth;
    const height = mapArea.patternData.length / mapArea.patternDataWidth;
    const layerData = [];
    for (let x = 0; x < width; x++) {
        for (let y = height - 1; y >= 0; y--) {
            const tileValue = mapArea.patternData[y * width + x];
            if (typeof tileValue === "number")
                layerData.push(0);
            else {
                tileValue[4] += 90;
                if (tileValue[4] === 360)
                    tileValue[4] = 0;
                layerData.push(tileValue);
            }
        }
    }
    setupPattern(layerData, height);
    const ratio = network_1.data.tileSetUpdater.tileSetAsset.pub.grid.width / network_1.data.tileSetUpdater.tileSetAsset.pub.grid.height;
    mapArea.patternBackgroundActor.setLocalScale(new SupEngine.THREE.Vector3(height, width / ratio, 1));
}
exports.rotateTiles = rotateTiles;
function getEditsFromPattern(point) {
    const edits = [];
    for (let tileIndex = 0; tileIndex < mapArea.patternData.length; tileIndex++) {
        const tileValue = mapArea.patternData[tileIndex];
        const x = point.x + tileIndex % mapArea.patternDataWidth;
        const y = point.y + Math.floor(tileIndex / mapArea.patternDataWidth);
        edits.push({ x, y, tileValue });
    }
    return edits;
}
function editMap(edits) {
    const actualEdits = [];
    const layer = network_1.data.tileMapUpdater.tileMapAsset.layers.byId[tileSetArea_1.default.selectedLayerId];
    for (const edit of edits) {
        if (edit.x >= 0 && edit.x < network_1.data.tileMapUpdater.tileMapAsset.pub.width && edit.y >= 0 && edit.y < network_1.data.tileMapUpdater.tileMapAsset.pub.height) {
            const index = edit.y * network_1.data.tileMapUpdater.tileMapAsset.pub.width + edit.x;
            let sameTile = true;
            if (edit.tileValue === 0) {
                if (layer.data[index] !== 0)
                    sameTile = false;
            }
            else {
                const tileValue = edit.tileValue;
                for (let i = 0; i < tileValue.length; i++) {
                    if (layer.data[index][i] !== tileValue[i]) {
                        sameTile = false;
                        break;
                    }
                }
            }
            if (!sameTile)
                actualEdits.push(edit);
        }
    }
    if (actualEdits.length === 0)
        return;
    network_1.data.projectClient.editAsset(SupClient.query.asset, "editMap", layer.id, actualEdits);
}
function getMapGridPosition(gameInstance, cameraComponent) {
    const mousePosition = gameInstance.input.mousePosition;
    const position = new SupEngine.THREE.Vector3(mousePosition.x, mousePosition.y, 0);
    cameraComponent.actor.getLocalPosition(tmpVector3);
    let x = position.x / gameInstance.threeRenderer.domElement.width;
    x = x * 2 - 1;
    x *= cameraComponent.orthographicScale / 2 * cameraComponent.cachedRatio;
    x += tmpVector3.x;
    x *= network_1.data.tileMapUpdater.tileMapAsset.pub.pixelsPerUnit / network_1.data.tileMapUpdater.tileSetAsset.pub.grid.width;
    x = Math.floor(x);
    let y = position.y / gameInstance.threeRenderer.domElement.height;
    y = y * 2 - 1;
    y *= cameraComponent.orthographicScale / 2;
    y -= tmpVector3.y;
    y *= network_1.data.tileMapUpdater.tileMapAsset.pub.pixelsPerUnit / network_1.data.tileMapUpdater.tileSetAsset.pub.grid.height;
    y = Math.floor(y);
    return [x, -y - 1];
}
function handleMapArea() {
    if (network_1.data.tileMapUpdater == null || network_1.data.tileMapUpdater.tileMapAsset == null ||
        network_1.data.tileMapUpdater.tileSetAsset == null || network_1.data.tileMapUpdater.tileSetAsset.pub.texture == null) {
        mapArea.patternActor.threeObject.visible = false;
        mapArea.patternBackgroundActor.threeObject.visible = false;
        return;
    }
    const pub = network_1.data.tileMapUpdater.tileMapAsset.pub;
    const input = mapArea.gameInstance.input;
    const [mouseX, mouseY] = getMapGridPosition(mapArea.gameInstance, mapArea.cameraComponent);
    let cursorHasMoved = false;
    if (mouseX !== mapArea.cursorPoint.x || mouseY !== mapArea.cursorPoint.y) {
        cursorHasMoved = true;
        mapArea.cursorPoint.x = mouseX;
        mapArea.cursorPoint.y = mouseY;
        ui_1.default.mousePositionLabel.x.textContent = mouseX.toString();
        ui_1.default.mousePositionLabel.y.textContent = mouseY.toString();
    }
    if (ui_1.default.brushToolButton.checked)
        handleBrushMode(cursorHasMoved);
    else if (ui_1.default.fillToolButton.checked)
        handleFillMode(cursorHasMoved);
    else if (ui_1.default.selectionToolButton.checked)
        handleSelectionMode(cursorHasMoved);
    else if (ui_1.default.eraserToolButton.checked)
        handleEraserMode(cursorHasMoved);
    // Quick switch to Brush or Eraser
    if (input.mouseButtons[2].wasJustReleased && (ui_1.default.brushToolButton.checked || ui_1.default.eraserToolButton.checked)) {
        if (mouseX >= 0 && mouseX < pub.width && mouseY >= 0 && mouseY < pub.height) {
            const layer = network_1.data.tileMapUpdater.tileMapAsset.layers.byId[tileSetArea_1.default.selectedLayerId];
            const tile = layer.data[mouseY * pub.width + mouseX];
            if (typeof tile === "number") {
                ui_1.selectEraserTool();
            }
            else {
                ui_1.selectBrushTool(tile[0], tile[1]);
                setupPattern([tile]);
            }
        }
    }
    // Update pattern background
    if (mapArea.patternActor.threeObject.visible || ui_1.default.eraserToolButton.checked) {
        const layer = network_1.data.tileMapUpdater.tileMapAsset.layers.byId[tileSetArea_1.default.selectedLayerId];
        const z = (pub.layers.indexOf(layer) + 0.5) * pub.layerDepthOffset;
        const ratioX = pub.pixelsPerUnit / network_1.data.tileMapUpdater.tileSetAsset.pub.grid.width;
        const ratioY = pub.pixelsPerUnit / network_1.data.tileMapUpdater.tileSetAsset.pub.grid.height;
        const patternPosition = new SupEngine.THREE.Vector3(mouseX / ratioX, mouseY / ratioY, z);
        mapArea.patternBackgroundActor.setLocalPosition(patternPosition);
    }
}
exports.handleMapArea = handleMapArea;
function handleBrushMode(cursorHasMoved) {
    const pub = network_1.data.tileMapUpdater.tileMapAsset.pub;
    const input = mapArea.gameInstance.input;
    const shiftKey = input.keyboardButtons[window.KeyEvent.DOM_VK_SHIFT];
    if (input.mouseButtons[0].isDown) {
        if (mapArea.lastTile != null && shiftKey.isDown) {
            const xMin = Math.min(mapArea.cursorPoint.x, mapArea.lastTile.x);
            const xOffset = Math.abs(mapArea.cursorPoint.x - mapArea.lastTile.x) + 1;
            const yMin = Math.min(mapArea.cursorPoint.y, mapArea.lastTile.y);
            const yOffset = Math.abs(mapArea.cursorPoint.y - mapArea.lastTile.y) + 1;
            const point = { x: 0, y: 0 };
            if (xOffset > yOffset) {
                point.x = xMin;
                point.y = mapArea.lastTile.y;
            }
            else {
                point.x = mapArea.lastTile.x;
                point.y = yMin;
            }
            editMap(getEditsFromPattern(point));
            setupPattern([mapArea.patternData[0]], 1);
        }
        else
            editMap(getEditsFromPattern(mapArea.cursorPoint));
        const x = mapArea.cursorPoint.x;
        const y = mapArea.cursorPoint.y;
        if (mapArea.patternData.length === 1 && x >= 0 && x < pub.width && y >= 0 && y < pub.height)
            mapArea.lastTile = { x, y, tile: mapArea.patternData[0].slice() };
    }
    else if (mapArea.lastTile != null && shiftKey.wasJustReleased) {
        setupPattern([mapArea.lastTile.tile]);
    }
    else if (mapArea.lastTile != null && shiftKey.isDown) {
        const xMin = Math.min(mapArea.cursorPoint.x, mapArea.lastTile.x);
        const xOffset = Math.abs(mapArea.cursorPoint.x - mapArea.lastTile.x) + 1;
        const yMin = Math.min(mapArea.cursorPoint.y, mapArea.lastTile.y);
        const yOffset = Math.abs(mapArea.cursorPoint.y - mapArea.lastTile.y) + 1;
        const patternData = [];
        if (xOffset > yOffset) {
            for (let x = 0; x < xOffset; x++)
                patternData.push(mapArea.lastTile.tile);
            setupPattern(patternData, xOffset, xMin, mapArea.lastTile.y);
        }
        else {
            for (let y = 0; y < yOffset; y++)
                patternData.push(mapArea.lastTile.tile);
            setupPattern(patternData, 1, mapArea.lastTile.x, yMin);
        }
    }
    else if (cursorHasMoved)
        setupPattern(mapArea.patternData, mapArea.patternDataWidth);
}
function handleFillMode(cursorHasMoved) {
    if (cursorHasMoved) {
        network_1.data.tileSetUpdater.tileSetRenderer.selectedTileActor.getLocalPosition(tmpVector3);
        setupFillPattern([tmpVector3.x, -tmpVector3.y, false, false, 0]);
    }
    if (!mapArea.gameInstance.input.mouseButtons[0].wasJustPressed)
        return;
    const pub = network_1.data.tileMapUpdater.tileMapAsset.pub;
    const edits = [];
    for (let y = 0; y < pub.height; y++) {
        for (let x = 0; x < pub.width; x++) {
            const tileValue = mapArea.patternRenderer.tileMap.getTileAt(0, x, y);
            if (tileValue !== 0)
                edits.push({ x, y, tileValue });
        }
    }
    editMap(edits);
}
function handleSelectionMode(cursorHasMoved) {
    const pub = network_1.data.tileMapUpdater.tileMapAsset.pub;
    const input = mapArea.gameInstance.input;
    const keyEvent = window.KeyEvent;
    const cancelAction = input.mouseButtons[2].wasJustPressed || input.keyboardButtons[keyEvent.DOM_VK_ESCAPE].wasJustPressed;
    // Moving/duplicating a pattern
    if (mapArea.patternActor.threeObject.visible) {
        if (cursorHasMoved)
            setupPattern(mapArea.patternData, mapArea.patternDataWidth);
        if (input.mouseButtons[0].wasJustPressed) {
            editMap(getEditsFromPattern(mapArea.cursorPoint));
            if (!mapArea.duplicatingSelection)
                clearSelection();
        }
        else if (cancelAction) {
            clearSelection();
        }
        return;
    }
    // Selection with mouse
    if (cancelAction)
        clearSelection();
    if (input.mouseButtons[0].wasJustPressed) {
        // A pattern is already in the buffer
        if (!mapArea.patternActor.threeObject.visible) {
            if (mapArea.cursorPoint.x >= 0 && mapArea.cursorPoint.x < pub.width && mapArea.cursorPoint.y >= 0 && mapArea.cursorPoint.y < pub.height) {
                mapArea.patternBackgroundActor.threeObject.visible = true;
                mapArea.selectionStartPoint = { x: mapArea.cursorPoint.x, y: mapArea.cursorPoint.y };
            }
            else {
                clearSelection();
            }
        }
    }
    if (mapArea.selectionStartPoint == null)
        return;
    if (input.mouseButtons[0].isDown) {
        // Clamp mouse values
        const x = Math.max(0, Math.min(pub.width - 1, mapArea.cursorPoint.x));
        const y = Math.max(0, Math.min(pub.height - 1, mapArea.cursorPoint.y));
        mapArea.selectionEndPoint = { x, y };
    }
    const startX = Math.min(mapArea.selectionStartPoint.x, mapArea.selectionEndPoint.x);
    const startY = Math.min(mapArea.selectionStartPoint.y, mapArea.selectionEndPoint.y);
    const width = Math.abs(mapArea.selectionEndPoint.x - mapArea.selectionStartPoint.x) + 1;
    const height = Math.abs(mapArea.selectionEndPoint.y - mapArea.selectionStartPoint.y) + 1;
    const ratioX = pub.pixelsPerUnit / network_1.data.tileMapUpdater.tileSetAsset.pub.grid.width;
    const ratioY = pub.pixelsPerUnit / network_1.data.tileMapUpdater.tileSetAsset.pub.grid.height;
    const z = network_1.data.tileMapUpdater.tileMapAsset.layers.pub.length * pub.layerDepthOffset;
    const patternPosition = new SupEngine.THREE.Vector3(startX / ratioX, startY / ratioY, z);
    mapArea.patternBackgroundActor.setLocalPosition(patternPosition);
    const ratio = network_1.data.tileSetUpdater.tileSetAsset.pub.grid.width / network_1.data.tileSetUpdater.tileSetAsset.pub.grid.height;
    mapArea.patternBackgroundActor.setLocalScale(new SupEngine.THREE.Vector3(width, height / ratio, 1));
    // Delete selection
    if (input.keyboardButtons[keyEvent.DOM_VK_DELETE].wasJustReleased) {
        const edits = [];
        walkSelection((x, y) => { edits.push({ x: startX + x, y: startY + y, tileValue: 0 }); });
        editMap(edits);
        mapArea.patternBackgroundActor.threeObject.visible = false;
        mapArea.selectionStartPoint = null;
    }
    // Move/duplicate the selection
    else if (input.keyboardButtons[keyEvent.DOM_VK_M].wasJustReleased || input.keyboardButtons[keyEvent.DOM_VK_D].wasJustReleased) {
        const layer = network_1.data.tileMapUpdater.tileMapAsset.layers.byId[tileSetArea_1.default.selectedLayerId];
        mapArea.duplicatingSelection = input.keyboardButtons[keyEvent.DOM_VK_D].wasJustReleased;
        if (!mapArea.duplicatingSelection) {
            const edits = [];
            walkSelection((x, y) => { edits.push({ x: startX + x, y: startY + y, tileValue: 0 }); });
            editMap(edits);
        }
        const layerData = [];
        walkSelection((x, y) => {
            const tile = layer.data[(startY + y) * pub.width + startX + x];
            layerData.push(tile);
        });
        setupPattern(layerData, width);
        mapArea.patternActor.threeObject.visible = true;
        mapArea.selectionStartPoint = null;
    }
}
function walkSelection(callback) {
    const width = Math.abs(mapArea.selectionEndPoint.x - mapArea.selectionStartPoint.x) + 1;
    const height = Math.abs(mapArea.selectionEndPoint.y - mapArea.selectionStartPoint.y) + 1;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            callback(x, y);
        }
    }
}
function clearSelection() {
    mapArea.selectionStartPoint = null;
    mapArea.patternBackgroundActor.threeObject.visible = false;
    mapArea.patternActor.threeObject.visible = false;
    mapArea.duplicatingSelection = false;
}
function selectEntireLayer() {
    mapArea.patternBackgroundActor.threeObject.visible = true;
    mapArea.selectionStartPoint = { x: 0, y: 0 };
    mapArea.selectionEndPoint = {
        x: network_1.data.tileMapUpdater.tileMapAsset.pub.width - 1,
        y: network_1.data.tileMapUpdater.tileMapAsset.pub.height - 1
    };
}
exports.selectEntireLayer = selectEntireLayer;
function handleEraserMode(cursorHasMoved) {
    if (mapArea.gameInstance.input.mouseButtons[0].isDown)
        editMap([{ x: mapArea.cursorPoint.x, y: mapArea.cursorPoint.y, tileValue: 0 }]);
}
