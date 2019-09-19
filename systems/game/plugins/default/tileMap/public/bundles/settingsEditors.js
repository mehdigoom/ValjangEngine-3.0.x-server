(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class TileMapSettingsEditor {
    constructor(container, projectClient) {
        this.fields = {};
        this.onResourceReceived = (resourceId, resource) => {
            this.resource = resource;
            for (const setting in resource.pub) {
                if (setting === "formatVersion")
                    continue;
                if (setting === "grid") {
                    this.fields["grid.width"].value = resource.pub.grid.width.toString();
                    this.fields["grid.height"].value = resource.pub.grid.height.toString();
                }
                else
                    this.fields[setting].value = resource.pub[setting];
            }
        };
        this.onResourceEdited = (resourceId, command, propertyName, value) => {
            this.fields[propertyName].value = value;
        };
        this.projectClient = projectClient;
        const { tbody } = SupClient.table.createTable(container);
        this.pixelsPerUnitRow = SupClient.table.appendRow(tbody, SupClient.i18n.t("settingsEditors:TileMap.pixelsPerUnit"));
        this.fields["pixelsPerUnit"] = SupClient.table.appendNumberField(this.pixelsPerUnitRow.valueCell, "");
        this.defaultWidthRow = SupClient.table.appendRow(tbody, SupClient.i18n.t("settingsEditors:TileMap.defaultWidth"));
        this.fields["width"] = SupClient.table.appendNumberField(this.defaultWidthRow.valueCell, "");
        this.defaultHeightRow = SupClient.table.appendRow(tbody, SupClient.i18n.t("settingsEditors:TileMap.defaultHeight"));
        this.fields["height"] = SupClient.table.appendNumberField(this.defaultHeightRow.valueCell, "");
        this.depthOffsetRow = SupClient.table.appendRow(tbody, SupClient.i18n.t("settingsEditors:TileMap.depthOffset"));
        this.fields["layerDepthOffset"] = SupClient.table.appendNumberField(this.depthOffsetRow.valueCell, "");
        this.gridSizeRow = SupClient.table.appendRow(tbody, SupClient.i18n.t("settingsEditors:TileMap.tileSetGridSize"));
        const gridFields = SupClient.table.appendNumberFields(this.gridSizeRow.valueCell, ["", ""]);
        this.fields["grid.width"] = gridFields[0];
        this.fields["grid.height"] = gridFields[1];
        const fieldNames = Object.keys(this.fields);
        fieldNames.forEach((fieldName) => {
            const field = this.fields[fieldName];
            field.addEventListener("change", (event) => {
                this.projectClient.editResource("tileMapSettings", "setProperty", fieldName, parseInt(event.target.value, 10));
            });
        });
        this.projectClient.subResource("tileMapSettings", this);
    }
}
exports.default = TileMapSettingsEditor;

},{}],2:[function(require,module,exports){
"use strict";
/// <reference path="../../../common/settings/settingsEditors/SettingsEditorPlugin.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
const TileMapSettingsEditor_1 = require("./TileMapSettingsEditor");
SupClient.registerPlugin("settingsEditors", "TileMap", {
    namespace: "editors",
    editor: TileMapSettingsEditor_1.default
});

},{"./TileMapSettingsEditor":1}]},{},[2]);
