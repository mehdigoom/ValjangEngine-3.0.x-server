"use strict";
/// <reference path="../../../common/textEditorWidget/operational-transform.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
const OT = require("operational-transform");
const fs = require("fs");
const path = require("path");
const async = require("async");
const _ = require("lodash");
const Uniforms_1 = require("./Uniforms");
const Attributes_1 = require("./Attributes");
class ShaderAsset extends SupCore.Data.Base.Asset {
    constructor(id, pub, server) {
        super(id, pub, ShaderAsset.schema, server);
    }
    init(options, callback) {
        this.server.data.resources.acquire("textEditorSettings", null, (err, textEditorSettings) => {
            this.server.data.resources.release("textEditorSettings", null);
            let tab;
            if (textEditorSettings.pub.softTab) {
                tab = "";
                for (let i = 0; i < textEditorSettings.pub.tabSize; i++)
                    tab = tab + " ";
            }
            else
                tab = "\t";
            const defaultVertexContent = `varying vec2 vUv;

void main() {
${tab}vUv = uv;
${tab}gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
}
`;
            const defaultFragmentContent = `uniform sampler2D map;
varying vec2 vUv;

void main() {
${tab}gl_FragColor = texture2D(map, vUv);
}
`;
            this.pub = {
                formatVersion: ShaderAsset.currentFormatVersion,
                uniforms: [{ id: "0", name: "map", type: "t", value: "map" }],
                useLightUniforms: false,
                attributes: [],
                vertexShader: {
                    text: defaultVertexContent,
                    draft: defaultVertexContent,
                    revisionId: 0
                },
                fragmentShader: {
                    text: defaultFragmentContent,
                    draft: defaultFragmentContent,
                    revisionId: 0
                }
            };
            super.init(options, callback);
        });
    }
    setup() {
        this.uniforms = new Uniforms_1.default(this.pub.uniforms);
        this.attributes = new Attributes_1.default(this.pub.attributes);
        this.vertexDocument = new OT.Document(this.pub.vertexShader.draft, this.pub.vertexShader.revisionId);
        this.fragmentDocument = new OT.Document(this.pub.fragmentShader.draft, this.pub.fragmentShader.revisionId);
    }
    load(assetPath) {
        let pub;
        const loadShaders = () => {
            // NOTE: Migration for Superpowers 0.10
            if (typeof pub.vertexShader === "string") {
                pub.vertexShader = {
                    text: pub.vertexShader,
                    draft: pub.vertexShader,
                    revisionId: 0
                };
                pub.fragmentShader = {
                    text: pub.fragmentShader,
                    draft: pub.fragmentShader,
                    revisionId: 0
                };
                this._onLoaded(assetPath, pub);
                return;
            }
            pub.vertexShader = { text: null, draft: null, revisionId: 0 };
            pub.fragmentShader = { text: null, draft: null, revisionId: 0 };
            // TODO: Rename to .glsl instead of .txt
            async.series([
                (cb) => {
                    fs.readFile(path.join(assetPath, "vertexShader.txt"), { encoding: "utf8" }, (err, text) => {
                        pub.vertexShader.text = text;
                        cb(null);
                    });
                },
                (cb) => {
                    fs.readFile(path.join(assetPath, "vertexShaderDraft.txt"), { encoding: "utf8" }, (err, draft) => {
                        pub.vertexShader.draft = (draft != null) ? draft : pub.vertexShader.text;
                        cb(null);
                    });
                },
                (cb) => {
                    fs.readFile(path.join(assetPath, "fragmentShader.txt"), { encoding: "utf8" }, (err, text) => {
                        pub.fragmentShader.text = text;
                        cb(null);
                    });
                },
                (cb) => {
                    fs.readFile(path.join(assetPath, "fragmentShaderDraft.txt"), { encoding: "utf8" }, (err, draft) => {
                        pub.fragmentShader.draft = (draft != null) ? draft : pub.fragmentShader.text;
                        this._onLoaded(assetPath, pub);
                    });
                }
            ]);
        };
        fs.readFile(path.join(assetPath, "shader.json"), { encoding: "utf8" }, (err, json) => {
            // NOTE: "asset.json" was renamed to "shader.json" in Superpowers 0.11
            if (err != null && err.code === "ENOENT") {
                fs.readFile(path.join(assetPath, "asset.json"), { encoding: "utf8" }, (err, json) => {
                    fs.rename(path.join(assetPath, "asset.json"), path.join(assetPath, "shader.json"), (err) => {
                        pub = JSON.parse(json);
                        loadShaders();
                    });
                });
            }
            else {
                pub = JSON.parse(json);
                loadShaders();
            }
        });
    }
    migrate(assetPath, pub, callback) {
        if (pub.formatVersion === ShaderAsset.currentFormatVersion) {
            callback(false);
            return;
        }
        if (pub.formatVersion == null) {
            // NOTE: Introduced in Superpowers 0.11
            if (pub.useLightUniforms == null)
                pub.useLightUniforms = false;
            pub.formatVersion = 1;
        }
        callback(true);
    }
    save(outputPath, callback) {
        // NOTE: Doing a clone here because of asynchronous operations below
        // We should use the new asset locking system instead
        const vertexShader = _.cloneDeep(this.pub.vertexShader);
        const fragmentShader = _.cloneDeep(this.pub.fragmentShader);
        this.write(fs.writeFile, outputPath, (err) => {
            if (err != null) {
                callback(err);
                return;
            }
            async.series([
                (cb) => {
                    if (vertexShader.draft !== vertexShader.text) {
                        fs.writeFile(path.join(outputPath, "vertexShaderDraft.txt"), vertexShader.draft, { encoding: "utf8" }, (err) => {
                            if (err != null && err.code !== "ENOENT")
                                cb(err);
                            else
                                cb(null);
                        });
                    }
                    else {
                        fs.unlink(path.join(outputPath, "vertexShaderDraft.txt"), (err) => {
                            if (err != null && err.code !== "ENOENT")
                                cb(err);
                            else
                                cb(null);
                        });
                    }
                },
                (cb) => {
                    if (fragmentShader.draft !== fragmentShader.text) {
                        fs.writeFile(path.join(outputPath, "fragmentShaderDraft.txt"), fragmentShader.draft, { encoding: "utf8" }, (err) => {
                            if (err != null && err.code !== "ENOENT")
                                cb(err);
                            else
                                cb(null);
                        });
                    }
                    else {
                        fs.unlink(path.join(outputPath, "fragmentShaderDraft.txt"), (err) => {
                            if (err != null && err.code !== "ENOENT")
                                cb(err);
                            else
                                cb(null);
                        });
                    }
                }
            ], callback);
        });
    }
    clientExport(outputPath, callback) {
        this.write(SupApp.writeFile, outputPath, callback);
    }
    write(writeFile, outputPath, callback) {
        // NOTE: Doing a clone here because of asynchronous operations below
        // We should use the new asset locking system instead
        const vertexShader = _.cloneDeep(this.pub.vertexShader);
        const fragmentShader = _.cloneDeep(this.pub.fragmentShader);
        delete this.pub.vertexShader;
        delete this.pub.fragmentShader;
        const json = JSON.stringify(this.pub, null, 2);
        this.pub.vertexShader = vertexShader;
        this.pub.fragmentShader = fragmentShader;
        // TODO: Rename to .glsl instead of .txt
        async.series([
            (cb) => {
                writeFile(path.join(outputPath, "shader.json"), json, { encoding: "utf8" }, (err) => {
                    if (err != null)
                        cb(err);
                    else
                        cb(null);
                });
            },
            (cb) => {
                writeFile(path.join(outputPath, "vertexShader.txt"), vertexShader.text, { encoding: "utf8" }, (err) => {
                    if (err != null)
                        cb(err);
                    else
                        cb(null);
                });
            },
            (cb) => {
                writeFile(path.join(outputPath, "fragmentShader.txt"), fragmentShader.text, { encoding: "utf8" }, (err) => {
                    if (err != null)
                        cb(err);
                    else
                        cb(null);
                });
            },
        ], callback);
    }
    server_newUniform(client, name, callback) {
        for (const uniform of this.pub.uniforms) {
            if (uniform.name === name) {
                callback(`An uniform named ${name} already exists`);
                return;
            }
        }
        const uniform = { id: null, name, type: "f", value: "0.0" };
        this.uniforms.add(uniform, null, (err, actualIndex) => {
            if (err != null) {
                callback(err);
                return;
            }
            callback(null, null, uniform, actualIndex);
            this.emit("change");
        });
    }
    client_newUniform(uniform, actualIndex) {
        this.uniforms.client_add(uniform, actualIndex);
    }
    server_deleteUniform(client, id, callback) {
        this.uniforms.remove(id, (err) => {
            if (err != null) {
                callback(err);
                return;
            }
            callback(null, null, id);
            this.emit("change");
        });
    }
    client_deleteUniform(id) {
        this.uniforms.client_remove(id);
        return;
    }
    server_setUniformProperty(client, id, key, value, callback) {
        if (key === "name") {
            if (typeof (value) !== "string") {
                callback("Invalid value");
                return;
            }
            value = value.trim();
            if (SupCore.Data.hasDuplicateName(id, value, this.uniforms.pub)) {
                callback("There's already an uniform with this name");
                return;
            }
        }
        this.uniforms.setProperty(id, key, value, (err, actualValue) => {
            if (err != null) {
                callback(err);
                return;
            }
            callback(null, null, id, key, actualValue);
            this.emit("change");
        });
    }
    client_setUniformProperty(id, key, actualValue) {
        this.uniforms.client_setProperty(id, key, actualValue);
    }
    server_newAttribute(client, name, callback) {
        for (const attribute of this.pub.attributes) {
            if (attribute.name === name) {
                callback(`An attribute named ${name} already exists`);
                return;
            }
        }
        const attribute = { id: null, name, type: "f" };
        this.attributes.add(attribute, null, (err, actualIndex) => {
            if (err != null) {
                callback(err);
                return;
            }
            callback(null, null, attribute, actualIndex);
            this.emit("change");
        });
    }
    client_newAttribute(attribute, actualIndex) {
        this.attributes.client_add(attribute, actualIndex);
    }
    server_deleteAttribute(client, id, callback) {
        this.attributes.remove(id, (err) => {
            if (err != null) {
                callback(err);
                return;
            }
            callback(null, null, id);
            this.emit("change");
        });
    }
    client_deleteAttribute(id) {
        this.attributes.client_remove(id);
        return;
    }
    server_setAttributeProperty(client, id, key, value, callback) {
        if (key === "name") {
            if (typeof (value) !== "string") {
                callback("Invalid value");
                return;
            }
            value = value.trim();
            if (SupCore.Data.hasDuplicateName(id, value, this.attributes.pub)) {
                callback("There's already an attribute with this name");
                return;
            }
        }
        this.attributes.setProperty(id, key, value, (err, actualValue) => {
            if (err != null) {
                callback(err);
                return;
            }
            callback(null, null, id, key, actualValue);
            this.emit("change");
        });
    }
    client_setAttributeProperty(id, key, actualValue) {
        this.attributes.client_setProperty(id, key, actualValue);
    }
    server_editVertexShader(client, operationData, revisionIndex, callback) {
        if (operationData.userId !== client.id) {
            callback("Invalid client id");
            return;
        }
        let operation = new OT.TextOperation();
        if (!operation.deserialize(operationData)) {
            callback("Invalid operation data");
            return;
        }
        try {
            operation = this.vertexDocument.apply(operation, revisionIndex);
        }
        catch (err) {
            callback("Operation can't be applied");
            return;
        }
        this.pub.vertexShader.draft = this.vertexDocument.text;
        this.pub.vertexShader.revisionId++;
        callback(null, null, operation.serialize(), this.vertexDocument.getRevisionId() - 1);
        this.emit("change");
    }
    client_editVertexShader(operationData, revisionIndex) {
        const operation = new OT.TextOperation();
        operation.deserialize(operationData);
        this.vertexDocument.apply(operation, revisionIndex);
        this.pub.vertexShader.draft = this.vertexDocument.text;
        this.pub.vertexShader.revisionId++;
    }
    server_saveVertexShader(client, callback) {
        this.pub.vertexShader.text = this.pub.vertexShader.draft;
        callback(null);
        this.emit("change");
    }
    client_saveVertexShader() {
        this.pub.vertexShader.text = this.pub.vertexShader.draft;
    }
    server_editFragmentShader(client, operationData, revisionIndex, callback) {
        if (operationData.userId !== client.id) {
            callback("Invalid client id");
            return;
        }
        let operation = new OT.TextOperation();
        if (!operation.deserialize(operationData)) {
            callback("Invalid operation data");
            return;
        }
        try {
            operation = this.fragmentDocument.apply(operation, revisionIndex);
        }
        catch (err) {
            callback("Operation can't be applied");
            return;
        }
        this.pub.fragmentShader.draft = this.fragmentDocument.text;
        this.pub.fragmentShader.revisionId++;
        callback(null, null, operation.serialize(), this.fragmentDocument.getRevisionId() - 1);
        this.emit("change");
    }
    client_editFragmentShader(operationData, revisionIndex) {
        const operation = new OT.TextOperation();
        operation.deserialize(operationData);
        this.fragmentDocument.apply(operation, revisionIndex);
        this.pub.fragmentShader.draft = this.fragmentDocument.text;
        this.pub.fragmentShader.revisionId++;
    }
    server_saveFragmentShader(client, callback) {
        this.pub.fragmentShader.text = this.pub.fragmentShader.draft;
        callback(null);
        this.emit("change");
    }
    client_saveFragmentShader() {
        this.pub.fragmentShader.text = this.pub.fragmentShader.draft;
    }
}
ShaderAsset.currentFormatVersion = 1;
ShaderAsset.schema = {
    formatVersion: { type: "integer" },
    uniforms: { type: "array" },
    useLightUniforms: { type: "boolean", mutable: true },
    attributes: { type: "array" },
    vertexShader: {
        type: "hash",
        properties: {
            text: { type: "string" },
            draft: { type: "string" },
            revisionId: { type: "integer" }
        }
    },
    fragmentShader: {
        type: "hash",
        properties: {
            text: { type: "string" },
            draft: { type: "string" },
            revisionId: { type: "integer" }
        }
    }
};
exports.default = ShaderAsset;
