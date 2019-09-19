"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ui_1 = require("./ui");
const engine_1 = require("./engine");
SupClient.i18n.load([], () => {
    exports.socket = SupClient.connect(SupClient.query.project);
    exports.socket.on("welcome", onWelcome);
    exports.socket.on("disconnect", SupClient.onDisconnected);
});
function onWelcome(clientId) {
    exports.data = { projectClient: new SupClient.ProjectClient(exports.socket, { subEntries: true }) };
    ui_1.setupEditors(clientId);
    exports.data.projectClient.subAsset(SupClient.query.asset, "shader", { onAssetReceived, onAssetEdited, onAssetTrashed });
}
function onAssetReceived(assetId, asset) {
    exports.data.shaderAsset = asset;
    for (const uniform of asset.pub.uniforms)
        ui_1.setupUniform(uniform);
    ui_1.default.useLightUniformsCheckbox.checked = asset.pub.useLightUniforms;
    for (const attribute of asset.pub.attributes)
        ui_1.setupAttribute(attribute);
    ui_1.default.vertexEditor.setText(asset.pub.vertexShader.draft);
    if (asset.pub.vertexShader.draft !== asset.pub.vertexShader.text)
        checkVertexShader();
    ui_1.default.fragmentEditor.setText(asset.pub.fragmentShader.draft);
    if (asset.pub.fragmentShader.draft !== asset.pub.fragmentShader.text)
        checkFragmentShader();
    engine_1.setupPreview();
}
const onEditCommands = {};
function onAssetEdited(id, command, ...args) {
    const commandFunction = onEditCommands[command];
    if (commandFunction != null)
        commandFunction.apply(this, args);
    if (ui_1.default.previewTypeSelect.value !== "Asset" && command !== "editVertexShader" && command !== "editFragmentShader")
        engine_1.setupPreview();
}
onEditCommands["setProperty"] = (path, value) => {
    switch (path) {
        case "useLightUniforms":
            ui_1.default.useLightUniformsCheckbox.checked = value;
            break;
    }
};
onEditCommands["newUniform"] = (uniform) => { ui_1.setupUniform(uniform); };
onEditCommands["deleteUniform"] = (id) => {
    const rowElt = ui_1.default.uniformsList.querySelector(`[data-id='${id}']`);
    rowElt.parentElement.removeChild(rowElt);
};
onEditCommands["setUniformProperty"] = (id, key, value) => {
    const rowElt = ui_1.default.uniformsList.querySelector(`[data-id='${id}']`);
    if (key === "value") {
        const type = exports.data.shaderAsset.uniforms.byId[id].type;
        switch (type) {
            case "f":
                const floatInputElt = rowElt.querySelector(".float");
                floatInputElt.value = value;
                break;
            case "c":
            case "v2":
            case "v3":
            case "v4":
                setUniformValues(rowElt, type, value);
                break;
            case "t":
                const textInputElt = rowElt.querySelector(".text");
                textInputElt.value = value;
                break;
        }
    }
    else {
        const fieldElt = rowElt.querySelector(`.${key}`);
        fieldElt.value = value;
    }
    if (key === "type")
        ui_1.setUniformValueInputs(id);
};
function setUniformValues(parentElt, name, values) {
    for (let i = 0; i < values.length; i++)
        parentElt.querySelector(`.${name}_${i}`).value = values[i].toString();
}
onEditCommands["newAttribute"] = (attribute) => { ui_1.setupAttribute(attribute); };
onEditCommands["deleteAttribute"] = (id) => {
    const rowElt = ui_1.default.attributesList.querySelector(`[data-id='${id}']`);
    rowElt.parentElement.removeChild(rowElt);
};
onEditCommands["setAttributeProperty"] = (id, key, value) => {
    const rowElt = ui_1.default.attributesList.querySelector(`[data-id='${id}']`);
    const fieldElt = rowElt.querySelector(`.${key}`);
    fieldElt.value = value;
};
onEditCommands["editVertexShader"] = (operationData) => {
    ui_1.default.vertexEditor.receiveEditText(operationData);
    checkVertexShader();
};
onEditCommands["saveVertexShader"] = () => {
    ui_1.default.vertexHeader.classList.toggle("has-draft", false);
    ui_1.default.vertexHeader.classList.toggle("has-errors", false);
    ui_1.default.vertexSaveElt.hidden = true;
};
onEditCommands["editFragmentShader"] = (operationData) => {
    ui_1.default.fragmentEditor.receiveEditText(operationData);
    checkFragmentShader();
};
onEditCommands["saveFragmentShader"] = () => {
    ui_1.default.fragmentHeader.classList.toggle("has-draft", false);
    ui_1.default.fragmentHeader.classList.toggle("has-errors", false);
    ui_1.default.fragmentSaveElt.hidden = true;
};
function onAssetTrashed() {
    SupClient.onAssetTrashed();
}
const gl = document.createElement("canvas").getContext("webgl");
function replaceShaderChunk(shader) {
    shader = shader.replace(/#include +<([\w\d.]+)>/g, (match, include) => SupEngine.THREE.ShaderChunk[include]);
    for (const lightNumString of ["NUM_DIR_LIGHTS", "NUM_SPOT_LIGHTS", "NUM_POINT_LIGHTS", "NUM_HEMI_LIGHTS"])
        shader = shader.replace(RegExp(lightNumString, "g"), "1");
    return shader;
}
const vertexStart = `precision mediump float;precision mediump int;
#define SHADER_NAME ShaderMaterial
#define VERTEX_TEXTURES
#define GAMMA_FACTOR 2
#define MAX_BONES 251
uniform mat4 modelMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat3 normalMatrix;
uniform vec3 cameraPosition;
attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;
#ifdef USE_COLOR
  attribute vec3 color;
#endif
#ifdef USE_MORPHTARGETS
  attribute vec3 morphTarget0;
  attribute vec3 morphTarget1;
  attribute vec3 morphTarget2;
  attribute vec3 morphTarget3;
  #ifdef USE_MORPHNORMALS
    attribute vec3 morphNormal0;
    attribute vec3 morphNormal1;
    attribute vec3 morphNormal2;
    attribute vec3 morphNormal3;
  #else
    attribute vec3 morphTarget4;
    attribute vec3 morphTarget5;
    attribute vec3 morphTarget6;
    attribute vec3 morphTarget7;
  #endif
#endif
#ifdef USE_SKINNING
  attribute vec4 skinIndex;
  attribute vec4 skinWeight;
#endif
`;
const vertexStartLength = vertexStart.split("\n").length;
function checkVertexShader() {
    const shader = gl.createShader(gl.VERTEX_SHADER);
    const shaderCode = replaceShaderChunk(ui_1.default.vertexEditor.codeMirrorInstance.getDoc().getValue());
    gl.shaderSource(shader, `${vertexStart}\n${shaderCode}`);
    gl.compileShader(shader);
    const log = gl.getShaderInfoLog(shader);
    const errors = log.split("\n");
    if (errors[errors.length - 1] === "")
        errors.pop();
    for (let error of errors) {
        error = error.replace("ERROR: 0:", "");
        const lineLimiterIndex = error.indexOf(":");
        const line = parseInt(error.slice(0, lineLimiterIndex), 10) - vertexStartLength;
        const message = error.slice(lineLimiterIndex + 2);
        console.log(`Error at line "${line}": ${message}`);
    }
    ui_1.default.vertexHeader.classList.toggle("has-errors", errors.length > 0);
    ui_1.default.vertexHeader.classList.toggle("has-draft", true);
    ui_1.default.vertexSaveElt.hidden = errors.length > 0;
}
const fragmentStart = `precision mediump float;
precision mediump int;
#define SHADER_NAME ShaderMaterial
#define GAMMA_FACTOR 2
uniform mat4 viewMatrix;
uniform vec3 cameraPosition;
`;
const fragmentStartLength = fragmentStart.split("\n").length;
function checkFragmentShader() {
    const shader = gl.createShader(gl.FRAGMENT_SHADER);
    const shaderCode = replaceShaderChunk(ui_1.default.fragmentEditor.codeMirrorInstance.getDoc().getValue());
    gl.shaderSource(shader, `${fragmentStart}\n${shaderCode}`);
    gl.compileShader(shader);
    const log = gl.getShaderInfoLog(shader);
    const errors = log.split("\n");
    if (errors[errors.length - 1] === "")
        errors.pop();
    for (let error of errors) {
        error = error.replace("ERROR: 0:", "");
        const lineLimiterIndex = error.indexOf(":");
        const line = parseInt(error.slice(0, lineLimiterIndex), 10) - fragmentStartLength;
        const message = error.slice(lineLimiterIndex + 2);
        console.log(`Error at line "${line}": ${message}`);
    }
    ui_1.default.fragmentHeader.classList.toggle("has-errors", errors.length > 0);
    ui_1.default.fragmentHeader.classList.toggle("has-draft", true);
    ui_1.default.fragmentSaveElt.hidden = errors.length > 0;
}
