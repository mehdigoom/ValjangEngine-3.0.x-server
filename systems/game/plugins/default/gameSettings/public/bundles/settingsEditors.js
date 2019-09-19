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
    }, { "_process": 2 }],
    2: [function(require, module, exports) {
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
    3: [function(require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        const path = require("path");
        class GameSettingsResource extends SupCore.Data.Base.Resource {
            constructor(id, pub, server) {
                super(id, pub, GameSettingsResource.schema, server);
            }
            init(callback) {
                this.pub = {
                    formatVersion: GameSettingsResource.currentFormatVersion,
                    startupSceneId: null,
                    framesPerSecond: 60,
                    ratioNumerator: null,
                    ratioDenominator: null,
                    customLayers: []
                };
                super.init(callback);
            }
            migrate(resourcePath, pub, callback) {
                if (pub.formatVersion === GameSettingsResource.currentFormatVersion) {
                    callback(false);
                    return;
                }
                if (pub.formatVersion == null) {
                    // NOTE: Custom layers were introduced in ValjangEngine 0.8
                    if (pub.customLayers == null)
                        pub.customLayers = [];
                    this.server.data.entries.walk((node) => {
                        const path = this.server.data.entries.getPathFromId(node.id);
                        if (path === pub.startupScene)
                            pub.startupSceneId = node.id;
                    });
                    delete pub.startupScene;
                    pub.formatVersion = 1;
                }
                callback(true);
            }
            restore() {
                if (this.pub.startupSceneId != null && this.server.data.entries.byId[this.pub.startupSceneId] != null) {
                    this.emit("setAssetBadge", this.pub.startupSceneId, "startupScene", "info");
                }
            }
            clientExport(outputPath, callback) {
                SupApp.writeFile(path.join(outputPath, "resource.json"), JSON.stringify(this.pub), callback);
            }
            server_setProperty(client, path, value, callback) {
                let oldSceneId;
                if (path === "startupSceneId")
                    oldSceneId = this.pub.startupSceneId;
                this.setProperty(path, value, (err, actualValue) => {
                    if (err != null) {
                        callback(err);
                        return;
                    }
                    if (path === "startupSceneId") {
                        if (oldSceneId != null && this.server.data.entries.byId[oldSceneId] != null)
                            this.emit("clearAssetBadge", oldSceneId, "startupScene");
                        if (actualValue != null && this.server.data.entries.byId[actualValue] != null)
                            this.emit("setAssetBadge", actualValue, "startupScene", "info");
                    }
                    callback(null, null, path, actualValue);
                });
            }
        }
        GameSettingsResource.currentFormatVersion = 1;
        GameSettingsResource.schema = {
            formatVersion: { type: "integer" },
            startupSceneId: { type: "string?", mutable: true },
            framesPerSecond: { type: "integer", minExcluded: 0, mutable: true },
            ratioNumerator: { type: "integer?", mutable: true },
            ratioDenominator: { type: "integer?", mutable: true },
            customLayers: {
                type: "array",
                mutable: true,
                minLength: 0,
                maxLength: 8,
                items: { type: "string", minLength: 1, maxLength: 80 }
            }
        };
        exports.default = GameSettingsResource;

    }, { "path": 1 }],
    4: [function(require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        const GameSettingsResource_1 = require("../data/GameSettingsResource");
        class GameSettingsEditor {
            constructor(container, projectClient) {
                this.fields = {};
                this.onResourceReceived = (resourceId, resource) => {
                    this.resource = resource;
                    this._setupCustomLayers();
                    for (const setting in resource.pub) {
                        if (setting === "formatVersion" || setting === "customLayers")
                            continue;
                        if (setting === "startupSceneId")
                            this._setStartupScene(resource.pub.startupSceneId);
                        else
                            this.fields[setting].value = resource.pub[setting];
                    }
                };
                this.onResourceEdited = (resourceId, command, propertyName) => {
                    if (propertyName === "customLayers")
                        this._setupCustomLayers();
                    else if (propertyName === "startupSceneId")
                        this._setStartupScene(this.resource.pub.startupSceneId);
                    else
                        this.fields[propertyName].value = this.resource.pub[propertyName];
                };
                this.onCustomLayerFieldChange = (event) => {
                    const index = parseInt(event.target.dataset["customLayerIndex"], 10);
                    if (index > this.customLayers.length)
                        return;
                    if (index === this.customLayers.length) {
                        if (event.target.value === "")
                            return;
                        this.customLayers.push(event.target.value);
                    } else {
                        if (event.target.value === "") {
                            if (index === this.customLayers.length - 1) {
                                this.customLayers.pop();
                            } else {
                                new SupClient.Dialogs.InfoDialog("Layer name cannot be empty");
                                event.target.value = this.customLayers[index];
                                return;
                            }
                        } else {
                            this.customLayers[index] = event.target.value;
                        }
                    }
                    this.projectClient.editResource("gameSettings", "setProperty", "customLayers", this.customLayers);
                };
                this.projectClient = projectClient;
                const { tbody } = SupClient.table.createTable(container);
                this.startupSceneRow = SupClient.table.appendRow(tbody, SupClient.i18n.t("settingsEditors:Game.startupScene"));
                this.sceneFieldSubscriber = SupClient.table.appendAssetField(this.startupSceneRow.valueCell, this.sceneAssetId, "scene", projectClient);
                this.sceneFieldSubscriber.on("select", (assetId) => {
                    this.projectClient.editResource("gameSettings", "setProperty", "startupSceneId", assetId);
                });
                this.fpsRow = SupClient.table.appendRow(tbody, SupClient.i18n.t("settingsEditors:Game.framesPerSecond"));
                this.fields["framesPerSecond"] = SupClient.table.appendNumberField(this.fpsRow.valueCell, "", { min: 1 });
                this.ratioRow = SupClient.table.appendRow(tbody, SupClient.i18n.t("settingsEditors:Game.screenRatio"));
                const ratioContainer = document.createElement("div");
                ratioContainer.className = "";
                this.ratioRow.valueCell.appendChild(ratioContainer);
                [this.fields["ratioNumerator"], this.fields["ratioDenominator"]] = SupClient.table.appendNumberFields(this.ratioRow.valueCell, ["", ""]);
                this.fields["ratioNumerator"].placeholder = SupClient.i18n.t("settingsEditors:Game.width");
                this.fields["ratioDenominator"].placeholder = SupClient.i18n.t("settingsEditors:Game.height");
                this.customLayersRow = SupClient.table.appendRow(tbody, SupClient.i18n.t("settingsEditors:Game.layers"));
                this.layerContainers = document.createElement("div");
                this.layerContainers.className = "list";
                this.customLayersRow.valueCell.appendChild(this.layerContainers);
                this.fields["defaultLayer"] = SupClient.table.appendTextField(this.layerContainers, "Default");
                this.fields["defaultLayer"].readOnly = true;
                for (let i = 0; i < GameSettingsResource_1.default.schema["customLayers"].maxLength; i++) {
                    const field = this.fields[`customLayer${i}`] = SupClient.table.appendTextField(this.layerContainers, "");
                    field.dataset["customLayerIndex"] = i.toString();
                    field.addEventListener("change", this.onCustomLayerFieldChange);
                }
                this.fields["framesPerSecond"].addEventListener("change", (event) => {
                    this.projectClient.editResource("gameSettings", "setProperty", "framesPerSecond", parseInt(event.target.value, 10));
                });
                this.fields["ratioNumerator"].addEventListener("change", (event) => {
                    this.projectClient.editResource("gameSettings", "setProperty", "ratioNumerator", parseInt(event.target.value, 10));
                });
                this.fields["ratioDenominator"].addEventListener("change", (event) => {
                    this.projectClient.editResource("gameSettings", "setProperty", "ratioDenominator", parseInt(event.target.value, 10));
                });
                this.projectClient.subResource("gameSettings", this);
            }
            _setStartupScene(id) {
                this.sceneAssetId = id;
                this.sceneFieldSubscriber.onChangeAssetId(id);
            }
            _setupCustomLayers() {
                this.customLayers = this.resource.pub.customLayers.slice(0);
                for (let i = 0; i < GameSettingsResource_1.default.schema["customLayers"].maxLength; i++) {
                    const field = this.fields[`customLayer${i}`];
                    if (i === this.customLayers.length) {
                        field.placeholder = SupClient.i18n.t("settingsEditors:Game.newLayer");
                        field.value = "";
                    } else {
                        field.placeholder = "";
                    }
                    if (i > this.customLayers.length) {
                        if (field.parentElement != null)
                            this.layerContainers.removeChild(field);
                    } else {
                        if (field.parentElement == null)
                            this.layerContainers.appendChild(field);
                        if (i < this.customLayers.length)
                            field.value = this.customLayers[i];
                    }
                }
            }
        }
        exports.default = GameSettingsEditor;

    }, { "../data/GameSettingsResource": 3 }],
    5: [function(require, module, exports) {
        "use strict";
        /// <reference path="../../../common/settings/settingsEditors/SettingsEditorPlugin.d.ts" />
        Object.defineProperty(exports, "__esModule", { value: true });
        const GameSettingsEditor_1 = require("./GameSettingsEditor");
        SupClient.registerPlugin("settingsEditors", "Game", {
            namespace: "general",
            editor: GameSettingsEditor_1.default
        });

    }, { "./GameSettingsEditor": 4 }]
}, {}, [5]);