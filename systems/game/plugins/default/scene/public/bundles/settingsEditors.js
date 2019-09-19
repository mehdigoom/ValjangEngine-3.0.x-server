(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

},{}],2:[function(require,module,exports){
"use strict";
/// <reference path="../../../common/settings/settingsEditors/SettingsEditorPlugin.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
const SceneSettingsEditor_1 = require("./SceneSettingsEditor");
SupClient.registerPlugin("settingsEditors", "Scene", {
    namespace: "editors",
    editor: SceneSettingsEditor_1.default
});

},{"./SceneSettingsEditor":1}]},{},[2]);
