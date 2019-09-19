(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
(function (global){
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.TreeView = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
var events_1 = require("events");
var TreeView = (function (_super) {
    __extends(TreeView, _super);
    function TreeView(container, options) {
        var _this = this;
        _super.call(this);
        this.onClick = function (event) {
            // Toggle groups
            var element = event.target;
            if (element.className === "toggle") {
                if (element.parentElement.tagName === "LI" && element.parentElement.classList.contains("group")) {
                    element.parentElement.classList.toggle("collapsed");
                    return;
                }
            }
            // Update selection
            if (element.tagName === "BUTTON" || element.tagName === "INPUT" || element.tagName === "SELECT")
                return;
            if (_this.updateSelection(event))
                _this.emit("selectionChange");
        };
        this.onDoubleClick = function (event) {
            if (_this.selectedNodes.length !== 1)
                return;
            var element = event.target;
            if (element.tagName === "BUTTON" || element.tagName === "INPUT" || element.tagName === "SELECT")
                return;
            if (element.className === "toggle")
                return;
            _this.emit("activate");
        };
        this.onKeyDown = function (event) {
            if (document.activeElement !== _this.treeRoot)
                return;
            if (_this.firstSelectedNode == null) {
                // TODO: Remove once we have this.focusedNode
                if (event.keyCode === 40) {
                    _this.addToSelection(_this.treeRoot.firstElementChild);
                    _this.emit("selectionChange");
                    event.preventDefault();
                }
                return;
            }
            switch (event.keyCode) {
                case 38: // up
                case 40:
                    _this.moveVertically(event.keyCode === 40 ? 1 : -1);
                    event.preventDefault();
                    break;
                case 37: // left
                case 39:
                    _this.moveHorizontally(event.keyCode === 39 ? 1 : -1);
                    event.preventDefault();
                    break;
                case 13:
                    if (_this.selectedNodes.length !== 1)
                        return;
                    _this.emit("activate");
                    event.preventDefault();
                    break;
            }
        };
        this.moveHorizontally = function (offset) {
            // TODO: this.focusedNode;
            var node = _this.firstSelectedNode;
            if (offset === -1) {
                if (!node.classList.contains("group") || node.classList.contains("collapsed")) {
                    if (!node.parentElement.classList.contains("children"))
                        return;
                    node = node.parentElement.previousElementSibling;
                }
                else if (node.classList.contains("group")) {
                    node.classList.add("collapsed");
                }
            }
            else {
                if (node.classList.contains("group")) {
                    if (node.classList.contains("collapsed"))
                        node.classList.remove("collapsed");
                    else
                        node = node.nextSibling.firstChild;
                }
            }
            if (node == null)
                return;
            _this.clearSelection();
            _this.addToSelection(node);
            _this.scrollIntoView(node);
            _this.emit("selectionChange");
        };
        this.onDragStart = function (event) {
            var element = event.target;
            if (element.tagName !== "LI")
                return false;
            if (!element.classList.contains("item") && !element.classList.contains("group"))
                return false;
            if (_this.selectedNodes.indexOf(element) === -1) {
                _this.clearSelection();
                _this.addToSelection(element);
                _this.emit("selectionChange");
            }
            if (_this.dragStartCallback != null && !_this.dragStartCallback(event, element))
                return false;
            _this.isDraggingNodes = true;
            return true;
        };
        this.onDragEnd = function (event) {
            _this.isDraggingNodes = false;
        };
        this.onDragOver = function (event) {
            var dropLocation = _this.getDropLocation(event);
            // Prevent dropping onto null
            if (dropLocation == null)
                return false;
            // If we're dragging nodes from the current tree view
            // Prevent dropping into descendant
            if (_this.isDraggingNodes) {
                if (dropLocation.where === "inside" && _this.selectedNodes.indexOf(dropLocation.target) !== -1)
                    return false;
                for (var _i = 0, _a = _this.selectedNodes; _i < _a.length; _i++) {
                    var selectedNode = _a[_i];
                    if (selectedNode.classList.contains("group") && selectedNode.nextSibling.contains(dropLocation.target))
                        return false;
                }
            }
            _this.hasDraggedOverAfterLeaving = true;
            _this.clearDropClasses();
            dropLocation.target.classList.add("drop-" + dropLocation.where);
            event.preventDefault();
        };
        this.onDragLeave = function (event) {
            _this.hasDraggedOverAfterLeaving = false;
            setTimeout(function () { if (!_this.hasDraggedOverAfterLeaving)
                _this.clearDropClasses(); }, 300);
        };
        this.onDrop = function (event) {
            event.preventDefault();
            var dropLocation = _this.getDropLocation(event);
            if (dropLocation == null)
                return;
            _this.clearDropClasses();
            if (!_this.isDraggingNodes) {
                _this.dropCallback(event, dropLocation, null);
                return false;
            }
            var children = _this.selectedNodes[0].parentElement.children;
            var orderedNodes = [];
            for (var i = 0; i < children.length; i++) {
                var child = children[i];
                if (_this.selectedNodes.indexOf(child) !== -1)
                    orderedNodes.push(child);
            }
            var reparent = (_this.dropCallback != null) ? _this.dropCallback(event, dropLocation, orderedNodes) : true;
            if (!reparent)
                return;
            var newParent;
            var referenceElt;
            switch (dropLocation.where) {
                case "inside":
                    if (!dropLocation.target.classList.contains("group"))
                        return;
                    newParent = dropLocation.target.nextSibling;
                    referenceElt = null;
                    break;
                case "below":
                    newParent = dropLocation.target.parentElement;
                    referenceElt = dropLocation.target.nextSibling;
                    if (referenceElt != null && referenceElt.tagName === "OL")
                        referenceElt = referenceElt.nextSibling;
                    break;
                case "above":
                    newParent = dropLocation.target.parentElement;
                    referenceElt = dropLocation.target;
                    break;
            }
            var draggedChildren;
            for (var _i = 0, orderedNodes_1 = orderedNodes; _i < orderedNodes_1.length; _i++) {
                var selectedNode = orderedNodes_1[_i];
                if (selectedNode.classList.contains("group")) {
                    draggedChildren = selectedNode.nextSibling;
                    draggedChildren.parentElement.removeChild(draggedChildren);
                }
                if (referenceElt === selectedNode) {
                    referenceElt = selectedNode.nextSibling;
                }
                selectedNode.parentElement.removeChild(selectedNode);
                newParent.insertBefore(selectedNode, referenceElt);
                referenceElt = selectedNode.nextSibling;
                if (draggedChildren != null) {
                    newParent.insertBefore(draggedChildren, referenceElt);
                    referenceElt = draggedChildren.nextSibling;
                }
            }
        };
        if (options == null)
            options = {};
        this.multipleSelection = (options.multipleSelection != null) ? options.multipleSelection : true;
        this.dragStartCallback = options.dragStartCallback;
        this.dropCallback = options.dropCallback;
        this.treeRoot = document.createElement("ol");
        this.treeRoot.tabIndex = 0;
        this.treeRoot.classList.add("tree");
        container.appendChild(this.treeRoot);
        this.selectedNodes = [];
        this.firstSelectedNode = null;
        this.treeRoot.addEventListener("click", this.onClick);
        this.treeRoot.addEventListener("dblclick", this.onDoubleClick);
        this.treeRoot.addEventListener("keydown", this.onKeyDown);
        container.addEventListener("keydown", function (event) {
            if (event.keyCode === 37 || event.keyCode === 39)
                event.preventDefault();
        });
        if (this.dragStartCallback != null) {
            this.treeRoot.addEventListener("dragstart", this.onDragStart);
            this.treeRoot.addEventListener("dragend", this.onDragEnd);
        }
        if (this.dropCallback != null) {
            this.treeRoot.addEventListener("dragover", this.onDragOver);
            this.treeRoot.addEventListener("dragleave", this.onDragLeave);
            this.treeRoot.addEventListener("drop", this.onDrop);
        }
    }
    TreeView.prototype.clearSelection = function () {
        for (var _i = 0, _a = this.selectedNodes; _i < _a.length; _i++) {
            var selectedNode = _a[_i];
            selectedNode.classList.remove("selected");
        }
        this.selectedNodes.length = 0;
        this.firstSelectedNode = null;
    };
    TreeView.prototype.addToSelection = function (element) {
        if (this.selectedNodes.indexOf(element) !== -1)
            return;
        this.selectedNodes.push(element);
        element.classList.add("selected");
        if (this.selectedNodes.length === 1)
            this.firstSelectedNode = element;
    };
    TreeView.prototype.scrollIntoView = function (element) {
        var ancestor = element.parentElement;
        while (ancestor != null && ancestor.className === "children") {
            ancestor.previousElementSibling.classList.remove("collapsed");
            ancestor = ancestor.parentElement;
        }
        var elementRect = element.getBoundingClientRect();
        var containerRect = this.treeRoot.parentElement.getBoundingClientRect();
        if (elementRect.top < containerRect.top)
            element.scrollIntoView(true);
        else if (elementRect.bottom > containerRect.bottom)
            element.scrollIntoView(false);
    };
    TreeView.prototype.clear = function () {
        this.treeRoot.innerHTML = "";
        this.selectedNodes.length = 0;
        this.firstSelectedNode = null;
        this.hasDraggedOverAfterLeaving = false;
        this.isDraggingNodes = false;
    };
    TreeView.prototype.append = function (element, type, parentGroupElement) {
        if (type !== "item" && type !== "group")
            throw new Error("Invalid type");
        var childrenElt;
        var siblingsElt;
        if (parentGroupElement != null) {
            if (parentGroupElement.tagName !== "LI" || !parentGroupElement.classList.contains("group"))
                throw new Error("Invalid parent group");
            siblingsElt = parentGroupElement.nextSibling;
        }
        else {
            siblingsElt = this.treeRoot;
        }
        if (!element.classList.contains(type)) {
            element.classList.add(type);
            if (this.dragStartCallback != null)
                element.draggable = true;
            if (type === "group") {
                var toggleElt = document.createElement("div");
                toggleElt.classList.add("toggle");
                element.insertBefore(toggleElt, element.firstChild);
                childrenElt = document.createElement("ol");
                childrenElt.classList.add("children");
            }
        }
        else if (type === "group") {
            childrenElt = element.nextSibling;
        }
        siblingsElt.appendChild(element);
        if (childrenElt != null)
            siblingsElt.appendChild(childrenElt);
        return element;
    };
    TreeView.prototype.insertBefore = function (element, type, referenceElement) {
        if (type !== "item" && type !== "group")
            throw new Error("Invalid type");
        if (referenceElement == null)
            throw new Error("A reference element is required");
        if (referenceElement.tagName !== "LI")
            throw new Error("Invalid reference element");
        var childrenElt;
        if (!element.classList.contains(type)) {
            element.classList.add(type);
            if (this.dragStartCallback != null)
                element.draggable = true;
            if (type === "group") {
                var toggleElt = document.createElement("div");
                toggleElt.classList.add("toggle");
                element.insertBefore(toggleElt, element.firstChild);
                childrenElt = document.createElement("ol");
                childrenElt.classList.add("children");
            }
        }
        else if (type === "group") {
            childrenElt = element.nextSibling;
        }
        referenceElement.parentElement.insertBefore(element, referenceElement);
        if (childrenElt != null)
            referenceElement.parentElement.insertBefore(childrenElt, element.nextSibling);
        return element;
    };
    TreeView.prototype.insertAt = function (element, type, index, parentElement) {
        var referenceElt;
        if (index != null) {
            referenceElt =
                (parentElement != null)
                    ? parentElement.nextSibling.querySelector(":scope > li:nth-of-type(" + (index + 1) + ")")
                    : this.treeRoot.querySelector(":scope > li:nth-of-type(" + (index + 1) + ")");
        }
        if (referenceElt != null)
            this.insertBefore(element, type, referenceElt);
        else
            this.append(element, type, parentElement);
    };
    TreeView.prototype.remove = function (element) {
        var selectedIndex = this.selectedNodes.indexOf(element);
        if (selectedIndex !== -1) {
            element.classList.remove("selected");
            this.selectedNodes.splice(selectedIndex, 1);
        }
        if (this.firstSelectedNode === element)
            this.firstSelectedNode = this.selectedNodes[0];
        if (element.classList.contains("group")) {
            var childrenElement = element.nextSibling;
            var removedSelectedNodes = [];
            for (var _i = 0, _a = this.selectedNodes; _i < _a.length; _i++) {
                var selectedNode = _a[_i];
                if (childrenElement.contains(selectedNode)) {
                    removedSelectedNodes.push(selectedNode);
                }
            }
            for (var _b = 0, removedSelectedNodes_1 = removedSelectedNodes; _b < removedSelectedNodes_1.length; _b++) {
                var removedSelectedNode = removedSelectedNodes_1[_b];
                removedSelectedNode.classList.remove("selected");
                this.selectedNodes.splice(this.selectedNodes.indexOf(removedSelectedNode), 1);
                if (this.firstSelectedNode === removedSelectedNode)
                    this.firstSelectedNode = this.selectedNodes[0];
            }
            element.parentElement.removeChild(childrenElement);
        }
        element.parentElement.removeChild(element);
    };
    // Returns whether the selection changed
    TreeView.prototype.updateSelection = function (event) {
        var selectionChanged = false;
        if ((!this.multipleSelection || (!event.shiftKey && !event.ctrlKey)) && this.selectedNodes.length > 0) {
            this.clearSelection();
            selectionChanged = true;
        }
        var ancestorElement = event.target;
        while (ancestorElement.tagName !== "LI" || (!ancestorElement.classList.contains("item") && !ancestorElement.classList.contains("group"))) {
            if (ancestorElement === this.treeRoot)
                return selectionChanged;
            ancestorElement = ancestorElement.parentElement;
        }
        var element = ancestorElement;
        if (this.selectedNodes.length > 0 && this.selectedNodes[0].parentElement !== element.parentElement) {
            return selectionChanged;
        }
        if (this.multipleSelection && event.shiftKey && this.selectedNodes.length > 0) {
            var startElement = this.firstSelectedNode;
            var elements = [];
            var inside = false;
            for (var i = 0; i < element.parentElement.children.length; i++) {
                var child = element.parentElement.children[i];
                if (child === startElement || child === element) {
                    if (inside || startElement === element) {
                        elements.push(child);
                        break;
                    }
                    inside = true;
                }
                if (inside && child.tagName === "LI")
                    elements.push(child);
            }
            this.clearSelection();
            this.selectedNodes = elements;
            this.firstSelectedNode = startElement;
            for (var _i = 0, _a = this.selectedNodes; _i < _a.length; _i++) {
                var selectedNode = _a[_i];
                selectedNode.classList.add("selected");
            }
            return true;
        }
        var index;
        if (event.ctrlKey && (index = this.selectedNodes.indexOf(element)) !== -1) {
            this.selectedNodes.splice(index, 1);
            element.classList.remove("selected");
            if (this.firstSelectedNode === element) {
                this.firstSelectedNode = this.selectedNodes[0];
            }
            return true;
        }
        this.addToSelection(element);
        return true;
    };
    TreeView.prototype.moveVertically = function (offset) {
        // TODO: this.focusedNode;
        var node = this.firstSelectedNode;
        if (offset === -1) {
            if (node.previousElementSibling != null) {
                var target = node.previousElementSibling;
                while (target.classList.contains("children")) {
                    if (!target.previousElementSibling.classList.contains("collapsed") && target.childElementCount > 0)
                        target = target.lastElementChild;
                    else
                        target = target.previousElementSibling;
                }
                node = target;
            }
            else if (node.parentElement.classList.contains("children"))
                node = node.parentElement.previousElementSibling;
            else
                return;
        }
        else {
            var walkUp = false;
            if (node.classList.contains("group")) {
                if (!node.classList.contains("collapsed") && node.nextElementSibling.childElementCount > 0)
                    node = node.nextElementSibling.firstElementChild;
                else if (node.nextElementSibling.nextElementSibling != null)
                    node = node.nextElementSibling.nextElementSibling;
                else
                    walkUp = true;
            }
            else {
                if (node.nextElementSibling != null)
                    node = node.nextElementSibling;
                else
                    walkUp = true;
            }
            if (walkUp) {
                if (node.parentElement.classList.contains("children")) {
                    var target = node.parentElement;
                    while (target.nextElementSibling == null) {
                        target = target.parentElement;
                        if (!target.classList.contains("children"))
                            return;
                    }
                    node = target.nextElementSibling;
                }
                else
                    return;
            }
        }
        if (node == null)
            return;
        this.clearSelection();
        this.addToSelection(node);
        this.scrollIntoView(node);
        this.emit("selectionChange");
    };
    ;
    TreeView.prototype.getDropLocation = function (event) {
        var element = event.target;
        if (element.tagName === "OL" && element.classList.contains("children")) {
            element = element.parentElement;
        }
        if (element === this.treeRoot) {
            element = element.lastChild;
            if (element == null)
                return { target: this.treeRoot, where: "inside" };
            if (element.tagName === "OL")
                element = element.previousSibling;
            return { target: element, where: "below" };
        }
        while (element.tagName !== "LI" || (!element.classList.contains("item") && !element.classList.contains("group"))) {
            if (element === this.treeRoot)
                return null;
            element = element.parentElement;
        }
        var where = this.getInsertionPoint(element, event.pageY);
        if (where === "below") {
            if (element.classList.contains("item") && element.nextSibling != null && element.nextSibling.tagName === "LI") {
                element = element.nextSibling;
                where = "above";
            }
            else if (element.classList.contains("group") && element.nextSibling.nextSibling != null && element.nextSibling.nextSibling.tagName === "LI") {
                element = element.nextSibling.nextSibling;
                where = "above";
            }
        }
        return { target: element, where: where };
    };
    TreeView.prototype.getInsertionPoint = function (element, y) {
        var rect = element.getBoundingClientRect();
        var offset = y - rect.top;
        if (offset < rect.height / 4)
            return "above";
        if (offset > rect.height * 3 / 4)
            return (element.classList.contains("group") && element.nextSibling.childElementCount > 0) ? "inside" : "below";
        return element.classList.contains("item") ? "below" : "inside";
    };
    TreeView.prototype.clearDropClasses = function () {
        var dropAbove = this.treeRoot.querySelector(".drop-above");
        if (dropAbove != null)
            dropAbove.classList.remove("drop-above");
        var dropInside = this.treeRoot.querySelector(".drop-inside");
        if (dropInside != null)
            dropInside.classList.remove("drop-inside");
        var dropBelow = this.treeRoot.querySelector(".drop-below");
        if (dropBelow != null)
            dropBelow.classList.remove("drop-below");
        // For the rare case where we're dropping a foreign item into an empty tree view
        this.treeRoot.classList.remove("drop-inside");
    };
    return TreeView;
}(events_1.EventEmitter));
module.exports = TreeView;

},{"events":1}]},{},[2])(2)
});
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"events":2}],2:[function(require,module,exports){
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

},{}],3:[function(require,module,exports){
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
},{"events":2}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class TileSet {
    constructor(data) {
        this.data = data;
    }
}
exports.default = TileSet;

},{}],5:[function(require,module,exports){
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
            width: 1, height: 1,
            direction: -1, orthographicScale: 10,
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
    setIsLayerActive(active) { if (this.mesh != null)
        this.mesh.visible = active; }
}
/* tslint:disable:variable-name */
TileSetRenderer.Updater = TileSetRendererUpdater_1.default;
exports.default = TileSetRenderer;

},{"./TileSetRendererUpdater":6}],6:[function(require,module,exports){
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

},{"./TileSet":4}],7:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TileSetRenderer_1 = require("../../components/TileSetRenderer");
const TileSetRendererUpdater_1 = require("../../components/TileSetRendererUpdater");
const TreeView = require("dnd-tree-view");
const ResizeHandle = require("resize-handle");
let data;
let ui = {};
let socket;
let hasStarted = false;
let isTabActive = true;
let animationFrame;
window.addEventListener("message", (event) => {
    if (event.data.type === "deactivate" || event.data.type === "activate") {
        isTabActive = event.data.type === "activate";
        onChangeActive();
    }
});
function onChangeActive() {
    const stopRendering = !hasStarted || !isTabActive;
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
function start() {
    socket = SupClient.connect(SupClient.query.project);
    socket.on("connect", onConnected);
    socket.on("disconnect", SupClient.onDisconnected);
    // Drawing
    ui.gameInstance = new SupEngine.GameInstance(document.querySelector("canvas"));
    ui.gameInstance.threeRenderer.setClearColor(0xbbbbbb);
    const cameraActor = new SupEngine.Actor(ui.gameInstance, "Camera");
    cameraActor.setLocalPosition(new SupEngine.THREE.Vector3(0, 0, 10));
    ui.cameraComponent = new SupEngine.componentClasses["Camera"](cameraActor);
    ui.cameraComponent.setOrthographicMode(true);
    ui.cameraControls = new SupEngine.editorComponentClasses["Camera2DControls"](cameraActor, ui.cameraComponent, { zoomSpeed: 1.5, zoomMin: 0.1, zoomMax: 10000 }, () => { data.tileSetUpdater.tileSetRenderer.gridRenderer.setOrthgraphicScale(ui.cameraComponent.orthographicScale); });
    // Sidebar
    new ResizeHandle(document.querySelector(".sidebar"), "right");
    const fileSelect = document.querySelector("input.file-select");
    fileSelect.addEventListener("change", onFileSelectChange);
    document.querySelector("button.upload").addEventListener("click", () => { fileSelect.click(); });
    document.querySelector("button.download").addEventListener("click", onDownloadTileset);
    ui.gridWidthInput = document.querySelector("input.grid-width");
    ui.gridWidthInput.addEventListener("change", () => { data.projectClient.editAsset(SupClient.query.asset, "setProperty", "grid.width", parseInt(ui.gridWidthInput.value, 10)); });
    ui.gridHeightInput = document.querySelector("input.grid-height");
    ui.gridHeightInput.addEventListener("change", () => { data.projectClient.editAsset(SupClient.query.asset, "setProperty", "grid.height", parseInt(ui.gridHeightInput.value, 10)); });
    ui.selectedTileInput = document.querySelector("input.selected-tile-number");
    // Tile properties
    ui.propertiesTreeView = new TreeView(document.querySelector(".properties-tree-view"), { multipleSelection: false });
    ui.propertiesTreeView.on("selectionChange", onPropertySelect);
    document.querySelector("button.new-property").addEventListener("click", onNewPropertyClick);
    document.querySelector("button.rename-property").addEventListener("click", onRenamePropertyClick);
    document.querySelector("button.delete-property").addEventListener("click", onDeletePropertyClick);
    hasStarted = true;
    onChangeActive();
}
// Network callbacks
const onEditCommands = {};
function onConnected() {
    data = {};
    data.projectClient = new SupClient.ProjectClient(socket, { subEntries: false });
    const tileSetActor = new SupEngine.Actor(ui.gameInstance, "Tile Set");
    const tileSetRenderer = new TileSetRenderer_1.default(tileSetActor);
    const config = { tileSetAssetId: SupClient.query.asset };
    const subscriber = {
        onAssetReceived: onAssetReceived,
        onAssetEdited: (assetId, command, ...args) => { if (onEditCommands[command] != null)
            onEditCommands[command](...args); },
        onAssetTrashed: SupClient.onAssetTrashed
    };
    data.tileSetUpdater = new TileSetRendererUpdater_1.default(data.projectClient, tileSetRenderer, config, subscriber);
}
function onAssetReceived(err, asset) {
    setupProperty("grid-width", data.tileSetUpdater.tileSetAsset.pub.grid.width);
    setupProperty("grid-height", data.tileSetUpdater.tileSetAsset.pub.grid.height);
    selectTile({ x: 0, y: 0 });
}
onEditCommands["upload"] = () => {
    selectTile({ x: 0, y: 0 });
};
onEditCommands["setProperty"] = (key, value) => {
    setupProperty(key, value);
    selectTile({ x: 0, y: 0 });
};
onEditCommands["addTileProperty"] = (tile, name) => {
    if (tile.x !== data.selectedTile.x && tile.y !== data.selectedTile.y)
        return;
    addTileProperty(name);
};
onEditCommands["renameTileProperty"] = (tile, name, newName) => {
    if (tile.x !== data.selectedTile.x && tile.y !== data.selectedTile.y)
        return;
    const liElt = ui.propertiesTreeView.treeRoot.querySelector(`li[data-name="${name}"]`);
    liElt.querySelector(".name").textContent = newName;
    liElt.dataset["name"] = newName;
    const properties = Object.keys(data.tileSetUpdater.tileSetAsset.pub.tileProperties[`${tile.x}_${tile.y}`]);
    properties.sort();
    ui.propertiesTreeView.remove(liElt);
    ui.propertiesTreeView.insertAt(liElt, "item", properties.indexOf(newName));
    if (ui.selectedProperty === name) {
        ui.selectedProperty = newName;
        ui.propertiesTreeView.addToSelection(liElt);
    }
};
onEditCommands["deleteTileProperty"] = (tile, name) => {
    if (tile.x !== data.selectedTile.x && tile.y !== data.selectedTile.y)
        return;
    ui.propertiesTreeView.remove(ui.propertiesTreeView.treeRoot.querySelector(`li[data-name="${name}"]`));
};
onEditCommands["editTileProperty"] = (tile, name, value) => {
    if (tile.x !== data.selectedTile.x && tile.y !== data.selectedTile.y)
        return;
    const liElt = ui.propertiesTreeView.treeRoot.querySelector(`li[data-name="${name}"]`);
    liElt.querySelector(".value").value = value;
};
function setupProperty(key, value) {
    switch (key) {
        case "grid-width":
            ui.gridWidthInput.value = value;
            break;
        case "grid-height":
            ui.gridHeightInput.value = value;
            break;
    }
}
function selectTile(tile) {
    data.selectedTile = tile;
    const pub = data.tileSetUpdater.tileSetAsset.pub;
    const tilePerRow = (pub.texture != null) ? Math.floor(pub.texture.image.width / pub.grid.width) : 1;
    ui.selectedTileInput.value = tile.x + tile.y * tilePerRow;
    while (ui.propertiesTreeView.treeRoot.children.length !== 0) {
        ui.propertiesTreeView.remove(ui.propertiesTreeView.treeRoot.children[0]);
    }
    if (pub.tileProperties[`${tile.x}_${tile.y}`] == null)
        return;
    const properties = Object.keys(pub.tileProperties[`${tile.x}_${tile.y}`]);
    properties.sort();
    for (const propertyName of properties) {
        addTileProperty(propertyName, pub.tileProperties[`${tile.x}_${tile.y}`][propertyName]);
    }
}
function addTileProperty(name, value = "") {
    const liElt = document.createElement("li");
    liElt.dataset["name"] = name;
    const nameSpan = document.createElement("span");
    nameSpan.className = "name";
    nameSpan.textContent = name;
    liElt.appendChild(nameSpan);
    const valueInput = document.createElement("input");
    valueInput.type = "string";
    valueInput.className = "value";
    valueInput.value = value;
    valueInput.addEventListener("input", () => { data.projectClient.editAsset(SupClient.query.asset, "editTileProperty", data.selectedTile, ui.selectedProperty, valueInput.value); });
    liElt.appendChild(valueInput);
    ui.propertiesTreeView.insertAt(liElt, "item");
}
// User interface
function onFileSelectChange(event) {
    if (event.target.files.length === 0)
        return;
    const reader = new FileReader;
    reader.onload = (event) => { data.projectClient.editAsset(SupClient.query.asset, "upload", reader.result); };
    reader.readAsArrayBuffer(event.target.files[0]);
    event.target.parentElement.reset();
}
function onDownloadTileset(event) {
    function triggerDownload(name) {
        const anchor = document.createElement("a");
        document.body.appendChild(anchor);
        anchor.style.display = "none";
        anchor.href = data.tileSetUpdater.tileSetAsset.url;
        // Not yet supported in IE and Safari (http://caniuse.com/#feat=download)
        anchor.download = `${name}.png`;
        anchor.click();
        document.body.removeChild(anchor);
    }
    const options = {
        initialValue: SupClient.i18n.t("tileSetEditor:texture.downloadInitialValue"),
        validationLabel: SupClient.i18n.t("common:actions.download")
    };
    if (SupApp != null) {
        triggerDownload(options.initialValue);
    }
    else {
        new SupClient.Dialogs.PromptDialog(SupClient.i18n.t("tileSetEditor:texture.downloadPrompt"), options, (name) => {
            if (name == null)
                return;
            triggerDownload(name);
        });
    }
}
function onPropertySelect() {
    if (ui.propertiesTreeView.selectedNodes.length === 1) {
        ui.selectedProperty = ui.propertiesTreeView.selectedNodes[0].dataset["name"];
        document.querySelector("button.rename-property").disabled = false;
        document.querySelector("button.delete-property").disabled = false;
    }
    else {
        ui.selectedProperty = null;
        document.querySelector("button.rename-property").disabled = true;
        document.querySelector("button.delete-property").disabled = true;
    }
}
function onNewPropertyClick() {
    const options = {
        initialValue: SupClient.i18n.t("tileSetEditor:newPropertyInitialValue"),
        validationLabel: SupClient.i18n.t("common:actions.create")
    };
    new SupClient.Dialogs.PromptDialog(SupClient.i18n.t("tileSetEditor:newPropertyPrompt"), options, (name) => {
        if (name == null)
            return;
        data.projectClient.editAsset(SupClient.query.asset, "addTileProperty", data.selectedTile, name, () => {
            ui.selectedProperty = name;
            ui.propertiesTreeView.clearSelection();
            const liElt = ui.propertiesTreeView.treeRoot.querySelector(`li[data-name="${ui.selectedProperty}"]`);
            ui.propertiesTreeView.addToSelection(liElt);
            liElt.querySelector("input").focus();
            document.querySelector("button.rename-property").disabled = false;
            document.querySelector("button.delete-property").disabled = false;
        });
    });
}
function onRenamePropertyClick() {
    if (ui.propertiesTreeView.selectedNodes.length !== 1)
        return;
    const options = {
        initialValue: ui.selectedProperty,
        validationLabel: SupClient.i18n.t("common:actions.rename")
    };
    new SupClient.Dialogs.PromptDialog(SupClient.i18n.t("tileSetEditor:renamePropertyPrompt"), options, (newName) => {
        if (newName == null)
            return;
        data.projectClient.editAsset(SupClient.query.asset, "renameTileProperty", data.selectedTile, ui.selectedProperty, newName);
    });
}
function onDeletePropertyClick() {
    if (ui.selectedProperty == null)
        return;
    const confirmLabel = SupClient.i18n.t("tileSetEditor:deletePropertyConfirm");
    const validationLabel = SupClient.i18n.t("common:actions.delete");
    new SupClient.Dialogs.ConfirmDialog(confirmLabel, { validationLabel }, (confirm) => {
        if (!confirm)
            return;
        data.projectClient.editAsset(SupClient.query.asset, "deleteTileProperty", data.selectedTile, ui.selectedProperty);
    });
}
// Drawing
let lastTimestamp = 0;
let accumulatedTime = 0;
function tick(timestamp = 0) {
    animationFrame = requestAnimationFrame(tick);
    accumulatedTime += timestamp - lastTimestamp;
    lastTimestamp = timestamp;
    const { updates, timeLeft } = ui.gameInstance.tick(accumulatedTime, handleTilesetArea);
    accumulatedTime = timeLeft;
    if (updates > 0)
        ui.gameInstance.draw();
}
function handleTilesetArea() {
    if (data == null || data.tileSetUpdater.tileSetAsset == null)
        return;
    const pub = data.tileSetUpdater.tileSetAsset.pub;
    if (pub.texture == null)
        return;
    if (ui.gameInstance.input.mouseButtons[0].wasJustReleased) {
        const mousePosition = ui.gameInstance.input.mousePosition;
        const [mouseX, mouseY] = ui.cameraControls.getScenePosition(mousePosition.x, mousePosition.y);
        const x = Math.floor(mouseX);
        const ratio = data.tileSetUpdater.tileSetAsset.pub.grid.width / data.tileSetUpdater.tileSetAsset.pub.grid.height;
        const y = Math.floor(mouseY * ratio);
        if (x >= 0 && x < pub.texture.image.width / pub.grid.width &&
            y >= 0 && y < pub.texture.image.height / pub.grid.height &&
            (x !== data.selectedTile.x || y !== data.selectedTile.y)) {
            data.tileSetUpdater.tileSetRenderer.select(x, y);
            selectTile({ x, y });
        }
    }
}
SupClient.i18n.load([{ root: `${window.location.pathname}/../..`, name: "tileSetEditor" }], start);

},{"../../components/TileSetRenderer":5,"../../components/TileSetRendererUpdater":6,"dnd-tree-view":1,"resize-handle":3}]},{},[7]);
