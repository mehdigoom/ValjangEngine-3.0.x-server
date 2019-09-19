"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CameraEditor {
    constructor(tbody, config, projectClient, editConfig) {
        this.viewportFields = {};
        this.onChangeMode = (event) => { this.editConfig("setProperty", "mode", event.target.value); };
        this.onChangeFOV = (event) => { this.editConfig("setProperty", "fov", parseFloat(event.target.value)); };
        this.onChangeOrthographicScale = (event) => { this.editConfig("setProperty", "orthographicScale", parseFloat(event.target.value)); };
        this.onChangeDepth = (event) => { this.editConfig("setProperty", "depth", parseFloat(event.target.value)); };
        this.onChangeNearClippingPlane = (event) => { this.editConfig("setProperty", "nearClippingPlane", parseFloat(event.target.value)); };
        this.onChangeFarClippingPlane = (event) => { this.editConfig("setProperty", "farClippingPlane", parseFloat(event.target.value)); };
        this.onChangeViewportX = (event) => { this.editConfig("setProperty", "viewport.x", parseFloat(event.target.value)); };
        this.onChangeViewportY = (event) => { this.editConfig("setProperty", "viewport.y", parseFloat(event.target.value)); };
        this.onChangeViewportWidth = (event) => { this.editConfig("setProperty", "viewport.width", parseFloat(event.target.value)); };
        this.onChangeViewportHeight = (event) => { this.editConfig("setProperty", "viewport.height", parseFloat(event.target.value)); };
        this.projectClient = projectClient;
        this.editConfig = editConfig;
        const modeRow = SupClient.table.appendRow(tbody, SupClient.i18n.t("componentEditors:Camera.mode"));
        const modeOptions = {
            perspective: SupClient.i18n.t("componentEditors:Camera.modeOptions.perspective"),
            orthographic: SupClient.i18n.t("componentEditors:Camera.modeOptions.orthographic")
        };
        this.modeSelectBox = SupClient.table.appendSelectBox(modeRow.valueCell, modeOptions, config.mode);
        this.fovRowParts = SupClient.table.appendRow(tbody, SupClient.i18n.t("componentEditors:Camera.fieldOfView"));
        this.fovField = SupClient.table.appendNumberField(this.fovRowParts.valueCell, config.fov, { min: 0.1, max: 179.9, step: 0.1 });
        this.orthographicScaleRowParts = SupClient.table.appendRow(tbody, SupClient.i18n.t("componentEditors:Camera.orthographicScale"));
        this.orthographicScaleField = SupClient.table.appendNumberField(this.orthographicScaleRowParts.valueCell, config.orthographicScale, { min: 0.1, step: 0.1 });
        if (config.mode === "perspective")
            this.orthographicScaleRowParts.row.style.display = "none";
        else
            this.fovRowParts.row.style.display = "none";
        const depthOptions = { title: SupClient.i18n.t("componentEditors:Camera.depthTitle") };
        const depthRow = SupClient.table.appendRow(tbody, SupClient.i18n.t("componentEditors:Camera.depth"), depthOptions);
        this.depthField = SupClient.table.appendNumberField(depthRow.valueCell, config.depth);
        const layersOptions = { title: SupClient.i18n.t("componentEditors:Camera.layersTitle") };
        const layersRow = SupClient.table.appendRow(tbody, SupClient.i18n.t("componentEditors:Camera.layers"), layersOptions);
        const layersField = SupClient.table.appendTextField(layersRow.valueCell, "");
        layersField.disabled = true;
        layersField.placeholder = "(not yet customizable)";
        const nearClippingPlaneRow = SupClient.table.appendRow(tbody, SupClient.i18n.t("componentEditors:Camera.nearPlane"));
        this.nearClippingPlaneField = SupClient.table.appendNumberField(nearClippingPlaneRow.valueCell, config.nearClippingPlane, { min: 0.1 });
        const farClippingPlaneRow = SupClient.table.appendRow(tbody, SupClient.i18n.t("componentEditors:Camera.farPlane"));
        this.farClippingPlaneField = SupClient.table.appendNumberField(farClippingPlaneRow.valueCell, config.farClippingPlane, { min: 0.1 });
        SupClient.table.appendHeader(tbody, SupClient.i18n.t("componentEditors:Camera.viewport.title"));
        const viewportXRow = SupClient.table.appendRow(tbody, SupClient.i18n.t("componentEditors:Camera.viewport.position"));
        [this.viewportFields.x, this.viewportFields.y] = SupClient.table.appendNumberFields(viewportXRow.valueCell, [config.viewport.x, config.viewport.y], { min: 0, max: 1, step: 0.1 });
        const widthRow = SupClient.table.appendRow(tbody, SupClient.i18n.t("componentEditors:Camera.viewport.size"));
        [this.viewportFields.width, this.viewportFields.height] = SupClient.table.appendNumberFields(widthRow.valueCell, [config.viewport.width, config.viewport.height], { min: 0, max: 1, step: 0.1 });
        this.modeSelectBox.addEventListener("change", this.onChangeMode);
        this.fovField.addEventListener("input", this.onChangeFOV);
        this.orthographicScaleField.addEventListener("input", this.onChangeOrthographicScale);
        this.depthField.addEventListener("change", this.onChangeDepth);
        this.nearClippingPlaneField.addEventListener("change", this.onChangeNearClippingPlane);
        this.farClippingPlaneField.addEventListener("change", this.onChangeFarClippingPlane);
        this.viewportFields.x.addEventListener("change", this.onChangeViewportX);
        this.viewportFields.y.addEventListener("change", this.onChangeViewportY);
        this.viewportFields.width.addEventListener("change", this.onChangeViewportWidth);
        this.viewportFields.height.addEventListener("change", this.onChangeViewportHeight);
    }
    destroy() { }
    config_setProperty(path, value) {
        switch (path) {
            case "mode":
                {
                    this.modeSelectBox.value = value;
                    this.orthographicScaleRowParts.row.style.display = (value === "perspective") ? "none" : "";
                    this.fovRowParts.row.style.display = (value === "perspective") ? "" : "none";
                }
                break;
            case "fov":
                {
                    this.fovField.value = value;
                }
                break;
            case "orthographicScale":
                {
                    this.orthographicScaleField.value = value;
                }
                break;
            case "depth":
                {
                    this.depthField.value = value;
                }
                break;
            case "nearClippingPlane":
                {
                    this.nearClippingPlaneField.value = value;
                }
                break;
            case "farClippingPlane":
                {
                    this.farClippingPlaneField.value = value;
                }
                break;
            case "viewport.x":
                {
                    this.viewportFields.x.value = value;
                }
                break;
            case "viewport.y":
                {
                    this.viewportFields.y.value = value;
                }
                break;
            case "viewport.width":
                {
                    this.viewportFields.width.value = value;
                }
                break;
            case "viewport.height":
                {
                    this.viewportFields.height.value = value;
                }
                break;
        }
    }
}
exports.default = CameraEditor;
