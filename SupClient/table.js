"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const FindAssetDialog_1 = require("./FindAssetDialog");
function createTable(parent) {
    const table = SupClient.html("table", { parent });
    const tbody = SupClient.html("tbody", { parent: table });
    return { table, tbody };
}
exports.createTable = createTable;
function appendRow(parentTableBody, name, options) {
    const row = SupClient.html("tr", { parent: parentTableBody });
    const labelCell = SupClient.html("th", { parent: row });
    let checkbox;
    if (options != null && options.checkbox) {
        const container = SupClient.html("div", { parent: labelCell });
        SupClient.html("div", { parent: container, textContent: name, title: options.title });
        checkbox = SupClient.html("input", { parent: container, type: "checkbox" });
    }
    else {
        labelCell.textContent = name;
        if (options != null && options.title != null)
            labelCell.title = options.title;
    }
    const valueCell = SupClient.html("td", { parent: row });
    return { row, labelCell, valueCell, checkbox };
}
exports.appendRow = appendRow;
function appendHeader(parentTableBody, text) {
    const headerRow = SupClient.html("tr", { parent: parentTableBody });
    SupClient.html("th", { parent: headerRow, textContent: text, colSpan: 2 });
    return headerRow;
}
exports.appendHeader = appendHeader;
function appendTextField(parent, value) {
    return SupClient.html("input", { parent, type: "text", value });
}
exports.appendTextField = appendTextField;
function appendTextAreaField(parent, value) {
    return SupClient.html("textarea", { parent, value });
}
exports.appendTextAreaField = appendTextAreaField;
function appendNumberField(parent, value, options) {
    const input = SupClient.html("input", { parent, type: "number", value: value.toString() });
    if (options != null) {
        if (options.min != null)
            input.min = options.min.toString();
        if (options.max != null)
            input.max = options.max.toString();
        if (options.step != null)
            input.step = options.step.toString();
    }
    return input;
}
exports.appendNumberField = appendNumberField;
function appendNumberFields(parent, values, options) {
    const inputsParent = SupClient.html("div", "inputs", { parent });
    const inputs = [];
    for (const value of values)
        inputs.push(appendNumberField(inputsParent, value, options));
    return inputs;
}
exports.appendNumberFields = appendNumberFields;
function appendBooleanField(parent, checked) {
    return SupClient.html("input", { parent, type: "checkbox", checked });
}
exports.appendBooleanField = appendBooleanField;
function appendSelectBox(parent, options, initialValue = "") {
    const selectInput = SupClient.html("select", { parent });
    for (const value in options)
        appendSelectOption(selectInput, value, options[value]);
    selectInput.value = initialValue;
    return selectInput;
}
exports.appendSelectBox = appendSelectBox;
function appendSelectOption(parent, value, label) {
    return SupClient.html("option", { parent, value, textContent: label });
}
exports.appendSelectOption = appendSelectOption;
function appendSelectOptionGroup(parent, label) {
    return SupClient.html("optgroup", { parent, label, textContent: label });
}
exports.appendSelectOptionGroup = appendSelectOptionGroup;
function appendSliderField(parent, value, options) {
    const sliderParent = SupClient.html("div", "inputs", { parent });
    const sliderField = SupClient.html("input", { parent: sliderParent, type: "range", value: value.toString(), style: { flex: "2" } });
    if (options != null) {
        if (options.min != null)
            sliderField.min = options.min.toString();
        if (options.max != null)
            sliderField.max = options.max.toString();
        if (options.sliderStep != null)
            sliderField.step = options.sliderStep.toString();
    }
    const numberField = appendNumberField(sliderParent, value, options);
    return { sliderField, numberField };
}
exports.appendSliderField = appendSliderField;
class ColorField extends events_1.EventEmitter {
    constructor(textField, pickerField, color) {
        super();
        this.textField = textField;
        this.pickerField = pickerField;
        this.textField.addEventListener("change", (event) => {
            const color = event.target.value;
            if (color.length !== 6)
                return;
            this.pickerField.value = `#${color}`;
            this.emit("change", color);
        });
        this.pickerField.addEventListener("change", (event) => {
            const color = event.target.value.slice(1);
            this.textField.value = color;
            this.emit("change", color);
        });
        this.setValue(color);
    }
    setValue(color) {
        this.textField.value = (color !== null) ? color : "";
        this.pickerField.value = (color !== null) ? `#${color}` : "#000000";
    }
    setDisabled(disabled) {
        this.textField.disabled = disabled;
        this.pickerField.disabled = disabled;
    }
}
function appendColorField(parent, color) {
    const colorParent = SupClient.html("div", "inputs", { parent });
    const textField = appendTextField(colorParent, "");
    textField.classList.add("color");
    const pickerField = SupClient.html("input", { parent: colorParent, type: "color" });
    return new ColorField(textField, pickerField, color);
}
exports.appendColorField = appendColorField;
class AssetFieldSubscriber extends events_1.EventEmitter {
    constructor(assetId, projectClient) {
        super();
        this.assetId = assetId;
        this.projectClient = projectClient;
        this.projectClient.subEntries(this);
    }
    destroy() {
        this.projectClient.unsubEntries(this);
    }
    onEntriesReceived(entries) {
        this.entries = entries;
        setTimeout(() => { this.emit("change", this.assetId); }, 1);
    }
    onEntryAdded(entry, parentId, index) { }
    onEntryMoved(id, parentId, index) {
        this.emit("change", this.assetId);
    }
    onSetEntryProperty(id, key, value) {
        if (key === "name")
            this.emit("change", this.assetId);
    }
    onEntryTrashed(id) {
        if (id === this.assetId)
            this.emit("change", this.assetId);
    }
    selectAssetId(assetId) {
        this.onChangeAssetId(assetId);
        this.emit("select", assetId);
    }
    onChangeAssetId(assetId) {
        this.assetId = assetId;
        this.emit("change", this.assetId);
    }
}
function appendAssetField(parent, assetId, assetType, projectClient) {
    const assetParent = SupClient.html("div", "inputs", { parent });
    const textField = SupClient.html("input", { parent: assetParent, type: "text", readOnly: true, style: { cursor: "pointer" } });
    const buttonElt = SupClient.html("button", { parent: assetParent, disabled: true, textContent: SupClient.i18n.t("common:actions.select") });
    let pluginPath;
    const assetSubscriber = new AssetFieldSubscriber(assetId, projectClient);
    assetSubscriber.on("change", (assetId) => {
        textField.value = assetId == null ? "" : assetSubscriber.entries.byId[assetId] == null ? "???" : assetSubscriber.entries.getPathFromId(assetId);
        buttonElt.textContent = SupClient.i18n.t(`common:actions.${assetId == null ? "select" : "clear"}`);
        buttonElt.disabled = pluginPath == null;
    });
    SupClient.fetch(`/systems/${SupCore.system.id}/plugins.json`, "json", (err, pluginsInfo) => {
        pluginPath = pluginsInfo.paths.editors[assetType];
        if (assetSubscriber.entries != null)
            buttonElt.disabled = false;
    });
    textField.addEventListener("click", (event) => {
        if (assetSubscriber.assetId != null) {
            SupClient.openEntry(assetSubscriber.assetId);
        }
        else {
            new FindAssetDialog_1.default(projectClient.entries, { [assetType]: { pluginPath } }, (assetId) => { if (assetId != null)
                assetSubscriber.selectAssetId(assetId); });
        }
    });
    textField.addEventListener("dragover", (event) => {
        if (!buttonElt.disabled)
            event.preventDefault();
    });
    textField.addEventListener("drop", (event) => {
        const entryId = event.dataTransfer.getData("application/vnd.ValjangEngine.entry").split(",")[0];
        if (typeof entryId !== "string")
            return;
        const entry = assetSubscriber.entries.byId[entryId];
        if (entry == null || entry.type !== assetType)
            return;
        assetSubscriber.selectAssetId(entryId);
    });
    buttonElt.addEventListener("click", (event) => {
        if (assetSubscriber.assetId != null) {
            assetSubscriber.selectAssetId(null);
            return;
        }
        new FindAssetDialog_1.default(projectClient.entries, { [assetType]: { pluginPath } }, (assetId) => { if (assetId != null)
            assetSubscriber.selectAssetId(assetId); });
    });
    return assetSubscriber;
}
exports.appendAssetField = appendAssetField;
