(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class BehaviorEditor {
    constructor(tbody, config, projectClient, editConfig) {
        this.onResourceReceived = (resourceId, resource) => {
            this.behaviorPropertiesResource = resource;
            this._buildBehaviorPropertiesUI();
        };
        this.onResourceEdited = (resourceId, command, ...args) => {
            if (command === "setScriptBehaviors" || command === "clearScriptBehaviors")
                this._buildBehaviorPropertiesUI();
        };
        this.onEntriesReceived = () => { };
        this.onEntryAdded = () => { };
        this.onEntryTrashed = () => { };
        this.onEntryMoved = (id) => {
            if (this.behaviorPropertiesResource != null &&
                this.behaviorPropertiesResource.behaviorNamesByScriptId[id] != null) {
                this._buildBehaviorPropertiesUI();
            }
        };
        this.onSetEntryProperty = (id, key) => {
            if (key === "name" &&
                this.behaviorPropertiesResource != null &&
                this.behaviorPropertiesResource.behaviorNamesByScriptId[id] != null) {
                this._buildBehaviorPropertiesUI();
            }
        };
        this.onChangeBehaviorName = (event) => { this.editConfig("setProperty", "behaviorName", event.target.value); };
        this.onOpenBehavior = () => {
            const behavior = this.behaviorPropertiesResource.pub.behaviors[this.config.behaviorName];
            if (behavior != null)
                SupClient.openEntry(behavior.scriptId, { line: behavior.line != null ? behavior.line : 0, ch: 0 });
        };
        // private onChangePropertySet = (event: any) => {}
        this.onChangePropertyValue = (event) => {
            this.applyPropertyValueChange(event.target);
        };
        this.onDropPropertyValue = (event) => {
            // When the drop event is called, the value won't have been updated yet since it can be cancelled
            // so we'll call .applyPropertyValueChange after the event has been applied
            setTimeout(() => {
                this.applyPropertyValueChange(event.target);
            }, 0);
        };
        this.tbody = tbody;
        this.config = config;
        this.projectClient = projectClient;
        this.editConfig = editConfig;
        // Using a <select> rather than <input> + <datalist> because of bugs in Chrome and Electron
        // See https://trello.com/c/jNNRLgdb/651 and https://github.com/atom/electron/issues/360
        const behaviorNameRow = SupClient.table.appendRow(this.tbody, SupClient.i18n.t("componentEditors:Behavior.class"));
        const behaviorDiv = document.createElement("div");
        behaviorDiv.classList.add("inputs");
        behaviorNameRow.valueCell.appendChild(behaviorDiv);
        this.behaviorNameField = SupClient.table.appendSelectBox(behaviorDiv, { "": SupClient.i18n.t("common:none") });
        this.behaviorNameField.addEventListener("change", this.onChangeBehaviorName);
        this.openBehaviorButton = document.createElement("button");
        this.openBehaviorButton.disabled = true;
        this.openBehaviorButton.textContent = SupClient.i18n.t("common:actions.open");
        behaviorDiv.appendChild(this.openBehaviorButton);
        this.openBehaviorButton.addEventListener("click", this.onOpenBehavior);
        SupClient.table.appendHeader(this.tbody, SupClient.i18n.t("componentEditors:Behavior.customizableProperties"));
        this.propertySettingsByName = {};
        this.projectClient.subEntries(this);
        this.projectClient.subResource("behaviorProperties", this);
    }
    destroy() {
        this.projectClient.unsubResource("behaviorProperties", this);
        this.projectClient.unsubEntries(this);
    }
    _buildBehaviorPropertiesUI() {
        // Setup behavior list
        while (this.behaviorNameField.childElementCount > 1)
            this.behaviorNameField.removeChild(this.behaviorNameField.lastElementChild);
        const entries = [];
        for (const scriptId in this.behaviorPropertiesResource.behaviorNamesByScriptId) {
            const behaviorNames = this.behaviorPropertiesResource.behaviorNamesByScriptId[scriptId];
            if (behaviorNames.length > 1) {
                entries.push([this.projectClient.entries.getPathFromId(scriptId)].concat(behaviorNames));
            }
            else if (behaviorNames.length === 1) {
                entries.push(behaviorNames[0]);
            }
        }
        entries.sort((a, b) => {
            if (Array.isArray(a))
                a = a[0];
            if (Array.isArray(b))
                b = b[0];
            return a.localeCompare(b);
        });
        for (const entry of entries) {
            if (Array.isArray(entry)) {
                const group = SupClient.table.appendSelectOptionGroup(this.behaviorNameField, entry[0]);
                for (const behaviorName of entry.slice(1)) {
                    SupClient.table.appendSelectOption(group, behaviorName, behaviorName);
                }
            }
            else {
                SupClient.table.appendSelectOption(this.behaviorNameField, entry, entry);
            }
        }
        if (this.config.behaviorName.length > 0 && this.behaviorPropertiesResource.pub.behaviors[this.config.behaviorName] == null) {
            SupClient.table.appendSelectOption(this.behaviorNameField, this.config.behaviorName, `(Missing) ${this.config.behaviorName}`);
            this.openBehaviorButton.disabled = true;
        }
        else
            this.openBehaviorButton.disabled = false;
        this.behaviorNameField.value = this.config.behaviorName;
        // Clear old property settings
        for (const name in this.propertySettingsByName) {
            const propertySetting = this.propertySettingsByName[name];
            propertySetting.row.parentElement.removeChild(propertySetting.row);
        }
        this.propertySettingsByName = {};
        // Setup new property settings
        let behaviorName = this.config.behaviorName;
        const listedProperties = [];
        while (behaviorName != null) {
            const behavior = this.behaviorPropertiesResource.pub.behaviors[behaviorName];
            if (behavior == null)
                break;
            for (const property of behavior.properties) {
                if (listedProperties.indexOf(property.name) !== -1)
                    continue;
                listedProperties.push(property.name);
                this._createPropertySetting(property);
            }
            behaviorName = behavior.parentBehavior;
        }
        // TODO: Display and allow cleaning up left-over property values
    }
    _createPropertySetting(property) {
        const propertySetting = SupClient.table.appendRow(this.tbody, property.name, { checkbox: true, title: `${property.name} (${property.type})` });
        this.propertySettingsByName[property.name] = propertySetting;
        this._createPropertyField(property.name);
        propertySetting.checkbox.checked = this.config.propertyValues[property.name] != null;
        propertySetting.checkbox.addEventListener("change", (event) => {
            if (!event.target.checked) {
                this.editConfig("clearBehaviorPropertyValue", property.name);
                return;
            }
            // defaultValue = property.value someday
            let defaultValue;
            switch (property.type) {
                case "boolean":
                    defaultValue = false;
                    break;
                case "number":
                    defaultValue = 0;
                    break;
                case "string":
                    defaultValue = "";
                    break;
                case "Sup.Math.Vector2":
                    defaultValue = { x: 0, y: 0 };
                    break;
                case "Sup.Math.Vector3":
                    defaultValue = { x: 0, y: 0, z: 0 };
                    break;
                // TODO: Support more types
                default:
                    defaultValue = null;
                    break;
            }
            this.editConfig("setBehaviorPropertyValue", property.name, property.type, defaultValue);
        });
    }
    _createPropertyField(propertyName) {
        let behaviorName = this.config.behaviorName;
        let property;
        while (behaviorName != null) {
            const behavior = this.behaviorPropertiesResource.pub.behaviors[behaviorName];
            property = this.behaviorPropertiesResource.propertiesByNameByBehavior[behaviorName][propertyName];
            if (property != null)
                break;
            behaviorName = behavior.parentBehavior;
        }
        const propertySetting = this.propertySettingsByName[propertyName];
        // TODO: We probably want to collect and display default values?
        // defaultPropertyValue = behaviorProperty?.value
        let propertyValue = null;
        let uiType = property.type;
        const propertyValueInfo = this.config.propertyValues[property.name];
        if (propertyValueInfo != null) {
            propertyValue = propertyValueInfo.value;
            if (propertyValueInfo.type !== property.type)
                uiType = "incompatibleType";
        }
        let propertyFields;
        switch (uiType) {
            case "incompatibleType":
                {
                    let propertyField = propertySetting.valueCell.querySelector("input[type=text]");
                    if (propertyField == null) {
                        propertySetting.valueCell.innerHTML = "";
                        propertyField = SupClient.table.appendTextField(propertySetting.valueCell, "");
                    }
                    propertyField.value = `(Incompatible type: ${propertyValueInfo.type})`;
                    propertyField.disabled = true;
                    propertyFields = [propertyField];
                }
                break;
            case "boolean":
                {
                    let propertyField = propertySetting.valueCell.querySelector("input[type=checkbox]");
                    if (propertyField == null) {
                        propertySetting.valueCell.innerHTML = "";
                        propertyField = SupClient.table.appendBooleanField(propertySetting.valueCell, false);
                        propertyField.addEventListener("change", this.onChangePropertyValue);
                    }
                    propertyField.checked = propertyValue;
                    propertyField.disabled = propertyValueInfo == null;
                    propertyFields = [propertyField];
                }
                break;
            case "number":
                {
                    let propertyField = propertySetting.valueCell.querySelector("input[type=number]");
                    if (propertyField == null) {
                        propertySetting.valueCell.innerHTML = "";
                        propertyField = SupClient.table.appendNumberField(propertySetting.valueCell, 0);
                        propertyField.addEventListener("change", this.onChangePropertyValue);
                        propertyField.addEventListener("drop", this.onDropPropertyValue);
                    }
                    propertyField.value = propertyValue;
                    propertyField.disabled = propertyValueInfo == null;
                    propertyFields = [propertyField];
                }
                break;
            case "string":
                {
                    let propertyField = propertySetting.valueCell.querySelector("input[type=text]");
                    if (propertyField == null) {
                        propertySetting.valueCell.innerHTML = "";
                        propertyField = SupClient.table.appendTextField(propertySetting.valueCell, "");
                        propertyField.addEventListener("change", this.onChangePropertyValue);
                        propertyField.addEventListener("drop", this.onDropPropertyValue);
                    }
                    propertyField.value = propertyValue;
                    propertyField.disabled = propertyValueInfo == null;
                    propertyFields = [propertyField];
                }
                break;
            case "Sup.Math.Vector2":
            case "Sup.Math.Vector3":
                {
                    const vectorContainer = propertySetting.valueCell.querySelector(".inputs");
                    if (vectorContainer == null) {
                        propertySetting.valueCell.innerHTML = "";
                        const defaultValues = uiType === "Sup.Math.Vector3" ? [0, 0, 0] : [0, 0];
                        propertyFields = SupClient.table.appendNumberFields(propertySetting.valueCell, defaultValues);
                        for (const field of propertyFields) {
                            field.addEventListener("change", this.onChangePropertyValue);
                            field.addEventListener("drop", this.onDropPropertyValue);
                        }
                    }
                    else {
                        propertyFields = Array.prototype.slice.call(vectorContainer.querySelectorAll("input"));
                    }
                    propertyFields[0].value = (propertyValue != null) ? propertyValue.x : "";
                    propertyFields[1].value = (propertyValue != null) ? propertyValue.y : "";
                    if (uiType === "Sup.Math.Vector3")
                        propertyFields[2].value = (propertyValue != null) ? propertyValue.z : "";
                    for (const field of propertyFields)
                        field.disabled = propertyValueInfo == null;
                }
                break;
            // TODO: Support more types
            default: {
                propertySetting.valueCell.innerHTML = "";
                console.error(`Unsupported property type: ${property.type}`);
                return;
            }
        }
        for (const field of propertyFields) {
            field.dataset["behaviorPropertyName"] = property.name;
            field.dataset["behaviorPropertyType"] = property.type;
        }
    }
    config_setProperty(path, value) {
        switch (path) {
            case "behaviorName": {
                this.behaviorNameField.value = value;
                this._buildBehaviorPropertiesUI();
                break;
            }
        }
    }
    config_setBehaviorPropertyValue(name, type, value) {
        this.propertySettingsByName[name].checkbox.checked = true;
        this._createPropertyField(name);
    }
    config_clearBehaviorPropertyValue(name) {
        this.propertySettingsByName[name].checkbox.checked = false;
        this._createPropertyField(name);
    }
    applyPropertyValueChange(target) {
        const propertyName = target.dataset["behaviorPropertyName"];
        const propertyType = target.dataset["behaviorPropertyType"];
        let propertyValue;
        switch (propertyType) {
            case "boolean":
                propertyValue = target.checked;
                break;
            case "number":
                propertyValue = parseFloat(target.value);
                break;
            case "string":
                propertyValue = target.value;
                break;
            case "Sup.Math.Vector2":
            case "Sup.Math.Vector3":
                {
                    const parent = target.parentElement;
                    propertyValue = {
                        x: parseFloat(parent.children[0].value),
                        y: parseFloat(parent.children[1].value)
                    };
                    if (propertyType === "Sup.Math.Vector3")
                        propertyValue.z = parseFloat(parent.children[2].value);
                }
                break;
            default:
                console.error(`Unsupported property type: ${propertyType}`);
                break;
        }
        this.editConfig("setBehaviorPropertyValue", propertyName, propertyType, propertyValue, (err) => {
            if (err != null) {
                new SupClient.Dialogs.InfoDialog(err);
                return;
            }
        });
    }
}
exports.default = BehaviorEditor;

},{}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function importActor(entry, projectClient, options, callback) {
    getBehaviorName(projectClient, entry.id, (err, behaviorName) => {
        if (err != null) {
            callback(err, null);
            return;
        }
        let name = entry.name;
        if (name === "Behavior" || name === "Behaviour") {
            const parentNode = projectClient.entries.parentNodesById[entry.id];
            if (parentNode != null)
                name = parentNode.name;
        }
        projectClient.editAsset(SupClient.query.asset, "addNode", name, options, (nodeId) => {
            importComponent(entry, projectClient, nodeId, (err) => { callback(err, nodeId); });
        });
    });
}
exports.importActor = importActor;
function importComponent(entry, projectClient, nodeId, callback) {
    getBehaviorName(projectClient, entry.id, (err, behaviorName) => {
        if (err != null) {
            callback(err, null);
            return;
        }
        projectClient.editAsset(SupClient.query.asset, "addComponent", nodeId, "Behavior", null, (componentId) => {
            projectClient.editAsset(SupClient.query.asset, "editComponent", nodeId, componentId, "setProperty", "behaviorName", behaviorName, callback);
        });
    });
}
exports.importComponent = importComponent;
function getBehaviorName(projectClient, scriptId, callback) {
    const subscriber = {
        onResourceReceived,
        onResourceEdited: null
    };
    function onResourceReceived(resourceId, resource) {
        projectClient.unsubResource("behaviorProperties", subscriber);
        if (resource.behaviorNamesByScriptId[scriptId] == null) {
            callback(SupClient.i18n.t("sceneEditor:errors.script.noBehaviorsFound"), null);
            return;
        }
        callback(null, resource.behaviorNamesByScriptId[scriptId][0]);
    }
    projectClient.subResource("behaviorProperties", subscriber);
}

},{}],3:[function(require,module,exports){
"use strict";
/// <reference path="../../scene/componentEditors/ComponentEditorPlugin.d.ts" />
/// <reference path="../../scene/componentEditors/ImportIntoScenePlugin.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
const BehaviorEditor_1 = require("./BehaviorEditor");
const importBehaviorIntoScene = require("./importBehaviorIntoScene");
SupClient.registerPlugin("componentEditors", "Behavior", BehaviorEditor_1.default);
SupClient.registerPlugin("importIntoScene", "script", importBehaviorIntoScene);

},{"./BehaviorEditor":1,"./importBehaviorIntoScene":2}]},{},[3]);
