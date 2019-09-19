"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ModelRendererEditor {
    constructor(tbody, config, projectClient, editConfig) {
        this.tbody = tbody;
        this.projectClient = projectClient;
        this.editConfig = editConfig;
        this.modelAssetId = config.modelAssetId;
        this.animationId = config.animationId;
        this.shaderAssetId = config.shaderAssetId;
        this.overrideOpacity = config.overrideOpacity;
        this.opacity = config.opacity;
        const modelRow = SupClient.table.appendRow(tbody, SupClient.i18n.t("componentEditors:ModelRenderer.model"));
        this.modelFieldSubscriber = SupClient.table.appendAssetField(modelRow.valueCell, this.modelAssetId, "model", projectClient);
        this.modelFieldSubscriber.on("select", (assetId) => {
            this.editConfig("setProperty", "modelAssetId", assetId);
            this.editConfig("setProperty", "animationId", null);
        });
        const animationRow = SupClient.table.appendRow(tbody, SupClient.i18n.t("componentEditors:ModelRenderer.animation"));
        this.animationSelectBox = SupClient.table.appendSelectBox(animationRow.valueCell, { "": SupClient.i18n.t("common:none") });
        this.animationSelectBox.addEventListener("change", (event) => {
            const animationId = (event.target.value === "") ? null : event.target.value;
            this.editConfig("setProperty", "animationId", animationId);
        });
        this.animationSelectBox.disabled = true;
        const shadowRow = SupClient.table.appendRow(tbody, SupClient.i18n.t("componentEditors:ModelRenderer.shadow.title"));
        const shadowDiv = document.createElement("div");
        shadowDiv.classList.add("inputs");
        shadowRow.valueCell.appendChild(shadowDiv);
        const castSpan = document.createElement("span");
        castSpan.style.marginLeft = "5px";
        castSpan.textContent = SupClient.i18n.t("componentEditors:ModelRenderer.shadow.cast");
        shadowDiv.appendChild(castSpan);
        this.castShadowField = SupClient.table.appendBooleanField(shadowDiv, config.castShadow);
        this.castShadowField.addEventListener("change", (event) => {
            this.editConfig("setProperty", "castShadow", event.target.checked);
        });
        const receiveSpan = document.createElement("span");
        receiveSpan.style.marginLeft = "5px";
        receiveSpan.textContent = SupClient.i18n.t("componentEditors:ModelRenderer.shadow.receive");
        shadowDiv.appendChild(receiveSpan);
        this.receiveShadowField = SupClient.table.appendBooleanField(shadowDiv, config.receiveShadow);
        this.receiveShadowField.addEventListener("change", (event) => {
            this.editConfig("setProperty", "receiveShadow", event.target.checked);
        });
        const colorRow = SupClient.table.appendRow(tbody, SupClient.i18n.t("componentEditors:ModelRenderer.color"));
        this.colorField = SupClient.table.appendColorField(colorRow.valueCell, config.color);
        this.colorField.addListener("change", (color) => {
            this.editConfig("setProperty", "color", color);
        });
        const opacityRow = SupClient.table.appendRow(tbody, SupClient.i18n.t("componentEditors:SpriteRenderer.opacity"), { checkbox: true });
        this.overrideOpacityField = opacityRow.checkbox;
        this.overrideOpacityField.addEventListener("change", (event) => {
            this.editConfig("setProperty", "opacity", this.asset != null ? this.asset.pub.opacity : null);
            this.editConfig("setProperty", "overrideOpacity", event.target.checked);
        });
        const opacityParent = document.createElement("div");
        opacityRow.valueCell.appendChild(opacityParent);
        const transparentOptions = {
            empty: "",
            opaque: SupClient.i18n.t("componentEditors:SpriteRenderer.opaque"),
            transparent: SupClient.i18n.t("componentEditors:SpriteRenderer.transparent"),
        };
        this.transparentField = SupClient.table.appendSelectBox(opacityParent, transparentOptions);
        this.transparentField.children[0].hidden = true;
        this.transparentField.addEventListener("change", (event) => {
            const opacity = this.transparentField.value === "transparent" ? 1 : null;
            this.editConfig("setProperty", "opacity", opacity);
        });
        this.opacityFields = SupClient.table.appendSliderField(opacityParent, "", { min: 0, max: 1, step: 0.1, sliderStep: 0.01 });
        this.opacityFields.numberField.parentElement.addEventListener("input", (event) => {
            this.editConfig("setProperty", "opacity", parseFloat(event.target.value));
        });
        this.updateOpacityField();
        const materialRow = SupClient.table.appendRow(tbody, SupClient.i18n.t("componentEditors:ModelRenderer.material"));
        this.materialSelectBox = SupClient.table.appendSelectBox(materialRow.valueCell, { "basic": "Basic", "phong": "Phong", "shader": "Shader" }, config.materialType);
        this.materialSelectBox.addEventListener("change", (event) => {
            this.editConfig("setProperty", "materialType", event.target.value);
        });
        const shaderRow = SupClient.table.appendRow(tbody, SupClient.i18n.t("componentEditors:ModelRenderer.shader"));
        this.shaderRow = shaderRow.row;
        this.shaderFieldSubscriber = SupClient.table.appendAssetField(shaderRow.valueCell, this.shaderAssetId, "shader", this.projectClient);
        this.shaderFieldSubscriber.on("select", (assetId) => {
            this.editConfig("setProperty", "shaderAssetId", assetId);
        });
        this.shaderRow.hidden = config.materialType !== "shader";
        if (this.modelAssetId != null)
            this.projectClient.subAsset(this.modelAssetId, "model", this);
    }
    destroy() {
        this.modelFieldSubscriber.destroy();
        this.shaderFieldSubscriber.destroy();
        if (this.modelAssetId != null)
            this.projectClient.unsubAsset(this.modelAssetId, this);
    }
    config_setProperty(path, value) {
        if (this.projectClient.entries == null)
            return;
        switch (path) {
            case "modelAssetId":
                if (this.modelAssetId != null) {
                    this.projectClient.unsubAsset(this.modelAssetId, this);
                    this.asset = null;
                }
                this.modelAssetId = value;
                this.animationSelectBox.disabled = true;
                if (this.modelAssetId != null)
                    this.projectClient.subAsset(this.modelAssetId, "model", this);
                this.modelFieldSubscriber.onChangeAssetId(this.modelAssetId);
                break;
            case "animationId":
                if (!this.animationSelectBox.disabled) {
                    this.animationSelectBox.value = (value != null) ? value : "";
                }
                this.animationId = value;
                break;
            case "castShadow":
                this.castShadowField.value = value;
                break;
            case "receiveShadow":
                this.receiveShadowField.value = value;
                break;
            case "color":
                this.colorField.setValue(value);
                break;
            case "overrideOpacity":
                this.overrideOpacity = value;
                this.updateOpacityField();
                break;
            case "opacity":
                this.opacity = value;
                this.updateOpacityField();
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
    // Network callbacks
    onAssetReceived(assetId, asset) {
        if (assetId !== this.modelAssetId)
            return;
        this.asset = asset;
        this._clearAnimations();
        for (const animation of this.asset.pub.animations) {
            SupClient.table.appendSelectOption(this.animationSelectBox, animation.id, animation.name);
        }
        this.animationSelectBox.value = (this.animationId != null) ? this.animationId : "";
        this.animationSelectBox.disabled = false;
        this.updateOpacityField();
    }
    onAssetEdited(assetId, command, ...args) {
        if (assetId !== this.modelAssetId)
            return;
        if (command === "setProperty" && args[0] === "opacity")
            this.updateOpacityField();
        if (command.indexOf("Animation") !== -1)
            return;
        const animationId = this.animationSelectBox.value;
        this._clearAnimations();
        for (const animation of this.asset.pub.animations) {
            SupClient.table.appendSelectOption(this.animationSelectBox, animation.id, animation.name);
        }
        if (animationId != null && this.asset.animations.byId[animationId] != null)
            this.animationSelectBox.value = animationId;
        else
            this.editConfig("setProperty", "animationId", "");
    }
    onAssetTrashed() {
        this.asset = null;
        this._clearAnimations();
        this.animationSelectBox.value = "";
        this.animationSelectBox.disabled = true;
    }
    // User interface
    _clearAnimations() {
        while (true) {
            const child = this.animationSelectBox.children[1];
            if (child == null)
                break;
            this.animationSelectBox.removeChild(child);
        }
    }
    updateOpacityField() {
        this.overrideOpacityField.checked = this.overrideOpacity;
        this.transparentField.disabled = !this.overrideOpacity;
        this.opacityFields.sliderField.disabled = !this.overrideOpacity;
        this.opacityFields.numberField.disabled = !this.overrideOpacity;
        if (!this.overrideOpacity && this.asset == null) {
            this.transparentField.value = "empty";
            this.opacityFields.numberField.parentElement.hidden = true;
        }
        else {
            const opacity = this.overrideOpacity ? this.opacity : this.asset.pub.opacity;
            if (opacity != null) {
                this.transparentField.value = "transparent";
                this.opacityFields.numberField.parentElement.hidden = false;
                this.opacityFields.sliderField.value = opacity.toString();
                this.opacityFields.numberField.value = opacity.toString();
            }
            else {
                this.transparentField.value = "opaque";
                this.opacityFields.numberField.parentElement.hidden = true;
            }
        }
    }
}
exports.default = ModelRendererEditor;
