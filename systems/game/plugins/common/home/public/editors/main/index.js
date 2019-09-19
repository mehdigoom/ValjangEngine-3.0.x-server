(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
(function (process){
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

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require('_process'))
},{"_process":2}],2:[function(require,module,exports){
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
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
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
} ())
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
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
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
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
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
    while(len) {
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

process.nextTick = function (fun) {
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
Item.prototype.run = function () {
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

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
require("./links");
let data;
let socket;
const ui = {
    chatHistoryContainer: document.querySelector(".chat"),
    chatHistory: document.querySelector(".chat ol"),
    roomUsers: document.querySelector(".members ul")
};
function start() {
    socket = SupClient.connect(SupClient.query.project);
    socket.on("connect", onConnected);
    socket.on("disconnect", SupClient.onDisconnected);
    // Chat
    document.querySelector(".chat-input textarea").addEventListener("keydown", onChatInputKeyDown);
    document.querySelector(".chat").addEventListener("click", onLinkClicked);
}
function onConnected() {
    data = {};
    // FIXME Add support in ProjectClient?
    socket.emit("sub", "rooms", "home", onRoomReceived);
    socket.on("edit:rooms", onRoomEdited);
}
function onRoomReceived(err, room) {
    data.room = new SupCore.Data.Room(room);
    for (const roomUser of data.room.pub.users)
        appendRoomUser(roomUser);
    for (const entry of data.room.pub.history)
        appendHistoryEntry(entry);
    scrollToBottom();
}
let onRoomCommands = {};
function onRoomEdited(id, command, ...args) {
    Object.getPrototypeOf(data.room)[`client_${command}`].apply(data.room, args);
    if (onRoomCommands[command] != null)
        onRoomCommands[command].apply(data.room, args);
}
function scrollToBottom() {
    setTimeout(() => { ui.chatHistoryContainer.scrollTop = ui.chatHistoryContainer.scrollHeight; }, 0);
}
// Firefox 41 loses the scroll position when going back to the tab
// so we'll manually restore it when the tab is activated
let savedScrollTop = 0;
ui.chatHistoryContainer.addEventListener("scroll", (event) => {
    savedScrollTop = ui.chatHistoryContainer.scrollTop;
});
window.addEventListener("message", (event) => {
    if (event.data.type === "activate") {
        setTimeout(() => { ui.chatHistoryContainer.scrollTop = savedScrollTop; }, 0);
    }
});
const appendDaySeparator = (date) => {
    const separatorElt = document.createElement("li");
    separatorElt.className = "day-separator";
    separatorElt.appendChild(document.createElement("hr"));
    const dateDiv = document.createElement("div");
    separatorElt.appendChild(dateDiv);
    const dateInnerDiv = document.createElement("div");
    dateInnerDiv.textContent = date.toDateString();
    dateDiv.appendChild(dateInnerDiv);
    ui.chatHistory.appendChild(separatorElt);
};
let previousDay;
const addressRegex = new RegExp("^(http[s]?:\\/\\/(www\\.)?|ftp:\\/\\/(www\\.)?|www\\.){1}([0-9A-Za-z-\\.@:%_\+~#=]+)+((\\.[a-zA-Z]{2,3})+)(/(.)*)?(\\?(.)*)?");
function appendHistoryEntry(entry) {
    const date = new Date(entry.timestamp);
    const day = date.toDateString();
    if (previousDay !== day) {
        appendDaySeparator(date);
        previousDay = day;
    }
    const entryElt = document.createElement("li");
    const timestampSpan = document.createElement("span");
    timestampSpan.className = "timestamp";
    const time = `00${date.getHours()}`.slice(-2) + ":" + `00${date.getMinutes()}`.slice(-2);
    timestampSpan.textContent = time;
    entryElt.appendChild(timestampSpan);
    const authorSpan = document.createElement("span");
    authorSpan.className = "author";
    authorSpan.textContent = entry.author;
    entryElt.appendChild(authorSpan);
    const addressTest = addressRegex.exec(entry.text);
    if (addressTest != null) {
        const beforeAddress = entry.text.slice(0, addressTest.index);
        const beforeTextSpan = document.createElement("span");
        beforeTextSpan.className = "text";
        beforeTextSpan.textContent = `: ${beforeAddress}`;
        entryElt.appendChild(beforeTextSpan);
        const addressTextLink = document.createElement("a");
        addressTextLink.className = "text";
        addressTextLink.textContent = addressTest[0];
        addressTextLink.href = addressTest[0];
        entryElt.appendChild(addressTextLink);
        const afterAddress = entry.text.slice(addressTest.index + addressTest[0].length);
        const afterTextSpan = document.createElement("span");
        afterTextSpan.className = "text";
        afterTextSpan.textContent = afterAddress;
        entryElt.appendChild(afterTextSpan);
    }
    else {
        const textSpan = document.createElement("span");
        textSpan.className = "text";
        textSpan.textContent = `: ${entry.text}`;
        entryElt.appendChild(textSpan);
    }
    ui.chatHistory.appendChild(entryElt);
}
onRoomCommands.appendMessage = (entry) => {
    if (window.parent != null)
        window.parent.postMessage({ type: "chat", content: `${entry.author}: ${entry.text}` }, window.location.origin);
    appendHistoryEntry(entry);
    scrollToBottom();
};
function appendRoomUser(roomUser) {
    const roomUserElt = document.createElement("li");
    roomUserElt.dataset["userId"] = roomUser.id;
    roomUserElt.textContent = roomUser.id;
    ui.roomUsers.appendChild(roomUserElt);
}
onRoomCommands.join = (roomUser) => {
    if (roomUser.connectionCount === 1)
        appendRoomUser(roomUser);
};
onRoomCommands.leave = (roomUserId) => {
    if (data.room.users.byId[roomUserId] == null) {
        const roomUserElt = ui.roomUsers.querySelector(`li[data-user-id=${roomUserId}]`);
        roomUserElt.parentElement.removeChild(roomUserElt);
    }
};
function onChatInputKeyDown(event) {
    if (event.keyCode !== 13 || event.shiftKey)
        return;
    event.preventDefault();
    if (!socket.connected)
        return;
    socket.emit("edit:rooms", "home", "appendMessage", this.value, (err) => {
        if (err != null) {
            new SupClient.Dialogs.InfoDialog(err);
            return;
        }
    });
    this.value = "";
}
function onLinkClicked(event) {
    const anchorElt = event.target;
    if (anchorElt.tagName === "A") {
        event.preventDefault();
        if (SupApp != null)
            SupApp.openLink(anchorElt.href);
        else
            window.open(anchorElt.href, "_blank");
    }
}
SupClient.i18n.load([{ root: path.join(window.location.pathname, "../.."), name: "home" }], start);

},{"./links":4,"path":1}],4:[function(require,module,exports){
if (SupApp != null) {
    document.querySelector(".sidebar .links").addEventListener("click", (event) => {
        if (event.target.tagName !== "A")
            return;
        event.preventDefault();
        SupApp.openLink(event.target.href);
    });
}

},{}]},{},[3]);
