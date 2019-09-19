"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const GameSettingsResource_1 = require("../data/GameSettingsResource");
class GameSettingsEditor {
    constructor(container, projectClient) {
        this.fields = {};
        this.onResourceReceived = (resourceId, resource) => {
            this.resource = resource;
            this._setupCustomLayers();
            for (const setting in resource.pub) {
                if (setting === "formatVersion" || setting === "customLayers")
                    continue;
                if (setting === "startupSceneId")
                    this._setStartupScene(resource.pub.startupSceneId);
                else
                    this.fields[setting].value = resource.pub[setting];
            }
        };
        this.onResourceEdited = (resourceId, command, propertyName) => {
            if (propertyName === "customLayers")
                this._setupCustomLayers();
            else if (propertyName === "startupSceneId")
                this._setStartupScene(this.resource.pub.startupSceneId);
            else
                this.fields[propertyName].value = this.resource.pub[propertyName];
        };
        this.onCustomLayerFieldChange = (event) => {
            const index = parseInt(event.target.dataset["customLayerIndex"], 10);
            if (index > this.customLayers.length)
                return;
            if (index === this.customLayers.length) {
                if (event.target.value === "")
                    return;
                this.customLayers.push(event.target.value);
            }
            else {
                if (event.target.value === "") {
                    if (index === this.customLayers.length - 1) {
                        this.customLayers.pop();
                    }
                    else {
                        new SupClient.Dialogs.InfoDialog("Layer name cannot be empty");
                        event.target.value = this.customLayers[index];
                        return;
                    }
                }
                else {
                    this.customLayers[index] = event.target.value;
                }
            }
            this.projectClient.editResource("gameSettings", "setProperty", "customLayers", this.customLayers);
        };
        this.projectClient = projectClient;
        const { tbody } = SupClient.table.createTable(container);
        this.startupSceneRow = SupClient.table.appendRow(tbody, SupClient.i18n.t("settingsEditors:Game.startupScene"));
        this.sceneFieldSubscriber = SupClient.table.appendAssetField(this.startupSceneRow.valueCell, this.sceneAssetId, "scene", projectClient);
        this.sceneFieldSubscriber.on("select", (assetId) => {
            this.projectClient.editResource("gameSettings", "setProperty", "startupSceneId", assetId);
        });
        this.fpsRow = SupClient.table.appendRow(tbody, SupClient.i18n.t("settingsEditors:Game.framesPerSecond"));
        this.fields["framesPerSecond"] = SupClient.table.appendNumberField(this.fpsRow.valueCell, "", { min: 1 });
        this.ratioRow = SupClient.table.appendRow(tbody, SupClient.i18n.t("settingsEditors:Game.screenRatio"));
        const ratioContainer = document.createElement("div");
        ratioContainer.className = "";
        this.ratioRow.valueCell.appendChild(ratioContainer);
        [this.fields["ratioNumerator"], this.fields["ratioDenominator"]] = SupClient.table.appendNumberFields(this.ratioRow.valueCell, ["", ""]);
        this.fields["ratioNumerator"].placeholder = SupClient.i18n.t("settingsEditors:Game.width");
        this.fields["ratioDenominator"].placeholder = SupClient.i18n.t("settingsEditors:Game.height");
        this.customLayersRow = SupClient.table.appendRow(tbody, SupClient.i18n.t("settingsEditors:Game.layers"));
        this.layerContainers = document.createElement("div");
        this.layerContainers.className = "list";
        this.customLayersRow.valueCell.appendChild(this.layerContainers);
        this.fields["defaultLayer"] = SupClient.table.appendTextField(this.layerContainers, "Default");
        this.fields["defaultLayer"].readOnly = true;
        for (let i = 0; i < GameSettingsResource_1.default.schema["customLayers"].maxLength; i++) {
            const field = this.fields[`customLayer${i}`] = SupClient.table.appendTextField(this.layerContainers, "");
            field.dataset["customLayerIndex"] = i.toString();
            field.addEventListener("change", this.onCustomLayerFieldChange);
        }
        this.fields["framesPerSecond"].addEventListener("change", (event) => {
            this.projectClient.editResource("gameSettings", "setProperty", "framesPerSecond", parseInt(event.target.value, 10));
        });
        this.fields["ratioNumerator"].addEventListener("change", (event) => {
            this.projectClient.editResource("gameSettings", "setProperty", "ratioNumerator", parseInt(event.target.value, 10));
        });
        this.fields["ratioDenominator"].addEventListener("change", (event) => {
            this.projectClient.editResource("gameSettings", "setProperty", "ratioDenominator", parseInt(event.target.value, 10));
        });
        this.projectClient.subResource("gameSettings", this);
    }
    _setStartupScene(id) {
        this.sceneAssetId = id;
        this.sceneFieldSubscriber.onChangeAssetId(id);
    }
    _setupCustomLayers() {
        this.customLayers = this.resource.pub.customLayers.slice(0);
        for (let i = 0; i < GameSettingsResource_1.default.schema["customLayers"].maxLength; i++) {
            const field = this.fields[`customLayer${i}`];
            if (i === this.customLayers.length) {
                field.placeholder = SupClient.i18n.t("settingsEditors:Game.newLayer");
                field.value = "";
            }
            else {
                field.placeholder = "";
            }
            if (i > this.customLayers.length) {
                if (field.parentElement != null)
                    this.layerContainers.removeChild(field);
            }
            else {
                if (field.parentElement == null)
                    this.layerContainers.appendChild(field);
                if (i < this.customLayers.length)
                    field.value = this.customLayers[i];
            }
        }
    }
}
exports.default = GameSettingsEditor;
