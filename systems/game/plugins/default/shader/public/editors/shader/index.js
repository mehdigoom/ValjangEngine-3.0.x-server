(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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
  for (var k in obj) if (Object.prototype.hasOwnProperty.call(obj, k)) {
    keys.push(k);
  }
  return k;
}
function functionBindPolyfill(context) {
  var fn = this;
  return function () {
    return fn.apply(context, arguments);
  };
}

},{}],2:[function(require,module,exports){
(function (global){
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.ResizeHandle = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      } else {
        // At least give some kind of context to the user
        var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
        err.context = er;
        throw err;
      }
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (listeners) {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.prototype.listenerCount = function(type) {
  if (this._events) {
    var evlistener = this._events[type];

    if (isFunction(evlistener))
      return 1;
    else if (evlistener)
      return evlistener.length;
  }
  return 0;
};

EventEmitter.listenerCount = function(emitter, type) {
  return emitter.listenerCount(type);
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],2:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var events = require("events");
var ResizeHandle = (function (_super) {
    __extends(ResizeHandle, _super);
    function ResizeHandle(targetElt, direction, options) {
        var _this = this;
        _super.call(this);
        this.savedSize = null;
        this.onDoubleClick = function (event) {
            if (event.button !== 0 || !_this.handleElt.classList.contains("collapsable"))
                return;
            var size = _this.targetElt.getBoundingClientRect()[_this.horizontal ? "width" : "height"];
            var newSize;
            if (size > 0) {
                _this.savedSize = size;
                newSize = 0;
                _this.targetElt.style.display = "none";
            }
            else {
                newSize = _this.savedSize;
                _this.savedSize = null;
                _this.targetElt.style.display = "";
            }
            if (_this.horizontal)
                _this.targetElt.style.width = newSize + "px";
            else
                _this.targetElt.style.height = newSize + "px";
        };
        this.onMouseDown = function (event) {
            if (event.button !== 0)
                return;
            if (_this.targetElt.style.display === "none")
                return;
            if (_this.handleElt.classList.contains("disabled"))
                return;
            event.preventDefault();
            _this.emit("dragStart");
            var initialSize;
            var startDrag;
            var directionClass;
            if (_this.horizontal) {
                initialSize = _this.targetElt.getBoundingClientRect().width;
                startDrag = event.clientX;
                directionClass = "vertical";
            }
            else {
                initialSize = _this.targetElt.getBoundingClientRect().height;
                startDrag = event.clientY;
                directionClass = "horizontal";
            }
            var dragTarget;
            if (_this.handleElt.setCapture != null) {
                dragTarget = _this.handleElt;
                dragTarget.setCapture();
            }
            else {
                dragTarget = window;
            }
            document.documentElement.classList.add("handle-dragging", directionClass);
            var onMouseMove = function (event) {
                var size = initialSize + (_this.start ? -startDrag : startDrag);
                _this.emit("drag");
                if (_this.horizontal) {
                    size += _this.start ? event.clientX : -event.clientX;
                    _this.targetElt.style.width = size + "px";
                }
                else {
                    size += _this.start ? event.clientY : -event.clientY;
                    _this.targetElt.style.height = size + "px";
                }
            };
            var onMouseUp = function (event) {
                if (dragTarget.releaseCapture != null)
                    dragTarget.releaseCapture();
                document.documentElement.classList.remove("handle-dragging", directionClass);
                dragTarget.removeEventListener("mousemove", onMouseMove);
                dragTarget.removeEventListener("mouseup", onMouseUp);
                _this.emit("dragEnd");
            };
            dragTarget.addEventListener("mousemove", onMouseMove);
            dragTarget.addEventListener("mouseup", onMouseUp);
        };
        if (["left", "right", "top", "bottom"].indexOf(direction) === -1)
            throw new Error("Invalid direction");
        this.horizontal = ["left", "right"].indexOf(direction) !== -1;
        this.start = ["left", "top"].indexOf(direction) !== -1;
        if (options == null)
            options = {};
        this.targetElt = targetElt;
        this.direction = direction;
        var candidateElt = this.start ? targetElt.nextElementSibling : targetElt.previousElementSibling;
        if (candidateElt != null && candidateElt.tagName === "DIV" && candidateElt.classList.contains("resize-handle")) {
            this.handleElt = candidateElt;
        }
        else {
            this.handleElt = document.createElement("div");
            this.handleElt.classList.add("resize-handle");
            if (this.start)
                targetElt.parentNode.insertBefore(this.handleElt, targetElt.nextSibling);
            else
                targetElt.parentNode.insertBefore(this.handleElt, targetElt);
        }
        this.handleElt.classList.add(direction);
        this.handleElt.classList.toggle("collapsable", options.collapsable);
        this.handleElt.addEventListener("dblclick", this.onDoubleClick);
        this.handleElt.addEventListener("mousedown", this.onMouseDown);
    }
    return ResizeHandle;
}(events.EventEmitter));
module.exports = ResizeHandle;

},{"events":1}]},{},[2])(2)
});
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"events":1}],3:[function(require,module,exports){
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

},{}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Attributes extends SupCore.Data.Base.ListById {
    constructor(pub) {
        super(pub, Attributes.schema);
    }
}
Attributes.schema = {
    name: { type: "string", minLength: 1, maxLength: 80, mutable: true },
    type: { type: "enum", items: ["f", "c", "v2", "v3", "v4"], mutable: true }
};
exports.default = Attributes;

},{}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Uniforms extends SupCore.Data.Base.ListById {
    constructor(pub) {
        super(pub, Uniforms.schema);
    }
    setProperty(id, key, value, callback) {
        function checkArray(value, size) {
            if (!Array.isArray(value))
                return false;
            if (value.length !== size)
                return false;
            for (const item of value)
                if (typeof item !== "number")
                    return false;
            return true;
        }
        if (key === "value") {
            const item = this.byId[id];
            switch (item.type) {
                case "f":
                    if (typeof value !== "number") {
                        callback("Invalid value", null);
                        return;
                    }
                    break;
                case "c":
                case "v3":
                    if (!checkArray(value, 3)) {
                        callback("Invalid value", null);
                        return;
                    }
                    break;
                case "v2":
                    if (!checkArray(value, 2)) {
                        callback("Invalid value", null);
                        return;
                    }
                    break;
                case "v4":
                    if (!checkArray(value, 4)) {
                        callback("Invalid value", null);
                        return;
                    }
                    break;
                case "t":
                    if (typeof value !== "string") {
                        callback("Invalid value", null);
                        return;
                    }
                    break;
            }
        }
        super.setProperty(id, key, value, (err, value) => {
            if (err != null) {
                callback(err, null);
                return;
            }
            callback(null, value);
            if (key === "type")
                this.updateItemValue(id, value);
        });
    }
    client_setProperty(id, key, value) {
        super.client_setProperty(id, key, value);
        if (key === "type")
            this.updateItemValue(id, value);
    }
    updateItemValue(id, value) {
        const item = this.byId[id];
        switch (value) {
            case "f":
                item.value = 0;
                break;
            case "c":
                item.value = [1, 1, 1];
                break;
            case "v2":
                item.value = [0, 0];
                break;
            case "v3":
                item.value = [0, 0, 0];
                break;
            case "v4":
                item.value = [0, 0, 0, 0];
                break;
            case "t":
                item.value = "map";
                break;
        }
    }
}
Uniforms.schema = {
    name: { type: "string", minLength: 1, maxLength: 80, mutable: true },
    type: { type: "enum", items: ["f", "c", "v2", "v3", "v4", "t"], mutable: true },
    value: { type: "any", mutable: true }
};
exports.default = Uniforms;

},{}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ui_1 = require("./ui");
const network_1 = require("./network");
const Shader_1 = require("../../components/Shader");
const THREE = SupEngine.THREE;
const canvasElt = document.querySelector("canvas");
const gameInstance = new SupEngine.GameInstance(canvasElt);
const cameraActor = new SupEngine.Actor(gameInstance, "Camera");
cameraActor.setLocalPosition(new THREE.Vector3(0, 0, 10));
const cameraComponent = new SupEngine.componentClasses["Camera"](cameraActor);
new SupEngine.editorComponentClasses["Camera3DControls"](cameraActor, cameraComponent);
const loader = new THREE.TextureLoader();
const leonardTexture = loader.load("leonard.png", undefined);
leonardTexture.magFilter = THREE.NearestFilter;
leonardTexture.minFilter = THREE.NearestFilter;
let previewActor;
let material;
function setupPreview(options = { useDraft: false }) {
    if (previewActor != null) {
        gameInstance.destroyActor(previewActor);
        previewActor = null;
    }
    if (network_1.data.previewComponentUpdater != null) {
        network_1.data.previewComponentUpdater.destroy();
        network_1.data.previewComponentUpdater = null;
    }
    if (material != null) {
        material.dispose();
        material = null;
    }
    if (ui_1.default.previewTypeSelect.value === "Asset" && ui_1.default.previewEntry == null)
        return;
    previewActor = new SupEngine.Actor(gameInstance, "Preview");
    let previewGeometry;
    switch (ui_1.default.previewTypeSelect.value) {
        case "Plane":
            previewGeometry = new THREE.PlaneBufferGeometry(2, 2);
            break;
        case "Box":
            previewGeometry = new THREE.BufferGeometry().fromGeometry(new THREE.BoxGeometry(2, 2, 2));
            break;
        case "Sphere":
            previewGeometry = new THREE.BufferGeometry().fromGeometry(new THREE.SphereGeometry(2, 12, 12));
            break;
        case "Asset":
            let componentClassName;
            const config = { materialType: "shader", shaderAssetId: SupClient.query.asset, spriteAssetId: null, modelAssetId: null };
            if (ui_1.default.previewEntry.type === "sprite") {
                componentClassName = "SpriteRenderer";
                config.spriteAssetId = ui_1.default.previewEntry.id;
            }
            else {
                componentClassName = "ModelRenderer";
                config.modelAssetId = ui_1.default.previewEntry.id;
            }
            const componentClass = SupEngine.componentClasses[componentClassName];
            const component = new componentClass(previewActor);
            network_1.data.previewComponentUpdater = new componentClass.Updater(network_1.data.projectClient, component, config);
            return;
    }
    material = Shader_1.createShaderMaterial(network_1.data.shaderAsset.pub, { map: leonardTexture }, previewGeometry, options);
    previewActor.threeObject.add(new THREE.Mesh(previewGeometry, material));
    gameInstance.update();
    gameInstance.draw();
}
exports.setupPreview = setupPreview;
let isTabActive = true;
let animationFrame;
window.addEventListener("message", (event) => {
    if (event.data.type === "deactivate" || event.data.type === "activate") {
        isTabActive = event.data.type === "activate";
        onChangeActive();
    }
});
function onChangeActive() {
    const stopRendering = !isTabActive;
    if (stopRendering) {
        if (animationFrame != null) {
            cancelAnimationFrame(animationFrame);
            animationFrame = null;
        }
    }
    else if (animationFrame == null) {
        animationFrame = requestAnimationFrame(tick);
    }
}
let lastTimestamp = 0;
let accumulatedTime = 0;
function tick(timestamp = 0) {
    animationFrame = requestAnimationFrame(tick);
    accumulatedTime += timestamp - lastTimestamp;
    lastTimestamp = timestamp;
    const { updates, timeLeft } = gameInstance.tick(accumulatedTime);
    accumulatedTime = timeLeft;
    if (updates !== 0 && material != null)
        for (let i = 0; i < updates; i++)
            material.uniforms.time.value += 1 / gameInstance.framesPerSecond;
    gameInstance.draw();
}
animationFrame = requestAnimationFrame(tick);

},{"../../components/Shader":3,"./network":8,"./ui":9}],7:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("./ui");
require("./engine");
require("./network");

},{"./engine":6,"./network":8,"./ui":9}],8:[function(require,module,exports){
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

},{"./engine":6,"./ui":9}],9:[function(require,module,exports){
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

},{"../../data/Attributes":4,"../../data/Uniforms":5,"./engine":6,"./network":8,"resize-handle":2}]},{},[7]);
