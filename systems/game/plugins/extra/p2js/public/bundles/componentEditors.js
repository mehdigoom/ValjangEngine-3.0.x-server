(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class P2BodyEditor {
    constructor(tbody, config, projectClient, editConfig) {
        this.fields = {};
        this.tbody = tbody;
        this.projectClient = projectClient;
        this.editConfig = editConfig;
        const massRow = SupClient.table.appendRow(this.tbody, SupClient.i18n.t("componentEditors:P2Body.mass"));
        this.fields["mass"] = SupClient.table.appendNumberField(massRow.valueCell, config.mass, { min: 0 });
        this.fields["mass"].addEventListener("change", (event) => {
            this.editConfig("setProperty", "mass", parseFloat(event.target.value));
        });
        const fixedRotationRow = SupClient.table.appendRow(this.tbody, SupClient.i18n.t("componentEditors:P2Body.fixedRotation"));
        this.fields["fixedRotation"] = SupClient.table.appendBooleanField(fixedRotationRow.valueCell, config.fixedRotation);
        this.fields["fixedRotation"].addEventListener("click", (event) => {
            this.editConfig("setProperty", "fixedRotation", event.target.checked);
        });
        const offsetRow = SupClient.table.appendRow(this.tbody, SupClient.i18n.t("componentEditors:P2Body.offset"));
        const offsetFields = SupClient.table.appendNumberFields(offsetRow.valueCell, [config.offsetX, config.offsetY]);
        this.fields["offsetX"] = offsetFields[0];
        this.fields["offsetX"].addEventListener("change", (event) => {
            this.editConfig("setProperty", "offsetX", parseFloat(event.target.value));
        });
        this.fields["offsetY"] = offsetFields[1];
        this.fields["offsetY"].addEventListener("change", (event) => {
            this.editConfig("setProperty", "offsetY", parseFloat(event.target.value));
        });
        const shapeRow = SupClient.table.appendRow(this.tbody, SupClient.i18n.t("componentEditors:P2Body.shape"));
        const shapeOptions = {
            "box": SupClient.i18n.t("componentEditors:P2Body.shapeOptions.box"),
            "circle": SupClient.i18n.t("componentEditors:P2Body.shapeOptions.circle")
        };
        this.fields["shape"] = SupClient.table.appendSelectBox(shapeRow.valueCell, shapeOptions, config.shape);
        this.fields["shape"].addEventListener("change", (event) => {
            this.editConfig("setProperty", "shape", event.target.value);
        });
        // Box
        this.sizeRow = SupClient.table.appendRow(this.tbody, SupClient.i18n.t("componentEditors:P2Body.size"));
        const sizeFields = SupClient.table.appendNumberFields(this.sizeRow.valueCell, [config.width, config.height], { min: 0 });
        this.fields["width"] = sizeFields[0];
        this.fields["width"].addEventListener("change", (event) => {
            this.editConfig("setProperty", "width", parseFloat(event.target.value));
        });
        this.fields["height"] = sizeFields[1];
        this.fields["height"].addEventListener("change", (event) => {
            this.editConfig("setProperty", "height", parseFloat(event.target.value));
        });
        this.angleRow = SupClient.table.appendRow(this.tbody, SupClient.i18n.t("componentEditors:P2Body.angle"));
        this.fields["angle"] = SupClient.table.appendNumberField(this.angleRow.valueCell, config.angle, { min: -360, max: 360 });
        this.fields["angle"].addEventListener("change", (event) => {
            this.editConfig("setProperty", "angle", parseFloat(event.target.value));
        });
        // Circle
        this.radiusRow = SupClient.table.appendRow(this.tbody, SupClient.i18n.t("componentEditors:P2Body.radius"));
        this.fields["radius"] = SupClient.table.appendNumberField(this.radiusRow.valueCell, config.radius, { min: 0 });
        this.fields["radius"].addEventListener("change", (event) => {
            this.editConfig("setProperty", "radius", parseFloat(event.target.value));
        });
        this.updateShapeInput(config.shape);
    }
    updateShapeInput(shape) {
        switch (shape) {
            case "box":
                {
                    this.sizeRow.row.hidden = false;
                    this.radiusRow.row.hidden = true;
                    this.angleRow.row.hidden = false;
                }
                break;
            case "circle":
                {
                    this.sizeRow.row.hidden = true;
                    this.radiusRow.row.hidden = false;
                    this.angleRow.row.hidden = true;
                }
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
exports.default = P2BodyEditor;

},{}],2:[function(require,module,exports){
"use strict";
/// <reference path="../../../default/scene/componentEditors/ComponentEditorPlugin.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
const P2BodyEditor_1 = require("./P2BodyEditor");
SupClient.registerPlugin("componentEditors", "P2Body", P2BodyEditor_1.default);

},{"./P2BodyEditor":1}]},{},[2]);
