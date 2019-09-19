(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class TileMapRendererEditor {
    constructor(tbody, config, projectClient, editConfig) {
        this.onChangeTileSetAsset = (event) => {
            if (event.target.value === "")
                this.editConfig("setProperty", "tileSetAssetId", null);
            else {
                const entry = SupClient.findEntryByPath(this.projectClient.entries.pub, event.target.value);
                if (entry != null && entry.type === "tileSet")
                    this.editConfig("setProperty", "tileSetAssetId", entry.id);
            }
        };
        this.projectClient = projectClient;
        this.editConfig = editConfig;
        this.tbody = tbody;
        this.tileMapAssetId = config.tileMapAssetId;
        this.tileSetAssetId = config.tileSetAssetId;
        this.shaderAssetId = config.shaderAssetId;
        const tileMapRow = SupClient.table.appendRow(tbody, SupClient.i18n.t("componentEditors:TileMapRenderer.tileMap"));
        this.tileMapFieldSubscriber = SupClient.table.appendAssetField(tileMapRow.valueCell, this.tileMapAssetId, "tileMap", projectClient);
        this.tileMapFieldSubscriber.on("select", (assetId) => {
            this.editConfig("setProperty", "tileMapAssetId", assetId);
        });
        const tileSetRow = SupClient.table.appendRow(tbody, SupClient.i18n.t("componentEditors:TileMapRenderer.tileSet"));
        this.tileSetTextField = SupClient.table.appendTextField(tileSetRow.valueCell, "");
        this.tileSetTextField.disabled = true;
        this.tileSetTextField.addEventListener("input", this.onChangeTileSetAsset);
        const shadowRow = SupClient.table.appendRow(tbody, SupClient.i18n.t("componentEditors:TileMapRenderer.shadow.title"));
        const shadowDiv = document.createElement("div");
        shadowDiv.classList.add("inputs");
        shadowRow.valueCell.appendChild(shadowDiv);
        const castSpan = document.createElement("span");
        castSpan.style.marginLeft = "5px";
        castSpan.textContent = SupClient.i18n.t("componentEditors:TileMapRenderer.shadow.cast");
        shadowDiv.appendChild(castSpan);
        this.castShadowField = SupClient.table.appendBooleanField(shadowDiv, config.castShadow);
        this.castShadowField.addEventListener("change", (event) => {
            this.editConfig("setProperty", "castShadow", event.target.checked);
        });
        const receiveSpan = document.createElement("span");
        receiveSpan.style.marginLeft = "5px";
        receiveSpan.textContent = SupClient.i18n.t("componentEditors:TileMapRenderer.shadow.receive");
        shadowDiv.appendChild(receiveSpan);
        this.receiveShadowField = SupClient.table.appendBooleanField(shadowDiv, config.receiveShadow);
        this.receiveShadowField.addEventListener("change", (event) => {
            this.editConfig("setProperty", "receiveShadow", event.target.checked);
        });
        const materialRow = SupClient.table.appendRow(tbody, SupClient.i18n.t("componentEditors:TileMapRenderer.material"));
        this.materialSelectBox = SupClient.table.appendSelectBox(materialRow.valueCell, { "basic": "Basic", "phong": "Phong", "shader": "Shader" }, config.materialType);
        this.materialSelectBox.addEventListener("change", (event) => {
            this.editConfig("setProperty", "materialType", event.target.value);
        });
        const shaderRow = SupClient.table.appendRow(tbody, SupClient.i18n.t("componentEditors:TileMapRenderer.shader"));
        this.shaderRow = shaderRow.row;
        this.shaderFieldSubscriber = SupClient.table.appendAssetField(shaderRow.valueCell, this.shaderAssetId, "shader", projectClient);
        this.shaderFieldSubscriber.on("select", (assetId) => {
            this.editConfig("setProperty", "shaderAssetId", assetId);
        });
        this.shaderRow.hidden = config.materialType !== "shader";
    }
    destroy() {
        this.tileMapFieldSubscriber.destroy();
        this.shaderFieldSubscriber.destroy();
    }
    config_setProperty(path, value) {
        if (this.projectClient.entries == null)
            return;
        switch (path) {
            case "tileMapAssetId":
                this.tileMapAssetId = value;
                this.tileMapFieldSubscriber.onChangeAssetId(this.tileMapAssetId);
                break;
            case "tileSetAssetId":
                this.tileSetAssetId = value;
                if (this.tileSetAssetId != null)
                    this.tileSetTextField.value = this.projectClient.entries.getPathFromId(this.tileSetAssetId);
                else
                    this.tileSetTextField.value = "";
                break;
            case "castShadow":
                this.castShadowField.checked = value;
                break;
            case "receiveShadow":
                this.receiveShadowField.checked = value;
                break;
            case "materialType":
                this.materialSelectBox.value = value;
                this.shaderRow.hidden = value !== "shader";
                break;
            case "shaderAssetId":
                this.shaderAssetId = value;
                this.shaderFieldSubscriber.onChangeAssetId(this.shaderAssetId);
                break;
        }
    }
}
exports.default = TileMapRendererEditor;

},{}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function importActor(entry, projectClient, options, callback) {
    let name = entry.name;
    if (name === "Tile Map") {
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
    projectClient.editAsset(SupClient.query.asset, "addComponent", nodeId, "TileMapRenderer", null, (componentId) => {
        projectClient.editAsset(SupClient.query.asset, "editComponent", nodeId, componentId, "setProperty", "tileMapAssetId", entry.id, callback);
    });
}
exports.importComponent = importComponent;

},{}],3:[function(require,module,exports){
"use strict";
/// <reference path="../../scene/componentEditors/ComponentEditorPlugin.d.ts" />
/// <reference path="../../scene/componentEditors/ImportIntoScenePlugin.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
const TileMapRendererEditor_1 = require("./TileMapRendererEditor");
const importTileMapIntoScene = require("./importTileMapIntoScene");
SupClient.registerPlugin("componentEditors", "TileMapRenderer", TileMapRendererEditor_1.default);
SupClient.registerPlugin("importIntoScene", "tileMap", importTileMapIntoScene);

},{"./TileMapRendererEditor":1,"./importTileMapIntoScene":2}]},{},[3]);
