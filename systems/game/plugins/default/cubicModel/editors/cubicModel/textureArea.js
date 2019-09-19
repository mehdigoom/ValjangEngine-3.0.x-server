"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ui_1 = require("./ui");
const network_1 = require("./network");
const CubicModelNodes_1 = require("../../data/CubicModelNodes");
const THREE = SupEngine.THREE;
const tmpVector3 = new THREE.Vector3();
const textureArea = { shapeLineMeshesByNodeId: {} };
exports.default = textureArea;
const canvas = document.querySelector(".texture-container canvas");
if (SupApp != null) {
    document.addEventListener("copy", (event) => {
        if (document.activeElement !== canvas)
            return;
        const dataURL = network_1.data.cubicModelUpdater.cubicModelAsset.clientTextureDatas["map"].ctx.canvas.toDataURL();
        SupApp.clipboard.copyFromDataURL(dataURL);
    });
}
const pasteCtx = document.createElement("canvas").getContext("2d");
document.addEventListener("paste", (event) => {
    if (document.activeElement !== canvas)
        return;
    if (event.clipboardData.items[0] == null)
        return;
    if (event.clipboardData.items[0].type.indexOf("image") === -1)
        return;
    if (textureArea.mode !== "paint")
        return;
    if (textureArea.pasteMesh != null)
        clearPasteSelection();
    const imageBlob = event.clipboardData.items[0].getAsFile();
    const image = new Image();
    image.src = URL.createObjectURL(imageBlob);
    image.onload = () => {
        pasteCtx.canvas.width = image.width;
        pasteCtx.canvas.height = image.height;
        pasteCtx.drawImage(image, 0, 0);
        const texture = new THREE.Texture(pasteCtx.canvas);
        texture.needsUpdate = true;
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        const geom = new THREE.PlaneBufferGeometry(image.width, image.height, 1, 1);
        const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, map: texture });
        textureArea.pasteMesh = new THREE.Mesh(geom, mat);
        textureArea.pasteActor.threeObject.add(textureArea.pasteMesh);
        textureArea.pasteActor.setLocalPosition(tmpVector3.set(image.width / 2, -image.height / 2, 1));
        textureArea.selectionRenderer.setSize(image.width, image.height);
        textureArea.selectionRenderer.actor.setParent(textureArea.pasteActor);
        textureArea.selectionRenderer.actor.setLocalPosition(tmpVector3.set(0, 0, 5));
        textureArea.selectionRenderer.actor.threeObject.visible = true;
    };
});
textureArea.gameInstance = new SupEngine.GameInstance(canvas);
textureArea.gameInstance.threeRenderer.setClearColor(0xbbbbbb);
const cameraActor = new SupEngine.Actor(textureArea.gameInstance, "Camera");
cameraActor.setLocalPosition(new SupEngine.THREE.Vector3(0, 0, 10));
const cameraComponent = new SupEngine.componentClasses["Camera"](cameraActor);
cameraComponent.setOrthographicMode(true);
cameraComponent.setOrthographicScale(10);
textureArea.cameraControls = new SupEngine.editorComponentClasses["Camera2DControls"](cameraActor, cameraComponent, { zoomSpeed: 1.5, zoomMin: 1, zoomMax: 200 });
const selectionActor = new SupEngine.Actor(textureArea.gameInstance, "Selection");
textureArea.selectionRenderer = new SupEngine.editorComponentClasses["SelectionRenderer"](selectionActor);
textureArea.pasteActor = new SupEngine.Actor(textureArea.gameInstance, "Paste");
function clearPasteSelection() {
    textureArea.pasteActor.threeObject.remove(textureArea.pasteMesh);
    textureArea.selectionRenderer.actor.setParent(null);
    textureArea.selectionRenderer.actor.threeObject.visible = false;
    textureArea.pasteMesh = null;
}
function setup() {
    setupTexture();
    network_1.data.cubicModelUpdater.cubicModelAsset.nodes.walk(addNode);
}
exports.setup = setup;
function setupTexture() {
    if (textureArea.textureMesh != null)
        textureArea.gameInstance.threeScene.remove(textureArea.textureMesh);
    const asset = network_1.data.cubicModelUpdater.cubicModelAsset;
    const threeTexture = network_1.data.cubicModelUpdater.cubicModelAsset.pub.textures["map"];
    const geom = new THREE.PlaneBufferGeometry(asset.pub.textureWidth, asset.pub.textureHeight, 1, 1);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, map: threeTexture });
    textureArea.textureMesh = new THREE.Mesh(geom, mat);
    textureArea.textureMesh.position.set(asset.pub.textureWidth / 2, -asset.pub.textureHeight / 2, -1);
    textureArea.gameInstance.threeScene.add(textureArea.textureMesh);
    textureArea.textureMesh.updateMatrixWorld(false);
}
exports.setupTexture = setupTexture;
textureArea.mode = "layout";
updateMode();
document.querySelector(".texture-container .controls .mode-selection").addEventListener("click", (event) => {
    const target = event.target;
    if (target.tagName !== "INPUT")
        return;
    textureArea.mode = target.value;
    updateMode();
    clearPasteSelection();
});
textureArea.paintTool = "brush";
document.querySelector(".texture-container .controls .paint-mode-container .tool").addEventListener("click", (event) => {
    const target = event.target;
    if (target.tagName !== "INPUT")
        return;
    textureArea.paintTool = target.value;
});
function updateMode() {
    for (const mode of ["layout", "paint"]) {
        const container = document.querySelector(`.${mode}-mode-container`);
        container.hidden = mode !== textureArea.mode;
    }
}
textureArea.colorInput = document.querySelector("input.color");
const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff00ff, opacity: 0.4, depthTest: false, depthWrite: false, transparent: true });
const selectedLineMaterial = new THREE.LineBasicMaterial({ color: 0xff00ff, opacity: 1, depthTest: false, depthWrite: false, transparent: true });
const verticesByShapeType = {
    "none": 0,
    "box": 20
};
function addNode(node) {
    const geometry = new THREE.Geometry();
    const line = new THREE.LineSegments(geometry, lineMaterial);
    textureArea.shapeLineMeshesByNodeId[node.id] = line;
    textureArea.gameInstance.threeScene.add(line);
    line.updateMatrixWorld(false);
    updateNode(node);
}
exports.addNode = addNode;
function updateNode(node) {
    const line = textureArea.shapeLineMeshesByNodeId[node.id];
    const verticesCount = verticesByShapeType[node.shape.type];
    const vertices = line.geometry.vertices;
    if (vertices.length < verticesCount) {
        for (let i = vertices.length; i < verticesCount; i++)
            vertices.push(new THREE.Vector3(0, 0, 0));
    }
    else if (vertices.length > verticesCount) {
        vertices.length = verticesCount;
    }
    // let origin = { x: node.shape.textureOffset.x, y: -node.shape.textureOffset.y };
    // TEMPORARY
    const origin = { x: node.shape.textureLayout["left"].offset.x, y: -node.shape.textureLayout["top"].offset.y };
    switch (node.shape.type) {
        case "box":
            const size = node.shape.settings.size;
            // Top horizontal line
            vertices[0].set(origin.x + size.z, origin.y, 1);
            vertices[1].set(origin.x + size.z + size.x * 2, origin.y, 1);
            // Shared horizontal line
            vertices[2].set(origin.x, origin.y - size.z, 1);
            vertices[3].set(origin.x + size.x * 2 + size.z * 2, origin.y - size.z, 1);
            // Bottom horizontal line
            vertices[4].set(origin.x, origin.y - size.z - size.y, 1);
            vertices[5].set(origin.x + size.x * 2 + size.z * 2, origin.y - size.z - size.y, 1);
            // Shared vertical line
            vertices[6].set(origin.x + size.z, origin.y, 1);
            vertices[7].set(origin.x + size.z, origin.y - size.z - size.y, 1);
            // First row, second vertical line
            vertices[8].set(origin.x + size.z + size.x, origin.y, 1);
            vertices[9].set(origin.x + size.z + size.x, origin.y - size.z, 1);
            // First row, third vertical line
            vertices[10].set(origin.x + size.z + size.x * 2, origin.y, 1);
            vertices[11].set(origin.x + size.z + size.x * 2, origin.y - size.z, 1);
            // Second row, first vertical line
            vertices[12].set(origin.x, origin.y - size.z, 1);
            vertices[13].set(origin.x, origin.y - size.z - size.y, 1);
            // Second row, fifth vertical line
            vertices[14].set(origin.x + size.x * 2 + size.z * 2, origin.y - size.z, 1);
            vertices[15].set(origin.x + size.x * 2 + size.z * 2, origin.y - size.z - size.y, 1);
            // Second row, third vertical line
            vertices[16].set(origin.x + size.x + size.z, origin.y - size.z, 1);
            vertices[17].set(origin.x + size.x + size.z, origin.y - size.z - size.y, 1);
            // Second row, fourth vertical line
            vertices[18].set(origin.x + size.x + size.z * 2, origin.y - size.z, 1);
            vertices[19].set(origin.x + size.x + size.z * 2, origin.y - size.z - size.y, 1);
            break;
    }
    line.geometry.verticesNeedUpdate = true;
}
exports.updateNode = updateNode;
function updateRemovedNode() {
    for (const nodeId in textureArea.shapeLineMeshesByNodeId) {
        if (network_1.data.cubicModelUpdater.cubicModelAsset.nodes.byId[nodeId] != null)
            continue;
        const line = textureArea.shapeLineMeshesByNodeId[nodeId];
        line.parent.remove(line);
        line.geometry.dispose();
        delete textureArea.shapeLineMeshesByNodeId[nodeId];
    }
}
exports.updateRemovedNode = updateRemovedNode;
const selectedNodeLineMeshes = [];
function setSelectedNode(nodeIds) {
    for (const selectedNodeLineMesh of selectedNodeLineMeshes)
        selectedNodeLineMesh.material = lineMaterial;
    selectedNodeLineMeshes.length = 0;
    for (const nodeId of nodeIds) {
        const selectedNodeLineMesh = textureArea.shapeLineMeshesByNodeId[nodeId];
        selectedNodeLineMesh.material = selectedLineMaterial;
        selectedNodeLineMeshes.push(selectedNodeLineMesh);
    }
}
exports.setSelectedNode = setSelectedNode;
const mousePosition = new THREE.Vector3();
const cameraPosition = new THREE.Vector3();
let isDrawing = false;
let isDragging = false;
let isMouseDown = false;
let hasMouseMoved = false;
const previousMousePosition = new THREE.Vector3();
function handleTextureArea() {
    const inputs = textureArea.gameInstance.input;
    const keys = window.KeyEvent;
    mousePosition.set(inputs.mousePosition.x, inputs.mousePosition.y, 0);
    cameraComponent.actor.getLocalPosition(cameraPosition);
    mousePosition.x /= textureArea.gameInstance.threeRenderer.domElement.width;
    mousePosition.x = mousePosition.x * 2 - 1;
    mousePosition.x *= cameraComponent.orthographicScale / 2 * cameraComponent.cachedRatio;
    mousePosition.x += cameraPosition.x;
    mousePosition.x = Math.floor(mousePosition.x);
    mousePosition.y /= textureArea.gameInstance.threeRenderer.domElement.height;
    mousePosition.y = mousePosition.y * 2 - 1;
    mousePosition.y *= cameraComponent.orthographicScale / 2;
    mousePosition.y -= cameraPosition.y;
    mousePosition.y = Math.floor(mousePosition.y);
    if (textureArea.mode === "layout") {
        if (isMouseDown && !inputs.mouseButtons[0].isDown) {
            isDragging = false;
            isMouseDown = false;
            if (!hasMouseMoved && !isDragging) {
                const hoveredNodeIds = getHoveredNodeIds();
                const isShiftDown = inputs.keyboardButtons[keys.DOM_VK_SHIFT].isDown;
                if (!isShiftDown)
                    ui_1.default.nodesTreeView.clearSelection();
                if (hoveredNodeIds.length > 0) {
                    if (!isShiftDown) {
                        const nodeElt = ui_1.default.nodesTreeView.treeRoot.querySelector(`li[data-id='${hoveredNodeIds[0]}']`);
                        ui_1.default.nodesTreeView.addToSelection(nodeElt);
                    }
                    else {
                        for (const nodeId of hoveredNodeIds) {
                            let isAlreadyAdded = false;
                            for (const nodeElt of ui_1.default.nodesTreeView.selectedNodes) {
                                if (nodeId === nodeElt.dataset["id"]) {
                                    isAlreadyAdded = true;
                                    break;
                                }
                            }
                            if (!isAlreadyAdded) {
                                const nodeElt = ui_1.default.nodesTreeView.treeRoot.querySelector(`li[data-id='${nodeId}']`);
                                ui_1.default.nodesTreeView.addToSelection(nodeElt);
                                break;
                            }
                        }
                    }
                }
                ui_1.setupSelectedNode();
            }
            hasMouseMoved = false;
        }
        else if (isDragging) {
            const x = mousePosition.x - previousMousePosition.x;
            const y = mousePosition.y - previousMousePosition.y;
            if (x !== 0 || y !== 0) {
                hasMouseMoved = true;
                const nodeIds = [];
                for (const selectedNode of ui_1.default.nodesTreeView.selectedNodes)
                    nodeIds.push(selectedNode.dataset["id"]);
                network_1.data.projectClient.editAsset(SupClient.query.asset, "moveNodeTextureOffset", nodeIds, { x, y });
            }
        }
        else if (inputs.mouseButtons[0].wasJustPressed) {
            isMouseDown = true;
            hasMouseMoved = false;
            const hoveredNodeIds = getHoveredNodeIds();
            for (const selectedNode of ui_1.default.nodesTreeView.selectedNodes) {
                if (hoveredNodeIds.indexOf(selectedNode.dataset["id"]) !== -1) {
                    isDragging = true;
                    break;
                }
            }
        }
        previousMousePosition.set(mousePosition.x, mousePosition.y, 0);
    }
    else if (textureArea.mode === "paint") {
        if (isMouseDown && !inputs.mouseButtons[0].isDown)
            isMouseDown = false;
        // Paste element
        if (textureArea.pasteMesh != null) {
            if (isMouseDown) {
                tmpVector3.set(mousePosition.x + previousMousePosition.x, -mousePosition.y + previousMousePosition.y, 0);
                textureArea.pasteActor.setLocalPosition(tmpVector3);
                return;
            }
            if (inputs.keyboardButtons[keys.DOM_VK_RIGHT].wasJustPressed) {
                textureArea.pasteMesh.position.x += 1;
                textureArea.pasteMesh.updateMatrixWorld(false);
            }
            if (inputs.keyboardButtons[keys.DOM_VK_LEFT].wasJustPressed) {
                textureArea.pasteMesh.position.x -= 1;
                textureArea.pasteMesh.updateMatrixWorld(false);
            }
            if (inputs.keyboardButtons[keys.DOM_VK_UP].wasJustPressed) {
                textureArea.pasteMesh.position.y += 1;
                textureArea.pasteMesh.updateMatrixWorld(false);
            }
            if (inputs.keyboardButtons[keys.DOM_VK_DOWN].wasJustPressed) {
                textureArea.pasteMesh.position.y -= 1;
                textureArea.pasteMesh.updateMatrixWorld(false);
            }
            if (inputs.mouseButtons[0].wasJustPressed) {
                const position = textureArea.pasteActor.getLocalPosition(tmpVector3);
                const width = pasteCtx.canvas.width;
                const height = pasteCtx.canvas.height;
                if (mousePosition.x > position.x - width / 2 && mousePosition.x < position.x + width / 2 &&
                    -mousePosition.y > position.y - height / 2 && -mousePosition.y < position.y + height / 2) {
                    isMouseDown = true;
                    previousMousePosition.set(position.x - mousePosition.x, position.y + mousePosition.y, 0);
                    return;
                }
                const imageData = pasteCtx.getImageData(0, 0, width, height).data;
                const edits = [];
                const startX = position.x - width / 2;
                const startY = -position.y - height / 2;
                for (let i = 0; i < width; i++) {
                    for (let j = 0; j < height; j++) {
                        const index = (j * width + i) * 4;
                        const x = startX + i;
                        if (x < 0 || x >= network_1.data.cubicModelUpdater.cubicModelAsset.pub.textureWidth)
                            continue;
                        const y = startY + j;
                        if (y < 0 || y >= network_1.data.cubicModelUpdater.cubicModelAsset.pub.textureHeight)
                            continue;
                        edits.push({ x, y, value: { r: imageData[index], g: imageData[index + 1], b: imageData[index + 2], a: imageData[index + 3] } });
                    }
                }
                network_1.data.projectClient.editAsset(SupClient.query.asset, "editTexture", "map", edits);
                clearPasteSelection();
            }
            return;
        }
        // Edit texture
        if (!isDrawing) {
            if (inputs.mouseButtons[0].wasJustPressed)
                isDrawing = true;
            else if (inputs.mouseButtons[2].wasJustPressed) {
                if (mousePosition.x < 0 || mousePosition.x >= network_1.data.cubicModelUpdater.cubicModelAsset.pub.textureWidth)
                    return;
                if (mousePosition.y < 0 || mousePosition.y >= network_1.data.cubicModelUpdater.cubicModelAsset.pub.textureHeight)
                    return;
                const textureData = network_1.data.cubicModelUpdater.cubicModelAsset.textureDatas["map"];
                const index = (mousePosition.y * network_1.data.cubicModelUpdater.cubicModelAsset.pub.textureWidth + mousePosition.x) * 4;
                const r = textureData[index + 0];
                const g = textureData[index + 1];
                const b = textureData[index + 2];
                const a = textureData[index + 3];
                if (a === 0) {
                    document.getElementById("eraser-tool").checked = true;
                    textureArea.paintTool = "eraser";
                }
                else {
                    document.getElementById("brush-tool").checked = true;
                    textureArea.paintTool = "brush";
                    const hex = ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
                    textureArea.colorInput.value = `#${hex}`;
                }
            }
        }
        else if (!inputs.mouseButtons[0].isDown)
            isDrawing = false;
        if (isDrawing) {
            if (mousePosition.x < 0 || mousePosition.x >= network_1.data.cubicModelUpdater.cubicModelAsset.pub.textureWidth)
                return;
            if (mousePosition.y < 0 || mousePosition.y >= network_1.data.cubicModelUpdater.cubicModelAsset.pub.textureHeight)
                return;
            const hex = parseInt(textureArea.colorInput.value.slice(1), 16);
            const brush = { r: 0, g: 0, b: 0, a: 0 };
            if (textureArea.paintTool === "brush") {
                brush.r = (hex >> 16 & 255);
                brush.g = (hex >> 8 & 255);
                brush.b = (hex & 255);
                brush.a = 255;
            }
            const mapName = "map";
            const textureData = network_1.data.cubicModelUpdater.cubicModelAsset.textureDatas[mapName];
            const index = (mousePosition.y * network_1.data.cubicModelUpdater.cubicModelAsset.pub.textureWidth + mousePosition.x) * 4;
            if (textureData[index + 0] !== brush.r || textureData[index + 1] !== brush.g || textureData[index + 2] !== brush.b || textureData[index + 3] !== brush.a) {
                const edits = [];
                edits.push({ x: mousePosition.x, y: mousePosition.y, value: brush });
                network_1.data.projectClient.editAsset(SupClient.query.asset, "editTexture", mapName, edits);
            }
        }
    }
}
exports.handleTextureArea = handleTextureArea;
function getHoveredNodeIds() {
    const hoveredNodeIds = [];
    for (const nodeId in network_1.data.cubicModelUpdater.cubicModelAsset.nodes.byId) {
        const node = network_1.data.cubicModelUpdater.cubicModelAsset.nodes.byId[nodeId];
        for (const faceName in node.shape.textureLayout) {
            const face = node.shape.textureLayout[faceName];
            const size = CubicModelNodes_1.getShapeTextureFaceSize(node.shape, faceName);
            if (mousePosition.x >= face.offset.x && mousePosition.x < face.offset.x + size.width &&
                mousePosition.y >= face.offset.y && mousePosition.y < face.offset.y + size.height) {
                hoveredNodeIds.push(nodeId);
                break;
            }
        }
    }
    return hoveredNodeIds;
}
