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

        var objectCreate = Object.create || objectCreatePolyfill
        var objectKeys = Object.keys || objectKeysPolyfill
        var bind = Function.prototype.bind || functionBindPolyfill

        function EventEmitter() {
            if (!this._events || !Object.prototype.hasOwnProperty.call(this, '_events')) {
                this._events = objectCreate(null);
                this._eventsCount = 0;
            }

            this._maxListeners = this._maxListeners || undefined;
        }
        module.exports = EventEmitter;

        // Backwards-compat with node 0.10.x
        EventEmitter.EventEmitter = EventEmitter;

        EventEmitter.prototype._events = undefined;
        EventEmitter.prototype._maxListeners = undefined;

        // By default EventEmitters will print a warning if more than 10 listeners are
        // added to it. This is a useful default which helps finding memory leaks.
        var defaultMaxListeners = 10;

        var hasDefineProperty;
        try {
            var o = {};
            if (Object.defineProperty) Object.defineProperty(o, 'x', { value: 0 });
            hasDefineProperty = o.x === 0;
        } catch (err) { hasDefineProperty = false }
        if (hasDefineProperty) {
            Object.defineProperty(EventEmitter, 'defaultMaxListeners', {
                enumerable: true,
                get: function() {
                    return defaultMaxListeners;
                },
                set: function(arg) {
                    // check whether the input is a positive number (whose value is zero or
                    // greater and not a NaN).
                    if (typeof arg !== 'number' || arg < 0 || arg !== arg)
                        throw new TypeError('"defaultMaxListeners" must be a positive number');
                    defaultMaxListeners = arg;
                }
            });
        } else {
            EventEmitter.defaultMaxListeners = defaultMaxListeners;
        }

        // Obviously not all Emitters should be limited to 10. This function allows
        // that to be increased. Set to zero for unlimited.
        EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
            if (typeof n !== 'number' || n < 0 || isNaN(n))
                throw new TypeError('"n" argument must be a positive number');
            this._maxListeners = n;
            return this;
        };

        function $getMaxListeners(that) {
            if (that._maxListeners === undefined)
                return EventEmitter.defaultMaxListeners;
            return that._maxListeners;
        }

        EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
            return $getMaxListeners(this);
        };

        // These standalone emit* functions are used to optimize calling of event
        // handlers for fast cases because emit() itself often has a variable number of
        // arguments and can be deoptimized because of that. These functions always have
        // the same number of arguments and thus do not get deoptimized, so the code
        // inside them can execute faster.
        function emitNone(handler, isFn, self) {
            if (isFn)
                handler.call(self);
            else {
                var len = handler.length;
                var listeners = arrayClone(handler, len);
                for (var i = 0; i < len; ++i)
                    listeners[i].call(self);
            }
        }

        function emitOne(handler, isFn, self, arg1) {
            if (isFn)
                handler.call(self, arg1);
            else {
                var len = handler.length;
                var listeners = arrayClone(handler, len);
                for (var i = 0; i < len; ++i)
                    listeners[i].call(self, arg1);
            }
        }

        function emitTwo(handler, isFn, self, arg1, arg2) {
            if (isFn)
                handler.call(self, arg1, arg2);
            else {
                var len = handler.length;
                var listeners = arrayClone(handler, len);
                for (var i = 0; i < len; ++i)
                    listeners[i].call(self, arg1, arg2);
            }
        }

        function emitThree(handler, isFn, self, arg1, arg2, arg3) {
            if (isFn)
                handler.call(self, arg1, arg2, arg3);
            else {
                var len = handler.length;
                var listeners = arrayClone(handler, len);
                for (var i = 0; i < len; ++i)
                    listeners[i].call(self, arg1, arg2, arg3);
            }
        }

        function emitMany(handler, isFn, self, args) {
            if (isFn)
                handler.apply(self, args);
            else {
                var len = handler.length;
                var listeners = arrayClone(handler, len);
                for (var i = 0; i < len; ++i)
                    listeners[i].apply(self, args);
            }
        }

        EventEmitter.prototype.emit = function emit(type) {
            var er, handler, len, args, i, events;
            var doError = (type === 'error');

            events = this._events;
            if (events)
                doError = (doError && events.error == null);
            else if (!doError)
                return false;

            // If there is no 'error' event listener then throw.
            if (doError) {
                if (arguments.length > 1)
                    er = arguments[1];
                if (er instanceof Error) {
                    throw er; // Unhandled 'error' event
                } else {
                    // At least give some kind of context to the user
                    var err = new Error('Unhandled "error" event. (' + er + ')');
                    err.context = er;
                    throw err;
                }
                return false;
            }

            handler = events[type];

            if (!handler)
                return false;

            var isFn = typeof handler === 'function';
            len = arguments.length;
            switch (len) {
                // fast cases
                case 1:
                    emitNone(handler, isFn, this);
                    break;
                case 2:
                    emitOne(handler, isFn, this, arguments[1]);
                    break;
                case 3:
                    emitTwo(handler, isFn, this, arguments[1], arguments[2]);
                    break;
                case 4:
                    emitThree(handler, isFn, this, arguments[1], arguments[2], arguments[3]);
                    break;
                    // slower
                default:
                    args = new Array(len - 1);
                    for (i = 1; i < len; i++)
                        args[i - 1] = arguments[i];
                    emitMany(handler, isFn, this, args);
            }

            return true;
        };

        function _addListener(target, type, listener, prepend) {
            var m;
            var events;
            var existing;

            if (typeof listener !== 'function')
                throw new TypeError('"listener" argument must be a function');

            events = target._events;
            if (!events) {
                events = target._events = objectCreate(null);
                target._eventsCount = 0;
            } else {
                // To avoid recursion in the case that type === "newListener"! Before
                // adding it to the listeners, first emit "newListener".
                if (events.newListener) {
                    target.emit('newListener', type,
                        listener.listener ? listener.listener : listener);

                    // Re-assign `events` because a newListener handler could have caused the
                    // this._events to be assigned to a new object
                    events = target._events;
                }
                existing = events[type];
            }

            if (!existing) {
                // Optimize the case of one listener. Don't need the extra array object.
                existing = events[type] = listener;
                ++target._eventsCount;
            } else {
                if (typeof existing === 'function') {
                    // Adding the second element, need to change to array.
                    existing = events[type] =
                        prepend ? [listener, existing] : [existing, listener];
                } else {
                    // If we've already got an array, just append.
                    if (prepend) {
                        existing.unshift(listener);
                    } else {
                        existing.push(listener);
                    }
                }

                // Check for listener leak
                if (!existing.warned) {
                    m = $getMaxListeners(target);
                    if (m && m > 0 && existing.length > m) {
                        existing.warned = true;
                        var w = new Error('Possible EventEmitter memory leak detected. ' +
                            existing.length + ' "' + String(type) + '" listeners ' +
                            'added. Use emitter.setMaxListeners() to ' +
                            'increase limit.');
                        w.name = 'MaxListenersExceededWarning';
                        w.emitter = target;
                        w.type = type;
                        w.count = existing.length;
                        if (typeof console === 'object' && console.warn) {
                            console.warn('%s: %s', w.name, w.message);
                        }
                    }
                }
            }

            return target;
        }

        EventEmitter.prototype.addListener = function addListener(type, listener) {
            return _addListener(this, type, listener, false);
        };

        EventEmitter.prototype.on = EventEmitter.prototype.addListener;

        EventEmitter.prototype.prependListener =
            function prependListener(type, listener) {
                return _addListener(this, type, listener, true);
            };

        function onceWrapper() {
            if (!this.fired) {
                this.target.removeListener(this.type, this.wrapFn);
                this.fired = true;
                switch (arguments.length) {
                    case 0:
                        return this.listener.call(this.target);
                    case 1:
                        return this.listener.call(this.target, arguments[0]);
                    case 2:
                        return this.listener.call(this.target, arguments[0], arguments[1]);
                    case 3:
                        return this.listener.call(this.target, arguments[0], arguments[1],
                            arguments[2]);
                    default:
                        var args = new Array(arguments.length);
                        for (var i = 0; i < args.length; ++i)
                            args[i] = arguments[i];
                        this.listener.apply(this.target, args);
                }
            }
        }

        function _onceWrap(target, type, listener) {
            var state = { fired: false, wrapFn: undefined, target: target, type: type, listener: listener };
            var wrapped = bind.call(onceWrapper, state);
            wrapped.listener = listener;
            state.wrapFn = wrapped;
            return wrapped;
        }

        EventEmitter.prototype.once = function once(type, listener) {
            if (typeof listener !== 'function')
                throw new TypeError('"listener" argument must be a function');
            this.on(type, _onceWrap(this, type, listener));
            return this;
        };

        EventEmitter.prototype.prependOnceListener =
            function prependOnceListener(type, listener) {
                if (typeof listener !== 'function')
                    throw new TypeError('"listener" argument must be a function');
                this.prependListener(type, _onceWrap(this, type, listener));
                return this;
            };

        // Emits a 'removeListener' event if and only if the listener was removed.
        EventEmitter.prototype.removeListener =
            function removeListener(type, listener) {
                var list, events, position, i, originalListener;

                if (typeof listener !== 'function')
                    throw new TypeError('"listener" argument must be a function');

                events = this._events;
                if (!events)
                    return this;

                list = events[type];
                if (!list)
                    return this;

                if (list === listener || list.listener === listener) {
                    if (--this._eventsCount === 0)
                        this._events = objectCreate(null);
                    else {
                        delete events[type];
                        if (events.removeListener)
                            this.emit('removeListener', type, list.listener || listener);
                    }
                } else if (typeof list !== 'function') {
                    position = -1;

                    for (i = list.length - 1; i >= 0; i--) {
                        if (list[i] === listener || list[i].listener === listener) {
                            originalListener = list[i].listener;
                            position = i;
                            break;
                        }
                    }

                    if (position < 0)
                        return this;

                    if (position === 0)
                        list.shift();
                    else
                        spliceOne(list, position);

                    if (list.length === 1)
                        events[type] = list[0];

                    if (events.removeListener)
                        this.emit('removeListener', type, originalListener || listener);
                }

                return this;
            };

        EventEmitter.prototype.removeAllListeners =
            function removeAllListeners(type) {
                var listeners, events, i;

                events = this._events;
                if (!events)
                    return this;

                // not listening for removeListener, no need to emit
                if (!events.removeListener) {
                    if (arguments.length === 0) {
                        this._events = objectCreate(null);
                        this._eventsCount = 0;
                    } else if (events[type]) {
                        if (--this._eventsCount === 0)
                            this._events = objectCreate(null);
                        else
                            delete events[type];
                    }
                    return this;
                }

                // emit removeListener for all listeners on all events
                if (arguments.length === 0) {
                    var keys = objectKeys(events);
                    var key;
                    for (i = 0; i < keys.length; ++i) {
                        key = keys[i];
                        if (key === 'removeListener') continue;
                        this.removeAllListeners(key);
                    }
                    this.removeAllListeners('removeListener');
                    this._events = objectCreate(null);
                    this._eventsCount = 0;
                    return this;
                }

                listeners = events[type];

                if (typeof listeners === 'function') {
                    this.removeListener(type, listeners);
                } else if (listeners) {
                    // LIFO order
                    for (i = listeners.length - 1; i >= 0; i--) {
                        this.removeListener(type, listeners[i]);
                    }
                }

                return this;
            };

        function _listeners(target, type, unwrap) {
            var events = target._events;

            if (!events)
                return [];

            var evlistener = events[type];
            if (!evlistener)
                return [];

            if (typeof evlistener === 'function')
                return unwrap ? [evlistener.listener || evlistener] : [evlistener];

            return unwrap ? unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);
        }

        EventEmitter.prototype.listeners = function listeners(type) {
            return _listeners(this, type, true);
        };

        EventEmitter.prototype.rawListeners = function rawListeners(type) {
            return _listeners(this, type, false);
        };

        EventEmitter.listenerCount = function(emitter, type) {
            if (typeof emitter.listenerCount === 'function') {
                return emitter.listenerCount(type);
            } else {
                return listenerCount.call(emitter, type);
            }
        };

        EventEmitter.prototype.listenerCount = listenerCount;

        function listenerCount(type) {
            var events = this._events;

            if (events) {
                var evlistener = events[type];

                if (typeof evlistener === 'function') {
                    return 1;
                } else if (evlistener) {
                    return evlistener.length;
                }
            }

            return 0;
        }

        EventEmitter.prototype.eventNames = function eventNames() {
            return this._eventsCount > 0 ? Reflect.ownKeys(this._events) : [];
        };

        // About 1.5x faster than the two-arg version of Array#splice().
        function spliceOne(list, index) {
            for (var i = index, k = i + 1, n = list.length; k < n; i += 1, k += 1)
                list[i] = list[k];
            list.pop();
        }

        function arrayClone(arr, n) {
            var copy = new Array(n);
            for (var i = 0; i < n; ++i)
                copy[i] = arr[i];
            return copy;
        }

        function unwrapListeners(arr) {
            var ret = new Array(arr.length);
            for (var i = 0; i < ret.length; ++i) {
                ret[i] = arr[i].listener || arr[i];
            }
            return ret;
        }

        function objectCreatePolyfill(proto) {
            var F = function() {};
            F.prototype = proto;
            return new F;
        }

        function objectKeysPolyfill(obj) {
            var keys = [];
            for (var k in obj)
                if (Object.prototype.hasOwnProperty.call(obj, k)) {
                    keys.push(k);
                }
            return k;
        }

        function functionBindPolyfill(context) {
            var fn = this;
            return function() {
                return fn.apply(context, arguments);
            };
        }

    }, {}],
    2: [function(require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        const THREE = SupEngine.THREE;
        class TileLayerGeometry extends THREE.BufferGeometry {
            constructor(width, height, widthSegments, heightSegments) {
                super();
                this.type = "TileLayerGeometry";
                const vertices = new Float32Array(widthSegments * heightSegments * 4 * 3);
                const normals = new Float32Array(widthSegments * heightSegments * 4 * 3);
                const uvs = new Float32Array(widthSegments * heightSegments * 4 * 2);
                uvs.fill(-1);
                let indices;
                if (vertices.length / 3 > 65535)
                    indices = new Uint32Array(widthSegments * heightSegments * 6);
                else
                    indices = new Uint16Array(widthSegments * heightSegments * 6);
                let verticesOffset = 0;
                let indicesOffset = 0;
                for (let iy = 0; iy < heightSegments; iy++) {
                    let y = iy * height / heightSegments;
                    for (let ix = 0; ix < widthSegments; ix++) {
                        let x = ix * width / widthSegments;
                        // Left bottom
                        vertices[verticesOffset + 0] = x;
                        vertices[verticesOffset + 1] = y;
                        normals[verticesOffset + 2] = 1;
                        // Right bottom
                        vertices[verticesOffset + 3] = x + width / widthSegments;
                        vertices[verticesOffset + 4] = y;
                        normals[verticesOffset + 5] = 1;
                        // Right top
                        vertices[verticesOffset + 6] = x + width / widthSegments;
                        vertices[verticesOffset + 7] = y + height / heightSegments;
                        normals[verticesOffset + 8] = 1;
                        // Left Top
                        vertices[verticesOffset + 9] = x;
                        vertices[verticesOffset + 10] = y + height / heightSegments;
                        normals[verticesOffset + 11] = 1;
                        const ref = (ix + iy * widthSegments) * 4;
                        // Bottom right corner
                        indices[indicesOffset + 0] = ref + 0;
                        indices[indicesOffset + 1] = ref + 1;
                        indices[indicesOffset + 2] = ref + 2;
                        // Top left corner
                        indices[indicesOffset + 3] = ref + 0;
                        indices[indicesOffset + 4] = ref + 2;
                        indices[indicesOffset + 5] = ref + 3;
                        verticesOffset += 4 * 3;
                        indicesOffset += 6;
                    }
                }
                this.setIndex(new THREE.BufferAttribute(indices, 1));
                this.addAttribute("position", new THREE.BufferAttribute(vertices, 3));
                this.addAttribute("normal", new THREE.BufferAttribute(normals, 3));
                this.addAttribute("uv", new THREE.BufferAttribute(uvs, 2));
            }
        }
        exports.default = TileLayerGeometry;

    }, {}],
    3: [function(require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        const events_1 = require("events");
        class TileMap extends events_1.EventEmitter {
            constructor(data) {
                super();
                this.data = data;
            }
            getWidth() { return this.data.width; }
            getHeight() { return this.data.height; }
            getPixelsPerUnit() { return this.data.pixelsPerUnit; }
            getLayersDepthOffset() { return this.data.layerDepthOffset; }
            getLayersCount() { return this.data.layers.length; }
            getLayerId(index) { return this.data.layers[index].id; }
            setTileAt(layer, x, y, value) {
                if (x < 0 || y < 0 || x >= this.data.width || y >= this.data.height)
                    return;
                const index = y * this.data.width + x;
                this.data.layers[layer].data[index] = (value != null) ? value : 0;
                this.emit("setTileAt", layer, x, y);
            }
            getTileAt(layer, x, y) {
                if (x < 0 || y < 0 || x >= this.data.width || y >= this.data.height)
                    return 0;
                const index = y * this.data.width + x;
                return this.data.layers[layer].data[index];
            }
        }
        exports.default = TileMap;

    }, { "events": 1 }],
    4: [function(require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        const THREE = SupEngine.THREE;

        const TileLayerGeometry_1 = require("./TileLayerGeometry");
        const TileMapRendererUpdater_1 = require("./TileMapRendererUpdater");
        class TileMapRenderer extends SupEngine.ActorComponent {
                constructor(actor) {
                    super(actor, "TileMapRenderer");
                    this.castShadow = false;
                    this.receiveShadow = false;
                    this.materialType = "basic";
                    this.onSetTileAt = (layerIndex, x, y) => { this.refreshTileAt(layerIndex, x, y); };
                }
                setTileMap(asset, materialType, customShader) {
                    if (this.layerMeshes != null)
                        this._clearLayerMeshes();
                    this.tileMap = asset;
                    if (materialType != null)
                        this.materialType = materialType;
                    this.customShader = customShader;
                    if (this.tileSet == null || this.tileSet.data.texture == null || this.tileMap == null)
                        return;
                    this._createLayerMeshes();
                }
                setTileSet(asset) {
                    if (this.layerMeshes != null)
                        this._clearLayerMeshes();
                    this.tileSet = asset;
                    if (this.tileSet == null || this.tileSet.data.texture == null)
                        return;
                    this.tilesPerRow = this.tileSet.data.texture.image.width / this.tileSet.data.grid.width;
                    this.tilesPerColumn = this.tileSet.data.texture.image.height / this.tileSet.data.grid.height;
                    if (this.tileMap != null)
                        this._createLayerMeshes();
                }
                _createLayerMeshes() {
                    this.layerMeshes = [];
                    this.layerMeshesById = {};
                    this.layerVisibleById = {};
                    for (let layerIndex = 0; layerIndex < this.tileMap.getLayersCount(); layerIndex++) {
                        const layerId = this.tileMap.getLayerId(layerIndex);
                        this.addLayer(layerId, layerIndex);
                    }
                    this.setCastShadow(this.castShadow);
                    this.tileMap.on("setTileAt", this.onSetTileAt);
                }
                _clearLayerMeshes() {
                    for (const layerMesh of this.layerMeshes) {
                        layerMesh.geometry.dispose();
                        layerMesh.material.dispose();
                        this.actor.threeObject.remove(layerMesh);
                    }
                    this.layerMeshes = null;
                    this.layerMeshesById = null;
                    this.layerVisibleById = null;
                    this.tileMap.removeListener("setTileAt", this.onSetTileAt);
                }
                _destroy() {
                    if (this.layerMeshes != null)
                        this._clearLayerMeshes();
                    this.tileMap = null;
                    this.tileSet = null;
                    super._destroy();
                }
                addLayer(layerId, layerIndex) {
                    const width = this.tileMap.getWidth() * this.tileSet.data.grid.width;
                    const height = this.tileMap.getHeight() * this.tileSet.data.grid.height;
                    const geometry = new TileLayerGeometry_1.default(width, height, this.tileMap.getWidth(), this.tileMap.getHeight());
                    let shaderData;
                    let defaultUniforms;
                    switch (this.materialType) {
                        case "basic":
                            shaderData = {
                                formatVersion: null,
                                vertexShader: { text: THREE.ShaderLib.basic.vertexShader, draft: null, revisionId: null },
                                fragmentShader: { text: "// Copied (and slightly adapted for ValjangEngine) from https://github.com/mrdoob/three.js/blob/dev/src/renderers/shaders/ShaderLib/meshbasic_frag.glsl\r\n\r\nuniform vec3 diffuse;\r\nuniform float opacity;\r\n\r\n#ifndef FLAT_SHADED\r\n\r\n\tvarying vec3 vNormal;\r\n\r\n#endif\r\n\r\n#include <common>\r\n#include <color_pars_fragment>\r\n#include <uv_pars_fragment>\r\n#include <uv2_pars_fragment>\r\n#include <map_pars_fragment>\r\n#include <alphamap_pars_fragment>\r\n#include <aomap_pars_fragment>\r\n#include <envmap_pars_fragment>\r\n#include <fog_pars_fragment>\r\n#include <specularmap_pars_fragment>\r\n#include <logdepthbuf_pars_fragment>\r\n#include <clipping_planes_pars_fragment>\r\n\r\nvoid main() {\r\n\t// ValjangEngine modification to discard empty tiles\r\n\tif (vUv.x < 0.0 && vUv.y < 0.0) discard;\r\n\r\n\t#include <clipping_planes_fragment>\r\n\r\n\tvec4 diffuseColor = vec4( diffuse, opacity );\r\n\r\n\t#include <logdepthbuf_fragment>\r\n\t#include <map_fragment>\r\n\t#include <color_fragment>\r\n\t#include <alphamap_fragment>\r\n\t#include <alphatest_fragment>\r\n\t#include <specularmap_fragment>\r\n\r\n\tReflectedLight reflectedLight;\r\n\treflectedLight.directDiffuse = vec3( 0.0 );\r\n\treflectedLight.directSpecular = vec3( 0.0 );\r\n\treflectedLight.indirectDiffuse = diffuseColor.rgb;\r\n\treflectedLight.indirectSpecular = vec3( 0.0 );\r\n\r\n\t#include <aomap_fragment>\r\n\r\n\tvec3 outgoingLight = reflectedLight.indirectDiffuse;\r\n\r\n\t#include <normal_flip>\r\n\t#include <envmap_fragment>\r\n\r\n\tgl_FragColor = vec4( outgoingLight, diffuseColor.a );\r\n\r\n\t#include <premultiplied_alpha_fragment>\r\n\t#include <tonemapping_fragment>\r\n\t#include <encodings_fragment>\r\n\t#include <fog_fragment>\r\n\r\n}", draft: null, revisionId: null },
                                uniforms: [{ id: null, name: "map", type: "t", value: "map" }],
                                attributes: [],
                                useLightUniforms: false
                            };
                            defaultUniforms = THREE.ShaderLib.basic.uniforms;
                            break;
                        case "phong":
                            shaderData = {
                                formatVersion: null,
                                vertexShader: { text: THREE.ShaderLib.phong.vertexShader, draft: null, revisionId: null },
                                fragmentShader: { text: "// Copied (and slightly adapted for ValjangEngine) from https://github.com/mrdoob/three.js/blob/dev/src/renderers/shaders/ShaderLib/meshphong_frag.glsl\r\n\r\n#define PHONG\r\n\r\nuniform vec3 diffuse;\r\nuniform vec3 emissive;\r\nuniform vec3 specular;\r\nuniform float shininess;\r\nuniform float opacity;\r\n\r\n#include <common>\r\n#include <packing>\r\n#include <color_pars_fragment>\r\n#include <uv_pars_fragment>\r\n#include <uv2_pars_fragment>\r\n#include <map_pars_fragment>\r\n#include <alphamap_pars_fragment>\r\n#include <aomap_pars_fragment>\r\n#include <lightmap_pars_fragment>\r\n#include <emissivemap_pars_fragment>\r\n#include <envmap_pars_fragment>\r\n#include <fog_pars_fragment>\r\n#include <bsdfs>\r\n#include <lights_pars>\r\n#include <lights_phong_pars_fragment>\r\n#include <shadowmap_pars_fragment>\r\n#include <bumpmap_pars_fragment>\r\n#include <normalmap_pars_fragment>\r\n#include <specularmap_pars_fragment>\r\n#include <logdepthbuf_pars_fragment>\r\n#include <clipping_planes_pars_fragment>\r\n\r\nvoid main() {\r\n\t// ValjangEngine modification to discard empty tiles\r\n\tif (vUv.x < 0.0 && vUv.y < 0.0) discard;\r\n\r\n\t#include <clipping_planes_fragment>\r\n\r\n\tvec4 diffuseColor = vec4( diffuse, opacity );\r\n\tReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );\r\n\tvec3 totalEmissiveRadiance = emissive;\r\n\r\n\t#include <logdepthbuf_fragment>\r\n\t#include <map_fragment>\r\n\t#include <color_fragment>\r\n\t#include <alphamap_fragment>\r\n\t#include <alphatest_fragment>\r\n\t#include <specularmap_fragment>\r\n\t#include <normal_flip>\r\n\t#include <normal_fragment>\r\n\t#include <emissivemap_fragment>\r\n\r\n\t// accumulation\r\n\t#include <lights_phong_fragment>\r\n\t#include <lights_template>\r\n\r\n\t// modulation\r\n\t#include <aomap_fragment>\r\n\r\n\tvec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;\r\n\r\n\t#include <envmap_fragment>\r\n\r\n\tgl_FragColor = vec4( outgoingLight, diffuseColor.a );\r\n\r\n\t#include <premultiplied_alpha_fragment>\r\n\t#include <tonemapping_fragment>\r\n\t#include <encodings_fragment>\r\n\t#include <fog_fragment>\r\n\r\n}", draft: null, revisionId: null },
                                uniforms: [{ id: null, name: "map", type: "t", value: "map" }],
                                attributes: [],
                                useLightUniforms: true
                            };
                            defaultUniforms = THREE.ShaderLib.phong.uniforms;
                            break;
                        case "shader":
                            shaderData = this.customShader;
                            break;
                    }
                    const material = SupEngine.componentClasses["Shader"].createShaderMaterial(shaderData, { map: this.tileSet.data.texture }, geometry, { defaultUniforms });
                    material.map = this.tileSet.data.texture;
                    material.alphaTest = 0.1;
                    material.side = THREE.DoubleSide;
                    material.transparent = true;
                    const layerMesh = new THREE.Mesh(geometry, material);
                    layerMesh.receiveShadow = this.receiveShadow;
                    const scaleRatio = 1 / this.tileMap.getPixelsPerUnit();
                    layerMesh.scale.set(scaleRatio, scaleRatio, 1);
                    layerMesh.updateMatrixWorld(false);
                    this.layerMeshes.splice(layerIndex, 0, layerMesh);
                    this.layerMeshesById[layerId] = layerMesh;
                    this.layerVisibleById[layerId] = true;
                    this.actor.threeObject.add(layerMesh);
                    for (let y = 0; y < this.tileMap.getHeight(); y++) {
                        for (let x = 0; x < this.tileMap.getWidth(); x++) {
                            this.refreshTileAt(layerIndex, x, y);
                        }
                    }
                    this.refreshLayersDepth();
                }
                deleteLayer(layerIndex) {
                    this.actor.threeObject.remove(this.layerMeshes[layerIndex]);
                    this.layerMeshes.splice(layerIndex, 1);
                    this.refreshLayersDepth();
                }
                moveLayer(layerId, newIndex) {
                    const layer = this.layerMeshesById[layerId];
                    const oldIndex = this.layerMeshes.indexOf(layer);
                    this.layerMeshes.splice(oldIndex, 1);
                    if (oldIndex < newIndex)
                        newIndex--;
                    this.layerMeshes.splice(newIndex, 0, layer);
                    this.refreshLayersDepth();
                }
                setCastShadow(castShadow) {
                    this.castShadow = castShadow;
                    for (const layerMesh of this.layerMeshes)
                        layerMesh.castShadow = castShadow;
                    if (!castShadow)
                        return;
                    this.actor.gameInstance.threeScene.traverse((object) => {
                        const material = object.material;
                        if (material != null)
                            material.needsUpdate = true;
                    });
                }
                setReceiveShadow(receiveShadow) {
                    this.receiveShadow = receiveShadow;
                    for (const layerMesh of this.layerMeshes) {
                        layerMesh.receiveShadow = receiveShadow;
                        layerMesh.material.needsUpdate = true;
                    }
                }
                refreshPixelsPerUnit(pixelsPerUnit) {
                    const scaleRatio = 1 / this.tileMap.getPixelsPerUnit();
                    for (const layerMesh of this.layerMeshes) {
                        layerMesh.scale.set(scaleRatio, scaleRatio, 1);
                        layerMesh.updateMatrixWorld(false);
                    }
                }
                refreshLayersDepth() {
                    for (let layerMeshIndex = 0; layerMeshIndex < this.layerMeshes.length; layerMeshIndex++) {
                        const layerMesh = this.layerMeshes[layerMeshIndex];
                        layerMesh.position.setZ(layerMeshIndex * this.tileMap.getLayersDepthOffset());
                        layerMesh.updateMatrixWorld(false);
                    }
                }
                refreshEntireMap() {
                    for (let layerIndex = 0; layerIndex < this.tileMap.getLayersCount(); layerIndex++) {
                        for (let y = 0; y < this.tileMap.getWidth(); y++) {
                            for (let x = 0; x < this.tileMap.getHeight(); x++) {
                                this.refreshTileAt(layerIndex, x, y);
                            }
                        }
                    }
                    this.refreshLayersDepth();
                }
                refreshTileAt(layerIndex, x, y) {
                    let tileX = -1;
                    let tileY = -1;
                    let flipX = false;
                    let flipY = false;
                    let angle = 0;
                    const tileInfo = this.tileMap.getTileAt(layerIndex, x, y);
                    if (tileInfo !== 0) {
                        tileX = tileInfo[0];
                        tileY = tileInfo[1];
                        flipX = tileInfo[2];
                        flipY = tileInfo[3];
                        angle = tileInfo[4];
                    }
                    const quadIndex = (x + y * this.tileMap.getWidth());
                    const layerMesh = this.layerMeshes[layerIndex];
                    const uvs = layerMesh.geometry.getAttribute("uv");
                    uvs.needsUpdate = true;
                    const uvsArray = uvs.array;
                    if (tileX === -1 || tileY === -1 || tileX >= this.tilesPerRow || tileY >= this.tilesPerColumn) {
                        for (let i = 0; i < 8; i++)
                            uvsArray[quadIndex * 8 + i] = -1;
                        return;
                    }
                    const image = this.tileSet.data.texture.image;
                    let left = (tileX * this.tileSet.data.grid.width + 0.2) / image.width;
                    let right = ((tileX + 1) * this.tileSet.data.grid.width - 0.2) / image.width;
                    let bottom = 1 - ((tileY + 1) * this.tileSet.data.grid.height - 0.2) / image.height;
                    let top = 1 - (tileY * this.tileSet.data.grid.height + 0.2) / image.height;
                    if (flipX)
                        [right, left] = [left, right];
                    if (flipY)
                        [top, bottom] = [bottom, top];
                    switch (angle) {
                        case 0:
                            uvsArray[quadIndex * 8 + 0] = left;
                            uvsArray[quadIndex * 8 + 1] = bottom;
                            uvsArray[quadIndex * 8 + 2] = right;
                            uvsArray[quadIndex * 8 + 3] = bottom;
                            uvsArray[quadIndex * 8 + 4] = right;
                            uvsArray[quadIndex * 8 + 5] = top;
                            uvsArray[quadIndex * 8 + 6] = left;
                            uvsArray[quadIndex * 8 + 7] = top;
                            break;
                        case 90:
                            uvsArray[quadIndex * 8 + 0] = left;
                            uvsArray[quadIndex * 8 + 1] = top;
                            uvsArray[quadIndex * 8 + 2] = left;
                            uvsArray[quadIndex * 8 + 3] = bottom;
                            uvsArray[quadIndex * 8 + 4] = right;
                            uvsArray[quadIndex * 8 + 5] = bottom;
                            uvsArray[quadIndex * 8 + 6] = right;
                            uvsArray[quadIndex * 8 + 7] = top;
                            break;
                        case 180:
                            uvsArray[quadIndex * 8 + 0] = right;
                            uvsArray[quadIndex * 8 + 1] = top;
                            uvsArray[quadIndex * 8 + 2] = left;
                            uvsArray[quadIndex * 8 + 3] = top;
                            uvsArray[quadIndex * 8 + 4] = left;
                            uvsArray[quadIndex * 8 + 5] = bottom;
                            uvsArray[quadIndex * 8 + 6] = right;
                            uvsArray[quadIndex * 8 + 7] = bottom;
                            break;
                        case 270:
                            uvsArray[quadIndex * 8 + 0] = right;
                            uvsArray[quadIndex * 8 + 1] = bottom;
                            uvsArray[quadIndex * 8 + 2] = right;
                            uvsArray[quadIndex * 8 + 3] = top;
                            uvsArray[quadIndex * 8 + 4] = left;
                            uvsArray[quadIndex * 8 + 5] = top;
                            uvsArray[quadIndex * 8 + 6] = left;
                            uvsArray[quadIndex * 8 + 7] = bottom;
                            break;
                    }
                }
                setIsLayerActive(active) {
                    if (this.layerMeshes == null)
                        return;
                    for (const layerId in this.layerMeshesById)
                        this.layerMeshesById[layerId].visible = active && this.layerVisibleById[layerId];
                }
            }
            /* tslint:disable:variable-name */
        TileMapRenderer.Updater = TileMapRendererUpdater_1.default;
        exports.default = TileMapRenderer;

    }, { "./TileLayerGeometry": 2, "./TileMapRendererUpdater": 5 }],
    5: [function(require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        const TileMap_1 = require("./TileMap");
        const TileSet_1 = require("./TileSet");
        class TileMapRendererUpdater {
            constructor(client, tileMapRenderer, config, externalSubscribers) {
                this.client = client;
                this.tileMapRenderer = tileMapRenderer;
                this.externalSubscribers = externalSubscribers;
                this.onTileMapAssetReceived = (assetId, asset) => {
                    this.tileMapAsset = asset;
                    this.setTileMap();
                    if (this.tileMapAsset.pub.tileSetId != null)
                        this.client.subAsset(this.tileMapAsset.pub.tileSetId, "tileSet", this.tileSetSubscriber);
                    const subscriber = this.externalSubscribers.tileMap;
                    if (subscriber.onAssetReceived != null)
                        subscriber.onAssetReceived(assetId, asset);
                };
                this.onTileMapAssetEdited = (assetId, command, ...args) => {
                    if (this.tileSetAsset != null || command === "changeTileSet") {
                        const commandFunction = this.onEditCommands[command];
                        if (commandFunction != null)
                            commandFunction.apply(this, args);
                    }
                    const subscriber = this.externalSubscribers.tileMap;
                    if (subscriber.onAssetEdited)
                        subscriber.onAssetEdited(assetId, command, ...args);
                };
                this.onEditCommands = {
                    changeTileSet: () => {
                        if (this.tileSetAssetId != null)
                            this.client.unsubAsset(this.tileSetAssetId, this.tileSetSubscriber);
                        this.tileSetAsset = null;
                        this.tileMapRenderer.setTileSet(null);
                        this.tileSetAssetId = this.tileMapAsset.pub.tileSetId;
                        if (this.tileSetAssetId != null)
                            this.client.subAsset(this.tileSetAssetId, "tileSet", this.tileSetSubscriber);
                    },
                    resizeMap: () => { this.setTileMap(); },
                    moveMap: () => { this.tileMapRenderer.refreshEntireMap(); },
                    setProperty: (path, value) => {
                        switch (path) {
                            case "pixelsPerUnit":
                                this.tileMapRenderer.refreshPixelsPerUnit(value);
                                break;
                            case "layerDepthOffset":
                                this.tileMapRenderer.refreshLayersDepth();
                                break;
                        }
                    },
                    editMap: (layerId, edits) => {
                        const index = this.tileMapAsset.pub.layers.indexOf(this.tileMapAsset.layers.byId[layerId]);
                        for (const edit of edits)
                            this.tileMapRenderer.refreshTileAt(index, edit.x, edit.y);
                    },
                    newLayer: (layer, index) => { this.tileMapRenderer.addLayer(layer.id, index); },
                    deleteLayer: (id, index) => { this.tileMapRenderer.deleteLayer(index); },
                    moveLayer: (id, newIndex) => { this.tileMapRenderer.moveLayer(id, newIndex); }
                };
                this.onTileMapAssetTrashed = (assetId) => {
                    this.tileMapRenderer.setTileMap(null);
                    const subscriber = this.externalSubscribers.tileMap;
                    if (subscriber.onAssetTrashed != null)
                        subscriber.onAssetTrashed(assetId);
                };
                this.onTileSetAssetReceived = (assetId, asset) => {
                    this.prepareTexture(asset.pub.texture, () => {
                        this.tileSetAsset = asset;
                        this.tileMapRenderer.setTileSet(new TileSet_1.default(asset.pub));
                        const subscriber = this.externalSubscribers.tileSet;
                        if (subscriber.onAssetReceived != null)
                            subscriber.onAssetReceived(assetId, asset);
                    });
                };
                this.onTileSetAssetEdited = (assetId, command, ...args) => {
                    const commandFunction = this.onTileSetEditCommands[command];
                    if (commandFunction != null)
                        commandFunction.apply(this, args);
                    const subscriber = this.externalSubscribers.tileSet;
                    if (subscriber.onAssetEdited)
                        subscriber.onAssetEdited(assetId, command, ...args);
                };
                this.onTileSetEditCommands = {
                    upload() {
                        this.prepareTexture(this.tileSetAsset.pub.texture, () => {
                            this.tileMapRenderer.setTileSet(new TileSet_1.default(this.tileSetAsset.pub));
                        });
                    },
                    setProperty() {
                        this.tileMapRenderer.setTileSet(new TileSet_1.default(this.tileSetAsset.pub));
                    }
                };
                this.onTileSetAssetTrashed = (assetId) => {
                    this.tileMapRenderer.setTileSet(null);
                    const subscriber = this.externalSubscribers.tileSet;
                    if (subscriber.onAssetTrashed)
                        subscriber.onAssetTrashed(assetId);
                };
                this.onShaderAssetReceived = (assetId, asset) => {
                    this.shaderPub = asset.pub;
                    this.setTileMap();
                };
                this.onShaderAssetEdited = (id, command, ...args) => {
                    if (command !== "editVertexShader" && command !== "editFragmentShader")
                        this.setTileMap();
                };
                this.onShaderAssetTrashed = () => {
                    this.shaderPub = null;
                    this.setTileMap();
                };
                this.tileMapAssetId = config.tileMapAssetId;
                this.tileSetAssetId = config.tileSetAssetId;
                this.materialType = config.materialType;
                this.shaderAssetId = config.shaderAssetId;
                this.tileMapRenderer.receiveShadow = config.receiveShadow;
                if (this.externalSubscribers == null)
                    this.externalSubscribers = {};
                if (this.externalSubscribers.tileMap == null)
                    this.externalSubscribers.tileMap = {};
                if (this.externalSubscribers.tileSet == null)
                    this.externalSubscribers.tileSet = {};
                this.tileMapSubscriber = {
                    onAssetReceived: this.onTileMapAssetReceived,
                    onAssetEdited: this.onTileMapAssetEdited,
                    onAssetTrashed: this.onTileMapAssetTrashed
                };
                this.tileSetSubscriber = {
                    onAssetReceived: this.onTileSetAssetReceived,
                    onAssetEdited: this.onTileSetAssetEdited,
                    onAssetTrashed: this.onTileSetAssetTrashed
                };
                this.shaderSubscriber = {
                    onAssetReceived: this.onShaderAssetReceived,
                    onAssetEdited: this.onShaderAssetEdited,
                    onAssetTrashed: this.onShaderAssetTrashed
                };
                if (this.tileMapAssetId != null)
                    this.client.subAsset(this.tileMapAssetId, "tileMap", this.tileMapSubscriber);
                if (this.shaderAssetId != null)
                    this.client.subAsset(this.shaderAssetId, "shader", this.shaderSubscriber);
            }
            destroy() {
                if (this.tileMapAssetId != null)
                    this.client.unsubAsset(this.tileMapAssetId, this.tileMapSubscriber);
                if (this.tileSetAssetId != null)
                    this.client.unsubAsset(this.tileSetAssetId, this.tileSetSubscriber);
                if (this.shaderAssetId != null)
                    this.client.unsubAsset(this.shaderAssetId, this.shaderSubscriber);
            }
            setTileMap() {
                if (this.tileMapAsset == null || (this.materialType === "shader" && this.shaderPub == null)) {
                    this.tileMapRenderer.setTileMap(null);
                    return;
                }
                this.tileMapRenderer.setTileMap(new TileMap_1.default(this.tileMapAsset.pub), this.materialType, this.shaderPub);
            }
            prepareTexture(texture, callback) {
                if (texture == null) {
                    callback();
                    return;
                }
                if (texture.image.complete)
                    callback();
                else
                    texture.image.addEventListener("load", callback);
            }
            config_setProperty(path, value) {
                switch (path) {
                    case "tileMapAssetId":
                        if (this.tileMapAssetId != null)
                            this.client.unsubAsset(this.tileMapAssetId, this.tileMapSubscriber);
                        this.tileMapAssetId = value;
                        this.tileMapAsset = null;
                        this.tileMapRenderer.setTileMap(null);
                        if (this.tileSetAssetId != null)
                            this.client.unsubAsset(this.tileSetAssetId, this.tileSetSubscriber);
                        this.tileSetAsset = null;
                        this.tileMapRenderer.setTileSet(null);
                        if (this.tileMapAssetId != null)
                            this.client.subAsset(this.tileMapAssetId, "tileMap", this.tileMapSubscriber);
                        break;
                        // case "tileSetAssetId":
                    case "castShadow":
                        this.tileMapRenderer.setCastShadow(value);
                        break;
                    case "receiveShadow":
                        this.tileMapRenderer.setReceiveShadow(value);
                        break;
                    case "materialType":
                        this.materialType = value;
                        this.setTileMap();
                        break;
                    case "shaderAssetId":
                        if (this.shaderAssetId != null)
                            this.client.unsubAsset(this.shaderAssetId, this.shaderSubscriber);
                        this.shaderAssetId = value;
                        this.shaderPub = null;
                        this.tileMapRenderer.setTileMap(null);
                        if (this.shaderAssetId != null)
                            this.client.subAsset(this.shaderAssetId, "shader", this.shaderSubscriber);
                        break;
                }
            }
        }
        exports.default = TileMapRendererUpdater;

    }, { "./TileMap": 3, "./TileSet": 6 }],
    6: [function(require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        class TileSet {
            constructor(data) {
                this.data = data;
            }
        }
        exports.default = TileSet;

    }, {}],
    7: [function(require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        const THREE = SupEngine.THREE;
        const TileSetRendererUpdater_1 = require("./TileSetRendererUpdater");
        class TileSetRenderer extends SupEngine.ActorComponent {
                constructor(actor, asset) {
                    super(actor, "TileSetRenderer");
                    this.material = new THREE.MeshBasicMaterial({ alphaTest: 0.1, side: THREE.DoubleSide, transparent: true });
                    const gridActor = new SupEngine.Actor(this.actor.gameInstance, "Grid");
                    gridActor.setLocalPosition(new THREE.Vector3(0, 0, 1));
                    this.gridRenderer = new SupEngine.editorComponentClasses["GridRenderer"](gridActor, {
                        width: 1,
                        height: 1,
                        direction: -1,
                        orthographicScale: 10,
                        ratio: { x: 1, y: 1 }
                    });
                    this.selectedTileActor = new SupEngine.Actor(this.actor.gameInstance, "Selection", null, { visible: false });
                    new SupEngine.editorComponentClasses["FlatColorRenderer"](this.selectedTileActor, 0x900090, 1, 1);
                    this.setTileSet(asset);
                }
                setTileSet(asset) {
                    this._clearMesh();
                    this.asset = asset;
                    if (this.asset == null)
                        return;
                    const geometry = new THREE.PlaneBufferGeometry(asset.data.texture.image.width, asset.data.texture.image.height);
                    this.material.map = asset.data.texture;
                    this.mesh = new THREE.Mesh(geometry, this.material);
                    this.actor.threeObject.add(this.mesh);
                    this.refreshScaleRatio();
                    this.selectedTileActor.threeObject.visible = true;
                }
                select(x, y, width = 1, height = 1) {
                    const ratio = this.asset.data.grid.width / this.asset.data.grid.height;
                    this.selectedTileActor.setLocalPosition(new THREE.Vector3(x, -y / ratio, 2));
                    this.selectedTileActor.setLocalScale(new THREE.Vector3(width, -height / ratio, 1));
                }
                refreshScaleRatio() {
                    const scaleX = 1 / this.asset.data.grid.width;
                    const scaleY = 1 / this.asset.data.grid.height;
                    const scale = Math.max(scaleX, scaleY);
                    this.mesh.scale.set(scale, scale, 1);
                    const material = this.mesh.material;
                    this.mesh.position.setX(material.map.image.width / 2 * scale);
                    this.mesh.position.setY(-material.map.image.height / 2 * scale);
                    this.mesh.updateMatrixWorld(false);
                    this.select(0, 0);
                }
                _clearMesh() {
                    if (this.mesh == null)
                        return;
                    this.mesh.geometry.dispose();
                    this.mesh.material.dispose();
                    this.actor.threeObject.remove(this.mesh);
                    this.mesh = null;
                    this.selectedTileActor.threeObject.visible = false;
                }
                _destroy() {
                    this._clearMesh();
                    this.actor.gameInstance.destroyActor(this.gridRenderer.actor);
                    this.actor.gameInstance.destroyActor(this.selectedTileActor);
                    this.asset = null;
                    super._destroy();
                }
                setIsLayerActive(active) {
                    if (this.mesh != null)
                        this.mesh.visible = active;
                }
            }
            /* tslint:disable:variable-name */
        TileSetRenderer.Updater = TileSetRendererUpdater_1.default;
        exports.default = TileSetRenderer;

    }, { "./TileSetRendererUpdater": 8 }],
    8: [function(require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        const TileSet_1 = require("./TileSet");
        class TileSetRendererUpdater {
            constructor(client, tileSetRenderer, config, externalSubscriber) {
                this.client = client;
                this.tileSetRenderer = tileSetRenderer;
                this.externalSubscriber = externalSubscriber;
                this.onTileSetAssetReceived = (assetId, asset) => {
                    this.prepareTexture(asset.pub.texture, () => {
                        this.tileSetAsset = asset;
                        if (asset.pub.texture != null) {
                            this.tileSetRenderer.setTileSet(new TileSet_1.default(asset.pub));
                            this.tileSetRenderer.gridRenderer.setGrid({
                                width: asset.pub.texture.image.width / asset.pub.grid.width,
                                height: asset.pub.texture.image.height / asset.pub.grid.height,
                                direction: -1,
                                orthographicScale: 10,
                                ratio: { x: 1, y: asset.pub.grid.width / asset.pub.grid.height }
                            });
                        }
                        if (this.externalSubscriber.onAssetReceived != null)
                            this.externalSubscriber.onAssetReceived(assetId, asset);
                    });
                };
                this.onTileSetAssetEdited = (assetId, command, ...args) => {
                    let callEditCallback = true;
                    const commandFunction = this.onEditCommands[command];
                    if (commandFunction != null && commandFunction(...args) === false)
                        callEditCallback = false;
                    if (callEditCallback && this.externalSubscriber.onAssetEdited != null) {
                        this.externalSubscriber.onAssetEdited(assetId, command, ...args);
                    }
                };
                this.onEditCommands = {
                    upload: () => {
                        const texture = this.tileSetAsset.pub.texture;
                        this.prepareTexture(texture, () => {
                            this.tileSetRenderer.setTileSet(new TileSet_1.default(this.tileSetAsset.pub));
                            const width = texture.image.width / this.tileSetAsset.pub.grid.width;
                            const height = texture.image.height / this.tileSetAsset.pub.grid.height;
                            this.tileSetRenderer.gridRenderer.resize(width, height);
                            this.tileSetRenderer.gridRenderer.setRatio({ x: 1, y: this.tileSetAsset.pub.grid.width / this.tileSetAsset.pub.grid.height });
                            if (this.externalSubscriber.onAssetEdited != null) {
                                this.externalSubscriber.onAssetEdited(this.tileSetAsset.id, "upload");
                            }
                        });
                        return false;
                    },
                    setProperty: (key, value) => {
                        switch (key) {
                            case "grid.width":
                            case "grid.height":
                                this.tileSetRenderer.refreshScaleRatio();
                                const width = this.tileSetAsset.pub.texture.image.width / this.tileSetAsset.pub.grid.width;
                                const height = this.tileSetAsset.pub.texture.image.height / this.tileSetAsset.pub.grid.height;
                                this.tileSetRenderer.gridRenderer.resize(width, height);
                                this.tileSetRenderer.gridRenderer.setRatio({ x: 1, y: this.tileSetAsset.pub.grid.width / this.tileSetAsset.pub.grid.height });
                                break;
                        }
                    }
                };
                this.onTileSetAssetTrashed = (assetId) => {
                    this.tileSetRenderer.setTileSet(null);
                    if (this.externalSubscriber.onAssetTrashed != null)
                        this.externalSubscriber.onAssetTrashed(assetId);
                };
                this.client = client;
                this.tileSetRenderer = tileSetRenderer;
                this.tileSetAssetId = config.tileSetAssetId;
                if (this.externalSubscriber == null)
                    this.externalSubscriber = {};
                this.tileSetSubscriber = {
                    onAssetReceived: this.onTileSetAssetReceived,
                    onAssetEdited: this.onTileSetAssetEdited,
                    onAssetTrashed: this.onTileSetAssetTrashed
                };
                if (this.tileSetAssetId != null)
                    this.client.subAsset(this.tileSetAssetId, "tileSet", this.tileSetSubscriber);
            }
            destroy() {
                if (this.tileSetAssetId != null) {
                    this.client.unsubAsset(this.tileSetAssetId, this.tileSetSubscriber);
                }
            }
            changeTileSetId(tileSetId) {
                if (this.tileSetAssetId != null)
                    this.client.unsubAsset(this.tileSetAssetId, this.tileSetSubscriber);
                this.tileSetAssetId = tileSetId;
                this.tileSetAsset = null;
                this.tileSetRenderer.setTileSet(null);
                this.tileSetRenderer.gridRenderer.resize(1, 1);
                if (this.tileSetAssetId != null)
                    this.client.subAsset(this.tileSetAssetId, "tileSet", this.tileSetSubscriber);
            }
            prepareTexture(texture, callback) {
                if (texture == null) {
                    callback();
                    return;
                }
                if (texture.image.complete)
                    callback();
                else
                    texture.image.addEventListener("load", callback);
            }
        }
        exports.default = TileSetRendererUpdater;

    }, { "./TileSet": 6 }],
    9: [function(require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        const TileMapRenderer_1 = require("./TileMapRenderer");
        const TileSetRenderer_1 = require("./TileSetRenderer");
        SupEngine.registerComponentClass("TileMapRenderer", TileMapRenderer_1.default);
        SupEngine.registerEditorComponentClass("TileSetRenderer", TileSetRenderer_1.default);

    }, { "./TileMapRenderer": 4, "./TileSetRenderer": 7 }]
}, {}, [9]);