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
        (function(process, global, setImmediate) {
            /*!
             * async
             * https://github.com/caolan/async
             *
             * Copyright 2010-2014 Caolan McMahon
             * Released under the MIT license
             */
            (function() {

                var async = {};

                function noop() {}

                function identity(v) {
                    return v;
                }

                function toBool(v) {
                    return !!v;
                }

                function notId(v) {
                    return !v;
                }

                // global on the server, window in the browser
                var previous_async;

                // Establish the root object, `window` (`self`) in the browser, `global`
                // on the server, or `this` in some virtual machines. We use `self`
                // instead of `window` for `WebWorker` support.
                var root = typeof self === 'object' && self.self === self && self ||
                    typeof global === 'object' && global.global === global && global ||
                    this;

                if (root != null) {
                    previous_async = root.async;
                }

                async.noConflict = function() {
                    root.async = previous_async;
                    return async;
                };

                function only_once(fn) {
                    return function() {
                        if (fn === null) throw new Error("Callback was already called.");
                        fn.apply(this, arguments);
                        fn = null;
                    };
                }

                function _once(fn) {
                    return function() {
                        if (fn === null) return;
                        fn.apply(this, arguments);
                        fn = null;
                    };
                }

                //// cross-browser compatiblity functions ////

                var _toString = Object.prototype.toString;

                var _isArray = Array.isArray || function(obj) {
                    return _toString.call(obj) === '[object Array]';
                };

                // Ported from underscore.js isObject
                var _isObject = function(obj) {
                    var type = typeof obj;
                    return type === 'function' || type === 'object' && !!obj;
                };

                function _isArrayLike(arr) {
                    return _isArray(arr) || (
                        // has a positive integer length property
                        typeof arr.length === "number" &&
                        arr.length >= 0 &&
                        arr.length % 1 === 0
                    );
                }

                function _arrayEach(arr, iterator) {
                    var index = -1,
                        length = arr.length;

                    while (++index < length) {
                        iterator(arr[index], index, arr);
                    }
                }

                function _map(arr, iterator) {
                    var index = -1,
                        length = arr.length,
                        result = Array(length);

                    while (++index < length) {
                        result[index] = iterator(arr[index], index, arr);
                    }
                    return result;
                }

                function _range(count) {
                    return _map(Array(count), function(v, i) { return i; });
                }

                function _reduce(arr, iterator, memo) {
                    _arrayEach(arr, function(x, i, a) {
                        memo = iterator(memo, x, i, a);
                    });
                    return memo;
                }

                function _forEachOf(object, iterator) {
                    _arrayEach(_keys(object), function(key) {
                        iterator(object[key], key);
                    });
                }

                function _indexOf(arr, item) {
                    for (var i = 0; i < arr.length; i++) {
                        if (arr[i] === item) return i;
                    }
                    return -1;
                }

                var _keys = Object.keys || function(obj) {
                    var keys = [];
                    for (var k in obj) {
                        if (obj.hasOwnProperty(k)) {
                            keys.push(k);
                        }
                    }
                    return keys;
                };

                function _keyIterator(coll) {
                    var i = -1;
                    var len;
                    var keys;
                    if (_isArrayLike(coll)) {
                        len = coll.length;
                        return function next() {
                            i++;
                            return i < len ? i : null;
                        };
                    } else {
                        keys = _keys(coll);
                        len = keys.length;
                        return function next() {
                            i++;
                            return i < len ? keys[i] : null;
                        };
                    }
                }

                // Similar to ES6's rest param (http://ariya.ofilabs.com/2013/03/es6-and-rest-parameter.html)
                // This accumulates the arguments passed into an array, after a given index.
                // From underscore.js (https://github.com/jashkenas/underscore/pull/2140).
                function _restParam(func, startIndex) {
                    startIndex = startIndex == null ? func.length - 1 : +startIndex;
                    return function() {
                        var length = Math.max(arguments.length - startIndex, 0);
                        var rest = Array(length);
                        for (var index = 0; index < length; index++) {
                            rest[index] = arguments[index + startIndex];
                        }
                        switch (startIndex) {
                            case 0:
                                return func.call(this, rest);
                            case 1:
                                return func.call(this, arguments[0], rest);
                        }
                        // Currently unused but handle cases outside of the switch statement:
                        // var args = Array(startIndex + 1);
                        // for (index = 0; index < startIndex; index++) {
                        //     args[index] = arguments[index];
                        // }
                        // args[startIndex] = rest;
                        // return func.apply(this, args);
                    };
                }

                function _withoutIndex(iterator) {
                    return function(value, index, callback) {
                        return iterator(value, callback);
                    };
                }

                //// exported async module functions ////

                //// nextTick implementation with browser-compatible fallback ////

                // capture the global reference to guard against fakeTimer mocks
                var _setImmediate = typeof setImmediate === 'function' && setImmediate;

                var _delay = _setImmediate ? function(fn) {
                    // not a direct alias for IE10 compatibility
                    _setImmediate(fn);
                } : function(fn) {
                    setTimeout(fn, 0);
                };

                if (typeof process === 'object' && typeof process.nextTick === 'function') {
                    async.nextTick = process.nextTick;
                } else {
                    async.nextTick = _delay;
                }
                async.setImmediate = _setImmediate ? _delay : async.nextTick;


                async.forEach =
                    async.each = function(arr, iterator, callback) {
                        return async.eachOf(arr, _withoutIndex(iterator), callback);
                    };

                async.forEachSeries =
                    async.eachSeries = function(arr, iterator, callback) {
                        return async.eachOfSeries(arr, _withoutIndex(iterator), callback);
                    };


                async.forEachLimit =
                    async.eachLimit = function(arr, limit, iterator, callback) {
                        return _eachOfLimit(limit)(arr, _withoutIndex(iterator), callback);
                    };

                async.forEachOf =
                    async.eachOf = function(object, iterator, callback) {
                        callback = _once(callback || noop);
                        object = object || [];

                        var iter = _keyIterator(object);
                        var key, completed = 0;

                        while ((key = iter()) != null) {
                            completed += 1;
                            iterator(object[key], key, only_once(done));
                        }

                        if (completed === 0) callback(null);

                        function done(err) {
                            completed--;
                            if (err) {
                                callback(err);
                            }
                            // Check key is null in case iterator isn't exhausted
                            // and done resolved synchronously.
                            else if (key === null && completed <= 0) {
                                callback(null);
                            }
                        }
                    };

                async.forEachOfSeries =
                    async.eachOfSeries = function(obj, iterator, callback) {
                        callback = _once(callback || noop);
                        obj = obj || [];
                        var nextKey = _keyIterator(obj);
                        var key = nextKey();

                        function iterate() {
                            var sync = true;
                            if (key === null) {
                                return callback(null);
                            }
                            iterator(obj[key], key, only_once(function(err) {
                                if (err) {
                                    callback(err);
                                } else {
                                    key = nextKey();
                                    if (key === null) {
                                        return callback(null);
                                    } else {
                                        if (sync) {
                                            async.setImmediate(iterate);
                                        } else {
                                            iterate();
                                        }
                                    }
                                }
                            }));
                            sync = false;
                        }
                        iterate();
                    };



                async.forEachOfLimit =
                    async.eachOfLimit = function(obj, limit, iterator, callback) {
                        _eachOfLimit(limit)(obj, iterator, callback);
                    };

                function _eachOfLimit(limit) {

                    return function(obj, iterator, callback) {
                        callback = _once(callback || noop);
                        obj = obj || [];
                        var nextKey = _keyIterator(obj);
                        if (limit <= 0) {
                            return callback(null);
                        }
                        var done = false;
                        var running = 0;
                        var errored = false;

                        (function replenish() {
                            if (done && running <= 0) {
                                return callback(null);
                            }

                            while (running < limit && !errored) {
                                var key = nextKey();
                                if (key === null) {
                                    done = true;
                                    if (running <= 0) {
                                        callback(null);
                                    }
                                    return;
                                }
                                running += 1;
                                iterator(obj[key], key, only_once(function(err) {
                                    running -= 1;
                                    if (err) {
                                        callback(err);
                                        errored = true;
                                    } else {
                                        replenish();
                                    }
                                }));
                            }
                        })();
                    };
                }


                function doParallel(fn) {
                    return function(obj, iterator, callback) {
                        return fn(async.eachOf, obj, iterator, callback);
                    };
                }

                function doParallelLimit(fn) {
                    return function(obj, limit, iterator, callback) {
                        return fn(_eachOfLimit(limit), obj, iterator, callback);
                    };
                }

                function doSeries(fn) {
                    return function(obj, iterator, callback) {
                        return fn(async.eachOfSeries, obj, iterator, callback);
                    };
                }

                function _asyncMap(eachfn, arr, iterator, callback) {
                    callback = _once(callback || noop);
                    arr = arr || [];
                    var results = _isArrayLike(arr) ? [] : {};
                    eachfn(arr, function(value, index, callback) {
                        iterator(value, function(err, v) {
                            results[index] = v;
                            callback(err);
                        });
                    }, function(err) {
                        callback(err, results);
                    });
                }

                async.map = doParallel(_asyncMap);
                async.mapSeries = doSeries(_asyncMap);
                async.mapLimit = doParallelLimit(_asyncMap);

                // reduce only has a series version, as doing reduce in parallel won't
                // work in many situations.
                async.inject =
                    async.foldl =
                    async.reduce = function(arr, memo, iterator, callback) {
                        async.eachOfSeries(arr, function(x, i, callback) {
                            iterator(memo, x, function(err, v) {
                                memo = v;
                                callback(err);
                            });
                        }, function(err) {
                            callback(err, memo);
                        });
                    };

                async.foldr =
                    async.reduceRight = function(arr, memo, iterator, callback) {
                        var reversed = _map(arr, identity).reverse();
                        async.reduce(reversed, memo, iterator, callback);
                    };

                async.transform = function(arr, memo, iterator, callback) {
                    if (arguments.length === 3) {
                        callback = iterator;
                        iterator = memo;
                        memo = _isArray(arr) ? [] : {};
                    }

                    async.eachOf(arr, function(v, k, cb) {
                        iterator(memo, v, k, cb);
                    }, function(err) {
                        callback(err, memo);
                    });
                };

                function _filter(eachfn, arr, iterator, callback) {
                    var results = [];
                    eachfn(arr, function(x, index, callback) {
                        iterator(x, function(v) {
                            if (v) {
                                results.push({ index: index, value: x });
                            }
                            callback();
                        });
                    }, function() {
                        callback(_map(results.sort(function(a, b) {
                            return a.index - b.index;
                        }), function(x) {
                            return x.value;
                        }));
                    });
                }

                async.select =
                    async.filter = doParallel(_filter);

                async.selectLimit =
                    async.filterLimit = doParallelLimit(_filter);

                async.selectSeries =
                    async.filterSeries = doSeries(_filter);

                function _reject(eachfn, arr, iterator, callback) {
                    _filter(eachfn, arr, function(value, cb) {
                        iterator(value, function(v) {
                            cb(!v);
                        });
                    }, callback);
                }
                async.reject = doParallel(_reject);
                async.rejectLimit = doParallelLimit(_reject);
                async.rejectSeries = doSeries(_reject);

                function _createTester(eachfn, check, getResult) {
                    return function(arr, limit, iterator, cb) {
                        function done() {
                            if (cb) cb(getResult(false, void 0));
                        }

                        function iteratee(x, _, callback) {
                            if (!cb) return callback();
                            iterator(x, function(v) {
                                if (cb && check(v)) {
                                    cb(getResult(true, x));
                                    cb = iterator = false;
                                }
                                callback();
                            });
                        }
                        if (arguments.length > 3) {
                            eachfn(arr, limit, iteratee, done);
                        } else {
                            cb = iterator;
                            iterator = limit;
                            eachfn(arr, iteratee, done);
                        }
                    };
                }

                async.any =
                    async.some = _createTester(async.eachOf, toBool, identity);

                async.someLimit = _createTester(async.eachOfLimit, toBool, identity);

                async.all =
                    async.every = _createTester(async.eachOf, notId, notId);

                async.everyLimit = _createTester(async.eachOfLimit, notId, notId);

                function _findGetResult(v, x) {
                    return x;
                }
                async.detect = _createTester(async.eachOf, identity, _findGetResult);
                async.detectSeries = _createTester(async.eachOfSeries, identity, _findGetResult);
                async.detectLimit = _createTester(async.eachOfLimit, identity, _findGetResult);

                async.sortBy = function(arr, iterator, callback) {
                    async.map(arr, function(x, callback) {
                        iterator(x, function(err, criteria) {
                            if (err) {
                                callback(err);
                            } else {
                                callback(null, { value: x, criteria: criteria });
                            }
                        });
                    }, function(err, results) {
                        if (err) {
                            return callback(err);
                        } else {
                            callback(null, _map(results.sort(comparator), function(x) {
                                return x.value;
                            }));
                        }

                    });

                    function comparator(left, right) {
                        var a = left.criteria,
                            b = right.criteria;
                        return a < b ? -1 : a > b ? 1 : 0;
                    }
                };

                async.auto = function(tasks, concurrency, callback) {
                    if (typeof arguments[1] === 'function') {
                        // concurrency is optional, shift the args.
                        callback = concurrency;
                        concurrency = null;
                    }
                    callback = _once(callback || noop);
                    var keys = _keys(tasks);
                    var remainingTasks = keys.length;
                    if (!remainingTasks) {
                        return callback(null);
                    }
                    if (!concurrency) {
                        concurrency = remainingTasks;
                    }

                    var results = {};
                    var runningTasks = 0;

                    var hasError = false;

                    var listeners = [];

                    function addListener(fn) {
                        listeners.unshift(fn);
                    }

                    function removeListener(fn) {
                        var idx = _indexOf(listeners, fn);
                        if (idx >= 0) listeners.splice(idx, 1);
                    }

                    function taskComplete() {
                        remainingTasks--;
                        _arrayEach(listeners.slice(0), function(fn) {
                            fn();
                        });
                    }

                    addListener(function() {
                        if (!remainingTasks) {
                            callback(null, results);
                        }
                    });

                    _arrayEach(keys, function(k) {
                        if (hasError) return;
                        var task = _isArray(tasks[k]) ? tasks[k] : [tasks[k]];
                        var taskCallback = _restParam(function(err, args) {
                            runningTasks--;
                            if (args.length <= 1) {
                                args = args[0];
                            }
                            if (err) {
                                var safeResults = {};
                                _forEachOf(results, function(val, rkey) {
                                    safeResults[rkey] = val;
                                });
                                safeResults[k] = args;
                                hasError = true;

                                callback(err, safeResults);
                            } else {
                                results[k] = args;
                                async.setImmediate(taskComplete);
                            }
                        });
                        var requires = task.slice(0, task.length - 1);
                        // prevent dead-locks
                        var len = requires.length;
                        var dep;
                        while (len--) {
                            if (!(dep = tasks[requires[len]])) {
                                throw new Error('Has nonexistent dependency in ' + requires.join(', '));
                            }
                            if (_isArray(dep) && _indexOf(dep, k) >= 0) {
                                throw new Error('Has cyclic dependencies');
                            }
                        }

                        function ready() {
                            return runningTasks < concurrency && _reduce(requires, function(a, x) {
                                return (a && results.hasOwnProperty(x));
                            }, true) && !results.hasOwnProperty(k);
                        }
                        if (ready()) {
                            runningTasks++;
                            task[task.length - 1](taskCallback, results);
                        } else {
                            addListener(listener);
                        }

                        function listener() {
                            if (ready()) {
                                runningTasks++;
                                removeListener(listener);
                                task[task.length - 1](taskCallback, results);
                            }
                        }
                    });
                };



                async.retry = function(times, task, callback) {
                    var DEFAULT_TIMES = 5;
                    var DEFAULT_INTERVAL = 0;

                    var attempts = [];

                    var opts = {
                        times: DEFAULT_TIMES,
                        interval: DEFAULT_INTERVAL
                    };

                    function parseTimes(acc, t) {
                        if (typeof t === 'number') {
                            acc.times = parseInt(t, 10) || DEFAULT_TIMES;
                        } else if (typeof t === 'object') {
                            acc.times = parseInt(t.times, 10) || DEFAULT_TIMES;
                            acc.interval = parseInt(t.interval, 10) || DEFAULT_INTERVAL;
                        } else {
                            throw new Error('Unsupported argument type for \'times\': ' + typeof t);
                        }
                    }

                    var length = arguments.length;
                    if (length < 1 || length > 3) {
                        throw new Error('Invalid arguments - must be either (task), (task, callback), (times, task) or (times, task, callback)');
                    } else if (length <= 2 && typeof times === 'function') {
                        callback = task;
                        task = times;
                    }
                    if (typeof times !== 'function') {
                        parseTimes(opts, times);
                    }
                    opts.callback = callback;
                    opts.task = task;

                    function wrappedTask(wrappedCallback, wrappedResults) {
                        function retryAttempt(task, finalAttempt) {
                            return function(seriesCallback) {
                                task(function(err, result) {
                                    seriesCallback(!err || finalAttempt, { err: err, result: result });
                                }, wrappedResults);
                            };
                        }

                        function retryInterval(interval) {
                            return function(seriesCallback) {
                                setTimeout(function() {
                                    seriesCallback(null);
                                }, interval);
                            };
                        }

                        while (opts.times) {

                            var finalAttempt = !(opts.times -= 1);
                            attempts.push(retryAttempt(opts.task, finalAttempt));
                            if (!finalAttempt && opts.interval > 0) {
                                attempts.push(retryInterval(opts.interval));
                            }
                        }

                        async.series(attempts, function(done, data) {
                            data = data[data.length - 1];
                            (wrappedCallback || opts.callback)(data.err, data.result);
                        });
                    }

                    // If a callback is passed, run this as a controll flow
                    return opts.callback ? wrappedTask() : wrappedTask;
                };

                async.waterfall = function(tasks, callback) {
                    callback = _once(callback || noop);
                    if (!_isArray(tasks)) {
                        var err = new Error('First argument to waterfall must be an array of functions');
                        return callback(err);
                    }
                    if (!tasks.length) {
                        return callback();
                    }

                    function wrapIterator(iterator) {
                        return _restParam(function(err, args) {
                            if (err) {
                                callback.apply(null, [err].concat(args));
                            } else {
                                var next = iterator.next();
                                if (next) {
                                    args.push(wrapIterator(next));
                                } else {
                                    args.push(callback);
                                }
                                ensureAsync(iterator).apply(null, args);
                            }
                        });
                    }
                    wrapIterator(async.iterator(tasks))();
                };

                function _parallel(eachfn, tasks, callback) {
                    callback = callback || noop;
                    var results = _isArrayLike(tasks) ? [] : {};

                    eachfn(tasks, function(task, key, callback) {
                        task(_restParam(function(err, args) {
                            if (args.length <= 1) {
                                args = args[0];
                            }
                            results[key] = args;
                            callback(err);
                        }));
                    }, function(err) {
                        callback(err, results);
                    });
                }

                async.parallel = function(tasks, callback) {
                    _parallel(async.eachOf, tasks, callback);
                };

                async.parallelLimit = function(tasks, limit, callback) {
                    _parallel(_eachOfLimit(limit), tasks, callback);
                };

                async.series = function(tasks, callback) {
                    _parallel(async.eachOfSeries, tasks, callback);
                };

                async.iterator = function(tasks) {
                    function makeCallback(index) {
                        function fn() {
                            if (tasks.length) {
                                tasks[index].apply(null, arguments);
                            }
                            return fn.next();
                        }
                        fn.next = function() {
                            return (index < tasks.length - 1) ? makeCallback(index + 1) : null;
                        };
                        return fn;
                    }
                    return makeCallback(0);
                };

                async.apply = _restParam(function(fn, args) {
                    return _restParam(function(callArgs) {
                        return fn.apply(
                            null, args.concat(callArgs)
                        );
                    });
                });

                function _concat(eachfn, arr, fn, callback) {
                    var result = [];
                    eachfn(arr, function(x, index, cb) {
                        fn(x, function(err, y) {
                            result = result.concat(y || []);
                            cb(err);
                        });
                    }, function(err) {
                        callback(err, result);
                    });
                }
                async.concat = doParallel(_concat);
                async.concatSeries = doSeries(_concat);

                async.whilst = function(test, iterator, callback) {
                    callback = callback || noop;
                    if (test()) {
                        var next = _restParam(function(err, args) {
                            if (err) {
                                callback(err);
                            } else if (test.apply(this, args)) {
                                iterator(next);
                            } else {
                                callback.apply(null, [null].concat(args));
                            }
                        });
                        iterator(next);
                    } else {
                        callback(null);
                    }
                };

                async.doWhilst = function(iterator, test, callback) {
                    var calls = 0;
                    return async.whilst(function() {
                        return ++calls <= 1 || test.apply(this, arguments);
                    }, iterator, callback);
                };

                async.until = function(test, iterator, callback) {
                    return async.whilst(function() {
                        return !test.apply(this, arguments);
                    }, iterator, callback);
                };

                async.doUntil = function(iterator, test, callback) {
                    return async.doWhilst(iterator, function() {
                        return !test.apply(this, arguments);
                    }, callback);
                };

                async.during = function(test, iterator, callback) {
                    callback = callback || noop;

                    var next = _restParam(function(err, args) {
                        if (err) {
                            callback(err);
                        } else {
                            args.push(check);
                            test.apply(this, args);
                        }
                    });

                    var check = function(err, truth) {
                        if (err) {
                            callback(err);
                        } else if (truth) {
                            iterator(next);
                        } else {
                            callback(null);
                        }
                    };

                    test(check);
                };

                async.doDuring = function(iterator, test, callback) {
                    var calls = 0;
                    async.during(function(next) {
                        if (calls++ < 1) {
                            next(null, true);
                        } else {
                            test.apply(this, arguments);
                        }
                    }, iterator, callback);
                };

                function _queue(worker, concurrency, payload) {
                    if (concurrency == null) {
                        concurrency = 1;
                    } else if (concurrency === 0) {
                        throw new Error('Concurrency must not be zero');
                    }

                    function _insert(q, data, pos, callback) {
                        if (callback != null && typeof callback !== "function") {
                            throw new Error("task callback must be a function");
                        }
                        q.started = true;
                        if (!_isArray(data)) {
                            data = [data];
                        }
                        if (data.length === 0 && q.idle()) {
                            // call drain immediately if there are no tasks
                            return async.setImmediate(function() {
                                q.drain();
                            });
                        }
                        _arrayEach(data, function(task) {
                            var item = {
                                data: task,
                                callback: callback || noop
                            };

                            if (pos) {
                                q.tasks.unshift(item);
                            } else {
                                q.tasks.push(item);
                            }

                            if (q.tasks.length === q.concurrency) {
                                q.saturated();
                            }
                        });
                        async.setImmediate(q.process);
                    }

                    function _next(q, tasks) {
                        return function() {
                            workers -= 1;

                            var removed = false;
                            var args = arguments;
                            _arrayEach(tasks, function(task) {
                                _arrayEach(workersList, function(worker, index) {
                                    if (worker === task && !removed) {
                                        workersList.splice(index, 1);
                                        removed = true;
                                    }
                                });

                                task.callback.apply(task, args);
                            });
                            if (q.tasks.length + workers === 0) {
                                q.drain();
                            }
                            q.process();
                        };
                    }

                    var workers = 0;
                    var workersList = [];
                    var q = {
                        tasks: [],
                        concurrency: concurrency,
                        payload: payload,
                        saturated: noop,
                        empty: noop,
                        drain: noop,
                        started: false,
                        paused: false,
                        push: function(data, callback) {
                            _insert(q, data, false, callback);
                        },
                        kill: function() {
                            q.drain = noop;
                            q.tasks = [];
                        },
                        unshift: function(data, callback) {
                            _insert(q, data, true, callback);
                        },
                        process: function() {
                            while (!q.paused && workers < q.concurrency && q.tasks.length) {

                                var tasks = q.payload ?
                                    q.tasks.splice(0, q.payload) :
                                    q.tasks.splice(0, q.tasks.length);

                                var data = _map(tasks, function(task) {
                                    return task.data;
                                });

                                if (q.tasks.length === 0) {
                                    q.empty();
                                }
                                workers += 1;
                                workersList.push(tasks[0]);
                                var cb = only_once(_next(q, tasks));
                                worker(data, cb);
                            }
                        },
                        length: function() {
                            return q.tasks.length;
                        },
                        running: function() {
                            return workers;
                        },
                        workersList: function() {
                            return workersList;
                        },
                        idle: function() {
                            return q.tasks.length + workers === 0;
                        },
                        pause: function() {
                            q.paused = true;
                        },
                        resume: function() {
                            if (q.paused === false) { return; }
                            q.paused = false;
                            var resumeCount = Math.min(q.concurrency, q.tasks.length);
                            // Need to call q.process once per concurrent
                            // worker to preserve full concurrency after pause
                            for (var w = 1; w <= resumeCount; w++) {
                                async.setImmediate(q.process);
                            }
                        }
                    };
                    return q;
                }

                async.queue = function(worker, concurrency) {
                    var q = _queue(function(items, cb) {
                        worker(items[0], cb);
                    }, concurrency, 1);

                    return q;
                };

                async.priorityQueue = function(worker, concurrency) {

                    function _compareTasks(a, b) {
                        return a.priority - b.priority;
                    }

                    function _binarySearch(sequence, item, compare) {
                        var beg = -1,
                            end = sequence.length - 1;
                        while (beg < end) {
                            var mid = beg + ((end - beg + 1) >>> 1);
                            if (compare(item, sequence[mid]) >= 0) {
                                beg = mid;
                            } else {
                                end = mid - 1;
                            }
                        }
                        return beg;
                    }

                    function _insert(q, data, priority, callback) {
                        if (callback != null && typeof callback !== "function") {
                            throw new Error("task callback must be a function");
                        }
                        q.started = true;
                        if (!_isArray(data)) {
                            data = [data];
                        }
                        if (data.length === 0) {
                            // call drain immediately if there are no tasks
                            return async.setImmediate(function() {
                                q.drain();
                            });
                        }
                        _arrayEach(data, function(task) {
                            var item = {
                                data: task,
                                priority: priority,
                                callback: typeof callback === 'function' ? callback : noop
                            };

                            q.tasks.splice(_binarySearch(q.tasks, item, _compareTasks) + 1, 0, item);

                            if (q.tasks.length === q.concurrency) {
                                q.saturated();
                            }
                            async.setImmediate(q.process);
                        });
                    }

                    // Start with a normal queue
                    var q = async.queue(worker, concurrency);

                    // Override push to accept second parameter representing priority
                    q.push = function(data, priority, callback) {
                        _insert(q, data, priority, callback);
                    };

                    // Remove unshift function
                    delete q.unshift;

                    return q;
                };

                async.cargo = function(worker, payload) {
                    return _queue(worker, 1, payload);
                };

                function _console_fn(name) {
                    return _restParam(function(fn, args) {
                        fn.apply(null, args.concat([_restParam(function(err, args) {
                            if (typeof console === 'object') {
                                if (err) {
                                    if (console.error) {
                                        console.error(err);
                                    }
                                } else if (console[name]) {
                                    _arrayEach(args, function(x) {
                                        console[name](x);
                                    });
                                }
                            }
                        })]));
                    });
                }
                async.log = _console_fn('log');
                async.dir = _console_fn('dir');
                /*async.info = _console_fn('info');
                async.warn = _console_fn('warn');
                async.error = _console_fn('error');*/

                async.memoize = function(fn, hasher) {
                    var memo = {};
                    var queues = {};
                    var has = Object.prototype.hasOwnProperty;
                    hasher = hasher || identity;
                    var memoized = _restParam(function memoized(args) {
                        var callback = args.pop();
                        var key = hasher.apply(null, args);
                        if (has.call(memo, key)) {
                            async.setImmediate(function() {
                                callback.apply(null, memo[key]);
                            });
                        } else if (has.call(queues, key)) {
                            queues[key].push(callback);
                        } else {
                            queues[key] = [callback];
                            fn.apply(null, args.concat([_restParam(function(args) {
                                memo[key] = args;
                                var q = queues[key];
                                delete queues[key];
                                for (var i = 0, l = q.length; i < l; i++) {
                                    q[i].apply(null, args);
                                }
                            })]));
                        }
                    });
                    memoized.memo = memo;
                    memoized.unmemoized = fn;
                    return memoized;
                };

                async.unmemoize = function(fn) {
                    return function() {
                        return (fn.unmemoized || fn).apply(null, arguments);
                    };
                };

                function _times(mapper) {
                    return function(count, iterator, callback) {
                        mapper(_range(count), iterator, callback);
                    };
                }

                async.times = _times(async.map);
                async.timesSeries = _times(async.mapSeries);
                async.timesLimit = function(count, limit, iterator, callback) {
                    return async.mapLimit(_range(count), limit, iterator, callback);
                };

                async.seq = function( /* functions... */ ) {
                    var fns = arguments;
                    return _restParam(function(args) {
                        var that = this;

                        var callback = args[args.length - 1];
                        if (typeof callback == 'function') {
                            args.pop();
                        } else {
                            callback = noop;
                        }

                        async.reduce(fns, args, function(newargs, fn, cb) {
                                fn.apply(that, newargs.concat([_restParam(function(err, nextargs) {
                                    cb(err, nextargs);
                                })]));
                            },
                            function(err, results) {
                                callback.apply(that, [err].concat(results));
                            });
                    });
                };

                async.compose = function( /* functions... */ ) {
                    return async.seq.apply(null, Array.prototype.reverse.call(arguments));
                };


                function _applyEach(eachfn) {
                    return _restParam(function(fns, args) {
                        var go = _restParam(function(args) {
                            var that = this;
                            var callback = args.pop();
                            return eachfn(fns, function(fn, _, cb) {
                                    fn.apply(that, args.concat([cb]));
                                },
                                callback);
                        });
                        if (args.length) {
                            return go.apply(this, args);
                        } else {
                            return go;
                        }
                    });
                }

                async.applyEach = _applyEach(async.eachOf);
                async.applyEachSeries = _applyEach(async.eachOfSeries);


                async.forever = function(fn, callback) {
                    var done = only_once(callback || noop);
                    var task = ensureAsync(fn);

                    function next(err) {
                        if (err) {
                            return done(err);
                        }
                        task(next);
                    }
                    next();
                };

                function ensureAsync(fn) {
                    return _restParam(function(args) {
                        var callback = args.pop();
                        args.push(function() {
                            var innerArgs = arguments;
                            if (sync) {
                                async.setImmediate(function() {
                                    callback.apply(null, innerArgs);
                                });
                            } else {
                                callback.apply(null, innerArgs);
                            }
                        });
                        var sync = true;
                        fn.apply(this, args);
                        sync = false;
                    });
                }

                async.ensureAsync = ensureAsync;

                async.constant = _restParam(function(values) {
                    var args = [null].concat(values);
                    return function(callback) {
                        return callback.apply(this, args);
                    };
                });

                async.wrapSync =
                    async.asyncify = function asyncify(func) {
                        return _restParam(function(args) {
                            var callback = args.pop();
                            var result;
                            try {
                                result = func.apply(this, args);
                            } catch (e) {
                                return callback(e);
                            }
                            // if result is Promise object
                            if (_isObject(result) && typeof result.then === "function") {
                                result.then(function(value) {
                                    callback(null, value);
                                })["catch"](function(err) {
                                    callback(err.message ? err : new Error(err));
                                });
                            } else {
                                callback(null, result);
                            }
                        });
                    };

                // Node.js
                if (typeof module === 'object' && module.exports) {
                    module.exports = async;
                }
                // AMD / RequireJS
                else if (typeof define === 'function' && define.amd) {
                    define([], function() {
                        return async;
                    });
                }
                // included directly via <script> tag
                else {
                    root.async = async;
                }

            }());

        }).call(this, require('_process'), typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {}, require("timers").setImmediate)
    }, { "_process": 3, "timers": 4 }],
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
        (function(setImmediate, clearImmediate) {
            var nextTick = require('process/browser.js').nextTick;
            var apply = Function.prototype.apply;
            var slice = Array.prototype.slice;
            var immediateIds = {};
            var nextImmediateId = 0;

            // DOM APIs, for completeness

            exports.setTimeout = function() {
                return new Timeout(apply.call(setTimeout, window, arguments), clearTimeout);
            };
            exports.setInterval = function() {
                return new Timeout(apply.call(setInterval, window, arguments), clearInterval);
            };
            exports.clearTimeout =
                exports.clearInterval = function(timeout) { timeout.close(); };

            function Timeout(id, clearFn) {
                this._id = id;
                this._clearFn = clearFn;
            }
            Timeout.prototype.unref = Timeout.prototype.ref = function() {};
            Timeout.prototype.close = function() {
                this._clearFn.call(window, this._id);
            };

            // Does not start the time, just sets up the members needed.
            exports.enroll = function(item, msecs) {
                clearTimeout(item._idleTimeoutId);
                item._idleTimeout = msecs;
            };

            exports.unenroll = function(item) {
                clearTimeout(item._idleTimeoutId);
                item._idleTimeout = -1;
            };

            exports._unrefActive = exports.active = function(item) {
                clearTimeout(item._idleTimeoutId);

                var msecs = item._idleTimeout;
                if (msecs >= 0) {
                    item._idleTimeoutId = setTimeout(function onTimeout() {
                        if (item._onTimeout)
                            item._onTimeout();
                    }, msecs);
                }
            };

            // That's not how node.js implements it but the exposed api is the same.
            exports.setImmediate = typeof setImmediate === "function" ? setImmediate : function(fn) {
                var id = nextImmediateId++;
                var args = arguments.length < 2 ? false : slice.call(arguments, 1);

                immediateIds[id] = true;

                nextTick(function onNextTick() {
                    if (immediateIds[id]) {
                        // fn.call() is faster so we optimize for the common use-case
                        // @see http://jsperf.com/call-apply-segu
                        if (args) {
                            fn.apply(null, args);
                        } else {
                            fn.call(null);
                        }
                        // Prevent ids from leaking
                        exports.clearImmediate(id);
                    }
                });

                return id;
            };

            exports.clearImmediate = typeof clearImmediate === "function" ? clearImmediate : function(id) {
                delete immediateIds[id];
            };
        }).call(this, require("timers").setImmediate, require("timers").clearImmediate)
    }, { "process/browser.js": 3, "timers": 4 }],
    5: [function(require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        let savedSettings = {
            outputFolder: ""
        };
        const settingsStorageKey = "ValjangEngine.build.game";
        const settingsJSON = window.localStorage.getItem(settingsStorageKey);
        if (settingsJSON != null) {
            const parsedSettings = JSON.parse(settingsJSON);
            if (savedSettings != null && typeof savedSettings === "object")
                savedSettings = parsedSettings;
        }
        class GameBuildSettingsEditor {
            constructor(container, entries, entriesTreeView) {
                this.entries = entries;
                this.entriesTreeView = entriesTreeView;
                const { table, tbody } = SupClient.table.createTable(container);
                this.table = table;
                table.classList.add("properties");
                table.hidden = true;
                const outputFolderRow = SupClient.table.appendRow(tbody, SupClient.i18n.t("buildSettingsEditors:game.outputFolder"));
                const inputs = SupClient.html("div", "inputs", { parent: outputFolderRow.valueCell });
                const value = savedSettings.outputFolder != null ? savedSettings.outputFolder : "";
                this.outputFolderTextfield = SupClient.html("input", { parent: inputs, type: "text", value, readOnly: true, style: { cursor: "pointer" } });
                this.outputFolderButton = SupClient.html("button", { parent: inputs, textContent: SupClient.i18n.t("common:actions.select") });
                this.outputFolderTextfield.addEventListener("click", (event) => {
                    event.preventDefault();
                    this.selectOutputfolder();
                });
                this.outputFolderButton.addEventListener("click", (event) => {
                    event.preventDefault();
                    this.selectOutputfolder();
                });
                const errorRow = SupClient.table.appendRow(tbody, "Error");
                this.errorRowElt = errorRow.row;
                this.errorRowElt.hidden = true;
                this.errorInput = SupClient.html("input", { parent: errorRow.valueCell, type: "text", readOnly: true });
            }
            setVisible(visible) {
                this.table.hidden = !visible;
            }
            getSettings(callback) {
                this.ensureOutputFolderValid((outputFolderValid) => {
                    callback(outputFolderValid ? { outputFolder: savedSettings.outputFolder } : null);
                });
            }
            selectOutputfolder() {
                SupApp.chooseFolder((folderPath) => {
                    if (folderPath == null)
                        return;
                    savedSettings.outputFolder = this.outputFolderTextfield.value = folderPath;
                    window.localStorage.setItem(settingsStorageKey, JSON.stringify(savedSettings));
                    this.ensureOutputFolderValid();
                });
            }
            ensureOutputFolderValid(callback) {
                if (savedSettings.outputFolder == null) {
                    this.displayError(SupClient.i18n.t("buildSettingsEditors:game.errors.selectDestionationFolder"));
                    if (callback != null)
                        callback(false);
                    return;
                }
                SupApp.readDir(savedSettings.outputFolder, (err, files) => {
                    if (err != null) {
                        this.displayError(SupClient.i18n.t("buildSettingsEditors:game.errors.emptyDirectoryCheckFail"));
                        console.log(err);
                        if (callback != null)
                            callback(false);
                        return;
                    }
                    let index = 0;
                    while (index < files.length) {
                        const item = files[index];
                        if (item[0] === "." || item === "Thumbs.db")
                            files.splice(index, 1);
                        else
                            index++;
                    }
                    if (files.length > 0) {
                        this.displayError(SupClient.i18n.t("buildSettingsEditors:game.errors.destinationFolderEmpty"));
                        if (callback != null)
                            callback(false);
                    } else {
                        this.errorRowElt.hidden = true;
                        if (callback != null)
                            callback(true);
                    }
                });
            }
            displayError(err) {
                this.errorRowElt.hidden = false;
                this.errorInput.value = err;
                this.errorRowElt.animate([
                    { transform: "translateX(0)" },
                    { transform: "translateX(1.5vh)" },
                    { transform: "translateX(0)" }
                ], { duration: 100 });
            }
        }
        exports.default = GameBuildSettingsEditor;

    }, {}],
    6: [function(require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        const async = require("async");
        const path = require("path");
        let projectClient;
        const subscribersByAssetId = {};
        const subscribersByResourceId = {};
        let entriesSubscriber;
        let entries;
        let settings;
        let projectWindowId;
        const progress = { index: 0, total: 0, errors: 0 };
        const statusElt = document.querySelector(".status");
        const progressElt = document.querySelector("progress");
        const detailsListElt = document.querySelector(".details ol");

        function loadPlugins(callback) {
            async.series([
                (cb) => { SupClient.loadScript(`/systems/${SupCore.system.id}/SupEngine.js`, cb); },
                (cb) => { SupClient.loadScript(`/systems/${SupCore.system.id}/plugins/default/scene/BaseComponentConfig.js`, cb); },
                (cb) => {
                    async.each(SupCore.system.pluginsInfo.list, (pluginName, cb) => {
                        const pluginPath = `/systems/${SupCore.system.id}/plugins/${pluginName}`;
                        async.each(["data", "componentConfigs"], (name, cb) => {
                            SupClient.loadScript(`${pluginPath}/bundles/${name}.js`, cb);
                        }, cb);
                    }, cb);
                }
            ], () => { callback(); });
        }

        function build(socket, theSettings, theProjectWindowId) {
            settings = theSettings;
            projectWindowId = theProjectWindowId;
            loadPlugins(() => {
                projectClient = new SupClient.ProjectClient(socket);
                entriesSubscriber = { onEntriesReceived };
                projectClient.subEntries(entriesSubscriber);
            });
        }
        exports.default = build;

        function onEntriesReceived(theEntries) {
            entries = theEntries;
            projectClient.unsubEntries(entriesSubscriber);
            // Manifest
            projectClient.socket.emit("sub", "manifest", null, onManifestReceived);
            progress.total++;
            // Assets
            entries.walk((entry) => {
                if (entry.type != null) {
                    // Only subscribe to assets that can be exported
                    if (SupCore.system.data.assetClasses[entry.type].prototype.clientExport != null) {
                        const subscriber = { onAssetReceived };
                        subscribersByAssetId[entry.id] = subscriber;
                        projectClient.subAsset(entry.id, entry.type, subscriber);
                        progress.total++;
                    }
                }
            });
            // Resources
            for (const resourceId in SupCore.system.data.resourceClasses) {
                // Only subscribe to resources that can be exported
                if (SupCore.system.data.resourceClasses[resourceId].prototype.clientExport != null) {
                    const subscriber = { onResourceReceived };
                    subscribersByResourceId[resourceId] = subscriber;
                    projectClient.subResource(resourceId, subscriber);
                    progress.total++;
                }
            }
            // TODO: Extra build files
            const systemBuildFiles = ["/SupCore.js"];
            const pluginsInfo = SupCore.system.pluginsInfo;
            const systemPath = `/systems/${SupCore.system.id}`;
            for (const plugin of pluginsInfo.list) {
                systemBuildFiles.push(`${systemPath}/plugins/${plugin}/bundles/components.js`);
                systemBuildFiles.push(`${systemPath}/plugins/${plugin}/bundles/runtime.js`);
                systemBuildFiles.push(`${systemPath}/plugins/${plugin}/bundles/typescriptAPI.js`);
            }
            systemBuildFiles.push(`${systemPath}/plugins.json`);
            systemBuildFiles.push(`${systemPath}/index.html`);
            systemBuildFiles.push(`${systemPath}/index.css`);
            systemBuildFiles.push(`${systemPath}/images/logo.png`);
            systemBuildFiles.push(`${systemPath}/SupEngine.js`);
            systemBuildFiles.push(`${systemPath}/SupRuntime.js`);
            for (const systemBuildFile of systemBuildFiles) {
                let localBuildFile = systemBuildFile;
                if (localBuildFile.indexOf(systemPath) === 0)
                    localBuildFile = systemBuildFile.substring(systemPath.length).replace("/", path.sep);
                const outputPath = `${settings.outputFolder}${localBuildFile}`;
                progress.total++;
                SupClient.fetch(systemBuildFile, "text", (err, data) => {
                    if (err != null) {
                        progress.errors++;
                        SupClient.html("li", { parent: detailsListElt, textContent: SupClient.i18n.t("builds:game.errors.exportFailed", { path: outputPath }) });
                        progress.index++;
                        updateProgress();
                        return;
                    }
                    const outputDirname = path.dirname(outputPath);
                    SupApp.mkdirp(outputDirname, (err) => {
                        if (err != null && outputDirname !== settings.outputFolder) {
                            progress.errors++;
                            SupClient.html("li", { parent: detailsListElt, textContent: SupClient.i18n.t("builds:game.errors.exportFailed", { path: outputPath }) });
                            progress.index++;
                            updateProgress();
                            return;
                        }
                        SupApp.writeFile(outputPath, data, (err) => {
                            if (err != null) {
                                progress.errors++;
                                SupClient.html("li", { parent: detailsListElt, textContent: SupClient.i18n.t("builds:game.errors.exportFailed", { path: outputPath }) });
                            }
                            progress.index++;
                            updateProgress();
                        });
                    });
                });
            }
            updateProgress();
        }

        function onManifestReceived(err, manifestPub) {
            projectClient.socket.emit("unsub", "manifest");
            const exportedProject = { name: manifestPub.name, assets: entries.getForStorage() };
            const json = JSON.stringify(exportedProject, null, 2);
            const projectPath = `${settings.outputFolder}/project.json`;
            SupApp.writeFile(projectPath, json, { encoding: "utf8" }, (err) => {
                if (err != null) {
                    progress.errors++;
                    SupClient.html("li", { parent: detailsListElt, textContent: SupClient.i18n.t("builds:game.errors.exportFailed", { path: projectPath }) });
                }
                progress.index++;
                updateProgress();
            });
        }

        function updateProgress() {
            progressElt.max = progress.total;
            progressElt.value = progress.index;
            if (progress.index < progress.total) {
                statusElt.textContent = SupClient.i18n.t("builds:game.progress", { path: settings.outputFolder, index: progress.index, total: progress.total });
            } else {
                statusElt.textContent = progress.errors > 0 ?
                    SupClient.i18n.t("builds:game.doneWithErrors", { path: settings.outputFolder, total: progress.total, errors: progress.errors }) :
                    SupClient.i18n.t("builds:game.done", { path: settings.outputFolder, total: progress.total });
                SupApp.sendMessage(projectWindowId, "build-finished");
            }
        }

        function onAssetReceived(assetId, asset) {
            projectClient.unsubAsset(assetId, subscribersByAssetId[assetId]);
            delete subscribersByAssetId[assetId];
            const outputFolder = `${settings.outputFolder}/assets/${entries.getStoragePathFromId(assetId)}`;
            SupApp.mkdirp(outputFolder, () => {
                asset.clientExport(outputFolder, (err) => {
                    if (err != null) {
                        progress.errors++;
                        SupClient.html("li", { parent: detailsListElt, textContent: SupClient.i18n.t("builds:game.errors.exportFailed", { path: outputFolder }) });
                    }
                    progress.index++;
                    updateProgress();
                });
            });
        }

        function onResourceReceived(resourceId, resource) {
            projectClient.unsubResource(resourceId, subscribersByResourceId[resourceId]);
            delete subscribersByAssetId[resourceId];
            const outputFolder = `${settings.outputFolder}/resources/${resourceId}`;
            SupApp.mkdirp(outputFolder, () => {
                resource.clientExport(outputFolder, (err) => {
                    if (err != null) {
                        progress.errors++;
                        SupClient.html("li", { parent: detailsListElt, textContent: SupClient.i18n.t("builds:game.errors.exportFailed", { path: outputFolder }) });
                    }
                    progress.index++;
                    updateProgress();
                });
            });
        }

    }, { "async": 1, "path": 2 }],
    7: [function(require, module, exports) {
        "use strict";
        /// <reference path="./GameBuildSettings.d.ts" />
        Object.defineProperty(exports, "__esModule", { value: true });
        const GameBuildSettingsEditor_1 = require("./GameBuildSettingsEditor");
        const buildGame_1 = require("./buildGame");
        SupClient.registerPlugin("build", "game", {
            settingsEditor: GameBuildSettingsEditor_1.default,
            build: buildGame_1.default
        });

    }, { "./GameBuildSettingsEditor": 5, "./buildGame": 6 }]
}, {}, [7]);