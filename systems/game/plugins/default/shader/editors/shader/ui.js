"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const network_1 = require("./network");
const engine_1 = require("./engine");
const Uniforms_1 = require("../../data/Uniforms");
const Attributes_1 = require("../../data/Attributes");
const ResizeHandle = require("resize-handle");
const ui = {};
exports.default = ui;
ui.uniformsList = document.querySelector(".uniforms tbody");
function setupUniform(uniform) {
    const rowElt = document.createElement("tr");
    rowElt.dataset["id"] = uniform.id;
    ui.uniformsList.insertBefore(rowElt, ui.uniformsList.lastChild);
    const nameElt = document.createElement("td");
    const nameInputElt = document.createElement("input");
    nameInputElt.classList.add("name");
    nameInputElt.addEventListener("change", (event) => {
        if (event.target.value === "")
            network_1.data.projectClient.editAsset(SupClient.query.asset, "deleteUniform", rowElt.dataset["id"]);
        else
            network_1.data.projectClient.editAsset(SupClient.query.asset, "setUniformProperty", rowElt.dataset["id"], "name", event.target.value);
    });
    nameInputElt.value = uniform.name;
    nameElt.appendChild(nameInputElt);
    rowElt.appendChild(nameElt);
    const typeElt = document.createElement("td");
    const selectTypeElt = document.createElement("select");
    for (const type of Uniforms_1.default.schema["type"].items) {
        const optionElt = document.createElement("option");
        optionElt.textContent = type;
        selectTypeElt.appendChild(optionElt);
    }
    selectTypeElt.classList.add("type");
    selectTypeElt.addEventListener("change", (event) => {
        network_1.data.projectClient.editAsset(SupClient.query.asset, "setUniformProperty", rowElt.dataset["id"], "type", event.target.value);
    });
    selectTypeElt.value = uniform.type;
    typeElt.appendChild(selectTypeElt);
    rowElt.appendChild(typeElt);
    const valueElt = document.createElement("td");
    rowElt.appendChild(valueElt);
    const valueDivElt = document.createElement("div");
    valueDivElt.classList.add("value");
    valueElt.appendChild(valueDivElt);
    setUniformValueInputs(uniform.id);
}
exports.setupUniform = setupUniform;
function setUniformValueInputs(id) {
    const uniform = network_1.data.shaderAsset.uniforms.byId[id];
    const valueRowElt = ui.uniformsList.querySelector(`[data-id='${id}'] .value`);
    while (valueRowElt.children.length > 0)
        valueRowElt.removeChild(valueRowElt.children[0]);
    switch (uniform.type) {
        case "f":
            const floatInputElt = document.createElement("input");
            floatInputElt.type = "number";
            floatInputElt.classList.add("float");
            floatInputElt.addEventListener("change", (event) => {
                network_1.data.projectClient.editAsset(SupClient.query.asset, "setUniformProperty", id, "value", parseFloat(event.target.value));
            });
            floatInputElt.value = uniform.value;
            valueRowElt.appendChild(floatInputElt);
            break;
        case "c":
        case "v2":
        case "v3":
        case "v4":
            setArrayUniformInputs(id, valueRowElt, uniform.type);
            break;
        case "t":
            const textInputElt = document.createElement("input");
            textInputElt.classList.add("text");
            textInputElt.addEventListener("change", (event) => {
                network_1.data.projectClient.editAsset(SupClient.query.asset, "setUniformProperty", id, "value", event.target.value);
            });
            textInputElt.value = uniform.value;
            valueRowElt.appendChild(textInputElt);
            break;
    }
}
exports.setUniformValueInputs = setUniformValueInputs;
function setArrayUniformInputs(id, parentElt, name) {
    const uniform = network_1.data.shaderAsset.uniforms.byId[id];
    for (let i = 0; i < uniform.value.length; i++) {
        const inputElt = document.createElement("input");
        inputElt.type = "number";
        inputElt.classList.add(`${name}_${i}`);
        inputElt.addEventListener("change", (event) => {
            const values = [];
            for (let j = 0; j < uniform.value.length; j++) {
                const elt = parentElt.querySelector(`.${name}_${j}`);
                values.push(parseFloat(elt.value));
            }
            network_1.data.projectClient.editAsset(SupClient.query.asset, "setUniformProperty", id, "value", values);
        });
        inputElt.value = uniform.value[i];
        parentElt.appendChild(inputElt);
    }
}
const newUniformInput = document.querySelector(".uniforms .new input");
newUniformInput.addEventListener("keyup", (event) => {
    if (event.keyCode === 13) {
        network_1.data.projectClient.editAsset(SupClient.query.asset, "newUniform", event.target.value);
        event.target.value = "";
    }
});
ui.useLightUniformsCheckbox = document.getElementById("use-light-uniforms");
ui.useLightUniformsCheckbox.addEventListener("change", (event) => {
    network_1.data.projectClient.editAsset(SupClient.query.asset, "setProperty", "useLightUniforms", event.target.checked);
});
ui.attributesList = document.querySelector(".attributes tbody");
function setupAttribute(attribute) {
    const rowElt = document.createElement("tr");
    rowElt.dataset["id"] = attribute.id;
    ui.attributesList.insertBefore(rowElt, ui.attributesList.lastChild);
    const nameElt = document.createElement("td");
    const nameInputElt = document.createElement("input");
    nameInputElt.classList.add("name");
    nameInputElt.addEventListener("change", (event) => {
        if (event.target.value === "")
            network_1.data.projectClient.editAsset(SupClient.query.asset, "deleteAttribute", rowElt.dataset["id"]);
        else
            network_1.data.projectClient.editAsset(SupClient.query.asset, "setAttributeProperty", rowElt.dataset["id"], "name", event.target.value);
    });
    nameInputElt.value = attribute.name;
    nameElt.appendChild(nameInputElt);
    rowElt.appendChild(nameElt);
    const typeElt = document.createElement("td");
    const selectTypeElt = document.createElement("select");
    for (const type of Attributes_1.default.schema["type"].items) {
        const optionElt = document.createElement("option");
        optionElt.textContent = type;
        selectTypeElt.appendChild(optionElt);
    }
    selectTypeElt.classList.add("type");
    selectTypeElt.addEventListener("change", (event) => { network_1.data.projectClient.editAsset(SupClient.query.asset, "setAttributeProperty", rowElt.dataset["id"], "type", event.target.value); });
    selectTypeElt.value = attribute.type;
    typeElt.appendChild(selectTypeElt);
    rowElt.appendChild(typeElt);
    const valueElt = document.createElement("td");
    valueElt.textContent = "Random";
    rowElt.appendChild(valueElt);
}
exports.setupAttribute = setupAttribute;
const newAttributeInput = document.querySelector(".attributes .new input");
newAttributeInput.addEventListener("keyup", (event) => {
    if (event.keyCode === 13) {
        network_1.data.projectClient.editAsset(SupClient.query.asset, "newAttribute", event.target.value);
        event.target.value = "";
    }
});
const shadersPane = document.querySelector(".shaders");
const shaderPaneResizeHandle = new ResizeHandle(shadersPane, "bottom");
shaderPaneResizeHandle.on("drag", () => {
    ui.vertexEditor.codeMirrorInstance.refresh();
    ui.fragmentEditor.codeMirrorInstance.refresh();
});
function onSaveVertex() {
    if (!ui.vertexHeader.classList.contains("has-errors"))
        network_1.data.projectClient.editAsset(SupClient.query.asset, "saveVertexShader");
}
function onSaveFragment() {
    if (!ui.fragmentHeader.classList.contains("has-errors"))
        network_1.data.projectClient.editAsset(SupClient.query.asset, "saveFragmentShader");
}
const fragmentShadersPane = shadersPane.querySelector(".fragment");
const fragmentShaderPaneResizeHandle = new ResizeHandle(fragmentShadersPane, "right");
fragmentShaderPaneResizeHandle.on("drag", () => {
    ui.vertexEditor.codeMirrorInstance.refresh();
    ui.fragmentEditor.codeMirrorInstance.refresh();
});
ui.vertexSaveElt = document.querySelector(".vertex button");
ui.vertexHeader = document.querySelector(".vertex .header");
ui.vertexSaveElt.addEventListener("click", onSaveVertex);
ui.fragmentSaveElt = document.querySelector(".fragment button");
ui.fragmentHeader = document.querySelector(".fragment .header");
ui.fragmentSaveElt.addEventListener("click", onSaveFragment);
function setupEditors(clientId) {
    const vertexTextArea = document.querySelector(".vertex textarea");
    ui.vertexEditor = new TextEditorWidget(network_1.data.projectClient, clientId, vertexTextArea, {
        mode: "x-shader/x-vertex",
        extraKeys: {
            "Ctrl-S": () => { onSaveVertex(); },
            "Cmd-S": () => { onSaveVertex(); },
        },
        sendOperationCallback: (operation) => {
            network_1.data.projectClient.editAsset(SupClient.query.asset, "editVertexShader", operation, network_1.data.shaderAsset.vertexDocument.getRevisionId());
        }
    });
    const fragmentTextArea = document.querySelector(".fragment textarea");
    ui.fragmentEditor = new TextEditorWidget(network_1.data.projectClient, clientId, fragmentTextArea, {
        mode: "x-shader/x-fragment",
        extraKeys: {
            "Ctrl-S": () => { onSaveFragment(); },
            "Cmd-S": () => { onSaveFragment(); },
        },
        sendOperationCallback: (operation) => {
            network_1.data.projectClient.editAsset(SupClient.query.asset, "editFragmentShader", operation, network_1.data.shaderAsset.fragmentDocument.getRevisionId());
        }
    });
}
exports.setupEditors = setupEditors;
const previewPane = document.querySelector(".preview");
new ResizeHandle(previewPane, "right");
ui.previewTypeSelect = previewPane.querySelector("select");
ui.previewTypeSelect.addEventListener("change", () => {
    ui.previewAssetInput.hidden = ui.previewTypeSelect.value !== "Asset";
    engine_1.setupPreview();
});
ui.previewAssetInput = previewPane.querySelector("input");
ui.previewAssetInput.addEventListener("input", (event) => {
    if (event.target.value === "") {
        ui.previewEntry = null;
        engine_1.setupPreview();
        return;
    }
    const entry = SupClient.findEntryByPath(network_1.data.projectClient.entries.pub, event.target.value);
    if (entry == null || (entry.type !== "sprite" && entry.type !== "model"))
        return;
    ui.previewEntry = entry;
    engine_1.setupPreview();
});
