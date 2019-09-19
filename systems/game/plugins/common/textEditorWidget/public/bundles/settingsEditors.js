(function() {
    function r(e, n, t) {
        function o(i, f) { if (!n[i]) { if (!e[i]) { var c = "function" == typeof require && require; if (!f && c) return c(i, !0); if (u) return u(i, !0); var a = new Error("Cannot find module '" + i + "'"); throw a.code = "MODULE_NOT_FOUND", a } var p = n[i] = { exports: {} };
                e[i][0].call(p.exports, function(r) { var n = e[i][1][r]; return o(n || r) }, p, p.exports, r, e, n, t) } return n[i].exports } for (var u = "function" == typeof require && require, i = 0; i < t.length; i++) o(t[i]); return o } return r })()({
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
        const events_1 = require("events");
        const storageKey = "ValjangEngine.common.textEditorWidget";
        const item = window.localStorage.getItem(storageKey);
        exports.pub = item != null ? JSON.parse(item) : {
            formatVersion: 2,
            keyMap: "sublime",
            theme: "default"
        };
        if (exports.pub.formatVersion === 1) {
            exports.pub.formatVersion = 2;
            edit("theme", "default");
        }
        exports.emitter = new events_1.EventEmitter();
        window.addEventListener("storage", (event) => {
            if (event.key !== storageKey)
                return;
            const oldPub = exports.pub;
            exports.pub = JSON.parse(event.newValue);
            if (oldPub.keyMap !== exports.pub.keyMap)
                exports.emitter.emit("keyMap");
            if (oldPub.theme !== exports.pub.theme)
                exports.emitter.emit("theme");
        });

        function edit(key, value) {
            exports.pub[key] = value;
            window.localStorage.setItem(storageKey, JSON.stringify(exports.pub));
        }
        exports.edit = edit;

    }, { "events": 1 }],
    5: [function(require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });

        const path = require("path");
        const textEditorUserSettings = require("../data/textEditorUserSettings");
        const modes = ["3024-day.css", "3024-night.css", "abcdef.css", "ambiance-mobile.css", "ambiance.css", "base16-dark.css", "base16-light.css", "bespin.css", "blackboard.css", "cobalt.css", "colorforth.css", "dracula.css", "duotone-dark.css", "duotone-light.css", "eclipse.css", "elegant.css", "erlang-dark.css", "hopscotch.css", "icecoder.css", "isotope.css", "lesser-dark.css", "liquibyte.css", "material.css", "mbo.css", "mdn-like.css", "midnight.css", "monokai.css", "neat.css", "neo.css", "night.css", "panda-syntax.css", "paraiso-dark.css", "paraiso-light.css", "pastel-on-dark.css", "railscasts.css", "rubyblue.css", "seti.css", "solarized.css", "the-matrix.css", "tomorrow-night-bright.css", "tomorrow-night-eighties.css", "ttcn.css", "twilight.css", "vibrant-ink.css", "xq-dark.css", "xq-light.css", "yeti.css", "zenburn.css"];
        class TextEditorSettingsEditor {
            constructor(container, projectClient) {
                this.onResourceReceived = (resourceId, resource) => {
                    this.resource = resource;
                    this.tabSizeField.value = resource.pub.tabSize.toString();
                    this.softTabField.checked = resource.pub.softTab;
                };
                this.onResourceEdited = (resourceId, command, propertyName) => {
                    switch (propertyName) {
                        case "tabSize":
                            this.tabSizeField.value = this.resource.pub.tabSize.toString();
                            break;
                        case "softTab":
                            this.softTabField.checked = this.resource.pub.softTab;
                            break;
                    }
                };
                const { tbody } = SupClient.table.createTable(container);
                // Project settings
                const tabSizeRow = SupClient.table.appendRow(tbody, SupClient.i18n.t("settingsEditors:TextEditor.tabSize"));
                this.tabSizeField = SupClient.table.appendNumberField(tabSizeRow.valueCell, "", { min: 1 });
                this.tabSizeField.addEventListener("change", (event) => {
                    projectClient.editResource("textEditorSettings", "setProperty", "tabSize", parseInt(event.target.value, 10));
                });
                const softTabRow = SupClient.table.appendRow(tbody, SupClient.i18n.t("settingsEditors:TextEditor.useSoftTab"));
                this.softTabField = SupClient.table.appendBooleanField(softTabRow.valueCell, true);
                this.softTabField.addEventListener("change", (event) => {
                    projectClient.editResource("textEditorSettings", "setProperty", "softTab", event.target.checked);
                });
                projectClient.subResource("textEditorSettings", this);
                // User settings
                const keyMapRow = SupClient.table.appendRow(tbody, SupClient.i18n.t("settingsEditors:TextEditor.keyMap"));
                this.keyMapField = SupClient.table.appendSelectBox(keyMapRow.valueCell, { "sublime": "Sublime", "emacs": "Emacs", "vim": "Vim" }, textEditorUserSettings.pub.keyMap);
                this.keyMapField.addEventListener("change", (event) => {
                    textEditorUserSettings.edit("keyMap", event.target.value);
                });
                textEditorUserSettings.emitter.addListener("keyMap", () => {
                    this.keyMapField.value = textEditorUserSettings.pub.keyMap;
                });
                const themeRow = SupClient.table.appendRow(tbody, SupClient.i18n.t("settingsEditors:TextEditor.theme"));
                const themeValues = { "default": "default" };
                for (const mode of modes) {
                    const modeNoExtension = mode.slice(0, mode.length - 4);
                    themeValues[modeNoExtension] = modeNoExtension;
                }
                this.themeField = SupClient.table.appendSelectBox(themeRow.valueCell, themeValues, textEditorUserSettings.pub.theme);
                this.themeField.addEventListener("change", (event) => {
                    textEditorUserSettings.edit("theme", event.target.value);
                });
                textEditorUserSettings.emitter.addListener("theme", () => {
                    this.themeField.value = textEditorUserSettings.pub.theme;
                });
            }
        }
        exports.default = TextEditorSettingsEditor;

    }, { "../data/textEditorUserSettings": 4, "path": 2 }],
    6: [function(require, module, exports) {
        "use strict";
        /// <reference path="../../settings/settingsEditors/SettingsEditorPlugin.d.ts" />
        Object.defineProperty(exports, "__esModule", { value: true });
        const TextEditorSettingsEditor_1 = require("./TextEditorSettingsEditor");
        SupClient.registerPlugin("settingsEditors", "TextEditor", {
            namespace: "editors",
            editor: TextEditorSettingsEditor_1.default
        });

    }, { "./TextEditorSettingsEditor": 5 }]
}, {}, [6]);