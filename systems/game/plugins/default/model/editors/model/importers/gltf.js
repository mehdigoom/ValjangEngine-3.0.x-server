"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const async = require("async");
const index_1 = require("./index");
const THREE = SupEngine.THREE;
var GLTFConst;
(function (GLTFConst) {
    GLTFConst[GLTFConst["UNSIGNED_SHORT"] = 5123] = "UNSIGNED_SHORT";
    GLTFConst[GLTFConst["FLOAT"] = 5126] = "FLOAT";
})(GLTFConst || (GLTFConst = {}));
var GLTFPrimitiveMode;
(function (GLTFPrimitiveMode) {
    GLTFPrimitiveMode[GLTFPrimitiveMode["POINTS"] = 0] = "POINTS";
    GLTFPrimitiveMode[GLTFPrimitiveMode["LINES"] = 1] = "LINES";
    GLTFPrimitiveMode[GLTFPrimitiveMode["LINE_LOOP"] = 2] = "LINE_LOOP";
    GLTFPrimitiveMode[GLTFPrimitiveMode["LINE_STRIP"] = 3] = "LINE_STRIP";
    GLTFPrimitiveMode[GLTFPrimitiveMode["TRIANGLES"] = 4] = "TRIANGLES";
    GLTFPrimitiveMode[GLTFPrimitiveMode["TRIANGLE_STRIP"] = 5] = "TRIANGLE_STRIP";
    GLTFPrimitiveMode[GLTFPrimitiveMode["TRIANGLE_FAN"] = 6] = "TRIANGLE_FAN";
})(GLTFPrimitiveMode || (GLTFPrimitiveMode = {}));
function convertAxisAngleToQuaternionArray(rotations, count) {
    const q = new THREE.Quaternion;
    const axis = new THREE.Vector3;
    for (let i = 0; i < count; i++) {
        axis.set(rotations[i * 4], rotations[i * 4 + 1], rotations[i * 4 + 2]).normalize();
        const angle = rotations[i * 4 + 3];
        q.setFromAxisAngle(axis, angle);
        rotations[i * 4] = q.x;
        rotations[i * 4 + 1] = q.y;
        rotations[i * 4 + 2] = q.z;
        rotations[i * 4 + 3] = q.w;
    }
}
function convertAxisAngleToQuaternion(rotation) {
    const q = new THREE.Quaternion;
    const axis = new THREE.Vector3;
    axis.set(rotation[0], rotation[1], rotation[2]).normalize();
    q.setFromAxisAngle(axis, rotation[3]);
    return q;
}
function getNodeMatrix(node, version) {
    const matrix = new THREE.Matrix4;
    if (node.matrix != null)
        return matrix.fromArray(node.matrix);
    return matrix.compose(new THREE.Vector3(node.translation[0], node.translation[1], node.translation[2]), (version !== "0.8") ? new THREE.Quaternion().fromArray(node.rotation) : convertAxisAngleToQuaternion(node.rotation), new THREE.Vector3(node.scale[0], node.scale[1], node.scale[2]));
}
function importModel(files, callback) {
    let gltfFile = null;
    const bufferFiles = {};
    const imageFiles = {};
    const buffers = {};
    for (const file of files) {
        const filename = file.name;
        const extension = filename.substring(filename.lastIndexOf(".") + 1).toLowerCase();
        switch (extension) {
            case "gltf":
                if (gltfFile != null) {
                    callback([index_1.createLogError(`Cannot import multiple GLTF files at once, already found ${gltfFile.name}`, filename)]);
                    return;
                }
                gltfFile = file;
                break;
            case "bin":
                bufferFiles[filename] = file;
                break;
            case "png":
            case "jpg":
                imageFiles[filename] = file;
                break;
            default:
                callback([index_1.createLogError(`Unsupported file type`, filename)]);
                return;
        }
    }
    const onGLTFRead = (err, gltf) => {
        if (err != null) {
            callback([index_1.createLogError("Could not parse as JSON", gltfFile.name)]);
            return;
        }
        const meshNames = Object.keys(gltf.meshes);
        if (meshNames.length > 1) {
            callback([index_1.createLogError("Only a single mesh is supported")], gltfFile.name);
            return;
        }
        // Used to be a number before 1.0, now it's a string, so let's normalize it
        gltf.asset.version = gltf.asset.version.toString();
        if (gltf.asset.version === "1")
            gltf.asset.version = "1.0";
        const supportedVersions = ["0.8", "1.0"];
        if (supportedVersions.indexOf(gltf.asset.version) === -1) {
            callback([index_1.createLogError(`Unsupported glTF format version: ${gltf.asset.version}. Supported versions are: ${supportedVersions.join(", ")}.`)], gltfFile.name);
            return;
        }
        const rootNode = gltf.nodes[gltf.scenes[gltf.scene].nodes[0]];
        // Check if the model has its up-axis pointing in the wrong direction
        let upAxisMatrix = null;
        if (rootNode.name === "Y_UP_Transform") {
            upAxisMatrix = new THREE.Matrix4().fromArray(rootNode.matrix);
            if (gltf.asset.generator === "collada2gltf@abb81d52ce290268fdb67b96f5bc5c620dee5bb5") {
                // The Y_UP_Transform matrix needed to be reversed
                // prior to this pull request: https://github.com/KhronosGroup/glTF/pull/332
                upAxisMatrix.getInverse(upAxisMatrix);
            }
        }
        let meshName = null;
        // let rootBoneNames: string[] = null;
        let skin = null;
        const nodesByJointName = {};
        const walkNode = (rootNode) => {
            if (rootNode.jointName != null)
                nodesByJointName[rootNode.jointName] = rootNode;
            if (meshName == null) {
                // glTF < 1.0 used to have an instanceSkin property on nodes
                const instanceSkin = (gltf.asset.version !== "0.8") ? rootNode : rootNode.instanceSkin;
                if (instanceSkin != null && instanceSkin.meshes != null && instanceSkin.meshes.length > 0) {
                    meshName = instanceSkin.meshes[0];
                    // rootBoneNames = instanceSkin.skeletons;
                    skin = gltf.skins[instanceSkin.skin];
                }
                else if (rootNode.meshes != null && rootNode.meshes.length > 0) {
                    meshName = rootNode.meshes[0];
                }
            }
            for (const childName of rootNode.children) {
                walkNode(gltf.nodes[childName]);
            }
        };
        for (const rootNodeName of gltf.scenes[gltf.scene].nodes)
            walkNode(gltf.nodes[rootNodeName]);
        if (meshName == null && meshNames.length > 0) {
            // For some reason, sometimes the mesh won't be attached to a node,
            // So let's just pick it up from gltf.meshes
            meshName = meshNames[0];
            // And look for a skin, too
            const skinNames = Object.keys(gltf.skins);
            if (skinNames.length === 1)
                skin = gltf.skins[skinNames[0]];
        }
        if (meshName == null) {
            callback([index_1.createLogError("No mesh found", gltfFile.name)]);
            return;
        }
        const meshInfo = gltf.meshes[meshName];
        if (meshInfo.primitives.length !== 1) {
            callback([index_1.createLogError("Only a single primitive is supported", gltfFile.name)]);
            return;
        }
        const mode = (gltf.asset.version !== "0.8") ? meshInfo.primitives[0].mode : meshInfo.primitives[0].primitive;
        if (mode !== GLTFPrimitiveMode.TRIANGLES) {
            callback([index_1.createLogError("Only triangles are supported", gltfFile.name)]);
            return;
        }
        async.each(Object.keys(gltf.buffers), (name, cb) => {
            const bufferInfo = gltf.buffers[name];
            // Remove path info from the URI
            let filename = decodeURI(bufferInfo.uri);
            if (filename.indexOf("/") !== -1)
                filename = filename.substring(filename.lastIndexOf("/") + 1);
            else if (filename.indexOf("\\") !== -1)
                filename = filename.substring(filename.lastIndexOf("\\") + 1);
            const bufferFile = bufferFiles[filename];
            if (bufferFile == null) {
                cb(new Error(`Missing buffer file: ${filename} (${bufferInfo.uri})`));
                return;
            }
            SupClient.readFile(bufferFile, "arraybuffer", (err, buffer) => {
                if (err != null) {
                    cb(new Error(`Could not read buffer file: ${filename} (${bufferInfo.uri})`));
                    return;
                }
                buffers[name] = buffer;
                cb(null);
            });
        }, (err) => {
            if (err != null) {
                callback([index_1.createLogError(err.message)]);
                return;
            }
            const primitive = meshInfo.primitives[0];
            const attributes = {};
            // Indices
            const indexAccessor = gltf.accessors[primitive.indices];
            if (indexAccessor != null) {
                if (indexAccessor.componentType !== GLTFConst.UNSIGNED_SHORT) {
                    callback([index_1.createLogError(`Unsupported component type for index accessor: ${indexAccessor.componentType}`)]);
                    return;
                }
                const indexBufferView = gltf.bufferViews[indexAccessor.bufferView];
                const start = indexBufferView.byteOffset + indexAccessor.byteOffset;
                attributes["index"] = buffers[indexBufferView.buffer].slice(start, start + indexAccessor.count * 2);
            }
            // Position
            const positionAccessor = gltf.accessors[primitive.attributes["POSITION"]];
            if (positionAccessor.componentType !== GLTFConst.FLOAT) {
                callback([index_1.createLogError(`Unsupported component type for position accessor: ${positionAccessor.componentType}`)]);
                return;
            }
            {
                const positionBufferView = gltf.bufferViews[positionAccessor.bufferView];
                const start = positionBufferView.byteOffset + positionAccessor.byteOffset;
                if (skin != null) {
                    const bindShapeMatrix = new THREE.Matrix4().fromArray(skin.bindShapeMatrix);
                    const positionArray = new Float32Array(buffers[positionBufferView.buffer], start, positionAccessor.count * 3);
                    for (let i = 0; i < positionAccessor.count; i++) {
                        const pos = new THREE.Vector3(positionArray[i * 3 + 0], positionArray[i * 3 + 1], positionArray[i * 3 + 2]);
                        pos.applyMatrix4(bindShapeMatrix);
                        positionArray[i * 3 + 0] = pos.x;
                        positionArray[i * 3 + 1] = pos.y;
                        positionArray[i * 3 + 2] = pos.z;
                    }
                }
                attributes["position"] = buffers[positionBufferView.buffer].slice(start, start + positionAccessor.count * positionAccessor.byteStride);
            }
            // Normal
            const normalAccessor = gltf.accessors[primitive.attributes["NORMAL"]];
            if (normalAccessor != null) {
                if (normalAccessor.componentType !== GLTFConst.FLOAT) {
                    callback([index_1.createLogError(`Unsupported component type for normal accessor: ${normalAccessor.componentType}`)]);
                    return;
                }
                const normalBufferView = gltf.bufferViews[normalAccessor.bufferView];
                const start = normalBufferView.byteOffset + normalAccessor.byteOffset;
                attributes["normal"] = buffers[normalBufferView.buffer].slice(start, start + normalAccessor.count * normalAccessor.byteStride);
            }
            // UV
            const uvAccessor = gltf.accessors[primitive.attributes["TEXCOORD_0"]];
            if (uvAccessor != null) {
                if (uvAccessor.componentType !== GLTFConst.FLOAT) {
                    callback([index_1.createLogError(`Unsupported component type for UV accessor: ${uvAccessor.componentType}`)]);
                    return;
                }
                const uvBufferView = gltf.bufferViews[uvAccessor.bufferView];
                const start = uvBufferView.byteOffset + uvAccessor.byteOffset;
                const uvArray = new Float32Array(buffers[uvBufferView.buffer], start, uvAccessor.count * 2);
                for (let i = 0; i < uvAccessor.count; i++) {
                    uvArray[i * 2 + 1] = 1 - uvArray[i * 2 + 1];
                }
                attributes["uv"] = buffers[uvBufferView.buffer].slice(start, start + uvAccessor.count * uvAccessor.byteStride);
            }
            // TODO: support more attributes
            // Skin indices
            const skinIndexAccessor = gltf.accessors[primitive.attributes["JOINT"]];
            if (skinIndexAccessor != null) {
                if (skinIndexAccessor.componentType !== GLTFConst.FLOAT) {
                    callback([index_1.createLogError(`Unsupported component type for skin index accessor: ${skinIndexAccessor.componentType}`)]);
                    return;
                }
                const skinIndexBufferView = gltf.bufferViews[skinIndexAccessor.bufferView];
                const start = skinIndexBufferView.byteOffset + skinIndexAccessor.byteOffset;
                attributes["skinIndex"] = buffers[skinIndexBufferView.buffer].slice(start, start + skinIndexAccessor.count * skinIndexAccessor.byteStride);
            }
            // Skin weights
            const skinWeightAccessor = gltf.accessors[primitive.attributes["WEIGHT"]];
            if (skinWeightAccessor != null) {
                if (skinWeightAccessor.componentType !== GLTFConst.FLOAT) {
                    callback([index_1.createLogError(`Unsupported component type for skin weight accessor: ${skinWeightAccessor.componentType}`)]);
                    return;
                }
                const skinWeightBufferView = gltf.bufferViews[skinWeightAccessor.bufferView];
                const start = skinWeightBufferView.byteOffset + skinWeightAccessor.byteOffset;
                attributes["skinWeight"] = buffers[skinWeightBufferView.buffer].slice(start, start + skinWeightAccessor.count * skinWeightAccessor.byteStride);
            }
            // Bones
            let bones = null;
            if (skin != null) {
                bones = [];
                for (let i = 0; i < skin.jointNames.length; i++) {
                    const jointName = skin.jointNames[i];
                    const boneNode = nodesByJointName[jointName];
                    const bone = { name: boneNode.jointName, matrix: getNodeMatrix(boneNode, gltf.asset.version).toArray(), parentIndex: null };
                    bones.push(bone);
                }
                for (let i = 0; i < skin.jointNames.length; i++) {
                    const jointName = skin.jointNames[i];
                    for (const childJointName of nodesByJointName[jointName].children) {
                        const boneIndex = skin.jointNames.indexOf(childJointName);
                        if (boneIndex !== -1)
                            bones[boneIndex].parentIndex = i;
                    }
                }
            }
            // Animation
            let animation = null;
            if (Object.keys(gltf.animations).length > 0) {
                animation = { duration: 0, keyFrames: {} };
                for (const gltfAnimName in gltf.animations) {
                    const gltfAnim = gltf.animations[gltfAnimName];
                    // gltfAnim.count = keyframe count
                    // gltfAnim.channels gives bone name + path (scale, rotation, position)
                    for (const gltfChannelName in gltfAnim.channels) {
                        const gltfChannel = gltfAnim.channels[gltfChannelName];
                        const jointName = gltfChannel.target.id;
                        // TODO: get skin.jointNames.indexOf(jointName) and work with IDs instead of jointName?
                        let boneAnim = animation.keyFrames[jointName];
                        if (boneAnim == null)
                            boneAnim = animation.keyFrames[jointName] = {};
                        if (boneAnim[gltfChannel.target.path] != null) {
                            callback([index_1.createLogError(`Found multiple animations for ${gltfChannel.target.path} of ${jointName} bone`)]);
                            return;
                        }
                        let boneTransformAnim = boneAnim[gltfChannel.target.path];
                        if (boneTransformAnim == null)
                            boneTransformAnim = boneAnim[gltfChannel.target.path] = [];
                        const inputParameterName = gltfAnim.samplers[gltfChannel.sampler].input;
                        const timeAccessor = gltf.accessors[gltfAnim.parameters[inputParameterName]];
                        if (timeAccessor.componentType !== GLTFConst.FLOAT) {
                            callback([index_1.createLogError(`Unsupported component type for animation time accessor: ${timeAccessor.componentType}`)]);
                            return;
                        }
                        const timeBufferView = gltf.bufferViews[timeAccessor.bufferView];
                        const timeArray = new Float32Array(buffers[timeBufferView.buffer], timeBufferView.byteOffset + timeAccessor.byteOffset, timeAccessor.count);
                        const outputParameterName = gltfAnim.samplers[gltfChannel.sampler].output;
                        const outputAccessor = gltf.accessors[gltfAnim.parameters[outputParameterName]];
                        if (outputAccessor.componentType !== GLTFConst.FLOAT) {
                            callback([index_1.createLogError(`Unsupported component type for animation output accessor: ${outputAccessor.componentType}`)]);
                            return;
                        }
                        const componentsCount = (outputAccessor.type === "VEC3") ? 3 : 4;
                        const outputBufferView = gltf.bufferViews[outputAccessor.bufferView];
                        const outputArray = new Float32Array(buffers[outputBufferView.buffer], outputBufferView.byteOffset + outputAccessor.byteOffset, outputAccessor.count * componentsCount);
                        if (outputParameterName === "rotation" && gltf.asset.version === "0.8")
                            convertAxisAngleToQuaternionArray(outputArray, outputAccessor.count);
                        for (let i = 0; i < timeArray.length; i++) {
                            const time = timeArray[i];
                            const value = [];
                            for (let j = 0; j < componentsCount; j++)
                                value.push(outputArray[i * componentsCount + j]);
                            boneTransformAnim.push({ time, value });
                            animation.duration = Math.max(animation.duration, time);
                        }
                    }
                }
            }
            const log = [index_1.createLogInfo(`Imported glTF model v${gltf.asset.version}, ${attributes["position"].byteLength / 4 / 3} vertices.`, gltfFile.name)];
            // Maps
            const maps = {};
            if (Object.keys(imageFiles).length === 0) {
                callback(log, { attributes, bones, maps, animation, upAxisMatrix: (upAxisMatrix != null) ? upAxisMatrix.toArray() : null });
                return;
            }
            SupClient.readFile(imageFiles[Object.keys(imageFiles)[0]], "arraybuffer", (err, data) => {
                maps["map"] = data;
                callback(log, { attributes, bones, maps, animation, upAxisMatrix: (upAxisMatrix != null) ? upAxisMatrix.toArray() : null });
            });
        });
    };
    SupClient.readFile(gltfFile, "json", onGLTFRead);
}
exports.importModel = importModel;
