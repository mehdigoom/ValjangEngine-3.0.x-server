"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class LightSettingsEditor {
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
        const shadowMapTypeRow = SupClient.table.appendRow(tbody, SupClient.i18n.t("settingsEditors:Light.shadowMapType"));
        this.fields["shadowMapType"] = SupClient.table.appendSelectBox(shadowMapTypeRow.valueCell, { "basic": "Basic", "pcf": "PCF", "pcfSoft": "PCF Soft" });
        this.fields["shadowMapType"].addEventListener("change", (event) => {
            this.projectClient.editResource("lightSettings", "setProperty", "shadowMapType", event.target.value);
        });
        this.projectClient.subResource("lightSettings", this);
    }
}
exports.default = LightSettingsEditor;
