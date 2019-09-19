(function() {
    function r(e, n, t) {
        function o(i, f) {
            if (!n[i]) {
                if (!e[i]) { var c = "function" == typeof require && require; if (!f && c) return c(i, !0); if (u) return u(i, !0); var a = new Error("Cannot find module '" + i + "'"); throw a.code = "MODULE_NOT_FOUND", a }
                var p = n[i] = { exports: {} };
                e[i][0].call(p.exports, function(r) { var n = e[i][1][r]; return o(n || r) }, p, p.exports, r, e, n, t)
            }
            return n[i].exports
        }
        for (var u = "function" == typeof require && require, i = 0; i < t.length; i++) o(t[i]);
        return o
    }
    return r
})()({
    1: [function(require, module, exports) {

    }, {}],
    2: [function(require, module, exports) {
        (function(process) {
            // Copyright Joyent, Inc. and other Node contributors.
            //
            // Permission is hereby granted, free of charge, to any person obtaining a
            // copy of this software and associated documentation files (the
            // "Software"), to deal in the Software without restriction, including
            // without limitation the rights to use, copy, modify, merge, publish,
            // distribute, sublicense, and/or sell copies of the Software, and to permit
            // persons to whom the Software is furnished to do so, subject to the
            // following conditions:
            //
            // The above copyright notice and this permission notice shall be included
            // in all copies or substantial portions of the Software.
            //
            // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
            // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
            // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
            // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
            // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
            // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
            // USE OR OTHER DEALINGS IN THE SOFTWARE.

            // resolves . and .. elements in a path array with directory names there
            // must be no slashes, empty elements, or device names (c:\) in the array
            // (so also no leading and trailing slashes - it does not distinguish
            // relative and absolute paths)
            function normalizeArray(parts, allowAboveRoot) {
                // if the path tries to go above the root, `up` ends up > 0
                var up = 0;
                for (var i = parts.length - 1; i >= 0; i--) {
                    var last = parts[i];
                    if (last === '.') {
                        parts.splice(i, 1);
                    } else if (last === '..') {
                        parts.splice(i, 1);
                        up++;
                    } else if (up) {
                        parts.splice(i, 1);
                        up--;
                    }
                }

                // if the path is allowed to go above the root, restore leading ..s
                if (allowAboveRoot) {
                    for (; up--; up) {
                        parts.unshift('..');
                    }
                }

                return parts;
            }

            // Split a filename into [root, dir, basename, ext], unix version
            // 'root' is just a slash, or nothing.
            var splitPathRe =
                /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
            var splitPath = function(filename) {
                return splitPathRe.exec(filename).slice(1);
            };

            // path.resolve([from ...], to)
            // posix version
            exports.resolve = function() {
                var resolvedPath = '',
                    resolvedAbsolute = false;

                for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
                    var path = (i >= 0) ? arguments[i] : process.cwd();

                    // Skip empty and invalid entries
                    if (typeof path !== 'string') {
                        throw new TypeError('Arguments to path.resolve must be strings');
                    } else if (!path) {
                        continue;
                    }

                    resolvedPath = path + '/' + resolvedPath;
                    resolvedAbsolute = path.charAt(0) === '/';
                }

                // At this point the path should be resolved to a full absolute path, but
                // handle relative paths to be safe (might happen when process.cwd() fails)

                // Normalize the path
                resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
                    return !!p;
                }), !resolvedAbsolute).join('/');

                return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
            };

            // path.normalize(path)
            // posix version
            exports.normalize = function(path) {
                var isAbsolute = exports.isAbsolute(path),
                    trailingSlash = substr(path, -1) === '/';

                // Normalize the path
                path = normalizeArray(filter(path.split('/'), function(p) {
                    return !!p;
                }), !isAbsolute).join('/');

                if (!path && !isAbsolute) {
                    path = '.';
                }
                if (path && trailingSlash) {
                    path += '/';
                }

                return (isAbsolute ? '/' : '') + path;
            };

            // posix version
            exports.isAbsolute = function(path) {
                return path.charAt(0) === '/';
            };

            // posix version
            exports.join = function() {
                var paths = Array.prototype.slice.call(arguments, 0);
                return exports.normalize(filter(paths, function(p, index) {
                    if (typeof p !== 'string') {
                        throw new TypeError('Arguments to path.join must be strings');
                    }
                    return p;
                }).join('/'));
            };


            // path.relative(from, to)
            // posix version
            exports.relative = function(from, to) {
                from = exports.resolve(from).substr(1);
                to = exports.resolve(to).substr(1);

                function trim(arr) {
                    var start = 0;
                    for (; start < arr.length; start++) {
                        if (arr[start] !== '') break;
                    }

                    var end = arr.length - 1;
                    for (; end >= 0; end--) {
                        if (arr[end] !== '') break;
                    }

                    if (start > end) return [];
                    return arr.slice(start, end - start + 1);
                }

                var fromParts = trim(from.split('/'));
                var toParts = trim(to.split('/'));

                var length = Math.min(fromParts.length, toParts.length);
                var samePartsLength = length;
                for (var i = 0; i < length; i++) {
                    if (fromParts[i] !== toParts[i]) {
                        samePartsLength = i;
                        break;
                    }
                }

                var outputParts = [];
                for (var i = samePartsLength; i < fromParts.length; i++) {
                    outputParts.push('..');
                }

                outputParts = outputParts.concat(toParts.slice(samePartsLength));

                return outputParts.join('/');
            };

            exports.sep = '/';
            exports.delimiter = ':';

            exports.dirname = function(path) {
                var result = splitPath(path),
                    root = result[0],
                    dir = result[1];

                if (!root && !dir) {
                    // No dirname whatsoever
                    return '.';
                }

                if (dir) {
                    // It has a dirname, strip trailing slash
                    dir = dir.substr(0, dir.length - 1);
                }

                return root + dir;
            };


            exports.basename = function(path, ext) {
                var f = splitPath(path)[2];
                // TODO: make this comparison case-insensitive on windows?
                if (ext && f.substr(-1 * ext.length) === ext) {
                    f = f.substr(0, f.length - ext.length);
                }
                return f;
            };


            exports.extname = function(path) {
                return splitPath(path)[3];
            };

            function filter(xs, f) {
                if (xs.filter) return xs.filter(f);
                var res = [];
                for (var i = 0; i < xs.length; i++) {
                    if (f(xs[i], i, xs)) res.push(xs[i]);
                }
                return res;
            }

            // String.prototype.substr - negative index don't work in IE8
            var substr = 'ab'.substr(-1) === 'b' ?

                function(str, start, len) { return str.substr(start, len) } :
                function(str, start, len) {
                    if (start < 0) start = str.length + start;
                    return str.substr(start, len);
                };

        }).call(this, require('_process'))
    }, { "_process": 3 }],
    3: [function(require, module, exports) {
        // shim for using process in browser
        var process = module.exports = {};

        // cached from whatever global is present so that test runners that stub it
        // don't break things.  But we need to wrap it in a try catch in case it is
        // wrapped in strict mode code which doesn't define any globals.  It's inside a
        // function because try/catches deoptimize in certain engines.

        var cachedSetTimeout;
        var cachedClearTimeout;

        function defaultSetTimout() {
            throw new Error('setTimeout has not been defined');
        }

        function defaultClearTimeout() {
            throw new Error('clearTimeout has not been defined');
        }
        (function() {
            try {
                if (typeof setTimeout === 'function') {
                    cachedSetTimeout = setTimeout;
                } else {
                    cachedSetTimeout = defaultSetTimout;
                }
            } catch (e) {
                cachedSetTimeout = defaultSetTimout;
            }
            try {
                if (typeof clearTimeout === 'function') {
                    cachedClearTimeout = clearTimeout;
                } else {
                    cachedClearTimeout = defaultClearTimeout;
                }
            } catch (e) {
                cachedClearTimeout = defaultClearTimeout;
            }
        }())

        function runTimeout(fun) {
            if (cachedSetTimeout === setTimeout) {
                //normal enviroments in sane situations
                return setTimeout(fun, 0);
            }
            // if setTimeout wasn't available but was latter defined
            if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
                cachedSetTimeout = setTimeout;
                return setTimeout(fun, 0);
            }
            try {
                // when when somebody has screwed with setTimeout but no I.E. maddness
                return cachedSetTimeout(fun, 0);
            } catch (e) {
                try {
                    // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
                    return cachedSetTimeout.call(null, fun, 0);
                } catch (e) {
                    // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
                    return cachedSetTimeout.call(this, fun, 0);
                }
            }


        }

        function runClearTimeout(marker) {
            if (cachedClearTimeout === clearTimeout) {
                //normal enviroments in sane situations
                return clearTimeout(marker);
            }
            // if clearTimeout wasn't available but was latter defined
            if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
                cachedClearTimeout = clearTimeout;
                return clearTimeout(marker);
            }
            try {
                // when when somebody has screwed with setTimeout but no I.E. maddness
                return cachedClearTimeout(marker);
            } catch (e) {
                try {
                    // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
                    return cachedClearTimeout.call(null, marker);
                } catch (e) {
                    // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
                    // Some versions of I.E. have different rules for clearTimeout vs setTimeout
                    return cachedClearTimeout.call(this, marker);
                }
            }



        }
        var queue = [];
        var draining = false;
        var currentQueue;
        var queueIndex = -1;

        function cleanUpNextTick() {
            if (!draining || !currentQueue) {
                return;
            }
            draining = false;
            if (currentQueue.length) {
                queue = currentQueue.concat(queue);
            } else {
                queueIndex = -1;
            }
            if (queue.length) {
                drainQueue();
            }
        }

        function drainQueue() {
            if (draining) {
                return;
            }
            var timeout = runTimeout(cleanUpNextTick);
            draining = true;

            var len = queue.length;
            while (len) {
                currentQueue = queue;
                queue = [];
                while (++queueIndex < len) {
                    if (currentQueue) {
                        currentQueue[queueIndex].run();
                    }
                }
                queueIndex = -1;
                len = queue.length;
            }
            currentQueue = null;
            draining = false;
            runClearTimeout(timeout);
        }

        process.nextTick = function(fun) {
            var args = new Array(arguments.length - 1);
            if (arguments.length > 1) {
                for (var i = 1; i < arguments.length; i++) {
                    args[i - 1] = arguments[i];
                }
            }
            queue.push(new Item(fun, args));
            if (queue.length === 1 && !draining) {
                runTimeout(drainQueue);
            }
        };

        // v8 likes predictible objects
        function Item(fun, array) {
            this.fun = fun;
            this.array = array;
        }
        Item.prototype.run = function() {
            this.fun.apply(null, this.array);
        };
        process.title = 'browser';
        process.browser = true;
        process.env = {};
        process.argv = [];
        process.version = ''; // empty string to avoid regexp issues
        process.versions = {};

        function noop() {}

        process.on = noop;
        process.addListener = noop;
        process.once = noop;
        process.off = noop;
        process.removeListener = noop;
        process.removeAllListeners = noop;
        process.emit = noop;
        process.prependListener = noop;
        process.prependOnceListener = noop;

        process.listeners = function(name) { return [] }

        process.binding = function(name) {
            throw new Error('process.binding is not supported');
        };

        process.cwd = function() { return '/' };
        process.chdir = function(dir) {
            throw new Error('process.chdir is not supported');
        };
        process.umask = function() { return 0; };

    }, {}],
    4: [function(require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        const path = require("path");
        class BehaviorPropertiesResource extends SupCore.Data.Base.Resource {
            constructor(id, pub, server) {
                super(id, pub, BehaviorPropertiesResource.schema, server);
            }
            setup() {
                this.behaviorNamesByScriptId = {};
                this.propertiesByNameByBehavior = {};
                for (const behaviorName in this.pub.behaviors) {
                    const behavior = this.pub.behaviors[behaviorName];
                    if (this.behaviorNamesByScriptId[behavior.scriptId] == null)
                        this.behaviorNamesByScriptId[behavior.scriptId] = [];
                    this.behaviorNamesByScriptId[behavior.scriptId].push(behaviorName);
                    this.propertiesByNameByBehavior[behaviorName] = {};
                    for (const property of behavior.properties)
                        this.propertiesByNameByBehavior[behaviorName][property.name] = property;
                }
            }
            init(callback) {
                this.pub = { behaviors: {} };
                super.init(callback);
            }
            clientExport(outputPath, callback) {
                SupApp.writeFile(path.join(outputPath, "resource.json"), JSON.stringify(this.pub), callback);
            }
            setScriptBehaviors(scriptId, behaviors) {
                this.client_setScriptBehaviors(scriptId, behaviors);
                this.emit("edit", "setScriptBehaviors", scriptId, behaviors);
                this.emit("change");
            }
            client_setScriptBehaviors(scriptId, behaviors) {
                const oldBehaviorNames = (this.behaviorNamesByScriptId[scriptId] != null) ? this.behaviorNamesByScriptId[scriptId] : [];
                const newBehaviorNames = this.behaviorNamesByScriptId[scriptId] = [];
                for (const name in behaviors) {
                    const behavior = behaviors[name];
                    this.pub.behaviors[name] = { scriptId, line: behavior.line, parentBehavior: behavior.parentBehavior, properties: behavior.properties };
                    const propertiesByName = this.propertiesByNameByBehavior[name] = {};
                    for (const property of behavior.properties)
                        propertiesByName[property.name] = property;
                    newBehaviorNames.push(name);
                }
                for (const oldBehaviorName of oldBehaviorNames) {
                    if (newBehaviorNames.indexOf(oldBehaviorName) !== -1)
                        continue;
                    delete this.propertiesByNameByBehavior[oldBehaviorName];
                    delete this.pub.behaviors[oldBehaviorName];
                }
            }
            clearScriptBehaviors(scriptId) {
                this.client_clearScriptBehaviors(scriptId);
                this.emit("edit", "clearScriptBehaviors", scriptId);
                this.emit("change");
            }
            client_clearScriptBehaviors(scriptId) {
                let oldBehaviorNames = this.behaviorNamesByScriptId[scriptId];
                if (oldBehaviorNames == null)
                    return;
                for (let oldBehaviorName of oldBehaviorNames) {
                    delete this.pub.behaviors[oldBehaviorName];
                    delete this.propertiesByNameByBehavior[oldBehaviorName];
                }
                delete this.behaviorNamesByScriptId[scriptId];
            }
        }
        BehaviorPropertiesResource.schema = {
            behaviors: {
                type: "hash",
                keys: { minLength: 1 },
                values: {
                    type: "hash",
                    properties: {
                        scriptId: { type: "string" },
                        parentBehavior: { type: "string" },
                        properties: {
                            type: "array",
                            items: {
                                type: "hash",
                                properties: {
                                    name: { type: "string" },
                                    type: { type: "string" }
                                }
                            }
                        }
                    }
                }
            }
        };
        exports.default = BehaviorPropertiesResource;

    }, { "path": 2 }],
    5: [function(require, module, exports) {
        (function(global) {
            "use strict";
            /// <reference path="../../../common/textEditorWidget/operational-transform.d.ts" />
            /// <reference path="../node_modules/typescript/lib/typescriptServices.d.ts" />
            /// <reference path="../../typescript/typescriptAPI/TypeScriptAPIPlugin.d.ts" />
            Object.defineProperty(exports, "__esModule", { value: true });
            const OT = require("operational-transform");
            const fs = require("fs");
            const path = require("path");
            let ts;
            let compileTypeScript;
            let globalDefs = "";
            if (global.window == null) {
                const serverRequire = require;
                ts = serverRequire("typescript");
                compileTypeScript = serverRequire("../runtime/compileTypeScript").default;
                SupCore.system.requireForAllPlugins("typescriptAPI/index.js");
                const plugins = SupCore.system.getPlugins("typescriptAPI");
                const actorComponentAccessors = [];
                for (const pluginName in plugins) {
                    const plugin = plugins[pluginName];
                    if (plugin.defs != null)
                        globalDefs += plugin.defs;
                    if (plugin.exposeActorComponent != null)
                        actorComponentAccessors.push(`${plugin.exposeActorComponent.propertyName}: ${plugin.exposeActorComponent.className};`);
                }
                globalDefs = globalDefs.replace("// INSERT_COMPONENT_ACCESSORS", actorComponentAccessors.join("\n    "));
            }
            class ScriptAsset extends SupCore.Data.Base.Asset {
                constructor(id, pub, server) {
                    super(id, pub, ScriptAsset.schema, server);
                }
                init(options, callback) {
                    // Transform "script asset name" into "ScriptAssetNameBehavior"
                    let behaviorName = options.name.trim().replace(/[()[\]{}-]/g, "");
                    behaviorName = behaviorName.slice(0, 1).toUpperCase() + behaviorName.slice(1);
                    if (behaviorName === "Behavior" || behaviorName === "Behaviour") {
                        const parentEntry = this.server.data.entries.parentNodesById[this.id];
                        if (parentEntry != null) {
                            behaviorName = parentEntry.name.slice(0, 1).toUpperCase() + parentEntry.name.slice(1) + behaviorName;
                        }
                    }
                    while (true) {
                        const index = behaviorName.indexOf(" ");
                        if (index === -1)
                            break;
                        behaviorName =
                            behaviorName.slice(0, index) +
                            behaviorName.slice(index + 1, index + 2).toUpperCase() +
                            behaviorName.slice(index + 2);
                    }
                    if (behaviorName.indexOf("Behavior") === -1 && behaviorName.indexOf("Behaviour") === -1)
                        behaviorName += "Behavior";
                    this.server.data.resources.acquire("textEditorSettings", null, (err, textEditorSettings) => {
                        this.server.data.resources.release("textEditorSettings", null);
                        let tab;
                        if (textEditorSettings.pub.softTab) {
                            tab = "";
                            for (let i = 0; i < textEditorSettings.pub.tabSize; i++)
                                tab = tab + " ";
                        } else
                            tab = "\t";
                        const defaultContent = `class ${behaviorName} extends Sup.Behavior {
${tab}awake() {
${tab}${tab}
${tab}}

${tab}update() {
${tab}${tab}
${tab}}
}
Sup.registerBehavior(${behaviorName});
`;
                        this.pub = {
                            text: defaultContent,
                            draft: defaultContent,
                            revisionId: 0
                        };
                        this.server.data.resources.acquire("behaviorProperties", null, (err, behaviorProperties) => {
                            this.server.data.resources.release("behaviorProperties", null);
                            if (behaviorProperties.pub.behaviors[behaviorName] == null) {
                                const behaviors = {};
                                behaviors[behaviorName] = { line: 0, properties: [], parentBehavior: null };
                                behaviorProperties.setScriptBehaviors(this.id, behaviors);
                            }
                            super.init(options, callback);
                        });
                    });
                }
                setup() {
                    this.document = new OT.Document(this.pub.draft, this.pub.revisionId);
                    this.hasDraft = this.pub.text !== this.pub.draft;
                }
                restore() {
                    if (this.hasDraft)
                        this.emit("setBadge", "draft", "info");
                }
                destroy(callback) {
                    this.server.data.resources.acquire("behaviorProperties", null, (err, behaviorProperties) => {
                        behaviorProperties.clearScriptBehaviors(this.id);
                        this.server.data.resources.release("behaviorProperties", null);
                        callback();
                    });
                }
                load(assetPath) {
                    // NOTE: asset.json was removed in ValjangEngine 0.10
                    // The empty callback is required to not fail if the file already doesn't exist
                    fs.unlink(path.join(assetPath, "asset.json"), (err) => {});
                    // NOTE: We must not set this.pub with a temporary value right now, otherwise
                    // the asset will be considered loaded by Dictionary.acquire
                    // and the acquire callback will be called immediately
                    let pub;
                    const finishLoading = () => {
                        if (pub.draft != null)
                            pub.draft = pub.draft.replace(/\r\n/g, "\n");
                        pub.text = pub.text.replace(/\r\n/g, "\n");
                        this._onLoaded(assetPath, pub);
                    };
                    const readDraft = (text) => {
                        fs.readFile(path.join(assetPath, "draft.ts"), { encoding: "utf8" }, (err, draft) => {
                            // NOTE: draft.txt was renamed to draft.ts in ValjangEngine 0.11
                            if (err != null && err.code === "ENOENT") {
                                fs.readFile(path.join(assetPath, "draft.txt"), { encoding: "utf8" }, (err, draft) => {
                                    pub = { revisionId: 0, text, draft: (draft != null) ? draft : text };
                                    finishLoading();
                                    if (draft != null) {
                                        if (draft !== text)
                                            fs.writeFile(path.join(assetPath, "draft.ts"), draft, { encoding: "utf8" }, (err) => {});
                                        fs.unlink(path.join(assetPath, "draft.txt"), (err) => {});
                                    }
                                });
                            } else {
                                pub = { revisionId: 0, text, draft: (draft != null) ? draft : text };
                                finishLoading();
                            }
                        });
                    };
                    fs.readFile(path.join(assetPath, "script.ts"), { encoding: "utf8" }, (err, text) => {
                        // NOTE: script.txt was renamed to script.ts in ValjangEngine 0.11
                        if (err != null && err.code === "ENOENT") {
                            fs.readFile(path.join(assetPath, "script.txt"), { encoding: "utf8" }, (err, text) => {
                                readDraft(text);
                                fs.writeFileSync(path.join(assetPath, "script.ts"), text, { encoding: "utf8" });
                                fs.unlink(path.join(assetPath, "script.txt"), (err) => {});
                            });
                        } else
                            readDraft(text);
                    });
                }
                save(outputPath, callback) {
                    this.write(fs.writeFile, outputPath, (err) => {
                        if (err != null) {
                            callback(err);
                            return;
                        }
                        if (this.hasDraft) {
                            fs.writeFile(path.join(outputPath, "draft.ts"), this.pub.draft, { encoding: "utf8" }, callback);
                        } else {
                            fs.unlink(path.join(outputPath, "draft.ts"), (err) => {
                                if (err != null && err.code !== "ENOENT") {
                                    callback(err);
                                    return;
                                }
                                callback(null);
                            });
                        }
                    });
                }
                clientExport(outputPath, callback) {
                    this.write(SupApp.writeFile, outputPath, callback);
                }
                write(writeFile, outputPath, callback) {
                    writeFile(path.join(outputPath, "script.ts"), this.pub.text, { encoding: "utf8" }, callback);
                }
                server_editText(client, operationData, revisionIndex, callback) {
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
                        operation = this.document.apply(operation, revisionIndex);
                    } catch (err) {
                        callback("Operation can't be applied");
                        return;
                    }
                    this.pub.draft = this.document.text;
                    this.pub.revisionId++;
                    callback(null, null, operation.serialize(), this.document.getRevisionId() - 1);
                    if (!this.hasDraft) {
                        this.hasDraft = true;
                        this.emit("setBadge", "draft", "info");
                    }
                    this.emit("change");
                }
                client_editText(operationData, revisionIndex) {
                    const operation = new OT.TextOperation();
                    operation.deserialize(operationData);
                    this.document.apply(operation, revisionIndex);
                    this.pub.draft = this.document.text;
                    this.pub.revisionId++;
                }
                server_applyDraftChanges(client, options, callback) {
                    const text = this.pub.draft;
                    const scriptNames = [];
                    const scripts = {};
                    let ownScriptName = "";
                    const finish = (errors) => {
                        const foundSelfErrors = (errors != null) && errors.some((x) => x.file === ownScriptName);
                        if (foundSelfErrors && !options.ignoreErrors) {
                            callback("foundSelfErrors");
                            return;
                        }
                        this.pub.text = text;
                        callback(null);
                        if (this.hasDraft) {
                            this.hasDraft = false;
                            this.emit("clearBadge", "draft");
                        }
                        this.emit("change");
                    };
                    const compile = () => {
                        let results;
                        try {
                            results = compileTypeScript(scriptNames, scripts, globalDefs, { sourceMap: false });
                        } catch (e) {
                            finish(null);
                            return;
                        }
                        if (results.errors.length > 0) {
                            finish(results.errors);
                            return;
                        }
                        const libLocals = results.program.getSourceFile("lib.d.ts").locals;
                        const supTypeSymbols = {
                            "Sup.Actor": libLocals["Sup"].exports["Actor"],
                            "Sup.Behavior": libLocals["Sup"].exports["Behavior"],
                            "Sup.Math.Vector2": libLocals["Sup"].exports["Math"].exports["Vector2"],
                            "Sup.Math.Vector3": libLocals["Sup"].exports["Math"].exports["Vector3"],
                            "Sup.Asset": libLocals["Sup"].exports["Asset"],
                        };
                        const supportedSupPropertyTypes = [
                            supTypeSymbols["Sup.Math.Vector2"],
                            supTypeSymbols["Sup.Math.Vector3"]
                        ];
                        const behaviors = {};
                        const file = results.program.getSourceFile(ownScriptName);
                        const ownLocals = file.locals;
                        for (const symbolName in ownLocals) {
                            const symbol = ownLocals[symbolName];
                            if ((symbol.flags & ts.SymbolFlags.Class) !== ts.SymbolFlags.Class)
                                continue;
                            const parentTypeNode = ts.getClassExtendsHeritageClauseElement(symbol.valueDeclaration);
                            if (parentTypeNode == null)
                                continue;
                            const parentTypeSymbol = results.typeChecker.getSymbolAtLocation(parentTypeNode.expression);
                            let baseTypeNode = parentTypeNode;
                            let baseTypeSymbol = parentTypeSymbol;
                            while (true) {
                                if (baseTypeSymbol === supTypeSymbols["Sup.Behavior"])
                                    break;
                                baseTypeNode = ts.getClassExtendsHeritageClauseElement(baseTypeSymbol.valueDeclaration);
                                if (baseTypeNode == null)
                                    break;
                                baseTypeSymbol = results.typeChecker.getSymbolAtLocation(baseTypeNode.expression);
                            }
                            if (baseTypeSymbol !== supTypeSymbols["Sup.Behavior"])
                                continue;
                            const properties = [];
                            let parentBehavior = null;
                            if (parentTypeSymbol !== supTypeSymbols["Sup.Behavior"])
                                parentBehavior = results.typeChecker.getFullyQualifiedName(parentTypeSymbol);
                            const line = file.getLineAndCharacterOfPosition(symbol.valueDeclaration.name.pos).line;
                            behaviors[symbolName] = { line, properties, parentBehavior };
                            for (const memberName in symbol.members) {
                                const member = symbol.members[memberName];
                                // Skip non-properties
                                if ((member.flags & ts.SymbolFlags.Property) !== ts.SymbolFlags.Property)
                                    continue;
                                // Skip static, private and protected members
                                const modifierFlags = (member.valueDeclaration.modifiers != null) ? member.valueDeclaration.modifiers.flags : null;
                                if (modifierFlags != null && (modifierFlags & (ts.NodeFlags.Private | ts.NodeFlags.Protected | ts.NodeFlags.Static)) !== 0)
                                    continue;
                                // TODO: skip members annotated as "non-customizable"
                                const type = results.typeChecker.getTypeAtLocation(member.valueDeclaration);
                                let typeName; // "unknown"
                                const typeSymbol = type.getSymbol();
                                if (supportedSupPropertyTypes.indexOf(typeSymbol) !== -1) {
                                    typeName = typeSymbol.getName();
                                    let parentSymbol = typeSymbol.parent;
                                    while (parentSymbol != null) {
                                        typeName = `${parentSymbol.getName()}.${typeName}`;
                                        parentSymbol = parentSymbol.parent;
                                    }
                                } else if (type.intrinsicName != null)
                                    typeName = type.intrinsicName;
                                if (typeName != null)
                                    properties.push({ name: member.name, type: typeName });
                            }
                        }
                        this.server.data.resources.acquire("behaviorProperties", null, (err, behaviorProperties) => {
                            behaviorProperties.setScriptBehaviors(this.id, behaviors);
                            this.server.data.resources.release("behaviorProperties", null);
                            finish(null);
                        });
                    };
                    let remainingAssetsToLoad = Object.keys(this.server.data.entries.byId).length;
                    let assetsLoading = 0;
                    this.server.data.entries.walk((entry) => {
                        remainingAssetsToLoad--;
                        if (entry.type !== "script") {
                            if (remainingAssetsToLoad === 0 && assetsLoading === 0)
                                compile();
                            return;
                        }
                        const name = `${this.server.data.entries.getPathFromId(entry.id)}.ts`;
                        scriptNames.push(name);
                        if (entry.id === this.id) {
                            ownScriptName = name;
                            scripts[name] = text;
                            if (remainingAssetsToLoad === 0 && assetsLoading === 0)
                                compile();
                            return;
                        }
                        assetsLoading++;
                        this.server.data.assets.acquire(entry.id, null, (err, asset) => {
                            scripts[name] = asset.pub.text;
                            this.server.data.assets.release(entry.id, null);
                            assetsLoading--;
                            if (remainingAssetsToLoad === 0 && assetsLoading === 0)
                                compile();
                        });
                    });
                }
                client_applyDraftChanges() { this.pub.text = this.pub.draft; }
            }
            ScriptAsset.schema = {
                text: { type: "string" },
                draft: { type: "string" },
                revisionId: { type: "integer" }
            };
            exports.default = ScriptAsset;

        }).call(this, typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
    }, { "fs": 1, "operational-transform": 10, "path": 2 }],
    6: [function(require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        const BehaviorPropertiesResource_1 = require("./BehaviorPropertiesResource");
        const ScriptAsset_1 = require("./ScriptAsset");
        SupCore.system.data.registerResource("behaviorProperties", BehaviorPropertiesResource_1.default);
        SupCore.system.data.registerAssetClass("script", ScriptAsset_1.default);

    }, { "./BehaviorPropertiesResource": 4, "./ScriptAsset": 5 }],
    7: [function(require, module, exports) {
        var OT = require("./index");
        var Document = (function() {
            function Document(text, revisionId) {
                if (text === void 0) { text = ""; }
                if (revisionId === void 0) { revisionId = 0; }
                this.operations = [];
                this.text = text;
                this._refRevisionId = revisionId;
            }
            Document.prototype.apply = function(newOperation, revision) {
                revision -= this._refRevisionId;
                // Should't happen
                if (revision > this.operations.length)
                    throw new Error("The operation base revision is greater than the document revision");
                if (revision < this.operations.length) {
                    // Conflict!
                    var missedOperations = new OT.TextOperation(this.operations[revision].userId);
                    missedOperations.targetLength = this.operations[revision].baseLength;
                    for (var index = revision; index < this.operations.length; index++)
                        missedOperations = missedOperations.compose(this.operations[index]);
                    newOperation = missedOperations.transform(newOperation)[1];
                }
                this.text = newOperation.apply(this.text);
                this.operations.push(newOperation.clone());
                return newOperation;
            };
            Document.prototype.getRevisionId = function() { return this.operations.length + this._refRevisionId; };
            return Document;
        })();
        module.exports = Document;

    }, { "./index": 10 }],
    8: [function(require, module, exports) {
        var TextOp = (function() {
            function TextOp(type, attributes) {
                this.type = type;
                this.attributes = attributes;
            }
            return TextOp;
        })();
        module.exports = TextOp;

    }, {}],
    9: [function(require, module, exports) {
        var OT = require("./index");
        var TextOperation = (function() {
            function TextOperation(userId) {
                this.ops = [];
                // An operation's baseLength is the length of every string the operation
                // can be applied to.
                this.baseLength = 0;
                // The targetLength is the length of every string that results from applying
                // the operation on a valid input string.
                this.targetLength = 0;
                this.userId = userId;
            }
            TextOperation.prototype.serialize = function() {
                var ops = [];
                for (var _i = 0, _a = this.ops; _i < _a.length; _i++) {
                    var op = _a[_i];
                    ops.push({ type: op.type, attributes: op.attributes });
                }
                return { ops: ops, userId: this.userId };
            };
            TextOperation.prototype.deserialize = function(data) {
                if (data == null)
                    return false;
                this.userId = data.userId;
                for (var _i = 0, _a = data.ops; _i < _a.length; _i++) {
                    var op = _a[_i];
                    switch (op.type) {
                        case "retain":
                            this.retain(op.attributes.amount);
                            break;
                        case "insert":
                            this.insert(op.attributes.text);
                            break;
                        case "delete":
                            this.delete(op.attributes.text);
                            break;
                        default:
                            return false;
                    }
                }
                return true;
            };
            TextOperation.prototype.retain = function(amount) {
                if (typeof(amount) !== "number" || amount <= 0)
                    return;
                this.baseLength += amount;
                this.targetLength += amount;
                var prevOp = this.ops[this.ops.length - 1];
                if (prevOp != null && prevOp.type === "retain") {
                    prevOp.attributes.amount += amount;
                } else {
                    this.ops.push(new OT.TextOp("retain", { amount: amount }));
                }
            };
            TextOperation.prototype.insert = function(text) {
                if (typeof(text) !== "string" || text === "")
                    return;
                this.targetLength += text.length;
                var prevOp = this.ops[this.ops.length - 1];
                if (prevOp != null && prevOp.type === "insert") {
                    prevOp.attributes.text += text;
                } else {
                    this.ops.push(new OT.TextOp("insert", { text: text }));
                }
            };
            TextOperation.prototype.delete = function(text) {
                if (typeof(text) !== "string" || text === "")
                    return;
                this.baseLength += text.length;
                var prevOp = this.ops[this.ops.length - 1];
                if (prevOp != null && prevOp.type === "delete") {
                    prevOp.attributes.text += text;
                } else {
                    this.ops.push(new OT.TextOp("delete", { text: text }));
                }
            };
            TextOperation.prototype.apply = function(text) {
                if (text.length !== this.baseLength)
                    throw new Error("The operation's base length must be equal to the string's length.");
                var index = 0;
                for (var _i = 0, _a = this.ops; _i < _a.length; _i++) {
                    var op = _a[_i];
                    switch (op.type) {
                        case "retain":
                            index += op.attributes.amount;
                            break;
                        case "insert":
                            text = text.substring(0, index) + op.attributes.text + text.substring(index, text.length);
                            index += op.attributes.text.length;
                            break;
                        case "delete":
                            text = text.substring(0, index) + text.substring(index + op.attributes.text.length, text.length);
                            break;
                    }
                }
                return text;
            };
            TextOperation.prototype.invert = function() {
                var invertedOperation = new TextOperation(this.userId);
                for (var _i = 0, _a = this.ops; _i < _a.length; _i++) {
                    var op = _a[_i];
                    switch (op.type) {
                        case "retain":
                            invertedOperation.retain(op.attributes.amount);
                            break;
                        case "insert":
                            invertedOperation.delete(op.attributes.text);
                            break;
                        case "delete":
                            invertedOperation.insert(op.attributes.text);
                            break;
                    }
                }
                return invertedOperation;
            };
            TextOperation.prototype.clone = function() {
                var operation = new TextOperation(this.userId);
                for (var _i = 0, _a = this.ops; _i < _a.length; _i++) {
                    var op = _a[_i];
                    switch (op.type) {
                        case "retain":
                            operation.retain(op.attributes.amount);
                            break;
                        case "insert":
                            operation.insert(op.attributes.text);
                            break;
                        case "delete":
                            operation.delete(op.attributes.text);
                            break;
                    }
                }
                return operation;
            };
            TextOperation.prototype.equal = function(otherOperation) {
                // if (otherOperation.insertedLength !== this.insertedLength) return false;
                if (otherOperation.ops.length !== this.ops.length)
                    return false;
                for (var opIndex = 0; opIndex < this.ops.length; opIndex++) {
                    var op = this.ops[opIndex];
                    var otherOp = otherOperation.ops[opIndex];
                    if (otherOp.type !== op.type)
                        return false;
                    for (var key in op.attributes) {
                        var attribute = op.attributes[key];
                        if (attribute !== otherOp.attributes[key])
                            return false;
                    }
                }
                return true;
            };
            /*
            Largely inspired from Firepad
            Compose merges two consecutive operations into one operation, that
            preserves the changes of both. Or, in other words, for each input string S
            and a pair of consecutive operations A and B,
            apply(apply(S, A), B) = apply(S, compose(A, B)) must hold.
            */
            TextOperation.prototype.compose = function(operation2) {
                if (this.targetLength !== operation2.baseLength)
                    throw new Error("The base length of the second operation has to be the target length of the first operation");
                // the combined operation
                var composedOperation = new TextOperation(this.userId);
                var ops1 = this.clone().ops;
                var ops2 = operation2.clone().ops;
                var i1 = 0; // current index into ops1 respectively ops2
                var i2 = 0;
                var op1 = ops1[i1++]; // current ops
                var op2 = ops2[i2++];
                while (true) {
                    // Dispatch on the type of op1 and op2
                    // end condition: both ops1 and ops2 have been processed
                    if (op1 == null && op2 == null)
                        break;
                    if (op2 == null) {
                        switch (op1.type) {
                            case "retain":
                                composedOperation.retain(op1.attributes.amount);
                                break;
                            case "insert":
                                composedOperation.insert(op1.attributes.text);
                                break;
                            case "delete":
                                composedOperation.delete(op1.attributes.text);
                                break;
                        }
                        op1 = ops1[i1++];
                        continue;
                    }
                    if (op1 == null) {
                        switch (op2.type) {
                            case "retain":
                                composedOperation.retain(op2.attributes.amount);
                                break;
                            case "insert":
                                composedOperation.insert(op2.attributes.text);
                                break;
                            case "delete":
                                composedOperation.delete(op2.attributes.text);
                                break;
                        }
                        op2 = ops2[i2++];
                        continue;
                    }
                    if (op1 != null && op1.type === "delete") {
                        composedOperation.delete(op1.attributes.text);
                        op1 = ops1[i1++];
                        continue;
                    }
                    if (op2 != null && op2.type === "insert") {
                        composedOperation.insert(op2.attributes.text);
                        op2 = ops2[i2++];
                        continue;
                    }
                    if (op1 == null)
                        throw new Error("Cannot transform operations: first operation is too short.");
                    if (op2 == null)
                        throw new Error("Cannot transform operations: first operation is too long.");
                    if (op1.type === "retain" && op2.type === "retain") {
                        if (op1.attributes.amount === op2.attributes.amount) {
                            composedOperation.retain(op1.attributes.amount);
                            op1 = ops1[i1++];
                            op2 = ops2[i2++];
                        } else if (op1.attributes.amount > op2.attributes.amount) {
                            composedOperation.retain(op2.attributes.amount);
                            op1.attributes.amount -= op2.attributes.amount;
                            op2 = ops2[i2++];
                        } else {
                            composedOperation.retain(op1.attributes.amount);
                            op2.attributes.amount -= op1.attributes.amount;
                            op1 = ops1[i1++];
                        }
                    } else if (op1.type === "insert" && op2.type === "delete") {
                        if (op1.attributes.text.length === op2.attributes.text) {
                            op1 = ops1[i1++];
                            op2 = ops2[i2++];
                        } else if (op1.attributes.text.length > op2.attributes.text.length) {
                            op1.attributes.text = op1.attributes.text.slice(op2.attributes.text.length);
                            op2 = ops2[i2++];
                        } else {
                            op2.attributes.text = op2.attributes.text.slice(op1.attributes.text.length);
                            op1 = ops1[i1++];
                        }
                    } else if (op1.type === "insert" && op2.type === "retain") {
                        if (op1.attributes.text.length > op2.attributes.amount) {
                            composedOperation.insert(op1.attributes.text.slice(0, op2.attributes.amount));
                            op1.attributes.text = op1.attributes.text.slice(op2.attributes.amount);
                            op2 = ops2[i2++];
                        } else if (op1.attributes.text.length === op2.attributes.amount) {
                            composedOperation.insert(op1.attributes.text);
                            op1 = ops1[i1++];
                            op2 = ops2[i2++];
                        } else {
                            composedOperation.insert(op1.attributes.text);
                            op2.attributes.amount -= op1.attributes.text.length;
                            op1 = ops1[i1++];
                        }
                    } else if (op1.type === "retain" && op2.type === "delete") {
                        if (op1.attributes.amount === op2.attributes.text.length) {
                            composedOperation.delete(op2.attributes.text);
                            op1 = ops1[i1++];
                            op2 = ops2[i2++];
                        } else if (op1.attributes.amount > op2.attributes.text.length) {
                            composedOperation.delete(op2.attributes.text);
                            op1.attributes.amount -= op2.attributes.text.length;
                            op2 = ops2[i2++];
                        } else {
                            composedOperation.delete(op2.attributes.text.slice(0, op1.attributes.amount));
                            op2.attributes.text = op2.attributes.text.slice(op1.attributes.amount);
                            op1 = ops1[i1++];
                        }
                    } else {
                        throw new Error("This shouldn't happen: op1: " + JSON.stringify(op1) + ", op2: " + JSON.stringify(op2));
                    }
                }
                return composedOperation;
            };
            /*
            Largely inspired from Firepad
            Transform takes two operations A (this) and B (other) that happened concurrently and
            produces two operations A' and B' (in an array) such that
            `apply(apply(S, A), B') = apply(apply(S, B), A')`.
            This function is the heart of OT.
            */
            TextOperation.prototype.transform = function(operation2) {
                var operation1prime, operation2prime;
                var ops1, ops2;
                // Give priority with the user id
                if (this.gotPriority(operation2.userId)) {
                    operation1prime = new TextOperation(this.userId);
                    operation2prime = new TextOperation(operation2.userId);
                    ops1 = this.clone().ops;
                    ops2 = operation2.clone().ops;
                } else {
                    operation1prime = new TextOperation(operation2.userId);
                    operation2prime = new TextOperation(this.userId);
                    ops1 = operation2.clone().ops;
                    ops2 = this.clone().ops;
                }
                var i1 = 0;
                var i2 = 0;
                var op1 = ops1[i1++];
                var op2 = ops2[i2++];
                while (true) {
                    // At every iteration of the loop, the imaginary cursor that both
                    // operation1 and operation2 have that operates on the input string must
                    // have the same position in the input string.
                    // end condition: both ops1 and ops2 have been processed
                    if (op1 == null && op2 == null)
                        break;
                    // next two cases: one or both ops are insert ops
                    // => insert the string in the corresponding prime operation, skip it in
                    // the other one. If both op1 and op2 are insert ops, prefer op1.
                    if (op1 != null && op1.type === "insert") {
                        operation1prime.insert(op1.attributes.text);
                        operation2prime.retain(op1.attributes.text.length);
                        op1 = ops1[i1++];
                        continue;
                    }
                    if (op2 != null && op2.type === "insert") {
                        operation1prime.retain(op2.attributes.text.length);
                        operation2prime.insert(op2.attributes.text);
                        op2 = ops2[i2++];
                        continue;
                    }
                    if (op1 == null)
                        throw new Error("Cannot transform operations: first operation is too short.");
                    if (op2 == null)
                        throw new Error("Cannot transform operations: first operation is too long.");
                    if (op1.type === "retain" && op2.type === "retain") {
                        // Simple case: retain/retain
                        var minl = void 0;
                        if (op1.attributes.amount === op2.attributes.amount) {
                            minl = op2.attributes.amount;
                            op1 = ops1[i1++];
                            op2 = ops2[i2++];
                        } else if (op1.attributes.amount > op2.attributes.amount) {
                            minl = op2.attributes.amount;
                            op1.attributes.amount -= op2.attributes.amount;
                            op2 = ops2[i2++];
                        } else {
                            minl = op1.attributes.amount;
                            op2.attributes.amount -= op1.attributes.amount;
                            op1 = ops1[i1++];
                        }
                        operation1prime.retain(minl);
                        operation2prime.retain(minl);
                    } else if (op1.type === "delete" && op2.type === "delete") {
                        // Both operations delete the same string at the same position. We don't
                        // need to produce any operations, we just skip over the delete ops and
                        // handle the case that one operation deletes more than the other.
                        if (op1.attributes.text.length === op2.attributes.text.length) {
                            op1 = ops1[i1++];
                            op2 = ops2[i2++];
                        } else if (op1.attributes.text.length > op2.attributes.text.length) {
                            op1.attributes.text = op1.attributes.text.slice(op2.attributes.text.length);
                            op2 = ops2[i2++];
                        } else {
                            op2.attributes.text = op1.attributes.text.slice(op1.attributes.text.length);
                            op1 = ops1[i1++];
                        }
                    } else if (op1.type === "delete" && op2.type === "retain") {
                        var text = void 0;
                        if (op1.attributes.text.length === op2.attributes.amount) {
                            text = op1.attributes.text;
                            op1 = ops1[i1++];
                            op2 = ops2[i2++];
                        } else if (op1.attributes.text.length > op2.attributes.amount) {
                            text = op1.attributes.text.slice(0, op2.attributes.amount);
                            op1.attributes.text = op1.attributes.text.slice(op2.attributes.amount);
                            op2 = ops2[i2++];
                        } else {
                            text = op1.attributes.text;
                            op2.attributes.amount -= op1.attributes.text.length;
                            op1 = ops1[i1++];
                        }
                        operation1prime.delete(text);
                    } else if (op1.type === "retain" && op2.type === "delete") {
                        var text = void 0;
                        if (op1.attributes.amount === op2.attributes.text.length) {
                            text = op2.attributes.text;
                            op1 = ops1[i1++];
                            op2 = ops2[i2++];
                        } else if (op1.attributes.amount > op2.attributes.text.length) {
                            text = op2.attributes.text;
                            op1.attributes.amount -= op2.attributes.text.length;
                            op2 = ops2[i2++];
                        } else {
                            text = op2.attributes.text.slice(0, op1.attributes.amount);
                            op2.attributes.text = op2.attributes.text.slice(op1.attributes.amount);
                            op1 = ops1[i1++];
                        }
                        operation2prime.delete(text);
                    } else {
                        throw new Error("The two operations aren't compatible");
                    }
                }
                if (this.gotPriority(operation2.userId))
                    return [operation1prime, operation2prime];
                else
                    return [operation2prime, operation1prime];
            };
            TextOperation.prototype.gotPriority = function(id2) { return (this.userId <= id2); };
            return TextOperation;
        })();
        module.exports = TextOperation;

    }, { "./index": 10 }],
    10: [function(require, module, exports) {
        var TextOp = require("./TextOp");
        exports.TextOp = TextOp;
        var Document = require("./Document");
        exports.Document = Document;
        var TextOperation = require("./TextOperation");
        exports.TextOperation = TextOperation;

    }, { "./Document": 7, "./TextOp": 8, "./TextOperation": 9 }]
}, {}, [6]);