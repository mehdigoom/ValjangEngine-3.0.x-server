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
    }, { "_process": 4, "timers": 6 }],
    2: [function(require, module, exports) {
        (function(global) {
            (function(f) {
                if (typeof exports === "object" && typeof module !== "undefined") { module.exports = f() } else if (typeof define === "function" && define.amd) { define([], f) } else {
                    var g;
                    if (typeof window !== "undefined") { g = window } else if (typeof global !== "undefined") { g = global } else if (typeof self !== "undefined") { g = self } else { g = this }
                    g.TreeView = f()
                }
            })(function() {
                var define, module, exports;
                return (function e(t, n, r) {
                    function s(o, u) {
                        if (!n[o]) {
                            if (!t[o]) { var a = typeof require == "function" && require; if (!u && a) return a(o, !0); if (i) return i(o, !0); var f = new Error("Cannot find module '" + o + "'"); throw f.code = "MODULE_NOT_FOUND", f }
                            var l = n[o] = { exports: {} };
                            t[o][0].call(l.exports, function(e) { var n = t[o][1][e]; return s(n ? n : e) }, l, l.exports, e, t, n, r)
                        }
                        return n[o].exports
                    }
                    var i = typeof require == "function" && require;
                    for (var o = 0; o < r.length; o++) s(r[o]);
                    return s
                })({
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

                    }, {}],
                    2: [function(require, module, exports) {
                        "use strict";
                        var __extends = (this && this.__extends) || function(d, b) {
                            for (var p in b)
                                if (b.hasOwnProperty(p)) d[p] = b[p];

                            function __() { this.constructor = d; }
                            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
                        };
                        var events_1 = require("events");
                        var TreeView = (function(_super) {
                            __extends(TreeView, _super);

                            function TreeView(container, options) {
                                var _this = this;
                                _super.call(this);
                                this.onClick = function(event) {
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
                                this.onDoubleClick = function(event) {
                                    if (_this.selectedNodes.length !== 1)
                                        return;
                                    var element = event.target;
                                    if (element.tagName === "BUTTON" || element.tagName === "INPUT" || element.tagName === "SELECT")
                                        return;
                                    if (element.className === "toggle")
                                        return;
                                    _this.emit("activate");
                                };
                                this.onKeyDown = function(event) {
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
                                this.moveHorizontally = function(offset) {
                                    // TODO: this.focusedNode;
                                    var node = _this.firstSelectedNode;
                                    if (offset === -1) {
                                        if (!node.classList.contains("group") || node.classList.contains("collapsed")) {
                                            if (!node.parentElement.classList.contains("children"))
                                                return;
                                            node = node.parentElement.previousElementSibling;
                                        } else if (node.classList.contains("group")) {
                                            node.classList.add("collapsed");
                                        }
                                    } else {
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
                                this.onDragStart = function(event) {
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
                                this.onDragEnd = function(event) {
                                    _this.isDraggingNodes = false;
                                };
                                this.onDragOver = function(event) {
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
                                this.onDragLeave = function(event) {
                                    _this.hasDraggedOverAfterLeaving = false;
                                    setTimeout(function() {
                                        if (!_this.hasDraggedOverAfterLeaving)
                                            _this.clearDropClasses();
                                    }, 300);
                                };
                                this.onDrop = function(event) {
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
                                container.addEventListener("keydown", function(event) {
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
                            TreeView.prototype.clearSelection = function() {
                                for (var _i = 0, _a = this.selectedNodes; _i < _a.length; _i++) {
                                    var selectedNode = _a[_i];
                                    selectedNode.classList.remove("selected");
                                }
                                this.selectedNodes.length = 0;
                                this.firstSelectedNode = null;
                            };
                            TreeView.prototype.addToSelection = function(element) {
                                if (this.selectedNodes.indexOf(element) !== -1)
                                    return;
                                this.selectedNodes.push(element);
                                element.classList.add("selected");
                                if (this.selectedNodes.length === 1)
                                    this.firstSelectedNode = element;
                            };
                            TreeView.prototype.scrollIntoView = function(element) {
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
                            TreeView.prototype.clear = function() {
                                this.treeRoot.innerHTML = "";
                                this.selectedNodes.length = 0;
                                this.firstSelectedNode = null;
                                this.hasDraggedOverAfterLeaving = false;
                                this.isDraggingNodes = false;
                            };
                            TreeView.prototype.append = function(element, type, parentGroupElement) {
                                if (type !== "item" && type !== "group")
                                    throw new Error("Invalid type");
                                var childrenElt;
                                var siblingsElt;
                                if (parentGroupElement != null) {
                                    if (parentGroupElement.tagName !== "LI" || !parentGroupElement.classList.contains("group"))
                                        throw new Error("Invalid parent group");
                                    siblingsElt = parentGroupElement.nextSibling;
                                } else {
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
                                } else if (type === "group") {
                                    childrenElt = element.nextSibling;
                                }
                                siblingsElt.appendChild(element);
                                if (childrenElt != null)
                                    siblingsElt.appendChild(childrenElt);
                                return element;
                            };
                            TreeView.prototype.insertBefore = function(element, type, referenceElement) {
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
                                } else if (type === "group") {
                                    childrenElt = element.nextSibling;
                                }
                                referenceElement.parentElement.insertBefore(element, referenceElement);
                                if (childrenElt != null)
                                    referenceElement.parentElement.insertBefore(childrenElt, element.nextSibling);
                                return element;
                            };
                            TreeView.prototype.insertAt = function(element, type, index, parentElement) {
                                var referenceElt;
                                if (index != null) {
                                    referenceElt =
                                        (parentElement != null) ?
                                        parentElement.nextSibling.querySelector(":scope > li:nth-of-type(" + (index + 1) + ")") :
                                        this.treeRoot.querySelector(":scope > li:nth-of-type(" + (index + 1) + ")");
                                }
                                if (referenceElt != null)
                                    this.insertBefore(element, type, referenceElt);
                                else
                                    this.append(element, type, parentElement);
                            };
                            TreeView.prototype.remove = function(element) {
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
                            TreeView.prototype.updateSelection = function(event) {
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
                            TreeView.prototype.moveVertically = function(offset) {
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
                                    } else if (node.parentElement.classList.contains("children"))
                                        node = node.parentElement.previousElementSibling;
                                    else
                                        return;
                                } else {
                                    var walkUp = false;
                                    if (node.classList.contains("group")) {
                                        if (!node.classList.contains("collapsed") && node.nextElementSibling.childElementCount > 0)
                                            node = node.nextElementSibling.firstElementChild;
                                        else if (node.nextElementSibling.nextElementSibling != null)
                                            node = node.nextElementSibling.nextElementSibling;
                                        else
                                            walkUp = true;
                                    } else {
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
                                        } else
                                            return;
                                    }
                                }
                                if (node == null)
                                    return;
                                this.clearSelection();
                                this.addToSelection(node);
                                this.scrollIntoView(node);
                                this.emit("selectionChange");
                            };;
                            TreeView.prototype.getDropLocation = function(event) {
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
                                    } else if (element.classList.contains("group") && element.nextSibling.nextSibling != null && element.nextSibling.nextSibling.tagName === "LI") {
                                        element = element.nextSibling.nextSibling;
                                        where = "above";
                                    }
                                }
                                return { target: element, where: where };
                            };
                            TreeView.prototype.getInsertionPoint = function(element, y) {
                                var rect = element.getBoundingClientRect();
                                var offset = y - rect.top;
                                if (offset < rect.height / 4)
                                    return "above";
                                if (offset > rect.height * 3 / 4)
                                    return (element.classList.contains("group") && element.nextSibling.childElementCount > 0) ? "inside" : "below";
                                return element.classList.contains("item") ? "below" : "inside";
                            };
                            TreeView.prototype.clearDropClasses = function() {
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

                    }, { "events": 1 }]
                }, {}, [2])(2)
            });
        }).call(this, typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
    }, { "events": 3 }],
    3: [function(require, module, exports) {
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
    4: [function(require, module, exports) {
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
    5: [function(require, module, exports) {
        (function(global) {
            (function(f) {
                if (typeof exports === "object" && typeof module !== "undefined") { module.exports = f() } else if (typeof define === "function" && define.amd) { define([], f) } else {
                    var g;
                    if (typeof window !== "undefined") { g = window } else if (typeof global !== "undefined") { g = global } else if (typeof self !== "undefined") { g = self } else { g = this }
                    g.ResizeHandle = f()
                }
            })(function() {
                var define, module, exports;
                return (function e(t, n, r) {
                    function s(o, u) {
                        if (!n[o]) {
                            if (!t[o]) { var a = typeof require == "function" && require; if (!u && a) return a(o, !0); if (i) return i(o, !0); var f = new Error("Cannot find module '" + o + "'"); throw f.code = "MODULE_NOT_FOUND", f }
                            var l = n[o] = { exports: {} };
                            t[o][0].call(l.exports, function(e) { var n = t[o][1][e]; return s(n ? n : e) }, l, l.exports, e, t, n, r)
                        }
                        return n[o].exports
                    }
                    var i = typeof require == "function" && require;
                    for (var o = 0; o < r.length; o++) s(r[o]);
                    return s
                })({
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

                    }, {}],
                    2: [function(require, module, exports) {
                        "use strict";
                        var __extends = (this && this.__extends) || function(d, b) {
                            for (var p in b)
                                if (b.hasOwnProperty(p)) d[p] = b[p];

                            function __() { this.constructor = d; }
                            d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
                        };
                        var events = require("events");
                        var ResizeHandle = (function(_super) {
                            __extends(ResizeHandle, _super);

                            function ResizeHandle(targetElt, direction, options) {
                                var _this = this;
                                _super.call(this);
                                this.savedSize = null;
                                this.onDoubleClick = function(event) {
                                    if (event.button !== 0 || !_this.handleElt.classList.contains("collapsable"))
                                        return;
                                    var size = _this.targetElt.getBoundingClientRect()[_this.horizontal ? "width" : "height"];
                                    var newSize;
                                    if (size > 0) {
                                        _this.savedSize = size;
                                        newSize = 0;
                                        _this.targetElt.style.display = "none";
                                    } else {
                                        newSize = _this.savedSize;
                                        _this.savedSize = null;
                                        _this.targetElt.style.display = "";
                                    }
                                    if (_this.horizontal)
                                        _this.targetElt.style.width = newSize + "px";
                                    else
                                        _this.targetElt.style.height = newSize + "px";
                                };
                                this.onMouseDown = function(event) {
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
                                    } else {
                                        initialSize = _this.targetElt.getBoundingClientRect().height;
                                        startDrag = event.clientY;
                                        directionClass = "horizontal";
                                    }
                                    var dragTarget;
                                    if (_this.handleElt.setCapture != null) {
                                        dragTarget = _this.handleElt;
                                        dragTarget.setCapture();
                                    } else {
                                        dragTarget = window;
                                    }
                                    document.documentElement.classList.add("handle-dragging", directionClass);
                                    var onMouseMove = function(event) {
                                        var size = initialSize + (_this.start ? -startDrag : startDrag);
                                        _this.emit("drag");
                                        if (_this.horizontal) {
                                            size += _this.start ? event.clientX : -event.clientX;
                                            _this.targetElt.style.width = size + "px";
                                        } else {
                                            size += _this.start ? event.clientY : -event.clientY;
                                            _this.targetElt.style.height = size + "px";
                                        }
                                    };
                                    var onMouseUp = function(event) {
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
                                } else {
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

                    }, { "events": 1 }]
                }, {}, [2])(2)
            });
        }).call(this, typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
    }, { "events": 3 }],
    6: [function(require, module, exports) {
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
    }, { "process/browser.js": 4, "timers": 6 }],
    7: [function(require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        const tmpVector3 = new SupEngine.THREE.Vector3();
        const tmpQuaternion = new SupEngine.THREE.Quaternion();
        class SceneUpdater {
            constructor(client, engine, config, externalSubscriber) {
                this.client = client;
                this.externalSubscriber = externalSubscriber;
                this.bySceneNodeId = {};
                this.onSceneAssetReceived = (assetId, asset) => {
                    this.sceneAsset = asset;
                    const walk = (node) => {
                        this.createNodeActor(node);
                        if (node.children != null && node.children.length > 0) {
                            for (const child of node.children)
                                walk(child);
                        }
                    };
                    for (const node of asset.nodes.pub)
                        walk(node);
                    if (this.externalSubscriber.onAssetReceived != null)
                        this.externalSubscriber.onAssetReceived(assetId, asset);
                };
                this.onSceneAssetEdited = (assetId, command, ...args) => {
                    const commandFunction = this.onEditCommands[command];
                    if (commandFunction != null)
                        commandFunction.apply(this, args);
                    if (this.externalSubscriber.onAssetEdited != null)
                        this.externalSubscriber.onAssetEdited(assetId, command, ...args);
                };
                this.onEditCommands = {
                    addNode: (node, parentId, index) => {
                        this.createNodeActor(node);
                    },
                    moveNode: (id, parentId, index) => {
                        const nodeActor = this.bySceneNodeId[id].actor;
                        const parentNodeActor = (this.bySceneNodeId[parentId] != null) ? this.bySceneNodeId[parentId].actor : null;
                        nodeActor.setParent(parentNodeActor);
                        this.onUpdateMarkerRecursive(id);
                    },
                    setNodeProperty: (id, path, value) => {
                        const nodeEditorData = this.bySceneNodeId[id];
                        switch (path) {
                            case "position":
                                nodeEditorData.actor.setLocalPosition(value);
                                if (!this.isInPrefab)
                                    this.onUpdateMarkerRecursive(id);
                                break;
                            case "orientation":
                                nodeEditorData.actor.setLocalOrientation(value);
                                if (!this.isInPrefab)
                                    this.onUpdateMarkerRecursive(id);
                                break;
                            case "scale":
                                nodeEditorData.actor.setLocalScale(value);
                                if (!this.isInPrefab)
                                    this.onUpdateMarkerRecursive(id);
                                break;
                            case "prefab.sceneAssetId":
                                nodeEditorData.prefabUpdater.config_setProperty("sceneAssetId", value);
                                break;
                        }
                    },
                    duplicateNode: (rootNode, newNodes) => {
                        for (const newNode of newNodes)
                            this.createNodeActor(newNode.node);
                    },
                    removeNode: (id) => {
                        this.recurseClearActor(id);
                    },
                    addComponent(nodeComponent, nodeId, index) {
                        this.createNodeActorComponent(this.sceneAsset.nodes.byId[nodeId], nodeComponent, this.bySceneNodeId[nodeId].actor);
                    },
                    editComponent(nodeId, componentId, command, ...args) {
                        const componentUpdater = this.bySceneNodeId[nodeId].bySceneComponentId[componentId].componentUpdater;
                        if (componentUpdater[`config_${command}`] != null)
                            componentUpdater[`config_${command}`].apply(componentUpdater, args);
                    },
                    removeComponent(nodeId, componentId) {
                        this.gameInstance.destroyComponent(this.bySceneNodeId[nodeId].bySceneComponentId[componentId].component);
                        this.bySceneNodeId[nodeId].bySceneComponentId[componentId].componentUpdater.destroy();
                        delete this.bySceneNodeId[nodeId].bySceneComponentId[componentId];
                    }
                };
                this.onSceneAssetTrashed = (assetId) => {
                    this.clearScene();
                    if (this.sceneSubscriber.onAssetTrashed != null)
                        this.sceneSubscriber.onAssetTrashed(assetId);
                };
                this.gameInstance = engine.gameInstance;
                this.rootActor = engine.actor;
                this.sceneAssetId = config.sceneAssetId;
                this.isInPrefab = config.isInPrefab;
                if (this.externalSubscriber == null)
                    this.externalSubscriber = {};
                this.sceneSubscriber = {
                    onAssetReceived: this.onSceneAssetReceived,
                    onAssetEdited: this.onSceneAssetEdited,
                    onAssetTrashed: this.onSceneAssetTrashed
                };
                if (this.sceneAssetId != null)
                    this.client.subAsset(this.sceneAssetId, "scene", this.sceneSubscriber);
            }
            destroy() {
                this.clearScene();
                if (this.sceneAssetId != null)
                    this.client.unsubAsset(this.sceneAssetId, this.sceneSubscriber);
            }
            onUpdateMarkerRecursive(nodeId) {
                this.sceneAsset.nodes.walkNode(this.sceneAsset.nodes.byId[nodeId], null, (descendantNode) => {
                    const nodeEditorData = this.bySceneNodeId[descendantNode.id];
                    nodeEditorData.markerActor.setGlobalPosition(nodeEditorData.actor.getGlobalPosition(tmpVector3));
                    nodeEditorData.markerActor.setGlobalOrientation(nodeEditorData.actor.getGlobalOrientation(tmpQuaternion));
                });
            }
            recurseClearActor(nodeId) {
                const nodeEditorData = this.bySceneNodeId[nodeId];
                if (nodeEditorData.prefabUpdater == null) {
                    for (const childActor of nodeEditorData.actor.children) {
                        const sceneNodeId = childActor.sceneNodeId;
                        if (sceneNodeId != null)
                            this.recurseClearActor(sceneNodeId);
                    }
                } else {
                    nodeEditorData.prefabUpdater.destroy();
                }
                for (const componentId in nodeEditorData.bySceneComponentId) {
                    nodeEditorData.bySceneComponentId[componentId].componentUpdater.destroy();
                }
                if (!this.isInPrefab)
                    this.gameInstance.destroyActor(nodeEditorData.markerActor);
                this.gameInstance.destroyActor(nodeEditorData.actor);
                delete this.bySceneNodeId[nodeId];
            }
            config_setProperty(path, value) {
                switch (path) {
                    case "sceneAssetId":
                        if (this.sceneAssetId != null)
                            this.client.unsubAsset(this.sceneAssetId, this.sceneSubscriber);
                        this.sceneAssetId = value;
                        this.clearScene();
                        this.sceneAsset = null;
                        if (this.sceneAssetId != null)
                            this.client.subAsset(this.sceneAssetId, "scene", this.sceneSubscriber);
                        break;
                }
            }
            createNodeActor(node) {
                const parentNode = this.sceneAsset.nodes.parentNodesById[node.id];
                let parentActor;
                if (parentNode != null)
                    parentActor = this.bySceneNodeId[parentNode.id].actor;
                else
                    parentActor = this.rootActor;
                const nodeActor = new SupEngine.Actor(this.gameInstance, node.name, parentActor);
                const nodeId = (this.rootActor == null) ? node.id : this.rootActor.threeObject.userData.nodeId;
                nodeActor.threeObject.userData.nodeId = nodeId;
                nodeActor.threeObject.position.copy(node.position);
                nodeActor.threeObject.quaternion.copy(node.orientation);
                nodeActor.threeObject.scale.copy(node.scale);
                nodeActor.threeObject.updateMatrixWorld(false);
                nodeActor.sceneNodeId = node.id;
                let markerActor;
                if (!this.isInPrefab) {
                    markerActor = new SupEngine.Actor(this.gameInstance, `${nodeId} Marker`, null, { layer: -1 });
                    markerActor.setGlobalPosition(nodeActor.getGlobalPosition(tmpVector3));
                    markerActor.setGlobalOrientation(nodeActor.getGlobalOrientation(tmpQuaternion));
                    new SupEngine.editorComponentClasses["TransformMarker"](markerActor);
                }
                this.bySceneNodeId[node.id] = { actor: nodeActor, markerActor, bySceneComponentId: {}, prefabUpdater: null };
                if (node.prefab != null) {
                    this.bySceneNodeId[node.id].prefabUpdater = new SceneUpdater(this.client, { gameInstance: this.gameInstance, actor: nodeActor }, { sceneAssetId: node.prefab.sceneAssetId, isInPrefab: true });
                }
                if (node.components != null)
                    for (const component of node.components)
                        this.createNodeActorComponent(node, component, nodeActor);
                return nodeActor;
            }
            createNodeActorComponent(sceneNode, sceneComponent, nodeActor) {
                let componentClass = SupEngine.editorComponentClasses[`${sceneComponent.type}Marker`];
                if (componentClass == null)
                    componentClass = SupEngine.componentClasses[sceneComponent.type];
                const actorComponent = new componentClass(nodeActor);
                this.bySceneNodeId[sceneNode.id].bySceneComponentId[sceneComponent.id] = {
                    component: actorComponent,
                    componentUpdater: new componentClass.Updater(this.client, actorComponent, sceneComponent.config),
                };
            }
            clearScene() {
                for (const sceneNodeId in this.bySceneNodeId) {
                    const sceneNode = this.bySceneNodeId[sceneNodeId];
                    if (!this.isInPrefab)
                        this.gameInstance.destroyActor(sceneNode.markerActor);
                    for (const componentId in sceneNode.bySceneComponentId)
                        sceneNode.bySceneComponentId[componentId].componentUpdater.destroy();
                    this.gameInstance.destroyActor(sceneNode.actor);
                }
                this.bySceneNodeId = {};
            }
        }
        exports.default = SceneUpdater;

    }, {}],
    8: [function(require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        const network_1 = require("./network");
        const ui_1 = require("./ui");
        const THREE = SupEngine.THREE;
        const engine = {};
        exports.default = engine;
        const canvasElt = document.querySelector("canvas");
        engine.gameInstance = new SupEngine.GameInstance(canvasElt);
        engine.cameraRoot = new SupEngine.Actor(engine.gameInstance, "Camera Root");
        engine.cameraActor = new SupEngine.Actor(engine.gameInstance, "Camera", engine.cameraRoot);
        engine.cameraActor.setLocalPosition(new THREE.Vector3(0, 0, 10));
        engine.cameraComponent = new SupEngine.componentClasses["Camera"](engine.cameraActor);
        engine.cameraComponent.layers = [0, -1];
        engine.cameraControls = new SupEngine.editorComponentClasses["Camera3DControls"](engine.cameraActor, engine.cameraComponent);
        engine.ambientLight = new THREE.AmbientLight(0xcfcfcf);
        const gridActor = new SupEngine.Actor(engine.gameInstance, "Grid", null, { layer: 0 });
        const selectionActor = new SupEngine.Actor(engine.gameInstance, "Selection Box", null, { layer: -1 });
        const transformHandlesActor = new SupEngine.Actor(engine.gameInstance, "Transform Handles", null, { layer: -1 });
        let draggingControls = false;
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
            } else if (animationFrame == null) {
                animationFrame = requestAnimationFrame(tick);
            }
        }

        function start() {
            // Those classes are loaded asynchronously
            engine.selectionBoxComponent = new SupEngine.editorComponentClasses["SelectionBox"](selectionActor);
            engine.transformHandleComponent = new SupEngine.editorComponentClasses["TransformHandle"](transformHandlesActor, engine.cameraComponent.unifiedThreeCamera);
            engine.transformHandleComponent.control.addEventListener("mouseDown", () => { draggingControls = true; });
            engine.transformHandleComponent.control.addEventListener("objectChange", onTransformChange);
            engine.gridHelperComponent = new SupEngine.editorComponentClasses["GridHelper"](gridActor, ui_1.default.gridSize, ui_1.default.gridStep);
            engine.gridHelperComponent.setVisible(false);
            hasStarted = true;
            onChangeActive();
        }
        exports.start = start;

        function updateCameraMode() {
            if (ui_1.default.cameraMode === "3D") {
                engine.cameraComponent.setOrthographicMode(false);
                engine.cameraControls = new SupEngine.editorComponentClasses["Camera3DControls"](engine.cameraActor, engine.cameraComponent);
                engine.cameraControls.movementSpeed = ui_1.default.cameraSpeedSlider.value;
            } else {
                engine.cameraActor.setLocalOrientation(new SupEngine.THREE.Quaternion().setFromAxisAngle(new SupEngine.THREE.Vector3(0, 1, 0), 0));
                engine.cameraComponent.setOrthographicMode(true);
                engine.cameraControls = new SupEngine.editorComponentClasses["Camera2DControls"](engine.cameraActor, engine.cameraComponent, {
                    zoomSpeed: 1.5,
                    zoomMin: 0.1,
                    zoomMax: 10000,
                });
            }
            engine.transformHandleComponent.control.camera = engine.cameraComponent.threeCamera;
            if (ui_1.default.cameraMode === "3D") {
                gridActor.setLocalPosition(new THREE.Vector3(0, 0, 0));
                gridActor.setLocalEulerAngles(new THREE.Euler(0, 0, 0));
                gridActor.layer = 0;
            } else {
                gridActor.setLocalPosition(new THREE.Vector3(0, 0, -500));
                gridActor.setLocalEulerAngles(new THREE.Euler(Math.PI / 2, 0, 0));
                gridActor.layer = -1;
            }
        }
        exports.updateCameraMode = updateCameraMode;
        let lastTimestamp = 0;
        let accumulatedTime = 0;

        function tick(timestamp = 0) {
            accumulatedTime += timestamp - lastTimestamp;
            lastTimestamp = timestamp;
            const { updates, timeLeft } = engine.gameInstance.tick(accumulatedTime, update);
            accumulatedTime = timeLeft;
            if (updates > 0)
                engine.gameInstance.draw();
            animationFrame = requestAnimationFrame(tick);
        }
        const gridPosition = new THREE.Vector3();

        function update() {
            if (ui_1.default.cameraMode === "3D" && engine.gameInstance.input.keyboardButtons[window.KeyEvent.DOM_VK_CONTROL].isDown) {
                if (engine.gameInstance.input.mouseButtons[5].isDown) {
                    ui_1.default.cameraSpeedSlider.value = (parseFloat(ui_1.default.cameraSpeedSlider.value) + 2 * parseFloat(ui_1.default.cameraSpeedSlider.step)).toString();
                    engine.cameraControls.movementSpeed = ui_1.default.cameraSpeedSlider.value;
                } else if (engine.gameInstance.input.mouseButtons[6].isDown) {
                    ui_1.default.cameraSpeedSlider.value = (parseFloat(ui_1.default.cameraSpeedSlider.value) - 2 * parseFloat(ui_1.default.cameraSpeedSlider.step)).toString();
                    engine.cameraControls.movementSpeed = ui_1.default.cameraSpeedSlider.value;
                }
            }
            if (engine.gameInstance.input.mouseButtons[0].wasJustReleased)
                mouseUp();
            const snap = engine.gameInstance.input.keyboardButtons[window.KeyEvent.DOM_VK_CONTROL].isDown;
            if (snap !== (engine.transformHandleComponent.control.translationSnap != null)) {
                engine.transformHandleComponent.control.setTranslationSnap(snap ? ui_1.default.gridStep : null);
                engine.transformHandleComponent.control.setRotationSnap(snap ? Math.PI / 36 : null);
            }
            if (ui_1.default.cameraMode === "2D") {
                engine.cameraActor.getLocalPosition(gridPosition);
                gridPosition.x -= gridPosition.x % ui_1.default.gridStep;
                gridPosition.y -= gridPosition.y % ui_1.default.gridStep;
                gridPosition.z = 0;
                gridActor.setLocalPosition(gridPosition);
            }
        }
        // Mouse picking
        const mousePosition = new THREE.Vector2;
        const raycaster = new THREE.Raycaster;

        function mouseUp() {
            if (draggingControls) {
                draggingControls = false;
                return;
            }
            mousePosition.x = engine.gameInstance.input.mousePosition.x / canvasElt.clientWidth * 2 - 1;
            mousePosition.y = -(engine.gameInstance.input.mousePosition.y / canvasElt.clientHeight * 2 - 1);
            raycaster.setFromCamera(mousePosition, engine.cameraComponent.threeCamera);
            let selectedNodeId = ui_1.default.nodesTreeView.selectedNodes.length > 0 ? ui_1.default.nodesTreeView.selectedNodes[0].dataset["id"] : null;
            ui_1.default.nodesTreeView.clearSelection();
            const intersects = raycaster.intersectObject(engine.gameInstance.threeScene, true);
            if (intersects.length > 0) {
                const hoveredNodeIds = [];
                for (const intersect of intersects) {
                    let threeObject = intersect.object;
                    while (threeObject != null) {
                        if (threeObject.userData.nodeId != null) {
                            if (hoveredNodeIds.indexOf(threeObject.userData.nodeId) === -1)
                                hoveredNodeIds.push(threeObject.userData.nodeId);
                            break;
                        }
                        threeObject = threeObject.parent;
                    }
                }
                if (hoveredNodeIds.length > 0) {
                    const hoveredNodeIdIndex = hoveredNodeIds.indexOf(selectedNodeId);
                    if (selectedNodeId != null && hoveredNodeIdIndex !== -1 && hoveredNodeIdIndex !== hoveredNodeIds.length - 1)
                        selectedNodeId = hoveredNodeIds[hoveredNodeIdIndex + 1];
                    else
                        selectedNodeId = hoveredNodeIds[0];
                    const treeViewNode = ui_1.default.nodesTreeView.treeRoot.querySelector(`li[data-id='${selectedNodeId}']`);
                    ui_1.default.nodesTreeView.addToSelection(treeViewNode);
                    let treeViewParent = treeViewNode.parentElement;
                    while (treeViewParent !== ui_1.default.nodesTreeView.treeRoot) {
                        if (treeViewParent.tagName === "OL")
                            treeViewParent.previousElementSibling.classList.remove("collapsed");
                        treeViewParent = treeViewParent.parentElement;
                    }
                    ui_1.default.nodesTreeView.scrollIntoView(treeViewNode);
                }
            }
            ui_1.setupSelectedNode();
            setupHelpers();
            if (engine.gameInstance.input.mouseButtons[0].doubleClicked) {
                focusActor(selectedNodeId);
                engine.gameInstance.input.mouseButtons[0].doubleClicked = false;
            }
        }

        function focusActor(selectedNodeId) {
            const position = new THREE.Box3().setFromObject(network_1.data.sceneUpdater.bySceneNodeId[selectedNodeId].actor.threeObject).getCenter();
            if (ui_1.default.cameraMode === "2D")
                position.z = engine.cameraActor.getLocalPosition(new THREE.Vector3()).z;
            engine.cameraActor.setLocalPosition(position);
            if (ui_1.default.cameraMode === "3D")
                engine.cameraActor.moveOriented(new THREE.Vector3(0, 0, 20));
        }
        exports.focusActor = focusActor;

        function setupHelpers() {
            const nodeElt = ui_1.default.nodesTreeView.selectedNodes[0];
            if (nodeElt != null && ui_1.default.nodesTreeView.selectedNodes.length === 1) {
                engine.selectionBoxComponent.setTarget(network_1.data.sceneUpdater.bySceneNodeId[nodeElt.dataset["id"]].actor.threeObject);
                engine.transformHandleComponent.setTarget(network_1.data.sceneUpdater.bySceneNodeId[nodeElt.dataset["id"]].actor.threeObject);
            } else {
                engine.selectionBoxComponent.setTarget(null);
                engine.transformHandleComponent.setTarget(null);
            }
        }
        exports.setupHelpers = setupHelpers;

        function onTransformChange() {
            const nodeElt = ui_1.default.nodesTreeView.selectedNodes[0];
            const nodeId = nodeElt.dataset["id"];
            const target = network_1.data.sceneUpdater.bySceneNodeId[nodeId].actor;
            const object = engine.transformHandleComponent.control.object;
            let transformType;
            let value;
            switch (engine.transformHandleComponent.mode) {
                case "translate":
                    {
                        transformType = "position";
                        const position = object.getWorldPosition();
                        if (target.parent != null) {
                            const mtx = target.parent.getGlobalMatrix(new THREE.Matrix4());
                            mtx.getInverse(mtx);
                            position.applyMatrix4(mtx);
                        }
                        value = { x: position.x, y: position.y, z: position.z };
                    }
                    break;
                case "rotate":
                    {
                        transformType = "orientation";
                        const orientation = object.getWorldQuaternion();
                        if (target.parent != null) {
                            const q = target.parent.getGlobalOrientation(new THREE.Quaternion()).inverse();
                            orientation.multiply(q);
                        }
                        value = { x: orientation.x, y: orientation.y, z: orientation.z, w: orientation.w };
                    }
                    break;
                case "scale":
                    {
                        transformType = "scale";
                        value = { x: object.scale.x, y: object.scale.y, z: object.scale.z };
                    }
                    break;
            }
            network_1.data.projectClient.editAsset(SupClient.query.asset, "setNodeProperty", nodeId, transformType, value);
        }

    }, { "./network": 10, "./ui": 11 }],
    9: [function(require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        require("./network");

    }, { "./network": 10 }],
    10: [function(require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        const ui_1 = require("./ui");
        const engine_1 = require("./engine");
        const async = require("async");
        const THREE = SupEngine.THREE;
        const SceneUpdater_1 = require("../../components/SceneUpdater");
        exports.socket = SupClient.connect(SupClient.query.project);
        exports.socket.on("welcome", onWelcome);
        exports.socket.on("disconnect", SupClient.onDisconnected);
        let sceneSettingSubscriber;
        let gameSettingSubscriber;
        // TODO
        const onEditCommands = {};

        function onWelcome() {
            exports.data = { projectClient: new SupClient.ProjectClient(exports.socket, { subEntries: true }) };
            loadPlugins((err) => {
                exports.data.projectClient.subResource("sceneSettings", sceneSettingSubscriber);
                exports.data.projectClient.subResource("gameSettings", gameSettingSubscriber);
                const subscriber = {
                    onAssetReceived: onSceneAssetReceived,
                    onAssetEdited: (assetId, command, ...args) => {
                        if (onEditCommands[command] != null)
                            onEditCommands[command](...args);
                    },
                    onAssetTrashed: SupClient.onAssetTrashed
                };
                exports.data.sceneUpdater = new SceneUpdater_1.default(exports.data.projectClient, { gameInstance: engine_1.default.gameInstance, actor: null }, { sceneAssetId: SupClient.query.asset, isInPrefab: false }, subscriber);
            });
        }

        function loadPlugins(callback) {
            const i18nFiles = [];
            i18nFiles.push({ root: `${window.location.pathname}/../..`, name: "sceneEditor" });
            SupClient.fetch(`/systems/${SupCore.system.id}/plugins.json`, "json", (err, pluginsInfo) => {
                for (const pluginName of pluginsInfo.list) {
                    const root = `/systems/${SupCore.system.id}/plugins/${pluginName}`;
                    i18nFiles.push({ root, name: "componentEditors" });
                }
                async.parallel([
                    (cb) => {
                        SupClient.i18n.load(i18nFiles, cb);
                    }, (cb) => {
                        async.each(pluginsInfo.list, (pluginName, cb) => {
                            const pluginPath = `/systems/${SupCore.system.id}/plugins/${pluginName}`;
                            async.each(["data", "components", "componentConfigs", "componentEditors"], (name, cb) => {
                                SupClient.loadScript(`${pluginPath}/bundles/${name}.js`, cb);
                            }, cb);
                        }, cb);
                    }
                ], callback);
            });
        }

        function startIfReady() {
            if (exports.data.sceneUpdater != null && exports.data.sceneUpdater.sceneAsset != null &&
                exports.data.sceneSettingsResource != null && exports.data.gameSettingsResource != null) {
                engine_1.start();
                ui_1.start();
                ui_1.setCameraMode(exports.data.sceneSettingsResource.pub.defaultCameraMode);
                ui_1.setCameraVerticalAxis(exports.data.sceneSettingsResource.pub.defaultVerticalAxis);
                ui_1.setupInspectorLayers();
            }
        }
        sceneSettingSubscriber = {
            onResourceReceived: (resourceId, resource) => {
                exports.data.sceneSettingsResource = resource;
                startIfReady();
            },
            onResourceEdited: (resourceId, command, propertyName) => {}
        };
        gameSettingSubscriber = {
            onResourceReceived: (resourceId, resource) => {
                exports.data.gameSettingsResource = resource;
                startIfReady();
            },
            onResourceEdited: (resourceId, command, propertyName) => {
                if (propertyName === "customLayers")
                    ui_1.setupInspectorLayers();
            }
        };

        function onSceneAssetReceived( /*err: string, asset: SceneAsset*/ ) {
            // Clear tree view
            ui_1.default.nodesTreeView.clearSelection();
            ui_1.default.nodesTreeView.treeRoot.innerHTML = "";
            const box = {
                x: { min: Infinity, max: -Infinity },
                y: { min: Infinity, max: -Infinity },
                z: { min: Infinity, max: -Infinity },
            };
            const pos = new THREE.Vector3();

            function walk(node, parentNode, parentElt) {
                const liElt = ui_1.createNodeElement(node);
                ui_1.default.nodesTreeView.append(liElt, "group", parentElt);
                if (node.children != null && node.children.length > 0) {
                    liElt.classList.add("collapsed");
                    for (const child of node.children)
                        walk(child, node, liElt);
                }
                // Compute scene bounding box
                exports.data.sceneUpdater.bySceneNodeId[node.id].actor.getGlobalPosition(pos);
                box.x.min = Math.min(box.x.min, pos.x);
                box.x.max = Math.max(box.x.max, pos.x);
                box.y.min = Math.min(box.y.min, pos.y);
                box.y.max = Math.max(box.y.max, pos.y);
                box.z.min = Math.min(box.z.min, pos.z);
                box.z.max = Math.max(box.z.max, pos.z);
            }
            for (const node of exports.data.sceneUpdater.sceneAsset.nodes.pub)
                walk(node, null, null);
            // Place camera so that it fits the scene
            if (exports.data.sceneUpdater.sceneAsset.nodes.pub.length > 0) {
                const z = box.z.max + 10;
                engine_1.default.cameraActor.setLocalPosition(new THREE.Vector3((box.x.min + box.x.max) / 2, (box.y.min + box.y.max) / 2, z));
                ui_1.default.camera2DZ.value = z.toString();
            }
            startIfReady();
        }
        const addNode = onEditCommands["addNode"] = (node, parentId, index) => {
            const nodeElt = ui_1.createNodeElement(node);
            let parentElt;
            if (parentId != null)
                parentElt = ui_1.default.nodesTreeView.treeRoot.querySelector(`[data-id='${parentId}']`);
            ui_1.default.nodesTreeView.insertAt(nodeElt, "group", index, parentElt);
        };
        onEditCommands["moveNode"] = (id, parentId, index) => {
            // Reparent tree node
            const nodeElt = ui_1.default.nodesTreeView.treeRoot.querySelector(`[data-id='${id}']`);
            const isInspected = ui_1.default.nodesTreeView.selectedNodes.length === 1 && nodeElt === ui_1.default.nodesTreeView.selectedNodes[0];
            let parentElt;
            if (parentId != null)
                parentElt = ui_1.default.nodesTreeView.treeRoot.querySelector(`[data-id='${parentId}']`);
            ui_1.default.nodesTreeView.insertAt(nodeElt, "group", index, parentElt);
            // Refresh inspector
            if (isInspected) {
                const node = exports.data.sceneUpdater.sceneAsset.nodes.byId[id];
                ui_1.setInspectorPosition(node.position);
                ui_1.setInspectorOrientation(node.orientation);
                ui_1.setInspectorScale(node.scale);
            }
            // TODO: Only refresh if selection is affected
            engine_1.setupHelpers();
        };
        onEditCommands["setNodeProperty"] = (id, path, value) => {
            const nodeElt = ui_1.default.nodesTreeView.treeRoot.querySelector(`[data-id='${id}']`);
            const isInspected = ui_1.default.nodesTreeView.selectedNodes.length === 1 && nodeElt === ui_1.default.nodesTreeView.selectedNodes[0];
            const node = exports.data.sceneUpdater.sceneAsset.nodes.byId[id];
            switch (path) {
                case "name":
                    nodeElt.querySelector(".name").textContent = value;
                    break;
                case "position":
                    if (isInspected)
                        ui_1.setInspectorPosition(node.position);
                    break;
                case "orientation":
                    if (isInspected)
                        ui_1.setInspectorOrientation(node.orientation);
                    break;
                case "scale":
                    if (isInspected)
                        ui_1.setInspectorScale(node.scale);
                    break;
                case "visible":
                    if (isInspected)
                        ui_1.setInspectorVisible(value);
                    break;
                case "layer":
                    if (isInspected)
                        ui_1.setInspectorLayer(value);
                    break;
                case "prefab.sceneAssetId":
                    if (isInspected)
                        ui_1.setInspectorPrefabScene(value);
                    break;
            }
            // TODO: Only refresh if selection is affected
            engine_1.setupHelpers();
        };
        onEditCommands["duplicateNode"] = (rootNode, newNodes) => {
            for (const newNode of newNodes)
                addNode(newNode.node, newNode.parentId, newNode.index);
            // TODO: Only refresh if selection is affected
            engine_1.setupHelpers();
        };
        onEditCommands["removeNode"] = (id) => {
            const nodeElt = ui_1.default.nodesTreeView.treeRoot.querySelector(`[data-id='${id}']`);
            const isInspected = ui_1.default.nodesTreeView.selectedNodes.length === 1 && nodeElt === ui_1.default.nodesTreeView.selectedNodes[0];
            ui_1.default.nodesTreeView.remove(nodeElt);
            if (isInspected)
                ui_1.setupSelectedNode();
            // TODO: Only refresh if selection is affected
            else
                engine_1.setupHelpers();
        };
        onEditCommands["addComponent"] = (nodeComponent, nodeId, index) => {
            const isInspected = ui_1.default.nodesTreeView.selectedNodes.length === 1 && nodeId === ui_1.default.nodesTreeView.selectedNodes[0].dataset["id"];
            if (isInspected) {
                const componentElt = ui_1.createComponentElement(nodeId, nodeComponent);
                // TODO: Take index into account
                ui_1.default.inspectorElt.querySelector(".components").appendChild(componentElt);
            }
            // TODO: Only refresh if selection is affected
            engine_1.setupHelpers();
        };
        onEditCommands["editComponent"] = (nodeId, componentId, command, ...args) => {
            const isInspected = ui_1.default.nodesTreeView.selectedNodes.length === 1 && nodeId === ui_1.default.nodesTreeView.selectedNodes[0].dataset["id"];
            if (isInspected) {
                const componentEditor = ui_1.default.componentEditors[componentId];
                const commandFunction = componentEditor[`config_${command}`];
                if (commandFunction != null)
                    commandFunction.apply(componentEditor, args);
            }
            // TODO: Only refresh if selection is affected
            engine_1.setupHelpers();
        };
        onEditCommands["removeComponent"] = (nodeId, componentId) => {
            const isInspected = ui_1.default.nodesTreeView.selectedNodes.length === 1 && nodeId === ui_1.default.nodesTreeView.selectedNodes[0].dataset["id"];
            if (isInspected) {
                ui_1.default.componentEditors[componentId].destroy();
                delete ui_1.default.componentEditors[componentId];
                const componentElt = ui_1.default.inspectorElt.querySelector(`.components > div[data-component-id='${componentId}']`);
                componentElt.parentElement.removeChild(componentElt);
            }
            // TODO: Only refresh if selection is affected
            engine_1.setupHelpers();
        };

    }, { "../../components/SceneUpdater": 7, "./engine": 8, "./ui": 11, "async": 1 }],
    11: [function(require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        const network_1 = require("./network");
        const engine_1 = require("./engine");
        const TreeView = require("dnd-tree-view");
        const ResizeHandle = require("resize-handle");
        const THREE = SupEngine.THREE;
        const ui = {};
        exports.default = ui;
        // Hotkeys
        document.addEventListener("keydown", (event) => {
            if (document.querySelector(".dialog") != null)
                return;
            let activeElement = document.activeElement;
            while (activeElement != null) {
                if (activeElement === ui.canvasElt || activeElement === ui.treeViewElt)
                    break;
                activeElement = activeElement.parentElement;
            }
            if (activeElement == null)
                return;
            if (event.keyCode === 78 && (event.ctrlKey || event.metaKey)) { // Ctrl+N
                event.preventDefault();
                event.stopPropagation();
                onNewNodeClick();
            }
            if (event.keyCode === 80 && (event.ctrlKey || event.metaKey)) { // Ctrl+P
                event.preventDefault();
                event.stopPropagation();
                onNewPrefabClick();
            }
            if (event.keyCode === 113) { // F2
                event.preventDefault();
                event.stopPropagation();
                onRenameNodeClick();
            }
            if (event.keyCode === 68 && (event.ctrlKey || event.metaKey)) { // Ctrl+D
                event.preventDefault();
                event.stopPropagation();
                onDuplicateNodeClick();
            }
            if (event.keyCode === 46) { // Delete
                event.preventDefault();
                event.stopPropagation();
                onDeleteNodeClick();
            }
        });
        const ignoredTagNames = ["INPUT", "TEXTAREA", "SELECT", "BUTTON"];
        document.addEventListener("keydown", (event) => {
            if (document.querySelector("body > .dialog") != null)
                return;
            if (ignoredTagNames.indexOf(event.target.tagName) !== -1)
                return;
            switch (event.keyCode) {
                case window.KeyEvent.DOM_VK_E:
                    document.getElementById(`transform-mode-translate`).checked = true;
                    engine_1.default.transformHandleComponent.setMode("translate");
                    break;
                case window.KeyEvent.DOM_VK_R:
                    document.getElementById(`transform-mode-rotate`).checked = true;
                    engine_1.default.transformHandleComponent.setMode("rotate");
                    break;
                case window.KeyEvent.DOM_VK_T:
                    document.getElementById(`transform-mode-scale`).checked = true;
                    engine_1.default.transformHandleComponent.setMode("scale");
                    break;
                case window.KeyEvent.DOM_VK_L:
                    const localElt = document.getElementById(`transform-space`);
                    localElt.checked = !localElt.checked;
                    engine_1.default.transformHandleComponent.setSpace(localElt.checked ? "local" : "world");
                    break;
                case window.KeyEvent.DOM_VK_G:
                    ui.gridCheckbox.checked = !ui.gridCheckbox.checked;
                    engine_1.default.gridHelperComponent.setVisible(ui.gridCheckbox.checked);
                    break;
                case window.KeyEvent.DOM_VK_F:
                    if (ui.nodesTreeView.selectedNodes.length !== 1)
                        return;
                    const nodeId = ui.nodesTreeView.selectedNodes[0].dataset["id"];
                    engine_1.focusActor(nodeId);
                    break;
            }
        });
        ui.canvasElt = document.querySelector("canvas");
        ui.actorDropElt = document.querySelector(".render-area .drop-asset-container");
        ui.componentDropElt = document.querySelector(".transform-area .drop-asset-container");
        // Setup resizable panes
        new ResizeHandle(document.querySelector(".sidebar"), "right");
        new ResizeHandle(document.querySelector(".nodes-tree-view"), "top");
        // Setup tree view
        ui.treeViewElt = document.querySelector(".nodes-tree-view");
        ui.nodesTreeView = new TreeView(ui.treeViewElt, { dragStartCallback: () => true, dropCallback: onNodesTreeViewDrop });
        ui.nodesTreeView.on("activate", onNodeActivate);
        ui.nodesTreeView.on("selectionChange", () => { setupSelectedNode(); });
        ui.newActorButton = document.querySelector("button.new-actor");
        ui.newActorButton.addEventListener("click", onNewNodeClick);
        ui.newPrefabButton = document.querySelector("button.new-prefab");
        ui.newPrefabButton.addEventListener("click", onNewPrefabClick);
        ui.renameNodeButton = document.querySelector("button.rename-node");
        ui.renameNodeButton.addEventListener("click", onRenameNodeClick);
        ui.duplicateNodeButton = document.querySelector("button.duplicate-node");
        ui.duplicateNodeButton.addEventListener("click", onDuplicateNodeClick);
        ui.deleteNodeButton = document.querySelector("button.delete-node");
        ui.deleteNodeButton.addEventListener("click", onDeleteNodeClick);
        // Inspector
        ui.inspectorElt = document.querySelector(".inspector");
        ui.inspectorTbodyElt = ui.inspectorElt.querySelector("tbody");
        ui.transform = {
            positionElts: ui.inspectorElt.querySelectorAll(".transform .position input"),
            orientationElts: ui.inspectorElt.querySelectorAll(".transform .orientation input"),
            scaleElts: ui.inspectorElt.querySelectorAll(".transform .scale input"),
        };
        ui.visibleCheckbox = ui.inspectorElt.querySelector(".visible input");
        ui.visibleCheckbox.addEventListener("change", onVisibleChange);
        ui.layerSelect = ui.inspectorElt.querySelector(".layer select");
        ui.layerSelect.addEventListener("change", onLayerChange);
        ui.prefabRow = ui.inspectorElt.querySelector(".prefab");
        ui.prefabInput = ui.inspectorElt.querySelector(".prefab input");
        ui.prefabInput.addEventListener("input", onPrefabInput);
        ui.prefabOpenElt = ui.inspectorElt.querySelector(".prefab button");
        ui.prefabOpenElt.addEventListener("click", (event) => {
            const selectedNode = ui.nodesTreeView.selectedNodes[0];
            const node = network_1.data.sceneUpdater.sceneAsset.nodes.byId[selectedNode.dataset["id"]];
            const id = node.prefab.sceneAssetId;
            SupClient.openEntry(id);
        });
        for (const transformType in ui.transform) {
            const inputs = ui.transform[transformType];
            for (const input of inputs)
                input.addEventListener("change", onTransformInputChange);
        }
        ui.newComponentButton = document.querySelector("button.new-component");
        ui.newComponentButton.addEventListener("click", onNewComponentClick);
        ui.cameraMode = "3D";
        ui.cameraModeButton = document.getElementById("toggle-camera-button");
        ui.cameraModeButton.addEventListener("click", onChangeCameraMode);
        ui.cameraVerticalAxis = "Y";
        ui.cameraVerticalAxisButton = document.getElementById("toggle-camera-vertical-axis");
        ui.cameraVerticalAxisButton.addEventListener("click", onChangeCameraVerticalAxis);
        ui.cameraSpeedSlider = document.getElementById("camera-speed-slider");
        ui.cameraSpeedSlider.addEventListener("input", onChangeCameraSpeed);
        ui.cameraSpeedSlider.value = engine_1.default.cameraControls.movementSpeed;
        ui.camera2DZ = document.getElementById("camera-2d-z");
        ui.camera2DZ.addEventListener("input", onChangeCamera2DZ);
        document.querySelector(".main .controls .transform-mode").addEventListener("click", onTransformModeClick);
        ui.componentsElt = ui.inspectorElt.querySelector(".components");
        ui.availableComponents = {};
        let componentEditorPlugins;

        function start() {
            componentEditorPlugins = SupClient.getPlugins("componentEditors");
            SupClient.setupHelpCallback(() => {
                window.parent.postMessage({ type: "openTool", name: "documentation", state: { section: "scene" } }, window.location.origin);
            });
            const componentTypes = Object.keys(componentEditorPlugins);
            componentTypes.sort((a, b) => {
                const componentLabelA = SupClient.i18n.t(`componentEditors:${a}.label`);
                const componentLabelB = SupClient.i18n.t(`componentEditors:${b}.label`);
                return componentLabelA.localeCompare(componentLabelB);
            });
            for (const componentType of componentTypes)
                ui.availableComponents[componentType] = SupClient.i18n.t(`componentEditors:${componentType}.label`);
            document.addEventListener("dragover", onDragOver);
            document.addEventListener("drop", onStopDrag);
            ui.actorDropElt.addEventListener("dragenter", onActorDragEnter);
            ui.actorDropElt.addEventListener("dragleave", onActorDragLeave);
            ui.actorDropElt.addEventListener("drop", onActorDrop);
            ui.componentDropElt.addEventListener("dragenter", onComponentDragEnter);
            ui.componentDropElt.addEventListener("dragleave", onComponentDragLeave);
            ui.componentDropElt.addEventListener("drop", onComponentDrop);
            document.querySelector(".main .loading").hidden = true;
            document.querySelector(".main .controls").hidden = false;
            document.querySelector(".render-area").hidden = false;
            ui.newActorButton.disabled = false;
            ui.newPrefabButton.disabled = false;
        }
        exports.start = start;
        // Transform
        function onTransformModeClick(event) {
            if (event.target.tagName !== "INPUT")
                return;
            if (event.target.id === "transform-space") {
                engine_1.default.transformHandleComponent.setSpace(event.target.checked ? "local" : "world");
            } else {
                const transformSpaceCheckbox = document.getElementById("transform-space");
                transformSpaceCheckbox.disabled = event.target.value === "scale";
                engine_1.default.transformHandleComponent.setMode(event.target.value);
            }
        }
        // Grid
        ui.gridCheckbox = document.getElementById("grid-visible");
        ui.gridCheckbox.addEventListener("change", onGridVisibleChange);
        ui.gridSize = 80;
        ui.gridStep = 1;
        document.getElementById("grid-step").addEventListener("input", onGridStepInput);

        function onGridStepInput(event) {
            const target = event.target;
            let value = parseFloat(target.value);
            if (value !== 0 && value < 0.0001) {
                value = 0;
                target.value = "0";
            }
            if (isNaN(value) || value <= 0) {
                target.reportValidity();
                return;
            }
            ui.gridStep = value;
            engine_1.default.gridHelperComponent.setup(ui.gridSize, ui.gridStep);
        }

        function onGridVisibleChange(event) {
            engine_1.default.gridHelperComponent.setVisible(event.target.checked);
        }
        // Light
        document.getElementById("show-light").addEventListener("change", (event) => {
            if (event.target.checked)
                engine_1.default.gameInstance.threeScene.add(engine_1.default.ambientLight);
            else
                engine_1.default.gameInstance.threeScene.remove(engine_1.default.ambientLight);
        });

        function createNodeElement(node) {
            const liElt = document.createElement("li");
            liElt.dataset["id"] = node.id;
            const nameSpan = document.createElement("span");
            nameSpan.classList.add("name");
            if (node.prefab != null)
                nameSpan.classList.add("prefab");
            nameSpan.textContent = node.name;
            liElt.appendChild(nameSpan);
            const visibleButton = document.createElement("button");
            visibleButton.textContent = SupClient.i18n.t("sceneEditor:treeView.visible.hide");
            visibleButton.classList.add("show");
            visibleButton.addEventListener("click", (event) => {
                event.stopPropagation();
                const actor = network_1.data.sceneUpdater.bySceneNodeId[event.target.parentElement.dataset["id"]].actor;
                actor.threeObject.visible = !actor.threeObject.visible;
                const visible = actor.threeObject.visible ? "hide" : "show";
                visibleButton.textContent = SupClient.i18n.t(`sceneEditor:treeView.visible.${visible}`);
                if (actor.threeObject.visible)
                    visibleButton.classList.add("show");
                else
                    visibleButton.classList.remove("show");
            });
            liElt.appendChild(visibleButton);
            return liElt;
        }
        exports.createNodeElement = createNodeElement;

        function onNodesTreeViewDrop(event, dropLocation, orderedNodes) {
            if (orderedNodes == null)
                return false;
            const dropPoint = SupClient.getTreeViewDropPoint(dropLocation, network_1.data.sceneUpdater.sceneAsset.nodes);
            const nodeIds = [];
            for (const node of orderedNodes)
                nodeIds.push(node.dataset["id"]);
            const sourceParentNode = network_1.data.sceneUpdater.sceneAsset.nodes.parentNodesById[nodeIds[0]];
            const sourceChildren = (sourceParentNode != null && sourceParentNode.children != null) ? sourceParentNode.children : network_1.data.sceneUpdater.sceneAsset.nodes.pub;
            const sameParent = (sourceParentNode != null && dropPoint.parentId === sourceParentNode.id);
            let i = 0;
            for (const id of nodeIds) {
                network_1.data.projectClient.editAsset(SupClient.query.asset, "moveNode", id, dropPoint.parentId, dropPoint.index + i);
                if (!sameParent || sourceChildren.indexOf(network_1.data.sceneUpdater.sceneAsset.nodes.byId[id]) >= dropPoint.index)
                    i++;
            }
            return false;
        }

        function onNodeActivate() {
            // Focus an actor by double clicking on treeview
            if (ui.nodesTreeView.selectedNodes.length !== 1)
                return;
            const nodeId = ui.nodesTreeView.selectedNodes[0].dataset["id"];
            engine_1.focusActor(nodeId);
        }

        function setupSelectedNode() {
            engine_1.setupHelpers();
            // Clear component editors
            for (const componentId in ui.componentEditors)
                ui.componentEditors[componentId].destroy();
            ui.componentEditors = {};
            // Setup transform
            const nodeElt = ui.nodesTreeView.selectedNodes[0];
            if (nodeElt == null || ui.nodesTreeView.selectedNodes.length !== 1) {
                ui.inspectorElt.hidden = true;
                ui.newActorButton.disabled = false;
                ui.newPrefabButton.disabled = false;
                ui.renameNodeButton.disabled = true;
                ui.duplicateNodeButton.disabled = true;
                ui.deleteNodeButton.disabled = true;
                return;
            }
            ui.inspectorElt.hidden = false;
            const node = network_1.data.sceneUpdater.sceneAsset.nodes.byId[nodeElt.dataset["id"]];
            setInspectorPosition(node.position);
            setInspectorOrientation(node.orientation);
            setInspectorScale(node.scale);
            ui.visibleCheckbox.checked = node.visible;
            ui.layerSelect.value = node.layer.toString();
            // If it's a prefab, disable various buttons
            const isPrefab = node.prefab != null;
            ui.newActorButton.disabled = isPrefab;
            ui.newPrefabButton.disabled = isPrefab;
            ui.renameNodeButton.disabled = false;
            ui.duplicateNodeButton.disabled = false;
            ui.deleteNodeButton.disabled = false;
            if (isPrefab) {
                if (ui.prefabRow.parentElement == null)
                    ui.inspectorTbodyElt.appendChild(ui.prefabRow);
                setInspectorPrefabScene(node.prefab.sceneAssetId);
            } else if (ui.prefabRow.parentElement != null)
                ui.inspectorTbodyElt.removeChild(ui.prefabRow);
            // Setup component editors
            ui.componentsElt.innerHTML = "";
            for (const component of node.components) {
                const componentElt = createComponentElement(node.id, component);
                ui.componentsElt.appendChild(componentElt);
            }
            ui.newComponentButton.disabled = isPrefab;
        }
        exports.setupSelectedNode = setupSelectedNode;

        function roundForInspector(number) { return parseFloat(number.toFixed(3)); }

        function setInspectorPosition(position) {
            const values = [
                roundForInspector(position.x).toString(),
                roundForInspector(position.y).toString(),
                roundForInspector(position.z).toString()
            ];
            for (let i = 0; i < 3; i++) {
                // NOTE: This helps avoid clearing selection when possible
                if (ui.transform.positionElts[i].value !== values[i]) {
                    ui.transform.positionElts[i].value = values[i];
                }
            }
        }
        exports.setInspectorPosition = setInspectorPosition;

        function setInspectorOrientation(orientation) {
            const euler = new THREE.Euler().setFromQuaternion(orientation);
            const values = [
                roundForInspector(THREE.Math.radToDeg(euler.x)).toString(),
                roundForInspector(THREE.Math.radToDeg(euler.y)).toString(),
                roundForInspector(THREE.Math.radToDeg(euler.z)).toString()
            ];
            // Work around weird conversion from quaternion to euler conversion
            if (values[1] === "180" && values[2] === "180") {
                values[0] = roundForInspector(180 - THREE.Math.radToDeg(euler.x)).toString();
                values[1] = "0";
                values[2] = "0";
            }
            for (let i = 0; i < 3; i++) {
                // NOTE: This helps avoid clearing selection when possible
                if (ui.transform.orientationElts[i].value !== values[i]) {
                    ui.transform.orientationElts[i].value = values[i];
                }
            }
        }
        exports.setInspectorOrientation = setInspectorOrientation;

        function setInspectorScale(scale) {
            const values = [
                roundForInspector(scale.x).toString(),
                roundForInspector(scale.y).toString(),
                roundForInspector(scale.z).toString()
            ];
            for (let i = 0; i < 3; i++) {
                // NOTE: This helps avoid clearing selection when possible
                if (ui.transform.scaleElts[i].value !== values[i]) {
                    ui.transform.scaleElts[i].value = values[i];
                }
            }
        }
        exports.setInspectorScale = setInspectorScale;

        function setInspectorVisible(visible) {
            ui.visibleCheckbox.checked = visible;
        }
        exports.setInspectorVisible = setInspectorVisible;

        function setInspectorLayer(layer) {
            ui.layerSelect.value = layer.toString();
        }
        exports.setInspectorLayer = setInspectorLayer;

        function setupInspectorLayers() {
            while (ui.layerSelect.childElementCount > network_1.data.gameSettingsResource.pub.customLayers.length + 1)
                ui.layerSelect.removeChild(ui.layerSelect.lastElementChild);
            let optionElt = ui.layerSelect.firstElementChild.nextElementSibling;
            for (let i = 0; i < network_1.data.gameSettingsResource.pub.customLayers.length; i++) {
                if (optionElt == null) {
                    optionElt = document.createElement("option");
                    ui.layerSelect.appendChild(optionElt);
                }
                optionElt.value = (i + 1).toString(); // + 1 because "Default" is 0
                optionElt.textContent = network_1.data.gameSettingsResource.pub.customLayers[i];
                optionElt = optionElt.nextElementSibling;
            }
        }
        exports.setupInspectorLayers = setupInspectorLayers;

        function setInspectorPrefabScene(sceneAssetId) {
            if (sceneAssetId != null && network_1.data.projectClient.entries.byId[sceneAssetId] != null) {
                ui.prefabInput.value = network_1.data.projectClient.entries.getPathFromId(sceneAssetId);
                ui.prefabOpenElt.disabled = false;
            } else {
                ui.prefabInput.value = "";
                ui.prefabOpenElt.disabled = true;
            }
        }
        exports.setInspectorPrefabScene = setInspectorPrefabScene;

        function onNewNodeClick() {
            const options = {
                initialValue: SupClient.i18n.t("sceneEditor:treeView.newActor.initialValue"),
                validationLabel: SupClient.i18n.t("common:actions.create"),
                pattern: SupClient.namePattern,
                title: SupClient.i18n.t("common:namePatternDescription")
            };
            new SupClient.Dialogs.PromptDialog(SupClient.i18n.t("sceneEditor:treeView.newActor.prompt"), options, (name) => {
                if (name == null)
                    return;
                createNewNode(name, false);
            });
        }

        function onNewPrefabClick() {
            const options = {
                initialValue: SupClient.i18n.t("sceneEditor:treeView.newPrefab.initialValue"),
                validationLabel: SupClient.i18n.t("common:actions.create"),
                pattern: SupClient.namePattern,
                title: SupClient.i18n.t("common:namePatternDescription")
            };
            new SupClient.Dialogs.PromptDialog(SupClient.i18n.t("sceneEditor:treeView.newPrefab.prompt"), options, (name) => {
                if (name == null)
                    return;
                createNewNode(name, true);
            });
        }

        function createNewNode(name, prefab) {
            const options = SupClient.getTreeViewInsertionPoint(ui.nodesTreeView);
            const offset = new THREE.Vector3(0, 0, -10).applyQuaternion(engine_1.default.cameraActor.getGlobalOrientation(new THREE.Quaternion()));
            const position = new THREE.Vector3();
            engine_1.default.cameraActor.getGlobalPosition(position).add(offset);
            if (options.parentId != null) {
                const parentMatrix = network_1.data.sceneUpdater.bySceneNodeId[options.parentId].actor.getGlobalMatrix(new THREE.Matrix4());
                position.applyMatrix4(parentMatrix.getInverse(parentMatrix));
            }
            options.transform = { position };
            options.prefab = prefab;
            network_1.data.projectClient.editAsset(SupClient.query.asset, "addNode", name, options, (nodeId) => {
                ui.nodesTreeView.clearSelection();
                ui.nodesTreeView.addToSelection(ui.nodesTreeView.treeRoot.querySelector(`li[data-id='${nodeId}']`));
                setupSelectedNode();
            });
        }

        function onRenameNodeClick() {
            if (ui.nodesTreeView.selectedNodes.length !== 1)
                return;
            const selectedNode = ui.nodesTreeView.selectedNodes[0];
            const node = network_1.data.sceneUpdater.sceneAsset.nodes.byId[selectedNode.dataset["id"]];
            const options = {
                initialValue: node.name,
                validationLabel: SupClient.i18n.t("common:actions.rename"),
                pattern: SupClient.namePattern,
                title: SupClient.i18n.t("common:namePatternDescription")
            };
            new SupClient.Dialogs.PromptDialog(SupClient.i18n.t("sceneEditor:treeView.renamePrompt"), options, (newName) => {
                if (newName == null)
                    return;
                network_1.data.projectClient.editAsset(SupClient.query.asset, "setNodeProperty", node.id, "name", newName);
            });
        }

        function onDuplicateNodeClick() {
            if (ui.nodesTreeView.selectedNodes.length !== 1)
                return;
            const selectedNode = ui.nodesTreeView.selectedNodes[0];
            const node = network_1.data.sceneUpdater.sceneAsset.nodes.byId[selectedNode.dataset["id"]];
            const options = {
                initialValue: node.name,
                validationLabel: SupClient.i18n.t("common:actions.duplicate"),
                pattern: SupClient.namePattern,
                title: SupClient.i18n.t("common:namePatternDescription")
            };
            new SupClient.Dialogs.PromptDialog(SupClient.i18n.t("sceneEditor:treeView.duplicatePrompt"), options, (newName) => {
                if (newName == null)
                    return;
                const options = SupClient.getTreeViewSiblingInsertionPoint(ui.nodesTreeView);
                network_1.data.projectClient.editAsset(SupClient.query.asset, "duplicateNode", newName, node.id, options.index, (nodeId) => {
                    ui.nodesTreeView.clearSelection();
                    ui.nodesTreeView.addToSelection(ui.nodesTreeView.treeRoot.querySelector(`li[data-id='${nodeId}']`));
                    setupSelectedNode();
                });
            });
        }

        function onDeleteNodeClick() {
            if (ui.nodesTreeView.selectedNodes.length === 0)
                return;
            const confirmLabel = SupClient.i18n.t("sceneEditor:treeView.deleteConfirm");
            const validationLabel = SupClient.i18n.t("common:actions.delete");
            new SupClient.Dialogs.ConfirmDialog(confirmLabel, { validationLabel }, (confirm) => {
                if (!confirm)
                    return;
                for (const selectedNode of ui.nodesTreeView.selectedNodes) {
                    network_1.data.projectClient.editAsset(SupClient.query.asset, "removeNode", selectedNode.dataset["id"]);
                }
            });
        }

        function onTransformInputChange(event) {
            if (ui.nodesTreeView.selectedNodes.length !== 1)
                return;
            const transformType = event.target.parentElement.parentElement.parentElement.className;
            const inputs = ui.transform[`${transformType}Elts`];
            let value = {
                x: parseFloat(inputs[0].value),
                y: parseFloat(inputs[1].value),
                z: parseFloat(inputs[2].value),
            };
            if (transformType === "orientation") {
                const euler = new THREE.Euler(THREE.Math.degToRad(value.x), THREE.Math.degToRad(value.y), THREE.Math.degToRad(value.z));
                const quaternion = new THREE.Quaternion().setFromEuler(euler);
                value = { x: quaternion.x, y: quaternion.y, z: quaternion.z, w: quaternion.w };
            }
            const nodeId = ui.nodesTreeView.selectedNodes[0].dataset["id"];
            network_1.data.projectClient.editAsset(SupClient.query.asset, "setNodeProperty", nodeId, transformType, value);
        }

        function onVisibleChange(event) {
            if (ui.nodesTreeView.selectedNodes.length !== 1)
                return;
            const nodeId = ui.nodesTreeView.selectedNodes[0].dataset["id"];
            network_1.data.projectClient.editAsset(SupClient.query.asset, "setNodeProperty", nodeId, "visible", event.target.checked);
        }

        function onLayerChange(event) {
            if (ui.nodesTreeView.selectedNodes.length !== 1)
                return;
            const nodeId = ui.nodesTreeView.selectedNodes[0].dataset["id"];
            network_1.data.projectClient.editAsset(SupClient.query.asset, "setNodeProperty", nodeId, "layer", parseInt(event.target.value, 10));
        }

        function onPrefabInput(event) {
            if (ui.nodesTreeView.selectedNodes.length !== 1)
                return;
            const nodeId = ui.nodesTreeView.selectedNodes[0].dataset["id"];
            if (event.target.value === "") {
                network_1.data.projectClient.editAsset(SupClient.query.asset, "setNodeProperty", nodeId, "prefab.sceneAssetId", null);
            } else {
                const entry = SupClient.findEntryByPath(network_1.data.projectClient.entries.pub, event.target.value);
                if (entry != null && entry.type === "scene") {
                    network_1.data.projectClient.editAsset(SupClient.query.asset, "setNodeProperty", nodeId, "prefab.sceneAssetId", entry.id);
                }
            }
        }

        function createComponentElement(nodeId, component) {
            const componentElt = document.createElement("div");
            componentElt.dataset["componentId"] = component.id;
            const template = document.getElementById("component-cartridge-template");
            const clone = document.importNode(template.content, true);
            clone.querySelector(".type").textContent = SupClient.i18n.t(`componentEditors:${component.type}.label`);
            const table = clone.querySelector(".settings");
            const editConfig = (command, ...args) => {
                let callback = (err) => {
                    if (err != null)
                        new SupClient.Dialogs.InfoDialog(err);
                };
                // Override callback if one is given
                let lastArg = args[args.length - 1];
                if (typeof lastArg === "function")
                    callback = args.pop();
                // Prevent setting a NaN value
                if (command === "setProperty" && typeof args[1] === "number" && isNaN(args[1]))
                    return;
                network_1.data.projectClient.editAsset(SupClient.query.asset, "editComponent", nodeId, component.id, command, ...args, callback);
            };
            const componentEditorPlugin = componentEditorPlugins[component.type].content;
            ui.componentEditors[component.id] = new componentEditorPlugin(table.querySelector("tbody"), component.config, network_1.data.projectClient, editConfig);
            const shrinkButton = clone.querySelector(".shrink-component");
            shrinkButton.addEventListener("click", () => {
                if (table.style.display === "none") {
                    table.style.display = "";
                    shrinkButton.textContent = "–";
                } else {
                    table.style.display = "none";
                    shrinkButton.textContent = "+";
                }
            });
            clone.querySelector(".delete-component").addEventListener("click", onDeleteComponentClick);
            componentElt.appendChild(clone);
            return componentElt;
        }
        exports.createComponentElement = createComponentElement;

        function onNewComponentClick() {
            const selectLabel = SupClient.i18n.t("sceneEditor:inspector.newComponent.select");
            const validationLabel = SupClient.i18n.t("sceneEditor:inspector.newComponent.validate");
            new SupClient.Dialogs.SelectDialog(selectLabel, ui.availableComponents, { validationLabel, size: 12 }, (type) => {
                if (type == null)
                    return;
                const nodeId = ui.nodesTreeView.selectedNodes[0].dataset["id"];
                network_1.data.projectClient.editAsset(SupClient.query.asset, "addComponent", nodeId, type, null);
            });
        }

        function onDeleteComponentClick(event) {
            const confirmLabel = SupClient.i18n.t("sceneEditor:inspector.deleteComponent.confirm");
            const validationLabel = SupClient.i18n.t("sceneEditor:inspector.deleteComponent.validate");
            new SupClient.Dialogs.ConfirmDialog(confirmLabel, { validationLabel }, (confirm) => {
                if (!confirm)
                    return;
                const nodeId = ui.nodesTreeView.selectedNodes[0].dataset["id"];
                const componentId = event.target.parentElement.parentElement.dataset["componentId"];
                network_1.data.projectClient.editAsset(SupClient.query.asset, "removeComponent", nodeId, componentId);
            });
        }

        function setCameraMode(mode) {
            engine_1.default.gameInstance.destroyComponent(engine_1.default.cameraControls);
            ui.cameraMode = mode;
            document.querySelector(".controls .camera-vertical-axis").hidden = ui.cameraMode !== "3D";
            document.querySelector(".controls .camera-speed").hidden = ui.cameraMode !== "3D";
            document.querySelector(".controls .camera-2d-z").hidden = ui.cameraMode === "3D";
            const axis = ui.cameraMode === "3D" ? ui.cameraVerticalAxis : "Y";
            engine_1.default.cameraRoot.setLocalEulerAngles(new THREE.Euler(axis === "Y" ? 0 : Math.PI / 2, 0, 0));
            engine_1.updateCameraMode();
            ui.cameraModeButton.textContent = ui.cameraMode;
        }
        exports.setCameraMode = setCameraMode;

        function onChangeCameraMode(event) {
            setCameraMode(ui.cameraMode === "3D" ? "2D" : "3D");
        }

        function setCameraVerticalAxis(axis) {
            ui.cameraVerticalAxis = axis;
            engine_1.default.cameraRoot.setLocalEulerAngles(new THREE.Euler(axis === "Y" ? 0 : Math.PI / 2, 0, 0));
            ui.cameraVerticalAxisButton.textContent = axis;
        }
        exports.setCameraVerticalAxis = setCameraVerticalAxis;

        function onChangeCameraVerticalAxis(event) {
            setCameraVerticalAxis(ui.cameraVerticalAxis === "Y" ? "Z" : "Y");
        }

        function onChangeCameraSpeed() {
            engine_1.default.cameraControls.movementSpeed = ui.cameraSpeedSlider.value;
        }

        function onChangeCamera2DZ() {
            const z = parseFloat(ui.camera2DZ.value);
            if (isNaN(z))
                return;
            engine_1.default.cameraActor.threeObject.position.setZ(z);
            engine_1.default.cameraActor.threeObject.updateMatrixWorld(false);
        }
        // Drag'n'drop
        function onDragOver(event) {
            if (network_1.data == null || network_1.data.projectClient.entries == null)
                return;
            // NOTE: We can't use event.dataTransfer.getData() to do an early check here
            // because of browser security restrictions
            ui.actorDropElt.hidden = false;
            if (ui.nodesTreeView.selectedNodes.length === 1) {
                const nodeId = ui.nodesTreeView.selectedNodes[0].dataset["id"];
                const node = network_1.data.sceneUpdater.sceneAsset.nodes.byId[nodeId];
                if (node.prefab == null)
                    ui.componentDropElt.hidden = false;
            }
            // Ensure we're not hovering the nodes tree view or component area
            let ancestorElt = event.target.parentElement;
            let preventDefaultBehavior = true;
            while (ancestorElt != null) {
                if (ancestorElt === ui.componentsElt || ancestorElt === ui.treeViewElt || (ui.componentDropElt.hidden && ancestorElt === ui.prefabRow)) {
                    preventDefaultBehavior = false;
                    break;
                }
                ancestorElt = ancestorElt.parentElement;
            }
            if (preventDefaultBehavior)
                event.preventDefault();
            if (ui.dropTimeout != null)
                clearTimeout(ui.dropTimeout);
            ui.dropTimeout = setTimeout(() => { onStopDrag(); }, 300);
        }

        function onStopDrag() {
            if (ui.dropTimeout != null) {
                clearTimeout(ui.dropTimeout);
                ui.dropTimeout = null;
            }
            ui.actorDropElt.hidden = true;
            ui.actorDropElt.querySelector(".drop-asset-text").classList.toggle("can-drop", false);
            ui.componentDropElt.hidden = true;
            ui.componentDropElt.querySelector(".drop-asset-text").classList.toggle("can-drop", false);
        }

        function onActorDragEnter(event) { ui.actorDropElt.querySelector(".drop-asset-text").classList.toggle("can-drop", true); }

        function onActorDragLeave(event) { ui.actorDropElt.querySelector(".drop-asset-text").classList.toggle("can-drop", false); }

        function onActorDrop(event) {
            if (network_1.data == null || network_1.data.projectClient.entries == null)
                return;
            // TODO: Support importing multiple assets at once
            const entryId = event.dataTransfer.getData("application/vnd.ValjangEngine.entry").split(",")[0];
            if (typeof entryId !== "string")
                return;
            const entry = network_1.data.projectClient.entries.byId[entryId];
            const plugin = SupClient.getPlugins("importIntoScene")[entry.type];
            if (plugin == null || plugin.content.importActor == null) {
                const reason = SupClient.i18n.t("sceneEditor:errors.cantImportAssetTypeIntoScene");
                new SupClient.Dialogs.InfoDialog(SupClient.i18n.t("sceneEditor:failures.importIntoScene", { reason }));
                return;
            }
            event.preventDefault();
            const raycaster = new THREE.Raycaster();
            const mousePosition = { x: (event.clientX / ui.canvasElt.clientWidth) * 2 - 1, y: -(event.clientY / ui.canvasElt.clientHeight) * 2 + 1 };
            raycaster.setFromCamera(mousePosition, engine_1.default.cameraComponent.threeCamera);
            const plane = new THREE.Plane();
            const offset = new THREE.Vector3(0, 0, -10).applyQuaternion(engine_1.default.cameraActor.getGlobalOrientation(new THREE.Quaternion()));
            const planePosition = engine_1.default.cameraActor.getGlobalPosition(new THREE.Vector3()).add(offset);
            plane.setFromNormalAndCoplanarPoint(offset.normalize(), planePosition);
            const position = raycaster.ray.intersectPlane(plane);
            const options = { transform: { position }, prefab: false };
            plugin.content.importActor(entry, network_1.data.projectClient, options, (err, nodeId) => {
                if (err != null) {
                    new SupClient.Dialogs.InfoDialog(SupClient.i18n.t("sceneEditor:failures.importIntoScene", { reason: err }));
                    return;
                }
                ui.nodesTreeView.clearSelection();
                const entryElt = ui.nodesTreeView.treeRoot.querySelector(`li[data-id='${nodeId}']`);
                ui.nodesTreeView.addToSelection(entryElt);
                ui.nodesTreeView.scrollIntoView(entryElt);
                setupSelectedNode();
                ui.canvasElt.focus();
            });
        }

        function onComponentDragEnter(event) { ui.componentDropElt.querySelector(".drop-asset-text").classList.toggle("can-drop", true); }

        function onComponentDragLeave(event) { ui.componentDropElt.querySelector(".drop-asset-text").classList.toggle("can-drop", false); }

        function onComponentDrop(event) {
            if (network_1.data == null || network_1.data.projectClient.entries == null)
                return;
            // TODO: Support importing multiple assets at once
            const entryId = event.dataTransfer.getData("application/vnd.ValjangEngine.entry").split(",")[0];
            if (typeof entryId !== "string")
                return;
            const entry = network_1.data.projectClient.entries.byId[entryId];
            const plugin = SupClient.getPlugins("importIntoScene")[entry.type];
            if (plugin == null || plugin.content.importComponent == null) {
                const reason = SupClient.i18n.t("sceneEditor:errors.cantImportAssetTypeIntoScene");
                new SupClient.Dialogs.InfoDialog(SupClient.i18n.t("sceneEditor:failures.importIntoScene", { reason }));
                return;
            }
            event.preventDefault();
            const nodeId = ui.nodesTreeView.selectedNodes[0].dataset["id"];
            plugin.content.importComponent(entry, network_1.data.projectClient, nodeId, (err, nodeId) => {});
        }

    }, { "./engine": 8, "./network": 10, "dnd-tree-view": 2, "resize-handle": 5 }]
}, {}, [9]);