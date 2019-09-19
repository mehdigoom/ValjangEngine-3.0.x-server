(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const THREE = SupEngine.THREE;
function createShaderMaterial(asset, textures, geometry, options) {
    if (asset == null)
        return null;
    let uniforms = options != null && options.defaultUniforms != null ? THREE.UniformsUtils.clone(options.defaultUniforms) :
        {};
    if (asset.useLightUniforms) {
        uniforms = THREE.UniformsUtils.merge([uniforms, THREE.UniformsUtils.clone(THREE.UniformsLib.lights)]);
    }
    uniforms["time"] = { type: "f", value: 0.0 };
    for (const uniform of asset.uniforms) {
        let value;
        switch (uniform.type) {
            case "f":
                value = uniform.value;
                break;
            case "c":
                value = new THREE.Color(uniform.value[0], uniform.value[1], uniform.value[2]);
                break;
            case "v2":
                value = new THREE.Vector2(uniform.value[0], uniform.value[1]);
                break;
            case "v3":
                value = new THREE.Vector3(uniform.value[0], uniform.value[1], uniform.value[2]);
                break;
            case "v4":
                value = new THREE.Vector4(uniform.value[0], uniform.value[1], uniform.value[2], uniform.value[3]);
                break;
            case "t":
                value = textures[uniform.value];
                if (value == null) {
                    console.warn(`Texture "${uniform.name}" is null`);
                    continue;
                }
                break;
        }
        uniforms[uniform.name] = { type: uniform.type, value };
    }
    for (const attribute of asset.attributes) {
        const values = [];
        let itemSize;
        switch (attribute.type) {
            case "f":
                itemSize = 1;
                break;
            case "c":
                itemSize = 3;
                break;
            case "v2":
                itemSize = 2;
                break;
            case "v3":
                itemSize = 3;
                break;
            case "v4":
                itemSize = 4;
                break;
        }
        const triangleCount = geometry.getAttribute("position").length / 3;
        for (let v = 0; v < triangleCount; v++) {
            for (let i = 0; i < itemSize; i++)
                values.push(Math.random());
        }
        geometry.addAttribute(attribute.name, new THREE.BufferAttribute(new Float32Array(values), itemSize));
    }
    const useDraft = options != null && options.useDraft === true;
    const vertexShader = useDraft ? asset.vertexShader.draft : asset.vertexShader.text;
    const fragmentShader = useDraft ? asset.fragmentShader.draft : asset.fragmentShader.text;
    return new THREE.ShaderMaterial({
        uniforms,
        vertexShader, fragmentShader,
        transparent: true,
        lights: asset.useLightUniforms
    });
}
exports.createShaderMaterial = createShaderMaterial;

},{}],2:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Shader = require("./Shader");
SupEngine.registerComponentClass("Shader", Shader);

},{"./Shader":1}]},{},[2]);
