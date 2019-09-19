"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class SpriteSettingsEditor {
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
        this.filteringRow = SupClient.table.appendRow(tbody, SupClient.i18n.t("settingsEditors:Sprite.filtering"));
        this.fields["filtering"] = SupClient.table.appendSelectBox(this.filteringRow.valueCell, {
            pixelated: SupClient.i18n.t("settingsEditors:Sprite.pixelated"),
            smooth: SupClient.i18n.t("settingsEditors:Sprite.smooth")
        });
        this.fpsRow = SupClient.table.appendRow(tbody, SupClient.i18n.t("settingsEditors:Sprite.framesPerSecond"));
        this.fields["framesPerSecond"] = SupClient.table.appendNumberField(this.fpsRow.valueCell, "");
        this.pixelsPerUnitRow = SupClient.table.appendRow(tbody, SupClient.i18n.t("settingsEditors:Sprite.pixelsPerUnit"));
        this.fields["pixelsPerUnit"] = SupClient.table.appendNumberField(this.pixelsPerUnitRow.valueCell, "");
        this.alphaTestRow = SupClient.table.appendRow(tbody, SupClient.i18n.t("settingsEditors:Sprite.alphaTesting"));
        this.fields["alphaTest"] = SupClient.table.appendNumberField(this.alphaTestRow.valueCell, "");
        this.fields["filtering"].addEventListener("change", (event) => {
            this.projectClient.editResource("spriteSettings", "setProperty", "filtering", event.target.value);
        });
        this.fields["framesPerSecond"].addEventListener("change", (event) => {
            this.projectClient.editResource("spriteSettings", "setProperty", "framesPerSecond", parseInt(event.target.value, 10));
        });
        this.fields["pixelsPerUnit"].addEventListener("change", (event) => {
            this.projectClient.editResource("spriteSettings", "setProperty", "pixelsPerUnit", parseInt(event.target.value, 10));
        });
        this.fields["alphaTest"].addEventListener("change", (event) => {
            this.projectClient.editResource("spriteSettings", "setProperty", "alphaTest", parseFloat(event.target.value));
        });
        this.projectClient.subResource("spriteSettings", this);
    }
}
exports.default = SpriteSettingsEditor;
