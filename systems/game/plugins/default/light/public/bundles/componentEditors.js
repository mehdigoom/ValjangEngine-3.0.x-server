(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class LightEditor {
    constructor(tbody, config, projectClient, editConfig) {
        this.fields = {};
        this.shadowRows = [];
        this.tbody = tbody;
        this.editConfig = editConfig;
        this.castShadow = config.castShadow;
        const typeRow = SupClient.table.appendRow(tbody, SupClient.i18n.t("componentEditors:Light.type"));
        const typeOptions = {
            "ambient": SupClient.i18n.t("componentEditors:Light.typeOptions.ambient"),
            "point": SupClient.i18n.t("componentEditors:Light.typeOptions.point"),
            "spot": SupClient.i18n.t("componentEditors:Light.typeOptions.spot"),
            "directional": SupClient.i18n.t("componentEditors:Light.typeOptions.directional")
        };
        this.fields["type"] = SupClient.table.appendSelectBox(typeRow.valueCell, typeOptions, config.type);
        this.fields["type"].addEventListener("change", (event) => {
            this.editConfig("setProperty", "type", event.target.value);
        });
        const colorRow = SupClient.table.appendRow(tbody, SupClient.i18n.t("componentEditors:Light.color"));
        this.colorField = SupClient.table.appendColorField(colorRow.valueCell, config.color);
        this.colorField.addListener("change", (color) => {
            this.editConfig("setProperty", "color", color);
        });
        const intensityRow = SupClient.table.appendRow(tbody, SupClient.i18n.t("componentEditors:Light.intensity"));
        this.fields["intensity"] = SupClient.table.appendNumberField(intensityRow.valueCell, config.intensity, { min: 0 });
        this.fields["intensity"].addEventListener("change", (event) => {
            this.editConfig("setProperty", "intensity", parseFloat(event.target.value));
        });
        const distanceRow = SupClient.table.appendRow(tbody, SupClient.i18n.t("componentEditors:Light.distance"));
        this.fields["distance"] = SupClient.table.appendNumberField(distanceRow.valueCell, config.distance, { min: 0 });
        this.fields["distance"].addEventListener("change", (event) => {
            this.editConfig("setProperty", "distance", parseFloat(event.target.value));
        });
        const angleRow = SupClient.table.appendRow(tbody, SupClient.i18n.t("componentEditors:Light.angle"));
        this.fields["angle"] = SupClient.table.appendNumberField(angleRow.valueCell, config.angle, { min: 0, max: 90 });
        this.fields["angle"].addEventListener("change", (event) => {
            this.editConfig("setProperty", "angle", parseFloat(event.target.value));
        });
        const targetRow = SupClient.table.appendRow(tbody, SupClient.i18n.t("componentEditors:Light.target"));
        const targetFields = SupClient.table.appendNumberFields(targetRow.valueCell, [config.target.x, config.target.y, config.target.z]);
        this.fields["target.x"] = targetFields[0];
        this.fields["target.x"].addEventListener("change", (event) => {
            this.editConfig("setProperty", "target.x", parseFloat(event.target.value));
        });
        this.fields["target.y"] = targetFields[1];
        this.fields["target.y"].addEventListener("change", (event) => {
            this.editConfig("setProperty", "target.y", parseFloat(event.target.value));
        });
        this.fields["target.z"] = targetFields[2];
        this.fields["target.z"].addEventListener("change", (event) => {
            this.editConfig("setProperty", "target.z", parseFloat(event.target.value));
        });
        const castShadowRow = SupClient.table.appendRow(tbody, SupClient.i18n.t("componentEditors:Light.castShadow"));
        this.fields["castShadow"] = SupClient.table.appendBooleanField(castShadowRow.valueCell, config.castShadow);
        this.fields["castShadow"].addEventListener("change", (event) => {
            this.editConfig("setProperty", "castShadow", event.target.checked);
        });
        const shadowHeaderRow = SupClient.table.appendHeader(tbody, SupClient.i18n.t("componentEditors:Light.shadowSettings.title"));
        this.shadowRows.push(shadowHeaderRow);
        const shadowMapSizeRow = SupClient.table.appendRow(tbody, SupClient.i18n.t("componentEditors:Light.shadowSettings.mapSize"));
        const shadowMapFields = SupClient.table.appendNumberFields(shadowMapSizeRow.valueCell, [config.shadowMapSize.width, config.shadowMapSize.height], { min: 1 });
        this.fields["shadowMapSize.width"] = shadowMapFields[0];
        this.fields["shadowMapSize.width"].addEventListener("change", (event) => {
            this.editConfig("setProperty", "shadowMapSize.width", parseFloat(event.target.value));
        });
        this.fields["shadowMapSize.height"] = shadowMapFields[1];
        this.fields["shadowMapSize.height"].addEventListener("change", (event) => {
            this.editConfig("setProperty", "shadowMapSize.height", parseFloat(event.target.value));
        });
        this.shadowRows.push(shadowMapSizeRow.row);
        const shadowBiasRow = SupClient.table.appendRow(tbody, SupClient.i18n.t("componentEditors:Light.shadowSettings.bias"));
        this.fields["shadowBias"] = SupClient.table.appendNumberField(shadowBiasRow.valueCell, config.shadowBias);
        this.fields["shadowBias"].addEventListener("change", (event) => {
            this.editConfig("setProperty", "shadowBias", parseFloat(event.target.value));
        });
        this.shadowRows.push(shadowBiasRow.row);
        const shadowPlanesRow = SupClient.table.appendRow(tbody, SupClient.i18n.t("componentEditors:Light.shadowSettings.near-far"));
        const shadowPlanesFields = SupClient.table.appendNumberFields(shadowPlanesRow.valueCell, [config.shadowCameraNearPlane, config.shadowCameraFarPlane], { min: 0 });
        this.fields["shadowCameraNearPlane"] = shadowPlanesFields[0];
        this.fields["shadowCameraNearPlane"].addEventListener("change", (event) => {
            this.editConfig("setProperty", "shadowCameraNearPlane", parseFloat(event.target.value));
        });
        this.fields["shadowCameraFarPlane"] = shadowPlanesFields[1];
        this.fields["shadowCameraFarPlane"].addEventListener("change", (event) => {
            this.editConfig("setProperty", "shadowCameraFarPlane", parseFloat(event.target.value));
        });
        this.shadowRows.push(shadowPlanesRow.row);
        const shadowCameraFovRow = SupClient.table.appendRow(tbody, SupClient.i18n.t("componentEditors:Light.shadowSettings.fov"));
        this.fields["shadowCameraFov"] = SupClient.table.appendNumberField(shadowCameraFovRow.valueCell, config.shadowCameraFov);
        this.fields["shadowCameraFov"].addEventListener("change", (event) => {
            this.editConfig("setProperty", "shadowCameraFov", parseFloat(event.target.value));
        });
        this.shadowRows.push(shadowCameraFovRow.row);
        const shadowCameraTopBottomRow = SupClient.table.appendRow(tbody, SupClient.i18n.t("componentEditors:Light.shadowSettings.top-bottom"));
        const shadowCameraTopBottomFields = SupClient.table.appendNumberFields(shadowCameraTopBottomRow.valueCell, [config.shadowCameraSize.top, config.shadowCameraSize.bottom]);
        this.fields["shadowCameraSize.top"] = shadowCameraTopBottomFields[0];
        this.fields["shadowCameraSize.top"].addEventListener("change", (event) => {
            this.editConfig("setProperty", "shadowCameraSize.top", parseFloat(event.target.value));
        });
        this.fields["shadowCameraSize.bottom"] = shadowCameraTopBottomFields[1];
        this.fields["shadowCameraSize.bottom"].addEventListener("change", (event) => {
            this.editConfig("setProperty", "shadowCameraSize.bottom", parseFloat(event.target.value));
        });
        this.shadowRows.push(shadowCameraTopBottomRow.row);
        const shadowCameraLeftRightRow = SupClient.table.appendRow(tbody, SupClient.i18n.t("componentEditors:Light.shadowSettings.left-right"));
        const shadowCameraLeftRightFields = SupClient.table.appendNumberFields(shadowCameraLeftRightRow.valueCell, [config.shadowCameraSize.left, config.shadowCameraSize.right]);
        this.fields["shadowCameraSize.left"] = shadowCameraLeftRightFields[0];
        this.fields["shadowCameraSize.left"].addEventListener("change", (event) => {
            this.editConfig("setProperty", "shadowCameraSize.left", parseFloat(event.target.value));
        });
        this.fields["shadowCameraSize.right"] = shadowCameraLeftRightFields[1];
        this.fields["shadowCameraSize.right"].addEventListener("change", (event) => {
            this.editConfig("setProperty", "shadowCameraSize.right", parseFloat(event.target.value));
        });
        this.shadowRows.push(shadowCameraLeftRightRow.row);
        this.updateFields();
    }
    destroy() { }
    config_setProperty(path, value) {
        if (path === "castShadow") {
            this.fields[path].checked = value;
            this.castShadow = value;
            this.updateFields();
        }
        else if (path === "color") {
            this.colorField.setValue(value);
        }
        else
            this.fields[path].value = value;
        if (path === "type")
            this.updateFields();
    }
    updateFields() {
        const type = this.fields["type"].value;
        const intensityRow = this.fields["intensity"].parentElement.parentElement;
        const distanceRow = this.fields["distance"].parentElement.parentElement;
        const angleRow = this.fields["angle"].parentElement.parentElement;
        const targetRow = this.fields["target.x"].parentElement.parentElement.parentElement;
        const castShadowRow = this.fields["castShadow"].parentElement.parentElement;
        if (type === "ambient") {
            intensityRow.hidden = true;
            distanceRow.hidden = true;
            angleRow.hidden = true;
            targetRow.hidden = true;
            castShadowRow.hidden = true;
            for (const shadowRow of this.shadowRows)
                shadowRow.hidden = true;
        }
        else {
            intensityRow.hidden = false;
            distanceRow.hidden = type === "directional";
            angleRow.hidden = type !== "spot";
            if (type === "spot" || type === "directional") {
                targetRow.hidden = false;
                castShadowRow.hidden = false;
                if (this.castShadow) {
                    for (const shadowRow of this.shadowRows)
                        shadowRow.hidden = false;
                    if (type === "spot") {
                        this.fields["shadowCameraSize.top"].parentElement.parentElement.parentElement.hidden = true;
                        this.fields["shadowCameraSize.left"].parentElement.parentElement.parentElement.hidden = true;
                    }
                    else {
                        this.fields["shadowCameraFov"].parentElement.parentElement.hidden = true;
                    }
                }
                else {
                    for (const shadowRow of this.shadowRows)
                        shadowRow.hidden = true;
                }
            }
            else {
                targetRow.hidden = true;
                castShadowRow.hidden = true;
                for (const shadowRow of this.shadowRows)
                    shadowRow.hidden = true;
            }
        }
    }
}
exports.default = LightEditor;

},{}],2:[function(require,module,exports){
"use strict";
/// <reference path="../../scene/componentEditors/ComponentEditorPlugin.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
const LightEditor_1 = require("./LightEditor");
SupClient.registerPlugin("componentEditors", "Light", LightEditor_1.default);

},{"./LightEditor":1}]},{},[2]);
