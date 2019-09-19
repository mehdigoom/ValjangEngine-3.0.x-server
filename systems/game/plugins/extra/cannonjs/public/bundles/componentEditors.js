(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CannonBodyEditor {
    constructor(tbody, config, projectClient, editConfig) {
        this.projectClient = projectClient;
        this.editConfig = editConfig;
        this.tbody = tbody;
        this.fields = {};
        const massRow = SupClient.table.appendRow(this.tbody, SupClient.i18n.t("componentEditors:CannonBody.mass"));
        this.fields["mass"] = SupClient.table.appendNumberField(massRow.valueCell, config.mass, { min: 0 });
        this.fields["mass"].addEventListener("change", (event) => {
            this.editConfig("setProperty", "mass", parseFloat(event.target.value));
        });
        const fixedRotationRow = SupClient.table.appendRow(this.tbody, SupClient.i18n.t("componentEditors:CannonBody.fixedRotation"));
        this.fields["fixedRotation"] = SupClient.table.appendBooleanField(fixedRotationRow.valueCell, config.fixedRotation);
        this.fields["fixedRotation"].addEventListener("click", (event) => {
            this.editConfig("setProperty", "fixedRotation", event.target.checked);
        });
        const groupRow = SupClient.table.appendRow(this.tbody, SupClient.i18n.t("componentEditors:CannonBody.group"));
        this.fields["group"] = SupClient.table.appendNumberField(groupRow.valueCell, config.group);
        this.fields["group"].addEventListener("change", (event) => {
            this.editConfig("setProperty", "group", parseInt(event.target.value, 10));
        });
        const maskRow = SupClient.table.appendRow(this.tbody, SupClient.i18n.t("componentEditors:CannonBody.mask"));
        this.fields["mask"] = SupClient.table.appendNumberField(maskRow.valueCell, config.mask);
        this.fields["mask"].addEventListener("change", (event) => {
            this.editConfig("setProperty", "mask", parseInt(event.target.value, 10));
        });
        // display a gray bar with "shape" written in it
        SupClient.table.appendHeader(this.tbody, SupClient.i18n.t("componentEditors:CannonBody.shape"));
        const shapeTypeRow = SupClient.table.appendRow(this.tbody, SupClient.i18n.t("componentEditors:CannonBody.shapeType"));
        this.fields["shape"] = SupClient.table.appendSelectBox(shapeTypeRow.valueCell, {
            "box": SupClient.i18n.t("componentEditors:CannonBody.shapeOptions.box"),
            "sphere": SupClient.i18n.t("componentEditors:CannonBody.shapeOptions.sphere"),
            "cylinder": SupClient.i18n.t("componentEditors:CannonBody.shapeOptions.cylinder")
        });
        this.fields["shape"].value = config.shape;
        this.fields["shape"].addEventListener("change", (event) => {
            this.editConfig("setProperty", "shape", event.target.value);
        });
        const positionOffsetRow = SupClient.table.appendRow(this.tbody, SupClient.i18n.t("componentEditors:CannonBody.positionOffset"));
        const positionOffsetFields = SupClient.table.appendNumberFields(positionOffsetRow.valueCell, [config.positionOffset.x, config.positionOffset.y, config.positionOffset.z]);
        this.fields["positionOffset.x"] = positionOffsetFields[0];
        this.fields["positionOffset.y"] = positionOffsetFields[1];
        this.fields["positionOffset.z"] = positionOffsetFields[2];
        this.fields["positionOffset.x"].addEventListener("change", (event) => {
            this.editConfig("setProperty", "positionOffset.x", parseFloat(event.target.value));
        });
        this.fields["positionOffset.y"].addEventListener("change", (event) => {
            this.editConfig("setProperty", "positionOffset.y", parseFloat(event.target.value));
        });
        this.fields["positionOffset.z"].addEventListener("change", (event) => {
            this.editConfig("setProperty", "positionOffset.z", parseFloat(event.target.value));
        });
        // Box / Cylinder
        this.orientationOffsetRow = SupClient.table.appendRow(this.tbody, SupClient.i18n.t("componentEditors:CannonBody.orientationOffset"));
        const orientationOffsetFields = SupClient.table.appendNumberFields(this.orientationOffsetRow.valueCell, [config.orientationOffset.x, config.orientationOffset.y, config.orientationOffset.z], { min: -360, max: 360 });
        this.fields["orientationOffset.x"] = orientationOffsetFields[0];
        this.fields["orientationOffset.y"] = orientationOffsetFields[1];
        this.fields["orientationOffset.z"] = orientationOffsetFields[2];
        this.fields["orientationOffset.x"].addEventListener("change", (event) => {
            this.editConfig("setProperty", "orientationOffset.x", parseFloat(event.target.value));
        });
        this.fields["orientationOffset.y"].addEventListener("change", (event) => {
            this.editConfig("setProperty", "orientationOffset.y", parseFloat(event.target.value));
        });
        this.fields["orientationOffset.z"].addEventListener("change", (event) => {
            this.editConfig("setProperty", "orientationOffset.z", parseFloat(event.target.value));
        });
        // Box
        this.halfSizeRow = SupClient.table.appendRow(this.tbody, SupClient.i18n.t("componentEditors:CannonBody.halfSize"));
        const halfSizeFields = SupClient.table.appendNumberFields(this.halfSizeRow.valueCell, [config.halfSize.x, config.halfSize.y, config.halfSize.z], { min: 0 });
        this.fields["halfSize.x"] = halfSizeFields[0];
        this.fields["halfSize.y"] = halfSizeFields[1];
        this.fields["halfSize.z"] = halfSizeFields[2];
        this.fields["halfSize.x"].addEventListener("change", (event) => {
            this.editConfig("setProperty", "halfSize.x", parseFloat(event.target.value));
        });
        this.fields["halfSize.y"].addEventListener("change", (event) => {
            this.editConfig("setProperty", "halfSize.y", parseFloat(event.target.value));
        });
        this.fields["halfSize.z"].addEventListener("change", (event) => {
            this.editConfig("setProperty", "halfSize.z", parseFloat(event.target.value));
        });
        // Sphere / Cylinder
        this.radiusRow = SupClient.table.appendRow(this.tbody, SupClient.i18n.t("componentEditors:CannonBody.radius"));
        this.fields["radius"] = SupClient.table.appendNumberField(this.radiusRow.valueCell, config.radius, { min: 0 });
        this.fields["radius"].addEventListener("change", (event) => {
            this.editConfig("setProperty", "radius", parseFloat(event.target.value));
        });
        // Cylinder
        this.heightRow = SupClient.table.appendRow(this.tbody, SupClient.i18n.t("componentEditors:CannonBody.height"));
        this.fields["height"] = SupClient.table.appendNumberField(this.heightRow.valueCell, config.height, { min: 0 });
        this.fields["height"].addEventListener("change", (event) => {
            this.editConfig("setProperty", "height", parseFloat(event.target.value));
        });
        this.segmentsRow = SupClient.table.appendRow(this.tbody, SupClient.i18n.t("componentEditors:CannonBody.segments"));
        this.fields["segments"] = SupClient.table.appendNumberField(this.segmentsRow.valueCell, config.segments, { min: 3 });
        this.fields["segments"].addEventListener("change", (event) => {
            this.editConfig("setProperty", "segments", parseInt(event.target.value, 10));
        });
        this.updateShapeInput(config.shape);
    }
    updateShapeInput(shape) {
        switch (shape) {
            case "box":
                this.orientationOffsetRow.row.hidden = false;
                this.halfSizeRow.row.hidden = false;
                this.radiusRow.row.hidden = true;
                this.heightRow.row.hidden = true;
                this.segmentsRow.row.hidden = true;
                break;
            case "sphere":
                this.orientationOffsetRow.row.hidden = true;
                this.halfSizeRow.row.hidden = true;
                this.radiusRow.row.hidden = false;
                this.heightRow.row.hidden = true;
                this.segmentsRow.row.hidden = true;
                break;
            case "cylinder":
                this.orientationOffsetRow.row.hidden = false;
                this.halfSizeRow.row.hidden = true;
                this.radiusRow.row.hidden = false;
                this.heightRow.row.hidden = false;
                this.segmentsRow.row.hidden = false;
                break;
        }
    }
    destroy() { }
    config_setProperty(path, value) {
        if (path === "fixedRotation")
            this.fields["fixedRotation"].checked = value;
        else
            this.fields[path].value = value;
        if (path === "shape")
            this.updateShapeInput(value);
    }
}
exports.default = CannonBodyEditor;

},{}],2:[function(require,module,exports){
"use strict";
/// <reference path="../../../default/scene/componentEditors/ComponentEditorPlugin.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
const CannonBodyEditor_1 = require("./CannonBodyEditor");
SupClient.registerPlugin("componentEditors", "CannonBody", CannonBodyEditor_1.default);

},{"./CannonBodyEditor":1}]},{},[2]);
