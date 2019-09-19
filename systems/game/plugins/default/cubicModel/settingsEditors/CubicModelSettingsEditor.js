"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CubicModelSettingsEditor {
    constructor(container, projectClient) {
        this.fields = {};
        this.onResourceReceived = (resourceId, resource) => {
            this.resource = resource;
            for (const setting in resource.pub) {
                this.fields[setting].value = resource.pub[setting];
            }
        };
        this.onResourceEdited = (resourceId, command, propertyName) => {
            this.fields[propertyName].value = this.resource.pub[propertyName];
        };
        this.projectClient = projectClient;
        const { tbody } = SupClient.table.createTable(container);
        this.pixelsPerUnitRow = SupClient.table.appendRow(tbody, SupClient.i18n.t("settingsEditors:CubicModel.pixelsPerUnit"));
        this.fields["pixelsPerUnit"] = SupClient.table.appendNumberField(this.pixelsPerUnitRow.valueCell, "");
        this.fields["pixelsPerUnit"].addEventListener("change", (event) => {
            this.projectClient.editResource("cubicModelSettings", "setProperty", "pixelsPerUnit", parseInt(event.target.value, 10));
        });
        this.projectClient.subResource("cubicModelSettings", this);
    }
}
exports.default = CubicModelSettingsEditor;
