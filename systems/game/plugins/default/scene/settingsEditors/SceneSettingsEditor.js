"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class SceneSettingsEditor {
    constructor(container, projectClient) {
        this.fields = {};
        this.onResourceReceived = (resourceId, resource) => {
            this.resource = resource;
            for (const setting in resource.pub) {
                if (setting === "formatVersion")
                    continue;
                this.fields[setting].value = resource.pub[setting];
            }
        };
        this.onResourceEdited = (resourceId, command, propertyName) => {
            this.fields[propertyName].value = this.resource.pub[propertyName];
        };
        this.projectClient = projectClient;
        const { tbody } = SupClient.table.createTable(container);
        const defaultCameraModeRow = SupClient.table.appendRow(tbody, SupClient.i18n.t("settingsEditors:Scene.defaultCameraMode"));
        this.fields["defaultCameraMode"] = SupClient.table.appendSelectBox(defaultCameraModeRow.valueCell, { "3D": "3D", "2D": "2D" });
        this.fields["defaultCameraMode"].addEventListener("change", (event) => {
            this.projectClient.editResource("sceneSettings", "setProperty", "defaultCameraMode", event.target.value);
        });
        const defaultVerticalAxisRow = SupClient.table.appendRow(tbody, SupClient.i18n.t("settingsEditors:Scene.defaultCameraVerticalAxis"));
        this.fields["defaultVerticalAxis"] = SupClient.table.appendSelectBox(defaultVerticalAxisRow.valueCell, { "Y": "Y", "Z": "Z" });
        this.fields["defaultVerticalAxis"].addEventListener("change", (event) => {
            this.projectClient.editResource("sceneSettings", "setProperty", "defaultVerticalAxis", event.target.value);
        });
        this.projectClient.subResource("sceneSettings", this);
    }
}
exports.default = SceneSettingsEditor;
