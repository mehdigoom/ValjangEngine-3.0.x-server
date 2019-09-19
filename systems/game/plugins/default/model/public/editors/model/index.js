(function() {
    function r(e, n, t) {
        function o(i, f) { if (!n[i]) { if (!e[i]) { var c = "function" == typeof require && require; if (!f && c) return c(i, !0); if (u) return u(i, !0); var a = new Error("Cannot find module '" + i + "'"); throw a.code = "MODULE_NOT_FOUND", a } var p = n[i] = { exports: {} };
                e[i][0].call(p.exports, function(r) { var n = e[i][1][r]; return o(n || r) }, p, p.exports, r, e, n, t) } return n[i].exports } for (var u = "function" == typeof require && require, i = 0; i < t.length; i++) o(t[i]); return o } return r })()({
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
    }, { "_process": 9, "timers": 11 }],
    2: [function(require, module, exports) {
        'use strict'

        exports.byteLength = byteLength
        exports.toByteArray = toByteArray
        exports.fromByteArray = fromByteArray

        var lookup = []
        var revLookup = []
        var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

        var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
        for (var i = 0, len = code.length; i < len; ++i) {
            lookup[i] = code[i]
            revLookup[code.charCodeAt(i)] = i
        }

        // Support decoding URL-safe base64 strings, as Node.js does.
        // See: https://en.wikipedia.org/wiki/Base64#URL_applications
        revLookup['-'.charCodeAt(0)] = 62
        revLookup['_'.charCodeAt(0)] = 63

        function getLens(b64) {
            var len = b64.length

            if (len % 4 > 0) {
                throw new Error('Invalid string. Length must be a multiple of 4')
            }

            // Trim off extra bytes after placeholder bytes are found
            // See: https://github.com/beatgammit/base64-js/issues/42
            var validLen = b64.indexOf('=')
            if (validLen === -1) validLen = len

            var placeHoldersLen = validLen === len ?
                0 :
                4 - (validLen % 4)

            return [validLen, placeHoldersLen]
        }

        // base64 is 4/3 + up to two characters of the original data
        function byteLength(b64) {
            var lens = getLens(b64)
            var validLen = lens[0]
            var placeHoldersLen = lens[1]
            return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
        }

        function _byteLength(b64, validLen, placeHoldersLen) {
            return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
        }

        function toByteArray(b64) {
            var tmp
            var lens = getLens(b64)
            var validLen = lens[0]
            var placeHoldersLen = lens[1]

            var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

            var curByte = 0

            // if there are placeholders, only get up to the last complete 4 chars
            var len = placeHoldersLen > 0 ?
                validLen - 4 :
                validLen

            for (var i = 0; i < len; i += 4) {
                tmp =
                    (revLookup[b64.charCodeAt(i)] << 18) |
                    (revLookup[b64.charCodeAt(i + 1)] << 12) |
                    (revLookup[b64.charCodeAt(i + 2)] << 6) |
                    revLookup[b64.charCodeAt(i + 3)]
                arr[curByte++] = (tmp >> 16) & 0xFF
                arr[curByte++] = (tmp >> 8) & 0xFF
                arr[curByte++] = tmp & 0xFF
            }

            if (placeHoldersLen === 2) {
                tmp =
                    (revLookup[b64.charCodeAt(i)] << 2) |
                    (revLookup[b64.charCodeAt(i + 1)] >> 4)
                arr[curByte++] = tmp & 0xFF
            }

            if (placeHoldersLen === 1) {
                tmp =
                    (revLookup[b64.charCodeAt(i)] << 10) |
                    (revLookup[b64.charCodeAt(i + 1)] << 4) |
                    (revLookup[b64.charCodeAt(i + 2)] >> 2)
                arr[curByte++] = (tmp >> 8) & 0xFF
                arr[curByte++] = tmp & 0xFF
            }

            return arr
        }

        function tripletToBase64(num) {
            return lookup[num >> 18 & 0x3F] +
                lookup[num >> 12 & 0x3F] +
                lookup[num >> 6 & 0x3F] +
                lookup[num & 0x3F]
        }

        function encodeChunk(uint8, start, end) {
            var tmp
            var output = []
            for (var i = start; i < end; i += 3) {
                tmp =
                    ((uint8[i] << 16) & 0xFF0000) +
                    ((uint8[i + 1] << 8) & 0xFF00) +
                    (uint8[i + 2] & 0xFF)
                output.push(tripletToBase64(tmp))
            }
            return output.join('')
        }

        function fromByteArray(uint8) {
            var tmp
            var len = uint8.length
            var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
            var parts = []
            var maxChunkLength = 16383 // must be multiple of 3

            // go through the array every three bytes, we'll deal with trailing stuff later
            for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
                parts.push(encodeChunk(
                    uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)
                ))
            }

            // pad the end with zeros, but make sure to not forget the extra bytes
            if (extraBytes === 1) {
                tmp = uint8[len - 1]
                parts.push(
                    lookup[tmp >> 2] +
                    lookup[(tmp << 4) & 0x3F] +
                    '=='
                )
            } else if (extraBytes === 2) {
                tmp = (uint8[len - 2] << 8) + uint8[len - 1]
                parts.push(
                    lookup[tmp >> 10] +
                    lookup[(tmp >> 4) & 0x3F] +
                    lookup[(tmp << 2) & 0x3F] +
                    '='
                )
            }

            return parts.join('')
        }

    }, {}],
    3: [function(require, module, exports) {

    }, {}],
    4: [function(require, module, exports) {
        /*!
         * The buffer module from node.js, for the browser.
         *
         * @author   Feross Aboukhadijeh <https://feross.org>
         * @license  MIT
         */
        /* eslint-disable no-proto */

        'use strict'

        var base64 = require('base64-js')
        var ieee754 = require('ieee754')

        exports.Buffer = Buffer
        exports.SlowBuffer = SlowBuffer
        exports.INSPECT_MAX_BYTES = 50

        var K_MAX_LENGTH = 0x7fffffff
        exports.kMaxLength = K_MAX_LENGTH

        /**
         * If `Buffer.TYPED_ARRAY_SUPPORT`:
         *   === true    Use Uint8Array implementation (fastest)
         *   === false   Print warning and recommend using `buffer` v4.x which has an Object
         *               implementation (most compatible, even IE6)
         *
         * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
         * Opera 11.6+, iOS 4.2+.
         *
         * We report that the browser does not support typed arrays if the are not subclassable
         * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
         * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
         * for __proto__ and has a buggy typed array implementation.
         */
        Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

        if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
            typeof console.error === 'function') {
            console.error(
                'This browser lacks typed array (Uint8Array) support which is required by ' +
                '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
            )
        }

        function typedArraySupport() {
            // Can typed array instances can be augmented?
            try {
                var arr = new Uint8Array(1)
                arr.__proto__ = { __proto__: Uint8Array.prototype, foo: function() { return 42 } }
                return arr.foo() === 42
            } catch (e) {
                return false
            }
        }

        Object.defineProperty(Buffer.prototype, 'parent', {
            enumerable: true,
            get: function() {
                if (!Buffer.isBuffer(this)) return undefined
                return this.buffer
            }
        })

        Object.defineProperty(Buffer.prototype, 'offset', {
            enumerable: true,
            get: function() {
                if (!Buffer.isBuffer(this)) return undefined
                return this.byteOffset
            }
        })

        function createBuffer(length) {
            if (length > K_MAX_LENGTH) {
                throw new RangeError('The value "' + length + '" is invalid for option "size"')
            }
            // Return an augmented `Uint8Array` instance
            var buf = new Uint8Array(length)
            buf.__proto__ = Buffer.prototype
            return buf
        }

        /**
         * The Buffer constructor returns instances of `Uint8Array` that have their
         * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
         * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
         * and the `Uint8Array` methods. Square bracket notation works as expected -- it
         * returns a single octet.
         *
         * The `Uint8Array` prototype remains unmodified.
         */

        function Buffer(arg, encodingOrOffset, length) {
            // Common case.
            if (typeof arg === 'number') {
                if (typeof encodingOrOffset === 'string') {
                    throw new TypeError(
                        'The "string" argument must be of type string. Received type number'
                    )
                }
                return allocUnsafe(arg)
            }
            return from(arg, encodingOrOffset, length)
        }

        // Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
        if (typeof Symbol !== 'undefined' && Symbol.species != null &&
            Buffer[Symbol.species] === Buffer) {
            Object.defineProperty(Buffer, Symbol.species, {
                value: null,
                configurable: true,
                enumerable: false,
                writable: false
            })
        }

        Buffer.poolSize = 8192 // not used by this implementation

        function from(value, encodingOrOffset, length) {
            if (typeof value === 'string') {
                return fromString(value, encodingOrOffset)
            }

            if (ArrayBuffer.isView(value)) {
                return fromArrayLike(value)
            }

            if (value == null) {
                throw TypeError(
                    'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
                    'or Array-like Object. Received type ' + (typeof value)
                )
            }

            if (isInstance(value, ArrayBuffer) ||
                (value && isInstance(value.buffer, ArrayBuffer))) {
                return fromArrayBuffer(value, encodingOrOffset, length)
            }

            if (typeof value === 'number') {
                throw new TypeError(
                    'The "value" argument must not be of type number. Received type number'
                )
            }

            var valueOf = value.valueOf && value.valueOf()
            if (valueOf != null && valueOf !== value) {
                return Buffer.from(valueOf, encodingOrOffset, length)
            }

            var b = fromObject(value)
            if (b) return b

            if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
                typeof value[Symbol.toPrimitive] === 'function') {
                return Buffer.from(
                    value[Symbol.toPrimitive]('string'), encodingOrOffset, length
                )
            }

            throw new TypeError(
                'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
                'or Array-like Object. Received type ' + (typeof value)
            )
        }

        /**
         * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
         * if value is a number.
         * Buffer.from(str[, encoding])
         * Buffer.from(array)
         * Buffer.from(buffer)
         * Buffer.from(arrayBuffer[, byteOffset[, length]])
         **/
        Buffer.from = function(value, encodingOrOffset, length) {
            return from(value, encodingOrOffset, length)
        }

        // Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
        // https://github.com/feross/buffer/pull/148
        Buffer.prototype.__proto__ = Uint8Array.prototype
        Buffer.__proto__ = Uint8Array

        function assertSize(size) {
            if (typeof size !== 'number') {
                throw new TypeError('"size" argument must be of type number')
            } else if (size < 0) {
                throw new RangeError('The value "' + size + '" is invalid for option "size"')
            }
        }

        function alloc(size, fill, encoding) {
            assertSize(size)
            if (size <= 0) {
                return createBuffer(size)
            }
            if (fill !== undefined) {
                // Only pay attention to encoding if it's a string. This
                // prevents accidentally sending in a number that would
                // be interpretted as a start offset.
                return typeof encoding === 'string' ?
                    createBuffer(size).fill(fill, encoding) :
                    createBuffer(size).fill(fill)
            }
            return createBuffer(size)
        }

        /**
         * Creates a new filled Buffer instance.
         * alloc(size[, fill[, encoding]])
         **/
        Buffer.alloc = function(size, fill, encoding) {
            return alloc(size, fill, encoding)
        }

        function allocUnsafe(size) {
            assertSize(size)
            return createBuffer(size < 0 ? 0 : checked(size) | 0)
        }

        /**
         * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
         * */
        Buffer.allocUnsafe = function(size) {
                return allocUnsafe(size)
            }
            /**
             * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
             */
        Buffer.allocUnsafeSlow = function(size) {
            return allocUnsafe(size)
        }

        function fromString(string, encoding) {
            if (typeof encoding !== 'string' || encoding === '') {
                encoding = 'utf8'
            }

            if (!Buffer.isEncoding(encoding)) {
                throw new TypeError('Unknown encoding: ' + encoding)
            }

            var length = byteLength(string, encoding) | 0
            var buf = createBuffer(length)

            var actual = buf.write(string, encoding)

            if (actual !== length) {
                // Writing a hex string, for example, that contains invalid characters will
                // cause everything after the first invalid character to be ignored. (e.g.
                // 'abxxcd' will be treated as 'ab')
                buf = buf.slice(0, actual)
            }

            return buf
        }

        function fromArrayLike(array) {
            var length = array.length < 0 ? 0 : checked(array.length) | 0
            var buf = createBuffer(length)
            for (var i = 0; i < length; i += 1) {
                buf[i] = array[i] & 255
            }
            return buf
        }

        function fromArrayBuffer(array, byteOffset, length) {
            if (byteOffset < 0 || array.byteLength < byteOffset) {
                throw new RangeError('"offset" is outside of buffer bounds')
            }

            if (array.byteLength < byteOffset + (length || 0)) {
                throw new RangeError('"length" is outside of buffer bounds')
            }

            var buf
            if (byteOffset === undefined && length === undefined) {
                buf = new Uint8Array(array)
            } else if (length === undefined) {
                buf = new Uint8Array(array, byteOffset)
            } else {
                buf = new Uint8Array(array, byteOffset, length)
            }

            // Return an augmented `Uint8Array` instance
            buf.__proto__ = Buffer.prototype
            return buf
        }

        function fromObject(obj) {
            if (Buffer.isBuffer(obj)) {
                var len = checked(obj.length) | 0
                var buf = createBuffer(len)

                if (buf.length === 0) {
                    return buf
                }

                obj.copy(buf, 0, 0, len)
                return buf
            }

            if (obj.length !== undefined) {
                if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
                    return createBuffer(0)
                }
                return fromArrayLike(obj)
            }

            if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
                return fromArrayLike(obj.data)
            }
        }

        function checked(length) {
            // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
            // length is NaN (which is otherwise coerced to zero.)
            if (length >= K_MAX_LENGTH) {
                throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                    'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
            }
            return length | 0
        }

        function SlowBuffer(length) {
            if (+length != length) { // eslint-disable-line eqeqeq
                length = 0
            }
            return Buffer.alloc(+length)
        }

        Buffer.isBuffer = function isBuffer(b) {
            return b != null && b._isBuffer === true &&
                b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
        }

        Buffer.compare = function compare(a, b) {
            if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength)
            if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength)
            if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
                throw new TypeError(
                    'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
                )
            }

            if (a === b) return 0

            var x = a.length
            var y = b.length

            for (var i = 0, len = Math.min(x, y); i < len; ++i) {
                if (a[i] !== b[i]) {
                    x = a[i]
                    y = b[i]
                    break
                }
            }

            if (x < y) return -1
            if (y < x) return 1
            return 0
        }

        Buffer.isEncoding = function isEncoding(encoding) {
            switch (String(encoding).toLowerCase()) {
                case 'hex':
                case 'utf8':
                case 'utf-8':
                case 'ascii':
                case 'latin1':
                case 'binary':
                case 'base64':
                case 'ucs2':
                case 'ucs-2':
                case 'utf16le':
                case 'utf-16le':
                    return true
                default:
                    return false
            }
        }

        Buffer.concat = function concat(list, length) {
            if (!Array.isArray(list)) {
                throw new TypeError('"list" argument must be an Array of Buffers')
            }

            if (list.length === 0) {
                return Buffer.alloc(0)
            }

            var i
            if (length === undefined) {
                length = 0
                for (i = 0; i < list.length; ++i) {
                    length += list[i].length
                }
            }

            var buffer = Buffer.allocUnsafe(length)
            var pos = 0
            for (i = 0; i < list.length; ++i) {
                var buf = list[i]
                if (isInstance(buf, Uint8Array)) {
                    buf = Buffer.from(buf)
                }
                if (!Buffer.isBuffer(buf)) {
                    throw new TypeError('"list" argument must be an Array of Buffers')
                }
                buf.copy(buffer, pos)
                pos += buf.length
            }
            return buffer
        }

        function byteLength(string, encoding) {
            if (Buffer.isBuffer(string)) {
                return string.length
            }
            if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
                return string.byteLength
            }
            if (typeof string !== 'string') {
                throw new TypeError(
                    'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
                    'Received type ' + typeof string
                )
            }

            var len = string.length
            var mustMatch = (arguments.length > 2 && arguments[2] === true)
            if (!mustMatch && len === 0) return 0

            // Use a for loop to avoid recursion
            var loweredCase = false
            for (;;) {
                switch (encoding) {
                    case 'ascii':
                    case 'latin1':
                    case 'binary':
                        return len
                    case 'utf8':
                    case 'utf-8':
                        return utf8ToBytes(string).length
                    case 'ucs2':
                    case 'ucs-2':
                    case 'utf16le':
                    case 'utf-16le':
                        return len * 2
                    case 'hex':
                        return len >>> 1
                    case 'base64':
                        return base64ToBytes(string).length
                    default:
                        if (loweredCase) {
                            return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
                        }
                        encoding = ('' + encoding).toLowerCase()
                        loweredCase = true
                }
            }
        }
        Buffer.byteLength = byteLength

        function slowToString(encoding, start, end) {
            var loweredCase = false

            // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
            // property of a typed array.

            // This behaves neither like String nor Uint8Array in that we set start/end
            // to their upper/lower bounds if the value passed is out of range.
            // undefined is handled specially as per ECMA-262 6th Edition,
            // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
            if (start === undefined || start < 0) {
                start = 0
            }
            // Return early if start > this.length. Done here to prevent potential uint32
            // coercion fail below.
            if (start > this.length) {
                return ''
            }

            if (end === undefined || end > this.length) {
                end = this.length
            }

            if (end <= 0) {
                return ''
            }

            // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
            end >>>= 0
            start >>>= 0

            if (end <= start) {
                return ''
            }

            if (!encoding) encoding = 'utf8'

            while (true) {
                switch (encoding) {
                    case 'hex':
                        return hexSlice(this, start, end)

                    case 'utf8':
                    case 'utf-8':
                        return utf8Slice(this, start, end)

                    case 'ascii':
                        return asciiSlice(this, start, end)

                    case 'latin1':
                    case 'binary':
                        return latin1Slice(this, start, end)

                    case 'base64':
                        return base64Slice(this, start, end)

                    case 'ucs2':
                    case 'ucs-2':
                    case 'utf16le':
                    case 'utf-16le':
                        return utf16leSlice(this, start, end)

                    default:
                        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
                        encoding = (encoding + '').toLowerCase()
                        loweredCase = true
                }
            }
        }

        // This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
        // to detect a Buffer instance. It's not possible to use `instanceof Buffer`
        // reliably in a browserify context because there could be multiple different
        // copies of the 'buffer' package in use. This method works even for Buffer
        // instances that were created from another copy of the `buffer` package.
        // See: https://github.com/feross/buffer/issues/154
        Buffer.prototype._isBuffer = true

        function swap(b, n, m) {
            var i = b[n]
            b[n] = b[m]
            b[m] = i
        }

        Buffer.prototype.swap16 = function swap16() {
            var len = this.length
            if (len % 2 !== 0) {
                throw new RangeError('Buffer size must be a multiple of 16-bits')
            }
            for (var i = 0; i < len; i += 2) {
                swap(this, i, i + 1)
            }
            return this
        }

        Buffer.prototype.swap32 = function swap32() {
            var len = this.length
            if (len % 4 !== 0) {
                throw new RangeError('Buffer size must be a multiple of 32-bits')
            }
            for (var i = 0; i < len; i += 4) {
                swap(this, i, i + 3)
                swap(this, i + 1, i + 2)
            }
            return this
        }

        Buffer.prototype.swap64 = function swap64() {
            var len = this.length
            if (len % 8 !== 0) {
                throw new RangeError('Buffer size must be a multiple of 64-bits')
            }
            for (var i = 0; i < len; i += 8) {
                swap(this, i, i + 7)
                swap(this, i + 1, i + 6)
                swap(this, i + 2, i + 5)
                swap(this, i + 3, i + 4)
            }
            return this
        }

        Buffer.prototype.toString = function toString() {
            var length = this.length
            if (length === 0) return ''
            if (arguments.length === 0) return utf8Slice(this, 0, length)
            return slowToString.apply(this, arguments)
        }

        Buffer.prototype.toLocaleString = Buffer.prototype.toString

        Buffer.prototype.equals = function equals(b) {
            if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
            if (this === b) return true
            return Buffer.compare(this, b) === 0
        }

        Buffer.prototype.inspect = function inspect() {
            var str = ''
            var max = exports.INSPECT_MAX_BYTES
            str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim()
            if (this.length > max) str += ' ... '
            return '<Buffer ' + str + '>'
        }

        Buffer.prototype.compare = function compare(target, start, end, thisStart, thisEnd) {
            if (isInstance(target, Uint8Array)) {
                target = Buffer.from(target, target.offset, target.byteLength)
            }
            if (!Buffer.isBuffer(target)) {
                throw new TypeError(
                    'The "target" argument must be one of type Buffer or Uint8Array. ' +
                    'Received type ' + (typeof target)
                )
            }

            if (start === undefined) {
                start = 0
            }
            if (end === undefined) {
                end = target ? target.length : 0
            }
            if (thisStart === undefined) {
                thisStart = 0
            }
            if (thisEnd === undefined) {
                thisEnd = this.length
            }

            if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
                throw new RangeError('out of range index')
            }

            if (thisStart >= thisEnd && start >= end) {
                return 0
            }
            if (thisStart >= thisEnd) {
                return -1
            }
            if (start >= end) {
                return 1
            }

            start >>>= 0
            end >>>= 0
            thisStart >>>= 0
            thisEnd >>>= 0

            if (this === target) return 0

            var x = thisEnd - thisStart
            var y = end - start
            var len = Math.min(x, y)

            var thisCopy = this.slice(thisStart, thisEnd)
            var targetCopy = target.slice(start, end)

            for (var i = 0; i < len; ++i) {
                if (thisCopy[i] !== targetCopy[i]) {
                    x = thisCopy[i]
                    y = targetCopy[i]
                    break
                }
            }

            if (x < y) return -1
            if (y < x) return 1
            return 0
        }

        // Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
        // OR the last index of `val` in `buffer` at offset <= `byteOffset`.
        //
        // Arguments:
        // - buffer - a Buffer to search
        // - val - a string, Buffer, or number
        // - byteOffset - an index into `buffer`; will be clamped to an int32
        // - encoding - an optional encoding, relevant is val is a string
        // - dir - true for indexOf, false for lastIndexOf
        function bidirectionalIndexOf(buffer, val, byteOffset, encoding, dir) {
            // Empty buffer means no match
            if (buffer.length === 0) return -1

            // Normalize byteOffset
            if (typeof byteOffset === 'string') {
                encoding = byteOffset
                byteOffset = 0
            } else if (byteOffset > 0x7fffffff) {
                byteOffset = 0x7fffffff
            } else if (byteOffset < -0x80000000) {
                byteOffset = -0x80000000
            }
            byteOffset = +byteOffset // Coerce to Number.
            if (numberIsNaN(byteOffset)) {
                // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
                byteOffset = dir ? 0 : (buffer.length - 1)
            }

            // Normalize byteOffset: negative offsets start from the end of the buffer
            if (byteOffset < 0) byteOffset = buffer.length + byteOffset
            if (byteOffset >= buffer.length) {
                if (dir) return -1
                else byteOffset = buffer.length - 1
            } else if (byteOffset < 0) {
                if (dir) byteOffset = 0
                else return -1
            }

            // Normalize val
            if (typeof val === 'string') {
                val = Buffer.from(val, encoding)
            }

            // Finally, search either indexOf (if dir is true) or lastIndexOf
            if (Buffer.isBuffer(val)) {
                // Special case: looking for empty string/buffer always fails
                if (val.length === 0) {
                    return -1
                }
                return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
            } else if (typeof val === 'number') {
                val = val & 0xFF // Search for a byte value [0-255]
                if (typeof Uint8Array.prototype.indexOf === 'function') {
                    if (dir) {
                        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
                    } else {
                        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
                    }
                }
                return arrayIndexOf(buffer, [val], byteOffset, encoding, dir)
            }

            throw new TypeError('val must be string, number or Buffer')
        }

        function arrayIndexOf(arr, val, byteOffset, encoding, dir) {
            var indexSize = 1
            var arrLength = arr.length
            var valLength = val.length

            if (encoding !== undefined) {
                encoding = String(encoding).toLowerCase()
                if (encoding === 'ucs2' || encoding === 'ucs-2' ||
                    encoding === 'utf16le' || encoding === 'utf-16le') {
                    if (arr.length < 2 || val.length < 2) {
                        return -1
                    }
                    indexSize = 2
                    arrLength /= 2
                    valLength /= 2
                    byteOffset /= 2
                }
            }

            function read(buf, i) {
                if (indexSize === 1) {
                    return buf[i]
                } else {
                    return buf.readUInt16BE(i * indexSize)
                }
            }

            var i
            if (dir) {
                var foundIndex = -1
                for (i = byteOffset; i < arrLength; i++) {
                    if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
                        if (foundIndex === -1) foundIndex = i
                        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
                    } else {
                        if (foundIndex !== -1) i -= i - foundIndex
                        foundIndex = -1
                    }
                }
            } else {
                if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
                for (i = byteOffset; i >= 0; i--) {
                    var found = true
                    for (var j = 0; j < valLength; j++) {
                        if (read(arr, i + j) !== read(val, j)) {
                            found = false
                            break
                        }
                    }
                    if (found) return i
                }
            }

            return -1
        }

        Buffer.prototype.includes = function includes(val, byteOffset, encoding) {
            return this.indexOf(val, byteOffset, encoding) !== -1
        }

        Buffer.prototype.indexOf = function indexOf(val, byteOffset, encoding) {
            return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
        }

        Buffer.prototype.lastIndexOf = function lastIndexOf(val, byteOffset, encoding) {
            return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
        }

        function hexWrite(buf, string, offset, length) {
            offset = Number(offset) || 0
            var remaining = buf.length - offset
            if (!length) {
                length = remaining
            } else {
                length = Number(length)
                if (length > remaining) {
                    length = remaining
                }
            }

            var strLen = string.length

            if (length > strLen / 2) {
                length = strLen / 2
            }
            for (var i = 0; i < length; ++i) {
                var parsed = parseInt(string.substr(i * 2, 2), 16)
                if (numberIsNaN(parsed)) return i
                buf[offset + i] = parsed
            }
            return i
        }

        function utf8Write(buf, string, offset, length) {
            return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
        }

        function asciiWrite(buf, string, offset, length) {
            return blitBuffer(asciiToBytes(string), buf, offset, length)
        }

        function latin1Write(buf, string, offset, length) {
            return asciiWrite(buf, string, offset, length)
        }

        function base64Write(buf, string, offset, length) {
            return blitBuffer(base64ToBytes(string), buf, offset, length)
        }

        function ucs2Write(buf, string, offset, length) {
            return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
        }

        Buffer.prototype.write = function write(string, offset, length, encoding) {
            // Buffer#write(string)
            if (offset === undefined) {
                encoding = 'utf8'
                length = this.length
                offset = 0
                    // Buffer#write(string, encoding)
            } else if (length === undefined && typeof offset === 'string') {
                encoding = offset
                length = this.length
                offset = 0
                    // Buffer#write(string, offset[, length][, encoding])
            } else if (isFinite(offset)) {
                offset = offset >>> 0
                if (isFinite(length)) {
                    length = length >>> 0
                    if (encoding === undefined) encoding = 'utf8'
                } else {
                    encoding = length
                    length = undefined
                }
            } else {
                throw new Error(
                    'Buffer.write(string, encoding, offset[, length]) is no longer supported'
                )
            }

            var remaining = this.length - offset
            if (length === undefined || length > remaining) length = remaining

            if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
                throw new RangeError('Attempt to write outside buffer bounds')
            }

            if (!encoding) encoding = 'utf8'

            var loweredCase = false
            for (;;) {
                switch (encoding) {
                    case 'hex':
                        return hexWrite(this, string, offset, length)

                    case 'utf8':
                    case 'utf-8':
                        return utf8Write(this, string, offset, length)

                    case 'ascii':
                        return asciiWrite(this, string, offset, length)

                    case 'latin1':
                    case 'binary':
                        return latin1Write(this, string, offset, length)

                    case 'base64':
                        // Warning: maxLength not taken into account in base64Write
                        return base64Write(this, string, offset, length)

                    case 'ucs2':
                    case 'ucs-2':
                    case 'utf16le':
                    case 'utf-16le':
                        return ucs2Write(this, string, offset, length)

                    default:
                        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
                        encoding = ('' + encoding).toLowerCase()
                        loweredCase = true
                }
            }
        }

        Buffer.prototype.toJSON = function toJSON() {
            return {
                type: 'Buffer',
                data: Array.prototype.slice.call(this._arr || this, 0)
            }
        }

        function base64Slice(buf, start, end) {
            if (start === 0 && end === buf.length) {
                return base64.fromByteArray(buf)
            } else {
                return base64.fromByteArray(buf.slice(start, end))
            }
        }

        function utf8Slice(buf, start, end) {
            end = Math.min(buf.length, end)
            var res = []

            var i = start
            while (i < end) {
                var firstByte = buf[i]
                var codePoint = null
                var bytesPerSequence = (firstByte > 0xEF) ? 4 :
                    (firstByte > 0xDF) ? 3 :
                    (firstByte > 0xBF) ? 2 :
                    1

                if (i + bytesPerSequence <= end) {
                    var secondByte, thirdByte, fourthByte, tempCodePoint

                    switch (bytesPerSequence) {
                        case 1:
                            if (firstByte < 0x80) {
                                codePoint = firstByte
                            }
                            break
                        case 2:
                            secondByte = buf[i + 1]
                            if ((secondByte & 0xC0) === 0x80) {
                                tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
                                if (tempCodePoint > 0x7F) {
                                    codePoint = tempCodePoint
                                }
                            }
                            break
                        case 3:
                            secondByte = buf[i + 1]
                            thirdByte = buf[i + 2]
                            if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
                                tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
                                if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
                                    codePoint = tempCodePoint
                                }
                            }
                            break
                        case 4:
                            secondByte = buf[i + 1]
                            thirdByte = buf[i + 2]
                            fourthByte = buf[i + 3]
                            if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
                                tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
                                if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
                                    codePoint = tempCodePoint
                                }
                            }
                    }
                }

                if (codePoint === null) {
                    // we did not generate a valid codePoint so insert a
                    // replacement char (U+FFFD) and advance only 1 byte
                    codePoint = 0xFFFD
                    bytesPerSequence = 1
                } else if (codePoint > 0xFFFF) {
                    // encode to utf16 (surrogate pair dance)
                    codePoint -= 0x10000
                    res.push(codePoint >>> 10 & 0x3FF | 0xD800)
                    codePoint = 0xDC00 | codePoint & 0x3FF
                }

                res.push(codePoint)
                i += bytesPerSequence
            }

            return decodeCodePointsArray(res)
        }

        // Based on http://stackoverflow.com/a/22747272/680742, the browser with
        // the lowest limit is Chrome, with 0x10000 args.
        // We go 1 magnitude less, for safety
        var MAX_ARGUMENTS_LENGTH = 0x1000

        function decodeCodePointsArray(codePoints) {
            var len = codePoints.length
            if (len <= MAX_ARGUMENTS_LENGTH) {
                return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
            }

            // Decode in chunks to avoid "call stack size exceeded".
            var res = ''
            var i = 0
            while (i < len) {
                res += String.fromCharCode.apply(
                    String,
                    codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
                )
            }
            return res
        }

        function asciiSlice(buf, start, end) {
            var ret = ''
            end = Math.min(buf.length, end)

            for (var i = start; i < end; ++i) {
                ret += String.fromCharCode(buf[i] & 0x7F)
            }
            return ret
        }

        function latin1Slice(buf, start, end) {
            var ret = ''
            end = Math.min(buf.length, end)

            for (var i = start; i < end; ++i) {
                ret += String.fromCharCode(buf[i])
            }
            return ret
        }

        function hexSlice(buf, start, end) {
            var len = buf.length

            if (!start || start < 0) start = 0
            if (!end || end < 0 || end > len) end = len

            var out = ''
            for (var i = start; i < end; ++i) {
                out += toHex(buf[i])
            }
            return out
        }

        function utf16leSlice(buf, start, end) {
            var bytes = buf.slice(start, end)
            var res = ''
            for (var i = 0; i < bytes.length; i += 2) {
                res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
            }
            return res
        }

        Buffer.prototype.slice = function slice(start, end) {
            var len = this.length
            start = ~~start
            end = end === undefined ? len : ~~end

            if (start < 0) {
                start += len
                if (start < 0) start = 0
            } else if (start > len) {
                start = len
            }

            if (end < 0) {
                end += len
                if (end < 0) end = 0
            } else if (end > len) {
                end = len
            }

            if (end < start) end = start

            var newBuf = this.subarray(start, end)
                // Return an augmented `Uint8Array` instance
            newBuf.__proto__ = Buffer.prototype
            return newBuf
        }

        /*
         * Need to make sure that buffer isn't trying to write out of bounds.
         */
        function checkOffset(offset, ext, length) {
            if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
            if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
        }

        Buffer.prototype.readUIntLE = function readUIntLE(offset, byteLength, noAssert) {
            offset = offset >>> 0
            byteLength = byteLength >>> 0
            if (!noAssert) checkOffset(offset, byteLength, this.length)

            var val = this[offset]
            var mul = 1
            var i = 0
            while (++i < byteLength && (mul *= 0x100)) {
                val += this[offset + i] * mul
            }

            return val
        }

        Buffer.prototype.readUIntBE = function readUIntBE(offset, byteLength, noAssert) {
            offset = offset >>> 0
            byteLength = byteLength >>> 0
            if (!noAssert) {
                checkOffset(offset, byteLength, this.length)
            }

            var val = this[offset + --byteLength]
            var mul = 1
            while (byteLength > 0 && (mul *= 0x100)) {
                val += this[offset + --byteLength] * mul
            }

            return val
        }

        Buffer.prototype.readUInt8 = function readUInt8(offset, noAssert) {
            offset = offset >>> 0
            if (!noAssert) checkOffset(offset, 1, this.length)
            return this[offset]
        }

        Buffer.prototype.readUInt16LE = function readUInt16LE(offset, noAssert) {
            offset = offset >>> 0
            if (!noAssert) checkOffset(offset, 2, this.length)
            return this[offset] | (this[offset + 1] << 8)
        }

        Buffer.prototype.readUInt16BE = function readUInt16BE(offset, noAssert) {
            offset = offset >>> 0
            if (!noAssert) checkOffset(offset, 2, this.length)
            return (this[offset] << 8) | this[offset + 1]
        }

        Buffer.prototype.readUInt32LE = function readUInt32LE(offset, noAssert) {
            offset = offset >>> 0
            if (!noAssert) checkOffset(offset, 4, this.length)

            return ((this[offset]) |
                    (this[offset + 1] << 8) |
                    (this[offset + 2] << 16)) +
                (this[offset + 3] * 0x1000000)
        }

        Buffer.prototype.readUInt32BE = function readUInt32BE(offset, noAssert) {
            offset = offset >>> 0
            if (!noAssert) checkOffset(offset, 4, this.length)

            return (this[offset] * 0x1000000) +
                ((this[offset + 1] << 16) |
                    (this[offset + 2] << 8) |
                    this[offset + 3])
        }

        Buffer.prototype.readIntLE = function readIntLE(offset, byteLength, noAssert) {
            offset = offset >>> 0
            byteLength = byteLength >>> 0
            if (!noAssert) checkOffset(offset, byteLength, this.length)

            var val = this[offset]
            var mul = 1
            var i = 0
            while (++i < byteLength && (mul *= 0x100)) {
                val += this[offset + i] * mul
            }
            mul *= 0x80

            if (val >= mul) val -= Math.pow(2, 8 * byteLength)

            return val
        }

        Buffer.prototype.readIntBE = function readIntBE(offset, byteLength, noAssert) {
            offset = offset >>> 0
            byteLength = byteLength >>> 0
            if (!noAssert) checkOffset(offset, byteLength, this.length)

            var i = byteLength
            var mul = 1
            var val = this[offset + --i]
            while (i > 0 && (mul *= 0x100)) {
                val += this[offset + --i] * mul
            }
            mul *= 0x80

            if (val >= mul) val -= Math.pow(2, 8 * byteLength)

            return val
        }

        Buffer.prototype.readInt8 = function readInt8(offset, noAssert) {
            offset = offset >>> 0
            if (!noAssert) checkOffset(offset, 1, this.length)
            if (!(this[offset] & 0x80)) return (this[offset])
            return ((0xff - this[offset] + 1) * -1)
        }

        Buffer.prototype.readInt16LE = function readInt16LE(offset, noAssert) {
            offset = offset >>> 0
            if (!noAssert) checkOffset(offset, 2, this.length)
            var val = this[offset] | (this[offset + 1] << 8)
            return (val & 0x8000) ? val | 0xFFFF0000 : val
        }

        Buffer.prototype.readInt16BE = function readInt16BE(offset, noAssert) {
            offset = offset >>> 0
            if (!noAssert) checkOffset(offset, 2, this.length)
            var val = this[offset + 1] | (this[offset] << 8)
            return (val & 0x8000) ? val | 0xFFFF0000 : val
        }

        Buffer.prototype.readInt32LE = function readInt32LE(offset, noAssert) {
            offset = offset >>> 0
            if (!noAssert) checkOffset(offset, 4, this.length)

            return (this[offset]) |
                (this[offset + 1] << 8) |
                (this[offset + 2] << 16) |
                (this[offset + 3] << 24)
        }

        Buffer.prototype.readInt32BE = function readInt32BE(offset, noAssert) {
            offset = offset >>> 0
            if (!noAssert) checkOffset(offset, 4, this.length)

            return (this[offset] << 24) |
                (this[offset + 1] << 16) |
                (this[offset + 2] << 8) |
                (this[offset + 3])
        }

        Buffer.prototype.readFloatLE = function readFloatLE(offset, noAssert) {
            offset = offset >>> 0
            if (!noAssert) checkOffset(offset, 4, this.length)
            return ieee754.read(this, offset, true, 23, 4)
        }

        Buffer.prototype.readFloatBE = function readFloatBE(offset, noAssert) {
            offset = offset >>> 0
            if (!noAssert) checkOffset(offset, 4, this.length)
            return ieee754.read(this, offset, false, 23, 4)
        }

        Buffer.prototype.readDoubleLE = function readDoubleLE(offset, noAssert) {
            offset = offset >>> 0
            if (!noAssert) checkOffset(offset, 8, this.length)
            return ieee754.read(this, offset, true, 52, 8)
        }

        Buffer.prototype.readDoubleBE = function readDoubleBE(offset, noAssert) {
            offset = offset >>> 0
            if (!noAssert) checkOffset(offset, 8, this.length)
            return ieee754.read(this, offset, false, 52, 8)
        }

        function checkInt(buf, value, offset, ext, max, min) {
            if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
            if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
            if (offset + ext > buf.length) throw new RangeError('Index out of range')
        }

        Buffer.prototype.writeUIntLE = function writeUIntLE(value, offset, byteLength, noAssert) {
            value = +value
            offset = offset >>> 0
            byteLength = byteLength >>> 0
            if (!noAssert) {
                var maxBytes = Math.pow(2, 8 * byteLength) - 1
                checkInt(this, value, offset, byteLength, maxBytes, 0)
            }

            var mul = 1
            var i = 0
            this[offset] = value & 0xFF
            while (++i < byteLength && (mul *= 0x100)) {
                this[offset + i] = (value / mul) & 0xFF
            }

            return offset + byteLength
        }

        Buffer.prototype.writeUIntBE = function writeUIntBE(value, offset, byteLength, noAssert) {
            value = +value
            offset = offset >>> 0
            byteLength = byteLength >>> 0
            if (!noAssert) {
                var maxBytes = Math.pow(2, 8 * byteLength) - 1
                checkInt(this, value, offset, byteLength, maxBytes, 0)
            }

            var i = byteLength - 1
            var mul = 1
            this[offset + i] = value & 0xFF
            while (--i >= 0 && (mul *= 0x100)) {
                this[offset + i] = (value / mul) & 0xFF
            }

            return offset + byteLength
        }

        Buffer.prototype.writeUInt8 = function writeUInt8(value, offset, noAssert) {
            value = +value
            offset = offset >>> 0
            if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
            this[offset] = (value & 0xff)
            return offset + 1
        }

        Buffer.prototype.writeUInt16LE = function writeUInt16LE(value, offset, noAssert) {
            value = +value
            offset = offset >>> 0
            if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
            this[offset] = (value & 0xff)
            this[offset + 1] = (value >>> 8)
            return offset + 2
        }

        Buffer.prototype.writeUInt16BE = function writeUInt16BE(value, offset, noAssert) {
            value = +value
            offset = offset >>> 0
            if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
            this[offset] = (value >>> 8)
            this[offset + 1] = (value & 0xff)
            return offset + 2
        }

        Buffer.prototype.writeUInt32LE = function writeUInt32LE(value, offset, noAssert) {
            value = +value
            offset = offset >>> 0
            if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
            this[offset + 3] = (value >>> 24)
            this[offset + 2] = (value >>> 16)
            this[offset + 1] = (value >>> 8)
            this[offset] = (value & 0xff)
            return offset + 4
        }

        Buffer.prototype.writeUInt32BE = function writeUInt32BE(value, offset, noAssert) {
            value = +value
            offset = offset >>> 0
            if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
            this[offset] = (value >>> 24)
            this[offset + 1] = (value >>> 16)
            this[offset + 2] = (value >>> 8)
            this[offset + 3] = (value & 0xff)
            return offset + 4
        }

        Buffer.prototype.writeIntLE = function writeIntLE(value, offset, byteLength, noAssert) {
            value = +value
            offset = offset >>> 0
            if (!noAssert) {
                var limit = Math.pow(2, (8 * byteLength) - 1)

                checkInt(this, value, offset, byteLength, limit - 1, -limit)
            }

            var i = 0
            var mul = 1
            var sub = 0
            this[offset] = value & 0xFF
            while (++i < byteLength && (mul *= 0x100)) {
                if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
                    sub = 1
                }
                this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
            }

            return offset + byteLength
        }

        Buffer.prototype.writeIntBE = function writeIntBE(value, offset, byteLength, noAssert) {
            value = +value
            offset = offset >>> 0
            if (!noAssert) {
                var limit = Math.pow(2, (8 * byteLength) - 1)

                checkInt(this, value, offset, byteLength, limit - 1, -limit)
            }

            var i = byteLength - 1
            var mul = 1
            var sub = 0
            this[offset + i] = value & 0xFF
            while (--i >= 0 && (mul *= 0x100)) {
                if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
                    sub = 1
                }
                this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
            }

            return offset + byteLength
        }

        Buffer.prototype.writeInt8 = function writeInt8(value, offset, noAssert) {
            value = +value
            offset = offset >>> 0
            if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
            if (value < 0) value = 0xff + value + 1
            this[offset] = (value & 0xff)
            return offset + 1
        }

        Buffer.prototype.writeInt16LE = function writeInt16LE(value, offset, noAssert) {
            value = +value
            offset = offset >>> 0
            if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
            this[offset] = (value & 0xff)
            this[offset + 1] = (value >>> 8)
            return offset + 2
        }

        Buffer.prototype.writeInt16BE = function writeInt16BE(value, offset, noAssert) {
            value = +value
            offset = offset >>> 0
            if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
            this[offset] = (value >>> 8)
            this[offset + 1] = (value & 0xff)
            return offset + 2
        }

        Buffer.prototype.writeInt32LE = function writeInt32LE(value, offset, noAssert) {
            value = +value
            offset = offset >>> 0
            if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
            this[offset] = (value & 0xff)
            this[offset + 1] = (value >>> 8)
            this[offset + 2] = (value >>> 16)
            this[offset + 3] = (value >>> 24)
            return offset + 4
        }

        Buffer.prototype.writeInt32BE = function writeInt32BE(value, offset, noAssert) {
            value = +value
            offset = offset >>> 0
            if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
            if (value < 0) value = 0xffffffff + value + 1
            this[offset] = (value >>> 24)
            this[offset + 1] = (value >>> 16)
            this[offset + 2] = (value >>> 8)
            this[offset + 3] = (value & 0xff)
            return offset + 4
        }

        function checkIEEE754(buf, value, offset, ext, max, min) {
            if (offset + ext > buf.length) throw new RangeError('Index out of range')
            if (offset < 0) throw new RangeError('Index out of range')
        }

        function writeFloat(buf, value, offset, littleEndian, noAssert) {
            value = +value
            offset = offset >>> 0
            if (!noAssert) {
                checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
            }
            ieee754.write(buf, value, offset, littleEndian, 23, 4)
            return offset + 4
        }

        Buffer.prototype.writeFloatLE = function writeFloatLE(value, offset, noAssert) {
            return writeFloat(this, value, offset, true, noAssert)
        }

        Buffer.prototype.writeFloatBE = function writeFloatBE(value, offset, noAssert) {
            return writeFloat(this, value, offset, false, noAssert)
        }

        function writeDouble(buf, value, offset, littleEndian, noAssert) {
            value = +value
            offset = offset >>> 0
            if (!noAssert) {
                checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
            }
            ieee754.write(buf, value, offset, littleEndian, 52, 8)
            return offset + 8
        }

        Buffer.prototype.writeDoubleLE = function writeDoubleLE(value, offset, noAssert) {
            return writeDouble(this, value, offset, true, noAssert)
        }

        Buffer.prototype.writeDoubleBE = function writeDoubleBE(value, offset, noAssert) {
            return writeDouble(this, value, offset, false, noAssert)
        }

        // copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
        Buffer.prototype.copy = function copy(target, targetStart, start, end) {
            if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
            if (!start) start = 0
            if (!end && end !== 0) end = this.length
            if (targetStart >= target.length) targetStart = target.length
            if (!targetStart) targetStart = 0
            if (end > 0 && end < start) end = start

            // Copy 0 bytes; we're done
            if (end === start) return 0
            if (target.length === 0 || this.length === 0) return 0

            // Fatal error conditions
            if (targetStart < 0) {
                throw new RangeError('targetStart out of bounds')
            }
            if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
            if (end < 0) throw new RangeError('sourceEnd out of bounds')

            // Are we oob?
            if (end > this.length) end = this.length
            if (target.length - targetStart < end - start) {
                end = target.length - targetStart + start
            }

            var len = end - start

            if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
                // Use built-in when available, missing from IE11
                this.copyWithin(targetStart, start, end)
            } else if (this === target && start < targetStart && targetStart < end) {
                // descending copy from end
                for (var i = len - 1; i >= 0; --i) {
                    target[i + targetStart] = this[i + start]
                }
            } else {
                Uint8Array.prototype.set.call(
                    target,
                    this.subarray(start, end),
                    targetStart
                )
            }

            return len
        }

        // Usage:
        //    buffer.fill(number[, offset[, end]])
        //    buffer.fill(buffer[, offset[, end]])
        //    buffer.fill(string[, offset[, end]][, encoding])
        Buffer.prototype.fill = function fill(val, start, end, encoding) {
            // Handle string cases:
            if (typeof val === 'string') {
                if (typeof start === 'string') {
                    encoding = start
                    start = 0
                    end = this.length
                } else if (typeof end === 'string') {
                    encoding = end
                    end = this.length
                }
                if (encoding !== undefined && typeof encoding !== 'string') {
                    throw new TypeError('encoding must be a string')
                }
                if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
                    throw new TypeError('Unknown encoding: ' + encoding)
                }
                if (val.length === 1) {
                    var code = val.charCodeAt(0)
                    if ((encoding === 'utf8' && code < 128) ||
                        encoding === 'latin1') {
                        // Fast path: If `val` fits into a single byte, use that numeric value.
                        val = code
                    }
                }
            } else if (typeof val === 'number') {
                val = val & 255
            }

            // Invalid ranges are not set to a default, so can range check early.
            if (start < 0 || this.length < start || this.length < end) {
                throw new RangeError('Out of range index')
            }

            if (end <= start) {
                return this
            }

            start = start >>> 0
            end = end === undefined ? this.length : end >>> 0

            if (!val) val = 0

            var i
            if (typeof val === 'number') {
                for (i = start; i < end; ++i) {
                    this[i] = val
                }
            } else {
                var bytes = Buffer.isBuffer(val) ?
                    val :
                    Buffer.from(val, encoding)
                var len = bytes.length
                if (len === 0) {
                    throw new TypeError('The value "' + val +
                        '" is invalid for argument "value"')
                }
                for (i = 0; i < end - start; ++i) {
                    this[i + start] = bytes[i % len]
                }
            }

            return this
        }

        // HELPER FUNCTIONS
        // ================

        var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

        function base64clean(str) {
            // Node takes equal signs as end of the Base64 encoding
            str = str.split('=')[0]
                // Node strips out invalid characters like \n and \t from the string, base64-js does not
            str = str.trim().replace(INVALID_BASE64_RE, '')
                // Node converts strings with length < 2 to ''
            if (str.length < 2) return ''
                // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
            while (str.length % 4 !== 0) {
                str = str + '='
            }
            return str
        }

        function toHex(n) {
            if (n < 16) return '0' + n.toString(16)
            return n.toString(16)
        }

        function utf8ToBytes(string, units) {
            units = units || Infinity
            var codePoint
            var length = string.length
            var leadSurrogate = null
            var bytes = []

            for (var i = 0; i < length; ++i) {
                codePoint = string.charCodeAt(i)

                // is surrogate component
                if (codePoint > 0xD7FF && codePoint < 0xE000) {
                    // last char was a lead
                    if (!leadSurrogate) {
                        // no lead yet
                        if (codePoint > 0xDBFF) {
                            // unexpected trail
                            if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
                            continue
                        } else if (i + 1 === length) {
                            // unpaired lead
                            if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
                            continue
                        }

                        // valid lead
                        leadSurrogate = codePoint

                        continue
                    }

                    // 2 leads in a row
                    if (codePoint < 0xDC00) {
                        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
                        leadSurrogate = codePoint
                        continue
                    }

                    // valid surrogate pair
                    codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
                } else if (leadSurrogate) {
                    // valid bmp char, but last char was a lead
                    if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
                }

                leadSurrogate = null

                // encode utf8
                if (codePoint < 0x80) {
                    if ((units -= 1) < 0) break
                    bytes.push(codePoint)
                } else if (codePoint < 0x800) {
                    if ((units -= 2) < 0) break
                    bytes.push(
                        codePoint >> 0x6 | 0xC0,
                        codePoint & 0x3F | 0x80
                    )
                } else if (codePoint < 0x10000) {
                    if ((units -= 3) < 0) break
                    bytes.push(
                        codePoint >> 0xC | 0xE0,
                        codePoint >> 0x6 & 0x3F | 0x80,
                        codePoint & 0x3F | 0x80
                    )
                } else if (codePoint < 0x110000) {
                    if ((units -= 4) < 0) break
                    bytes.push(
                        codePoint >> 0x12 | 0xF0,
                        codePoint >> 0xC & 0x3F | 0x80,
                        codePoint >> 0x6 & 0x3F | 0x80,
                        codePoint & 0x3F | 0x80
                    )
                } else {
                    throw new Error('Invalid code point')
                }
            }

            return bytes
        }

        function asciiToBytes(str) {
            var byteArray = []
            for (var i = 0; i < str.length; ++i) {
                // Node's code seems to be doing this and not & 0x7F..
                byteArray.push(str.charCodeAt(i) & 0xFF)
            }
            return byteArray
        }

        function utf16leToBytes(str, units) {
            var c, hi, lo
            var byteArray = []
            for (var i = 0; i < str.length; ++i) {
                if ((units -= 2) < 0) break

                c = str.charCodeAt(i)
                hi = c >> 8
                lo = c % 256
                byteArray.push(lo)
                byteArray.push(hi)
            }

            return byteArray
        }

        function base64ToBytes(str) {
            return base64.toByteArray(base64clean(str))
        }

        function blitBuffer(src, dst, offset, length) {
            for (var i = 0; i < length; ++i) {
                if ((i + offset >= dst.length) || (i >= src.length)) break
                dst[i + offset] = src[i]
            }
            return i
        }

        // ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
        // the `instanceof` check but they should be treated as of that type.
        // See: https://github.com/feross/buffer/issues/166
        function isInstance(obj, type) {
            return obj instanceof type ||
                (obj != null && obj.constructor != null && obj.constructor.name != null &&
                    obj.constructor.name === type.name)
        }

        function numberIsNaN(obj) {
            // For IE11 support
            return obj !== obj // eslint-disable-line no-self-compare
        }

    }, { "base64-js": 2, "ieee754": 7 }],
    5: [function(require, module, exports) {
        (function(global) {
            (function(f) { if (typeof exports === "object" && typeof module !== "undefined") { module.exports = f() } else if (typeof define === "function" && define.amd) { define([], f) } else { var g; if (typeof window !== "undefined") { g = window } else if (typeof global !== "undefined") { g = global } else if (typeof self !== "undefined") { g = self } else { g = this }
                    g.TreeView = f() } })(function() {
                var define, module, exports;
                return (function e(t, n, r) {
                    function s(o, u) { if (!n[o]) { if (!t[o]) { var a = typeof require == "function" && require; if (!u && a) return a(o, !0); if (i) return i(o, !0); var f = new Error("Cannot find module '" + o + "'"); throw f.code = "MODULE_NOT_FOUND", f } var l = n[o] = { exports: {} };
                            t[o][0].call(l.exports, function(e) { var n = t[o][1][e]; return s(n ? n : e) }, l, l.exports, e, t, n, r) } return n[o].exports } var i = typeof require == "function" && require; for (var o = 0; o < r.length; o++) s(r[o]); return s })({
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
    }, { "events": 6 }],
    6: [function(require, module, exports) {
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
    7: [function(require, module, exports) {
        exports.read = function(buffer, offset, isLE, mLen, nBytes) {
            var e, m
            var eLen = (nBytes * 8) - mLen - 1
            var eMax = (1 << eLen) - 1
            var eBias = eMax >> 1
            var nBits = -7
            var i = isLE ? (nBytes - 1) : 0
            var d = isLE ? -1 : 1
            var s = buffer[offset + i]

            i += d

            e = s & ((1 << (-nBits)) - 1)
            s >>= (-nBits)
            nBits += eLen
            for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

            m = e & ((1 << (-nBits)) - 1)
            e >>= (-nBits)
            nBits += mLen
            for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

            if (e === 0) {
                e = 1 - eBias
            } else if (e === eMax) {
                return m ? NaN : ((s ? -1 : 1) * Infinity)
            } else {
                m = m + Math.pow(2, mLen)
                e = e - eBias
            }
            return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
        }

        exports.write = function(buffer, value, offset, isLE, mLen, nBytes) {
            var e, m, c
            var eLen = (nBytes * 8) - mLen - 1
            var eMax = (1 << eLen) - 1
            var eBias = eMax >> 1
            var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
            var i = isLE ? 0 : (nBytes - 1)
            var d = isLE ? 1 : -1
            var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

            value = Math.abs(value)

            if (isNaN(value) || value === Infinity) {
                m = isNaN(value) ? 1 : 0
                e = eMax
            } else {
                e = Math.floor(Math.log(value) / Math.LN2)
                if (value * (c = Math.pow(2, -e)) < 1) {
                    e--
                    c *= 2
                }
                if (e + eBias >= 1) {
                    value += rt / c
                } else {
                    value += rt * Math.pow(2, 1 - eBias)
                }
                if (value * c >= 2) {
                    e++
                    c /= 2
                }

                if (e + eBias >= eMax) {
                    m = 0
                    e = eMax
                } else if (e + eBias >= 1) {
                    m = ((value * c) - 1) * Math.pow(2, mLen)
                    e = e + eBias
                } else {
                    m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
                    e = 0
                }
            }

            for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

            e = (e << mLen) | m
            eLen += mLen
            for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

            buffer[offset + i - d] |= s * 128
        }

    }, {}],
    8: [function(require, module, exports) {
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
    }, { "_process": 9 }],
    9: [function(require, module, exports) {
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
    10: [function(require, module, exports) {
        (function(global) {
            (function(f) { if (typeof exports === "object" && typeof module !== "undefined") { module.exports = f() } else if (typeof define === "function" && define.amd) { define([], f) } else { var g; if (typeof window !== "undefined") { g = window } else if (typeof global !== "undefined") { g = global } else if (typeof self !== "undefined") { g = self } else { g = this }
                    g.ResizeHandle = f() } })(function() {
                var define, module, exports;
                return (function e(t, n, r) {
                    function s(o, u) { if (!n[o]) { if (!t[o]) { var a = typeof require == "function" && require; if (!u && a) return a(o, !0); if (i) return i(o, !0); var f = new Error("Cannot find module '" + o + "'"); throw f.code = "MODULE_NOT_FOUND", f } var l = n[o] = { exports: {} };
                            t[o][0].call(l.exports, function(e) { var n = t[o][1][e]; return s(n ? n : e) }, l, l.exports, e, t, n, r) } return n[o].exports } var i = typeof require == "function" && require; for (var o = 0; o < r.length; o++) s(r[o]); return s })({
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
    }, { "events": 6 }],
    11: [function(require, module, exports) {
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
    }, { "process/browser.js": 9, "timers": 11 }],
    12: [function(require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        const THREE = SupEngine.THREE;
        const tmpBoneMatrix = new THREE.Matrix4;
        const tmpVec = new THREE.Vector3;
        const tmpQuat = new THREE.Quaternion;
        const ModelRendererUpdater_1 = require("./ModelRendererUpdater");

        function getInterpolationData(keyFrames, time) {
            let prevKeyFrame = keyFrames[keyFrames.length - 1];
            // TODO: Use a cache to maintain most recently used key frames for each bone
            // and profit from temporal contiguity
            let nextKeyFrame;
            for (const keyFrame of keyFrames) {
                nextKeyFrame = keyFrame;
                if (keyFrame.time > time)
                    break;
                prevKeyFrame = keyFrame;
            }
            if (prevKeyFrame === nextKeyFrame)
                nextKeyFrame = keyFrames[0];
            const timeSpan = nextKeyFrame.time - prevKeyFrame.time;
            const timeProgress = time - prevKeyFrame.time;
            const t = (timeSpan > 0) ? timeProgress / timeSpan : 0;
            return { prevKeyFrame, nextKeyFrame, t };
        }
        class ModelRenderer extends SupEngine.ActorComponent {
                constructor(actor) {
                    super(actor, "ModelRenderer");
                    this.color = { r: 1, g: 1, b: 1 };
                    this.hasPoseBeenUpdated = false;
                    this.materialType = "basic";
                    this.castShadow = false;
                    this.receiveShadow = false;
                }
                _clearMesh() {
                    if (this.skeletonHelper != null) {
                        this.actor.threeObject.remove(this.skeletonHelper);
                        this.skeletonHelper = null;
                    }
                    this.actor.threeObject.remove(this.threeMesh);
                    this.threeMesh.traverse((obj) => {
                        if (obj.dispose != null)
                            obj.dispose();
                    });
                    this.threeMesh = null;
                    this.material.dispose();
                    this.material = null;
                }
                _destroy() {
                    if (this.threeMesh != null)
                        this._clearMesh();
                    this.asset = null;
                    super._destroy();
                }
                setModel(asset, materialType, customShader) {
                    if (this.threeMesh != null)
                        this._clearMesh();
                    this.asset = asset;
                    if (materialType != null)
                        this.materialType = materialType;
                    if (customShader != null)
                        this.shaderAsset = customShader;
                    this.animation = null;
                    this.animationsByName = {};
                    if (asset == null || asset.attributes["position"] == null)
                        return;
                    this.updateAnimationsByName();
                    const geometry = new THREE.BufferGeometry;
                    if (this.asset.attributes["position"] != null) {
                        const buffer = new Float32Array(this.asset.attributes["position"]);
                        geometry.addAttribute("position", new THREE.BufferAttribute(buffer, 3));
                    }
                    if (this.asset.attributes["index"] != null) {
                        const buffer = new Uint16Array(this.asset.attributes["index"]);
                        geometry.setIndex(new THREE.BufferAttribute(buffer, 1));
                    }
                    if (this.asset.attributes["uv"] != null) {
                        const buffer = new Float32Array(this.asset.attributes["uv"]);
                        geometry.addAttribute("uv", new THREE.BufferAttribute(buffer, 2));
                    }
                    if (this.asset.attributes["normal"] != null) {
                        const buffer = new Float32Array(this.asset.attributes["normal"]);
                        geometry.addAttribute("normal", new THREE.BufferAttribute(buffer, 3));
                    }
                    if (this.asset.attributes["color"] != null) {
                        const buffer = new Float32Array(this.asset.attributes["color"]);
                        geometry.addAttribute("color", new THREE.BufferAttribute(buffer, 3));
                    }
                    if (this.asset.attributes["skinIndex"] != null) {
                        const buffer = new Float32Array(this.asset.attributes["skinIndex"]);
                        geometry.addAttribute("skinIndex", new THREE.BufferAttribute(buffer, 4));
                    }
                    if (this.asset.attributes["skinWeight"] != null) {
                        const buffer = new Float32Array(this.asset.attributes["skinWeight"]);
                        geometry.addAttribute("skinWeight", new THREE.BufferAttribute(buffer, 4));
                    }
                    if (this.materialType === "shader") {
                        this.material = SupEngine.componentClasses["Shader"].createShaderMaterial(this.shaderAsset, this.asset.textures, geometry);
                    } else {
                        let material;
                        if (this.materialType === "basic")
                            material = new THREE.MeshBasicMaterial();
                        else if (this.materialType === "phong") {
                            material = new THREE.MeshPhongMaterial();
                            material.lightMap = this.asset.textures[this.asset.mapSlots["light"]];
                        }
                        material.map = this.asset.textures[this.asset.mapSlots["map"]];
                        material.specularMap = this.asset.textures[this.asset.mapSlots["specular"]];
                        material.alphaMap = this.asset.textures[this.asset.mapSlots["alpha"]];
                        if (this.materialType === "phong")
                            material.normalMap = this.asset.textures[this.asset.mapSlots["normal"]];
                        material.alphaTest = 0.1;
                        this.material = material;
                    }
                    this.setColor(this.color.r, this.color.g, this.color.b);
                    this.setOpacity(this.opacity);
                    if (this.asset.bones != null) {
                        this.threeMesh = new THREE.SkinnedMesh(geometry, this.material);
                        if (this.asset.upAxisMatrix != null) {
                            const upAxisMatrix = new THREE.Matrix4().fromArray(this.asset.upAxisMatrix);
                            this.threeMesh.applyMatrix(upAxisMatrix);
                        }
                        const bones = [];
                        this.bonesByName = {};
                        for (const boneInfo of this.asset.bones) {
                            const bone = new THREE.Bone(this.threeMesh);
                            bone.name = boneInfo.name;
                            this.bonesByName[bone.name] = bone;
                            bone.applyMatrix(tmpBoneMatrix.fromArray(boneInfo.matrix));
                            bones.push(bone);
                        }
                        for (let i = 0; i < this.asset.bones.length; i++) {
                            const boneInfo = this.asset.bones[i];
                            if (boneInfo.parentIndex != null)
                                bones[boneInfo.parentIndex].add(bones[i]);
                            else
                                this.threeMesh.add(bones[i]);
                        }
                        this.threeMesh.updateMatrixWorld(true);
                        const useVertexTexture = false;
                        this.threeMesh.bind(new THREE.Skeleton(bones, undefined, useVertexTexture));
                        this.material.skinning = true;
                    } else
                        this.threeMesh = new THREE.Mesh(geometry, this.material);
                    this.setUnitRatio(asset.unitRatio);
                    this.setCastShadow(this.castShadow);
                    this.threeMesh.receiveShadow = this.receiveShadow;
                    this.actor.threeObject.add(this.threeMesh);
                    if (geometry.getAttribute("normal") == null)
                        this.threeMesh.geometry.computeVertexNormals();
                    this.threeMesh.updateMatrixWorld(false);
                }
                setCastShadow(castShadow) {
                    this.castShadow = castShadow;
                    this.threeMesh.castShadow = castShadow;
                }
                setOpacity(opacity) {
                    this.opacity = opacity;
                    if (this.material == null)
                        return;
                    if (this.opacity != null) {
                        this.material.transparent = true;
                        this.material.opacity = this.opacity;
                    } else {
                        this.material.transparent = false;
                        this.material.opacity = 1;
                    }
                    this.material.needsUpdate = true;
                }
                setColor(r, g, b) {
                    this.color.r = r;
                    this.color.g = g;
                    this.color.b = b;
                    if (this.material instanceof THREE.ShaderMaterial) {
                        const uniforms = this.material.uniforms;
                        if (uniforms.color != null)
                            uniforms.color.value.setRGB(r, g, b);
                    } else
                        this.material.color.setRGB(r, g, b);
                }
                setUnitRatio(unitRatio) {
                    if (this.threeMesh == null)
                        return;
                    const ratio = 1 / unitRatio;
                    this.threeMesh.scale.set(ratio, ratio, ratio);
                    this.threeMesh.updateMatrixWorld(false);
                }
                setShowSkeleton(show) {
                    if (show === (this.skeletonHelper != null))
                        return;
                    if (show) {
                        this.skeletonHelper = new THREE.SkeletonHelper(this.threeMesh);
                        if (this.asset.upAxisMatrix != null) {
                            const upAxisMatrix = new THREE.Matrix4().fromArray(this.asset.upAxisMatrix);
                            this.skeletonHelper.root = this.skeletonHelper;
                            this.skeletonHelper.applyMatrix(upAxisMatrix);
                            this.skeletonHelper.update();
                        }
                        this.skeletonHelper.material.linewidth = 3;
                        this.actor.threeObject.add(this.skeletonHelper);
                    } else {
                        this.actor.threeObject.remove(this.skeletonHelper);
                        this.skeletonHelper = null;
                    }
                    if (this.threeMesh != null)
                        this.threeMesh.updateMatrixWorld(true);
                }
                updateAnimationsByName() {
                    for (const animation of this.asset.animations) {
                        this.animationsByName[animation.name] = animation;
                    }
                }
                setAnimation(newAnimationName, newAnimationLooping = true) {
                    if (newAnimationName != null) {
                        const newAnimation = this.animationsByName[newAnimationName];
                        if (newAnimation == null)
                            throw new Error(`Animation ${newAnimationName} doesn't exist`);
                        if (newAnimation === this.animation && this.isAnimationPlaying)
                            return;
                        this.animation = newAnimation;
                        this.animationLooping = newAnimationLooping;
                        this.animationTimer = 0;
                        this.isAnimationPlaying = true;
                    } else {
                        this.animation = null;
                        this.clearPose();
                    }
                    return;
                }
                getAnimation() { return (this.animation != null) ? this.animation.name : null; }
                setAnimationTime(time) {
                    if (typeof time !== "number" || time < 0 || time > this.getAnimationDuration())
                        throw new Error("Invalid time");
                    this.animationTimer = time * this.actor.gameInstance.framesPerSecond;
                    this.updatePose();
                }
                getAnimationTime() { return (this.animation != null) ? this.animationTimer / this.actor.gameInstance.framesPerSecond : 0; }
                getAnimationDuration() {
                    if (this.animation == null || this.animation.duration == null)
                        return 0;
                    return this.animation.duration;
                }
                playAnimation(animationLooping = true) {
                    this.animationLooping = animationLooping;
                    this.isAnimationPlaying = true;
                }
                pauseAnimation() { this.isAnimationPlaying = false; }
                stopAnimation() {
                    if (this.animation == null)
                        return;
                    this.isAnimationPlaying = false;
                    this.animationTimer = 0;
                    this.updatePose();
                }
                clearPose() {
                    if (this.threeMesh == null)
                        return;
                    if (this.threeMesh.skeleton == null)
                        return;
                    for (let i = 0; i < this.threeMesh.skeleton.bones.length; i++) {
                        const bone = this.threeMesh.skeleton.bones[i];
                        bone.matrix.fromArray(this.asset.bones[i].matrix);
                        bone.matrix.decompose(bone.position, bone.quaternion, bone.scale);
                    }
                    this.threeMesh.updateMatrixWorld(false);
                    if (this.skeletonHelper != null)
                        this.skeletonHelper.update();
                }
                getBoneTransform(name) {
                    if (!this.hasPoseBeenUpdated)
                        this._tickAnimation();
                    const position = new THREE.Vector3;
                    const orientation = new THREE.Quaternion;
                    const scale = new THREE.Vector3;
                    if (this.bonesByName == null || this.bonesByName[name] == null)
                        return null;
                    this.bonesByName[name].matrixWorld.decompose(position, orientation, scale);
                    return { position, orientation, scale };
                }
                updatePose() {
                    this.hasPoseBeenUpdated = true;
                    // TODO: this.asset.speedMultiplier
                    const speedMultiplier = 1;
                    let time = this.animationTimer * speedMultiplier / this.actor.gameInstance.framesPerSecond;
                    if (time > this.animation.duration) {
                        if (this.animationLooping) {
                            this.animationTimer -= this.animation.duration * this.actor.gameInstance.framesPerSecond / speedMultiplier;
                            time -= this.animation.duration;
                        } else {
                            time = this.animation.duration;
                            this.isAnimationPlaying = false;
                        }
                    }
                    if (this.threeMesh.skeleton == null)
                        return;
                    for (let i = 0; i < this.threeMesh.skeleton.bones.length; i++) {
                        const bone = this.threeMesh.skeleton.bones[i];
                        const boneKeyFrames = this.animation.keyFrames[bone.name];
                        if (boneKeyFrames == null)
                            continue;
                        if (boneKeyFrames.translation != null) {
                            const { prevKeyFrame, nextKeyFrame, t } = getInterpolationData(boneKeyFrames.translation, time);
                            bone.position.fromArray(prevKeyFrame.value);
                            bone.position.lerp(tmpVec.fromArray(nextKeyFrame.value), t);
                        }
                        if (boneKeyFrames.rotation != null) {
                            const { prevKeyFrame, nextKeyFrame, t } = getInterpolationData(boneKeyFrames.rotation, time);
                            bone.quaternion.fromArray(prevKeyFrame.value);
                            bone.quaternion.slerp(tmpQuat.fromArray(nextKeyFrame.value), t);
                        }
                        if (boneKeyFrames.scale != null) {
                            const { prevKeyFrame, nextKeyFrame, t } = getInterpolationData(boneKeyFrames.scale, time);
                            bone.scale.fromArray(prevKeyFrame.value);
                            bone.scale.lerp(tmpVec.fromArray(nextKeyFrame.value), t);
                        }
                    }
                    this.threeMesh.updateMatrixWorld(false);
                    if (this.skeletonHelper != null)
                        this.skeletonHelper.update();
                }
                update() {
                    if (this.material != null) {
                        const uniforms = this.material.uniforms;
                        if (uniforms != null)
                            uniforms.time.value += 1 / this.actor.gameInstance.framesPerSecond;
                    }
                    if (this.hasPoseBeenUpdated) {
                        this.hasPoseBeenUpdated = false;
                        return;
                    }
                    this._tickAnimation();
                    this.hasPoseBeenUpdated = false;
                }
                _tickAnimation() {
                    if (this.threeMesh == null || this.threeMesh.skeleton == null)
                        return;
                    if (this.animation == null || this.animation.duration === 0 || !this.isAnimationPlaying)
                        return;
                    this.animationTimer += 1;
                    this.updatePose();
                }
                setIsLayerActive(active) {
                    if (this.threeMesh != null)
                        this.threeMesh.visible = active;
                }
            }
            /* tslint:disable:variable-name */
        ModelRenderer.Updater = ModelRendererUpdater_1.default;
        exports.default = ModelRenderer;

    }, { "./ModelRendererUpdater": 13 }],
    13: [function(require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        class ModelRendererUpdater {
            constructor(client, modelRenderer, config, externalSubscriber) {
                this.client = client;
                this.modelRenderer = modelRenderer;
                this.externalSubscriber = externalSubscriber;
                this.overrideOpacity = false;
                this.modelAsset = null;
                this.onModelAssetReceived = (assetId, asset) => {
                    if (this.modelRenderer.opacity == null)
                        this.modelRenderer.opacity = asset.pub.opacity;
                    this.prepareMaps(asset.pub.textures, () => {
                        this.modelAsset = asset;
                        this.setModel();
                        if (this.externalSubscriber.onAssetReceived != null)
                            this.externalSubscriber.onAssetReceived(assetId, asset);
                    });
                };
                this.onModelAssetEdited = (assetId, command, ...args) => {
                    const commandFunction = this.onEditCommands[command];
                    if (commandFunction != null)
                        commandFunction.apply(this, args);
                    if (this.externalSubscriber.onAssetEdited != null)
                        this.externalSubscriber.onAssetEdited(assetId, command, ...args);
                };
                this.onEditCommands = {
                    setModel: () => {
                        this.setModel();
                    },
                    setMaps: (maps) => {
                        // TODO: Only update the maps that changed, don't recreate the whole model
                        this.prepareMaps(this.modelAsset.pub.textures, () => {
                            this.setModel();
                        });
                    },
                    newAnimation: (animation, index) => {
                        this.modelRenderer.updateAnimationsByName();
                        this.playAnimation();
                    },
                    deleteAnimation: (id) => {
                        this.modelRenderer.updateAnimationsByName();
                        this.playAnimation();
                    },
                    setAnimationProperty: (id, key, value) => {
                        this.modelRenderer.updateAnimationsByName();
                        this.playAnimation();
                    },
                    setMapSlot: (slot, name) => { this.setModel(); },
                    deleteMap: (name) => { this.setModel(); },
                    setProperty: (path, value) => {
                        switch (path) {
                            case "unitRatio":
                                this.modelRenderer.setUnitRatio(value);
                                break;
                            case "opacity":
                                if (!this.overrideOpacity)
                                    this.modelRenderer.setOpacity(value);
                                break;
                        }
                    }
                };
                this.onModelAssetTrashed = () => {
                    this.modelAsset = null;
                    this.modelRenderer.setModel(null);
                };
                this.onShaderAssetReceived = (assetId, asset) => {
                    this.shaderPub = asset.pub;
                    this.setModel();
                };
                this.onShaderAssetEdited = (id, command, ...args) => {
                    if (command !== "editVertexShader" && command !== "editFragmentShader")
                        this.setModel();
                };
                this.onShaderAssetTrashed = () => {
                    this.shaderPub = null;
                    this.setModel();
                };
                if (this.externalSubscriber == null)
                    this.externalSubscriber = {};
                this.modelAssetId = config.modelAssetId;
                this.animationId = config.animationId;
                this.materialType = config.materialType;
                this.shaderAssetId = config.shaderAssetId;
                if (config.castShadow != null)
                    this.modelRenderer.castShadow = config.castShadow;
                if (config.receiveShadow != null)
                    this.modelRenderer.receiveShadow = config.receiveShadow;
                if (config.overrideOpacity != null) {
                    this.overrideOpacity = config.overrideOpacity;
                    if (this.overrideOpacity)
                        this.modelRenderer.opacity = config.opacity;
                }
                if (config.color != null) {
                    const hex = parseInt(config.color, 16);
                    this.modelRenderer.color.r = (hex >> 16 & 255) / 255;
                    this.modelRenderer.color.g = (hex >> 8 & 255) / 255;
                    this.modelRenderer.color.b = (hex & 255) / 255;
                }
                this.modelSubscriber = {
                    onAssetReceived: this.onModelAssetReceived,
                    onAssetEdited: this.onModelAssetEdited,
                    onAssetTrashed: this.onModelAssetTrashed
                };
                this.shaderSubscriber = {
                    onAssetReceived: this.onShaderAssetReceived,
                    onAssetEdited: this.onShaderAssetEdited,
                    onAssetTrashed: this.onShaderAssetTrashed
                };
                if (this.modelAssetId != null)
                    this.client.subAsset(this.modelAssetId, "model", this.modelSubscriber);
                if (this.shaderAssetId != null)
                    this.client.subAsset(this.shaderAssetId, "shader", this.shaderSubscriber);
            }
            destroy() {
                if (this.modelAssetId != null)
                    this.client.unsubAsset(this.modelAssetId, this.modelSubscriber);
                if (this.shaderAssetId != null)
                    this.client.unsubAsset(this.shaderAssetId, this.shaderSubscriber);
            }
            prepareMaps(textures, callback) {
                const textureNames = Object.keys(textures);
                let texturesToLoad = textureNames.length;
                if (texturesToLoad === 0) {
                    callback();
                    return;
                }

                function onTextureLoaded() {
                    texturesToLoad--;
                    if (texturesToLoad === 0)
                        callback();
                }
                textureNames.forEach((key) => {
                    const image = textures[key].image;
                    if (!image.complete)
                        image.addEventListener("load", onTextureLoaded);
                    else
                        onTextureLoaded();
                });
            }
            setModel() {
                if (this.modelAsset == null || (this.materialType === "shader" && this.shaderPub == null)) {
                    this.modelRenderer.setModel(null);
                    return;
                }
                this.modelRenderer.setModel(this.modelAsset.pub, this.materialType, this.shaderPub);
                if (this.animationId != null)
                    this.playAnimation();
            }
            playAnimation() {
                const animation = this.modelAsset.animations.byId[this.animationId];
                this.modelRenderer.setAnimation((animation != null) ? animation.name : null);
            }
            config_setProperty(path, value) {
                switch (path) {
                    case "modelAssetId":
                        if (this.modelAssetId != null)
                            this.client.unsubAsset(this.modelAssetId, this.modelSubscriber);
                        this.modelAssetId = value;
                        this.modelAsset = null;
                        this.modelRenderer.setModel(null, null);
                        if (this.modelAssetId != null)
                            this.client.subAsset(this.modelAssetId, "model", this.modelSubscriber);
                        break;
                    case "animationId":
                        this.animationId = value;
                        if (this.modelAsset != null)
                            this.playAnimation();
                        break;
                    case "castShadow":
                        this.modelRenderer.setCastShadow(value);
                        break;
                    case "receiveShadow":
                        this.modelRenderer.threeMesh.receiveShadow = value;
                        this.modelRenderer.threeMesh.material.needsUpdate = true;
                        break;
                    case "overrideOpacity":
                        this.overrideOpacity = value;
                        this.modelRenderer.setOpacity(value ? null : this.modelAsset.pub.opacity);
                        break;
                    case "opacity":
                        this.modelRenderer.setOpacity(value);
                        break;
                    case "color":
                        const hex = parseInt(value, 16);
                        this.modelRenderer.setColor((hex >> 16 & 255) / 255, (hex >> 8 & 255) / 255, (hex & 255) / 255);
                        break;
                    case "materialType":
                        this.materialType = value;
                        this.setModel();
                        break;
                    case "shaderAssetId":
                        if (this.shaderAssetId != null)
                            this.client.unsubAsset(this.shaderAssetId, this.shaderSubscriber);
                        this.shaderAssetId = value;
                        this.shaderPub = null;
                        this.modelRenderer.setModel(null);
                        if (this.shaderAssetId != null)
                            this.client.subAsset(this.shaderAssetId, "shader", this.shaderSubscriber);
                        break;
                }
            }
        }
        exports.default = ModelRendererUpdater;

    }, {}],
    14: [function(require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        class ModelAnimations extends SupCore.Data.Base.ListById {
            constructor(pub) {
                super(pub, ModelAnimations.schema);
            }
        }
        ModelAnimations.schema = {
            name: { type: "string", minLength: 1, maxLength: 80, mutable: true },
            duration: { type: "number" },
            keyFrames: {
                type: "hash",
                keys: { minLength: 1, maxLength: 80 },
                values: {
                    type: "hash",
                    properties: {
                        translation: {
                            type: "array?",
                            items: {
                                type: "hash",
                                properties: {
                                    time: { type: "number", min: 0 },
                                    value: { type: "array", items: { type: "number", length: 3 } }
                                }
                            }
                        },
                        rotation: {
                            type: "array?",
                            items: {
                                type: "hash",
                                properties: {
                                    time: { type: "number", min: 0 },
                                    value: { type: "array", items: { type: "number", length: 4 } }
                                }
                            }
                        },
                        scale: {
                            type: "array?",
                            items: {
                                type: "hash",
                                properties: {
                                    time: { type: "number", min: 0 },
                                    value: { type: "array", items: { type: "number", length: 3 } }
                                }
                            }
                        }
                    }
                }
            }
        };
        exports.default = ModelAnimations;

    }, {}],
    15: [function(require, module, exports) {
        (function(global, Buffer) {
            "use strict";
            Object.defineProperty(exports, "__esModule", { value: true });
            const path = require("path");
            const fs = require("fs");
            const async = require("async");
            // Reference to THREE, client-side only
            let THREE;
            if (global.window != null && window.SupEngine != null)
                THREE = SupEngine.THREE;
            const ModelAnimations_1 = require("./ModelAnimations");
            class ModelAsset extends SupCore.Data.Base.Asset {
                constructor(id, pub, server) {
                    super(id, pub, ModelAsset.schema, server);
                }
                init(options, callback) {
                    this.pub = {
                        formatVersion: ModelAsset.currentFormatVersion,
                        unitRatio: 1,
                        upAxisMatrix: null,
                        attributes: {
                            position: null,
                            index: null,
                            color: null,
                            uv: null,
                            normal: null,
                            skinIndex: null,
                            skinWeight: null
                        },
                        bones: null,
                        maps: { map: new Buffer(0) },
                        filtering: "pixelated",
                        wrapping: "clampToEdge",
                        animations: [],
                        opacity: null,
                        mapSlots: {
                            map: "map",
                            light: null,
                            specular: null,
                            alpha: null,
                            normal: null
                        }
                    };
                    super.init(options, callback);
                }
                setup() {
                    this.animations = new ModelAnimations_1.default(this.pub.animations);
                }
                load(assetPath) {
                    let pub;
                    const loadAttributesMaps = () => {
                        const mapNames = pub.maps;
                        // NOTE: "diffuse" was renamed to "map" in ValjangEngine 0.11
                        if (pub.formatVersion == null && mapNames.length === 1 && mapNames[0] === "diffuse")
                            mapNames[0] = "map";
                        pub.maps = {};
                        pub.attributes = {};
                        async.series([
                            (callback) => {
                                async.each(Object.keys(ModelAsset.schema["attributes"].properties), (key, cb) => {
                                    fs.readFile(path.join(assetPath, `attr-${key}.dat`), (err, buffer) => {
                                        // TODO: Handle error but ignore ENOENT
                                        if (err != null) {
                                            cb();
                                            return;
                                        }
                                        pub.attributes[key] = buffer;
                                        cb();
                                    });
                                }, (err) => { callback(err, null); });
                            },
                            (callback) => {
                                async.each(mapNames, (key, cb) => {
                                    fs.readFile(path.join(assetPath, `map-${key}.dat`), (err, buffer) => {
                                        // TODO: Handle error but ignore ENOENT
                                        if (err != null) {
                                            // NOTE: "diffuse" was renamed to "map" in ValjangEngine 0.11
                                            if (err.code === "ENOENT" && key === "map") {
                                                fs.readFile(path.join(assetPath, "map-diffuse.dat"), (err, buffer) => {
                                                    fs.rename(path.join(assetPath, "map-diffuse.dat"), path.join(assetPath, "map-map.dat"), (err) => {
                                                        pub.maps[key] = buffer;
                                                        cb();
                                                    });
                                                });
                                            } else
                                                cb();
                                            return;
                                        }
                                        pub.maps[key] = buffer;
                                        cb();
                                    });
                                }, (err) => { callback(err, null); });
                            }
                        ], (err) => { this._onLoaded(assetPath, pub); });
                    };
                    fs.readFile(path.join(assetPath, "model.json"), { encoding: "utf8" }, (err, json) => {
                        // NOTE: "asset.json" was renamed to "model.json" in ValjangEngine 0.11
                        if (err != null && err.code === "ENOENT") {
                            fs.readFile(path.join(assetPath, "asset.json"), { encoding: "utf8" }, (err, json) => {
                                fs.rename(path.join(assetPath, "asset.json"), path.join(assetPath, "model.json"), (err) => {
                                    pub = JSON.parse(json);
                                    loadAttributesMaps();
                                });
                            });
                        } else {
                            pub = JSON.parse(json);
                            loadAttributesMaps();
                        }
                    });
                }
                migrate(assetPath, pub, callback) {
                    if (pub.formatVersion === ModelAsset.currentFormatVersion) {
                        callback(false);
                        return;
                    }
                    if (pub.formatVersion == null) {
                        // NOTE: New settings introduced in ValjangEngine 0.8
                        if (typeof pub.opacity === "undefined")
                            pub.opacity = 1;
                        if (pub.advancedTextures == null) {
                            pub.advancedTextures = false;
                            pub.mapSlots = {
                                map: "map",
                                light: null,
                                specular: null,
                                alpha: null,
                                normal: null
                            };
                        }
                        if (pub.unitRatio == null)
                            pub.unitRatio = 1;
                        // NOTE: Filtering and wrapping were introduced in ValjangEngine 0.13
                        if (pub.filtering == null)
                            pub.filtering = "pixelated";
                        if (pub.wrapping == null)
                            pub.wrapping = "clampToEdge";
                        if (pub.animations == null)
                            pub.animations = [];
                        pub.formatVersion = 1;
                    }
                    if (pub.formatVersion === 1) {
                        delete pub.advancedTextures;
                        pub.formatVersion = 2;
                    }
                    callback(true);
                }
                client_load() {
                    this.mapObjectURLs = {};
                    this.loadTextures();
                }
                client_unload() {
                    this.unloadTextures();
                }
                save(outputPath, callback) {
                    this.write(fs.writeFile, outputPath, (err) => {
                        if (err != null) {
                            callback(err);
                            return;
                        }
                        // Clean up old attributes and maps from disk
                        async.series([
                            (callback) => {
                                async.each(Object.keys(ModelAsset.schema["attributes"].properties), (key, cb) => {
                                    const value = this.pub.attributes[key];
                                    if (value != null) {
                                        cb();
                                        return;
                                    }
                                    fs.unlink(path.join(outputPath, `attr-${key}.dat`), (err) => {
                                        if (err != null && err.code !== "ENOENT") {
                                            cb(err);
                                            return;
                                        }
                                        cb();
                                    });
                                }, callback);
                            },
                            (callback) => {
                                async.each(Object.keys(this.pub.maps), (mapName, cb) => {
                                    const value = this.pub.maps[mapName];
                                    if (value != null) {
                                        cb();
                                        return;
                                    }
                                    fs.unlink(path.join(outputPath, `map-${mapName}.dat`), (err) => {
                                        if (err != null && err.code !== "ENOENT") {
                                            cb(err);
                                            return;
                                        }
                                        cb();
                                    });
                                }, callback);
                            }
                        ], callback);
                    });
                }
                clientExport(outputPath, callback) {
                    this.write(SupApp.writeFile, outputPath, callback);
                }
                write(writeFile, outputPath, writeCallback) {
                    const attributes = this.pub.attributes;
                    const maps = this.pub.maps;
                    this.pub.attributes = [];
                    for (const key in attributes) {
                        if (attributes[key] != null)
                            this.pub.attributes.push(key);
                    }
                    this.pub.maps = [];
                    for (const mapName in maps) {
                        if (maps[mapName] != null)
                            this.pub.maps.push(mapName);
                    }
                    const textures = this.pub.textures;
                    delete this.pub.textures;
                    const json = JSON.stringify(this.pub, null, 2);
                    this.pub.attributes = attributes;
                    this.pub.maps = maps;
                    this.pub.textures = textures;
                    async.series([
                        (callback) => { writeFile(path.join(outputPath, "model.json"), json, { encoding: "utf8" }, callback); },
                        (callback) => {
                            async.each(Object.keys(ModelAsset.schema["attributes"].properties), (key, cb) => {
                                let value = attributes[key];
                                if (value == null) {
                                    cb();
                                    return;
                                }
                                if (value instanceof ArrayBuffer)
                                    value = new Buffer(value);
                                writeFile(path.join(outputPath, `attr-${key}.dat`), value, cb);
                            }, callback);
                        },
                        (callback) => {
                            async.each(Object.keys(maps), (mapName, cb) => {
                                let value = maps[mapName];
                                if (value == null) {
                                    cb();
                                    return;
                                }
                                if (value instanceof ArrayBuffer)
                                    value = Buffer.from(value);
                                writeFile(path.join(outputPath, `map-${mapName}.dat`), value, cb);
                            }, callback);
                        }
                    ], writeCallback);
                }
                unloadTextures() {
                    for (const textureName in this.pub.textures)
                        this.pub.textures[textureName].dispose();
                    for (const key in this.mapObjectURLs) {
                        URL.revokeObjectURL(this.mapObjectURLs[key]);
                        delete this.mapObjectURLs[key];
                    }
                }
                loadTextures() {
                    this.unloadTextures();
                    this.pub.textures = {};
                    Object.keys(this.pub.maps).forEach((key) => {
                        const buffer = this.pub.maps[key];
                        if (buffer == null || buffer.byteLength === 0)
                            return;
                        let texture = this.pub.textures[key];
                        let image = (texture != null) ? texture.image : null;
                        if (image == null) {
                            image = new Image;
                            texture = this.pub.textures[key] = new THREE.Texture(image);
                            if (this.pub.filtering === "pixelated") {
                                texture.magFilter = THREE.NearestFilter;
                                texture.minFilter = THREE.NearestFilter;
                            }
                            if (this.pub.wrapping === "repeat") {
                                texture.wrapS = SupEngine.THREE.RepeatWrapping;
                                texture.wrapT = SupEngine.THREE.RepeatWrapping;
                            } else if (this.pub.wrapping === "mirroredRepeat") {
                                texture.wrapS = SupEngine.THREE.MirroredRepeatWrapping;
                                texture.wrapT = SupEngine.THREE.MirroredRepeatWrapping;
                            }
                            const typedArray = new Uint8Array(buffer);
                            const blob = new Blob([typedArray], { type: "image/*" });
                            image.src = this.mapObjectURLs[key] = URL.createObjectURL(blob);
                        }
                        if (!image.complete) {
                            image.addEventListener("load", () => { texture.needsUpdate = true; });
                        }
                    });
                }
                client_setProperty(path, value) {
                    super.client_setProperty(path, value);
                    switch (path) {
                        case "filtering":
                            for (const textureName in this.pub.textures) {
                                const texture = this.pub.textures[textureName];
                                if (this.pub.filtering === "pixelated") {
                                    texture.magFilter = THREE.NearestFilter;
                                    texture.minFilter = THREE.NearestFilter;
                                } else {
                                    texture.magFilter = THREE.LinearFilter;
                                    texture.minFilter = THREE.LinearMipMapLinearFilter;
                                }
                                texture.needsUpdate = true;
                            }
                            break;
                        case "wrapping":
                            for (const textureName in this.pub.textures) {
                                const texture = this.pub.textures[textureName];
                                if (value === "clampToEdge") {
                                    texture.wrapS = SupEngine.THREE.ClampToEdgeWrapping;
                                    texture.wrapT = SupEngine.THREE.ClampToEdgeWrapping;
                                } else if (value === "repeat") {
                                    texture.wrapS = SupEngine.THREE.RepeatWrapping;
                                    texture.wrapT = SupEngine.THREE.RepeatWrapping;
                                } else if (value === "mirroredRepeat") {
                                    texture.wrapS = SupEngine.THREE.MirroredRepeatWrapping;
                                    texture.wrapT = SupEngine.THREE.MirroredRepeatWrapping;
                                }
                                texture.needsUpdate = true;
                            }
                            break;
                    }
                }
                server_setModel(client, upAxisMatrix, attributes, bones, callback) {
                    // Validate up matrix
                    if (upAxisMatrix != null) {
                        const violation = SupCore.Data.Base.getRuleViolation(upAxisMatrix, ModelAsset.schema["upAxisMatrix"], true);
                        if (violation != null) {
                            callback(`Invalid up axis matrix: ${SupCore.Data.Base.formatRuleViolation(violation)}`);
                            return;
                        }
                    }
                    // Validate attributes
                    if (attributes == null || typeof attributes !== "object") {
                        callback("Attributes must be an object");
                        return;
                    }
                    for (const key in attributes) {
                        const value = attributes[key];
                        if (ModelAsset.schema["attributes"].properties[key] == null) {
                            callback(`Unsupported attribute type: ${key}`);
                            return;
                        }
                        if (value != null && !(value instanceof Buffer)) {
                            callback(`Value for ${key} must be an ArrayBuffer or null`);
                            return;
                        }
                    }
                    // Validate bones
                    if (bones != null) {
                        const violation = SupCore.Data.Base.getRuleViolation(bones, ModelAsset.schema["bones"], true);
                        if (violation != null) {
                            callback(`Invalid bones: ${SupCore.Data.Base.formatRuleViolation(violation)}`);
                            return;
                        }
                    }
                    // Apply changes
                    this.pub.upAxisMatrix = upAxisMatrix;
                    this.pub.attributes = attributes;
                    this.pub.bones = bones;
                    callback(null, null, upAxisMatrix, attributes, bones);
                    this.emit("change");
                }
                client_setModel(upAxisMatrix, attributes, bones) {
                    this.pub.upAxisMatrix = upAxisMatrix;
                    this.pub.attributes = attributes;
                    this.pub.bones = bones;
                }
                server_setMaps(client, maps, callback) {
                    if (maps == null || typeof maps !== "object") {
                        callback("Maps must be an object");
                        return;
                    }
                    for (const mapName in maps) {
                        const value = maps[mapName];
                        if (this.pub.maps[mapName] == null) {
                            callback(`The map ${mapName} doesn't exist`);
                            return;
                        }
                        if (value != null && !(value instanceof Buffer)) {
                            callback(`Value for ${mapName} must be an ArrayBuffer or null`);
                            return;
                        }
                    }
                    for (const mapName in maps)
                        this.pub.maps[mapName] = maps[mapName];
                    callback(null, null, maps);
                    this.emit("change");
                }
                client_setMaps(maps) {
                    for (const mapName in maps)
                        this.pub.maps[mapName] = maps[mapName];
                    this.loadTextures();
                }
                server_newMap(client, name, callback) {
                    if (name == null || typeof name !== "string") {
                        callback("Name of the map must be a string");
                        return;
                    }
                    if (this.pub.maps[name] != null) {
                        callback(`The map ${name} already exists`);
                        return;
                    }
                    this.pub.maps[name] = new Buffer(0);
                    callback(null, null, name);
                    this.emit("change");
                }
                client_newMap(name) {
                    this.pub.maps[name] = new Buffer(0);
                }
                server_deleteMap(client, name, callback) {
                    if (name == null || typeof name !== "string") {
                        callback("Name of the map must be a string");
                        return;
                    }
                    if (this.pub.maps[name] == null) {
                        callback(`The map ${name} doesn't exist`);
                        return;
                    }
                    this.client_deleteMap(name);
                    callback(null, null, name);
                    this.emit("change");
                }
                client_deleteMap(name) {
                    for (const slotName in this.pub.mapSlots) {
                        const map = this.pub.mapSlots[slotName];
                        if (map === name)
                            this.pub.mapSlots[slotName] = null;
                    }
                    // NOTE: do not delete, the key must exist so the file can be deleted from the disk when the asset is saved
                    this.pub.maps[name] = null;
                }
                server_renameMap(client, oldName, newName, callback) {
                    if (oldName == null || typeof oldName !== "string") {
                        callback("Name of the map must be a string");
                        return;
                    }
                    if (newName == null || typeof newName !== "string") {
                        callback("New name of the map must be a string");
                        return;
                    }
                    if (this.pub.maps[newName] != null) {
                        callback(`The map ${newName} already exists`);
                        return;
                    }
                    this.client_renameMap(oldName, newName);
                    callback(null, null, oldName, newName);
                    this.emit("change");
                }
                client_renameMap(oldName, newName) {
                    this.pub.maps[newName] = this.pub.maps[oldName];
                    this.pub.maps[oldName] = null;
                    for (const slotName in this.pub.mapSlots) {
                        const map = this.pub.mapSlots[slotName];
                        if (map === oldName)
                            this.pub.mapSlots[slotName] = newName;
                    }
                }
                server_setMapSlot(client, slot, map, callback) {
                    if (slot == null || typeof slot !== "string") {
                        callback("Name of the slot must be a string");
                        return;
                    }
                    if (map != null && typeof map !== "string") {
                        callback("Name of the map must be a string");
                        return;
                    }
                    if (map != null && this.pub.maps[map] == null) {
                        callback(`The map ${map} doesn't exist`);
                        return;
                    }
                    this.pub.mapSlots[slot] = map;
                    callback(null, null, slot, map);
                    this.emit("change");
                }
                client_setMapSlot(slot, map) {
                        this.pub.mapSlots[slot] = map;
                    }
                    // Animations
                server_newAnimation(client, name, duration, keyFrames, callback) {
                    if (duration == null)
                        duration = 0;
                    if (keyFrames == null)
                        keyFrames = [];
                    const animation = { name, duration, keyFrames };
                    this.animations.add(animation, null, (err, actualIndex) => {
                        if (err != null) {
                            callback(err);
                            return;
                        }
                        animation.name = SupCore.Data.ensureUniqueName(animation.id, animation.name, this.animations.pub);
                        callback(null, animation.id, animation, actualIndex);
                        this.emit("change");
                    });
                }
                client_newAnimation(animation, actualIndex) {
                    this.animations.client_add(animation, actualIndex);
                }
                server_deleteAnimation(client, id, callback) {
                    this.animations.remove(id, (err) => {
                        if (err != null) {
                            callback(err);
                            return;
                        }
                        callback(null, null, id);
                        this.emit("change");
                    });
                }
                client_deleteAnimation(id) {
                    this.animations.client_remove(id);
                }
                server_moveAnimation(client, id, newIndex, callback) {
                    this.animations.move(id, newIndex, (err, actualIndex) => {
                        if (err != null) {
                            callback(err);
                            return;
                        }
                        callback(null, null, id, actualIndex);
                        this.emit("change");
                    });
                }
                client_moveAnimation(id, newIndex) {
                    this.animations.client_move(id, newIndex);
                }
                server_setAnimationProperty(client, id, key, value, callback) {
                    if (key === "name") {
                        if (typeof value !== "string") {
                            callback("Invalid value");
                            return;
                        }
                        value = value.trim();
                        if (SupCore.Data.hasDuplicateName(id, value, this.animations.pub)) {
                            callback("There's already an animation with this name");
                            return;
                        }
                    }
                    this.animations.setProperty(id, key, value, (err, actualValue) => {
                        if (err != null) {
                            callback(err);
                            return;
                        }
                        callback(null, null, id, key, actualValue);
                        this.emit("change");
                    });
                }
                client_setAnimationProperty(id, key, actualValue) {
                    this.animations.client_setProperty(id, key, actualValue);
                }
                server_setAnimation(client, id, duration, keyFrames, callback) {
                    let violation = SupCore.Data.Base.getRuleViolation(duration, ModelAnimations_1.default.schema["duration"], true);
                    if (violation != null) {
                        callback(`Invalid duration: ${SupCore.Data.Base.formatRuleViolation(violation)}`);
                        return;
                    }
                    violation = SupCore.Data.Base.getRuleViolation(keyFrames, ModelAnimations_1.default.schema["keyFrames"], true);
                    if (violation != null) {
                        callback(`Invalid duration: ${SupCore.Data.Base.formatRuleViolation(violation)}`);
                        return;
                    }
                    const animation = this.animations.byId[id];
                    if (animation == null) {
                        callback(`Invalid animation id: ${id}`);
                        return;
                    }
                    animation.duration = duration;
                    animation.keyFrames = keyFrames;
                    callback(null, null, id, duration, keyFrames);
                    this.emit("change");
                }
                client_setAnimation(id, duration, keyFrames) {
                    const animation = this.animations.byId[id];
                    animation.duration = duration;
                    animation.keyFrames = keyFrames;
                }
            }
            ModelAsset.currentFormatVersion = 2;
            ModelAsset.schema = {
                formatVersion: { type: "integer" },
                unitRatio: { type: "number", minExcluded: 0, mutable: true },
                upAxisMatrix: { type: "array", length: 16, items: { type: "number" } },
                attributes: {
                    type: "hash",
                    properties: {
                        position: { type: "buffer?", mutable: true },
                        index: { type: "buffer?", mutable: true },
                        color: { type: "buffer?", mutable: true },
                        uv: { type: "buffer?", mutable: true },
                        normal: { type: "buffer?", mutable: true },
                        skinIndex: { type: "buffer?", mutable: true },
                        skinWeight: { type: "buffer?", mutable: true }
                    }
                },
                bones: {
                    type: "array",
                    items: {
                        type: "hash",
                        properties: {
                            name: { type: "string", minLength: 1, maxLength: 80 },
                            parentIndex: { type: "integer?" },
                            matrix: { type: "array", length: 16, items: { type: "number" } }
                        }
                    }
                },
                // TODO: Material
                maps: {
                    type: "hash",
                    values: { type: "buffer?" }
                },
                filtering: { type: "enum", items: ["pixelated", "smooth"], mutable: true },
                wrapping: { type: "enum", items: ["clampToEdge", "repeat", "mirroredRepeat"], mutable: true },
                animations: { type: "array" },
                opacity: { type: "number?", min: 0, max: 1, mutable: true },
                mapSlots: {
                    type: "hash",
                    properties: {
                        map: { type: "string?", mutable: true },
                        light: { type: "string?", mutable: true },
                        specular: { type: "string?", mutable: true },
                        alpha: { type: "string?", mutable: true },
                        normal: { type: "string?", mutable: true }
                    }
                }
            };
            exports.default = ModelAsset;

        }).call(this, typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {}, require("buffer").Buffer)
    }, { "./ModelAnimations": 14, "async": 1, "buffer": 4, "fs": 3, "path": 8 }],
    16: [function(require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        const THREE = SupEngine.THREE;
        const engine = {};
        exports.default = engine;
        const canvasElt = document.querySelector("canvas");
        engine.gameInstance = new SupEngine.GameInstance(canvasElt);
        const cameraActor = new SupEngine.Actor(engine.gameInstance, "Camera");
        cameraActor.setLocalPosition(new THREE.Vector3(0, 0, 10));
        const cameraComponent = new SupEngine.componentClasses["Camera"](cameraActor);
        new SupEngine.editorComponentClasses["Camera3DControls"](cameraActor, cameraComponent);
        const light = new THREE.AmbientLight(0xcfcfcf);
        engine.gameInstance.threeScene.add(light);
        const spotLight = new THREE.PointLight(0xffffff, 0.2);
        cameraActor.threeObject.add(spotLight);
        spotLight.updateMatrixWorld(false);
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
            } else if (animationFrame == null) {
                animationFrame = requestAnimationFrame(tick);
            }
        }
        let lastTimestamp = 0;
        let accumulatedTime = 0;

        function tick(timestamp = 0) {
            accumulatedTime += timestamp - lastTimestamp;
            lastTimestamp = timestamp;
            const { updates, timeLeft } = engine.gameInstance.tick(accumulatedTime);
            accumulatedTime = timeLeft;
            if (updates > 0)
                engine.gameInstance.draw();
            animationFrame = requestAnimationFrame(tick);
        }
        animationFrame = requestAnimationFrame(tick);

    }, {}],
    17: [function(require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        const async = require("async");
        const index_1 = require("./index");
        const THREE = SupEngine.THREE;
        var GLTFConst;
        (function(GLTFConst) {
            GLTFConst[GLTFConst["UNSIGNED_SHORT"] = 5123] = "UNSIGNED_SHORT";
            GLTFConst[GLTFConst["FLOAT"] = 5126] = "FLOAT";
        })(GLTFConst || (GLTFConst = {}));
        var GLTFPrimitiveMode;
        (function(GLTFPrimitiveMode) {
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
                        } else if (rootNode.meshes != null && rootNode.meshes.length > 0) {
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
                    } {
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

    }, { "./index": 18, "async": 1 }],
    18: [function(require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        /* tslint:disable:no-unused-variable */
        const obj = require("./obj");
        const gltf = require("./gltf");

        function createLogError(message, file, line) { return { file, line, type: "error", message }; }
        exports.createLogError = createLogError;

        function createLogWarning(message, file, line) { return { file, line, type: "warning", message }; }
        exports.createLogWarning = createLogWarning;

        function createLogInfo(message, file, line) { return { file, line, type: "info", message }; }
        exports.createLogInfo = createLogInfo;
        const modelImporters = { obj, gltf };

        function default_1(files, callback) {
            let modelImporter = null;
            for (const file of files) {
                const filename = file.name;
                const extension = filename.substring(filename.lastIndexOf(".") + 1).toLowerCase();
                modelImporter = modelImporters[extension];
                if (modelImporter != null)
                    break;
            }
            if (modelImporter == null) {
                callback([createLogError("No compatible importer found")]);
                return;
            }
            modelImporter.importModel(files, callback);
            return;
        }
        exports.default = default_1;

    }, { "./gltf": 17, "./obj": 19 }],
    19: [function(require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        const index_1 = require("./index");

        function importModel(files, callback) {
            if (files.length > 1) {
                callback([index_1.createLogError("The OBJ importer only accepts one file at a time")]);
                return;
            }
            SupClient.readFile(files[0], "text", (err, data) => {
                parse(files[0].name, data, callback);
            });
        }
        exports.importModel = importModel;

        function parse(filename, text, callback) {
            const log = [];
            const arrays = { position: [], uv: [], normal: [] };
            const positionsByIndex = [];
            const uvsByIndex = [];
            const normalsByIndex = [];
            const lines = text.replace(/\r\n/g, "\n").split("\n");
            for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
                const line = lines[lineIndex].trim();
                // Ignore empty lines and comments
                if (line.length === 0 || line[0] === "#")
                    continue;
                const [command, ...valueStrings] = line.split(/\s+/);
                switch (command) {
                    case "v":
                        {
                            if (valueStrings.length !== 3) {
                                callback([index_1.createLogError(`Invalid v command: found ${valueStrings.length} values, expected 3`, filename, lineIndex)]);
                                return;
                            }
                            const values = [];
                            for (const valueString of valueStrings)
                                values.push(+valueString);
                            positionsByIndex.push(values);
                        }
                        break;
                    case "vt":
                        {
                            if (valueStrings.length < 2) {
                                callback([index_1.createLogError(`Invalid vt command: found ${valueStrings.length} values, expected 2`, filename, lineIndex)]);
                                return;
                            }
                            if (valueStrings.length > 2)
                                log.push(index_1.createLogWarning(`Ignoring extra texture coordinates (${valueStrings.length} found, using 2), only U and V are supported.`, filename, lineIndex));
                            const values = [];
                            for (let i = 0; i < valueStrings.length; i++)
                                values.push(+valueStrings[i]);
                            uvsByIndex.push(values);
                        }
                        break;
                    case "vn":
                        {
                            if (valueStrings.length !== 3) {
                                callback([index_1.createLogError(`Invalid vn command: found ${valueStrings.length} values, expected 3`, filename, lineIndex)]);
                                return;
                            }
                            const values = [];
                            for (const valueString of valueStrings)
                                values.push(+valueString);
                            normalsByIndex.push(values);
                        }
                        break;
                    case "f":
                        if (valueStrings.length !== 3 && valueStrings.length !== 4) {
                            log.push(index_1.createLogWarning(`Ignoring unsupported face with ${valueStrings.length} vertices, only triangles and quads are supported.`, filename, lineIndex));
                            break;
                        }
                        const positions = [];
                        const uvs = [];
                        const normals = [];
                        for (const valueString of valueStrings) {
                            const [posIndexString, uvIndexString, normalIndexString] = valueString.split("/");
                            const posIndex = posIndexString | 0;
                            const pos = (posIndex >= 0) ? positionsByIndex[posIndex - 1] :
                                positionsByIndex[positionsByIndex.length + posIndex];
                            positions.push(pos);
                            if (uvIndexString != null && uvIndexString.length > 0) {
                                const uvIndex = uvIndexString | 0;
                                const uv = (uvIndex >= 0) ? uvsByIndex[uvIndex - 1] :
                                    uvsByIndex[uvsByIndex.length + uvIndex];
                                uvs.push(uv);
                            }
                            if (normalIndexString != null) {
                                const normalIndex = normalIndexString | 0;
                                const normal = (normalIndex >= 0) ? normalsByIndex[normalIndex - 1] :
                                    normalsByIndex[normalsByIndex.length + normalIndex];
                                normals.push(normal);
                            }
                        }
                        if (valueStrings.length === 3) {
                            // Triangle
                            arrays.position.push(positions[0][0], positions[0][1], positions[0][2]);
                            arrays.position.push(positions[1][0], positions[1][1], positions[1][2]);
                            arrays.position.push(positions[2][0], positions[2][1], positions[2][2]);
                            if (uvs.length > 0) {
                                arrays.uv.push(uvs[0][0], uvs[0][1]);
                                arrays.uv.push(uvs[1][0], uvs[1][1]);
                                arrays.uv.push(uvs[2][0], uvs[2][1]);
                            }
                            if (normals.length > 0) {
                                arrays.normal.push(normals[0][0], normals[0][1], normals[0][2]);
                                arrays.normal.push(normals[1][0], normals[1][1], normals[1][2]);
                                arrays.normal.push(normals[2][0], normals[2][1], normals[2][2]);
                            }
                        } else {
                            // Quad
                            arrays.position.push(positions[0][0], positions[0][1], positions[0][2]);
                            arrays.position.push(positions[1][0], positions[1][1], positions[1][2]);
                            arrays.position.push(positions[2][0], positions[2][1], positions[2][2]);
                            arrays.position.push(positions[0][0], positions[0][1], positions[0][2]);
                            arrays.position.push(positions[2][0], positions[2][1], positions[2][2]);
                            arrays.position.push(positions[3][0], positions[3][1], positions[3][2]);
                            if (uvs.length > 0) {
                                arrays.uv.push(uvs[0][0], uvs[0][1]);
                                arrays.uv.push(uvs[1][0], uvs[1][1]);
                                arrays.uv.push(uvs[2][0], uvs[2][1]);
                                arrays.uv.push(uvs[0][0], uvs[0][1]);
                                arrays.uv.push(uvs[2][0], uvs[2][1]);
                                arrays.uv.push(uvs[3][0], uvs[3][1]);
                            }
                            if (normals.length > 0) {
                                arrays.normal.push(normals[0][0], normals[0][1], normals[0][2]);
                                arrays.normal.push(normals[1][0], normals[1][1], normals[1][2]);
                                arrays.normal.push(normals[2][0], normals[2][1], normals[2][2]);
                                arrays.normal.push(normals[0][0], normals[0][1], normals[0][2]);
                                arrays.normal.push(normals[2][0], normals[2][1], normals[2][2]);
                                arrays.normal.push(normals[3][0], normals[3][1], normals[3][2]);
                            }
                        }
                        break;
                    default:
                        log.push(index_1.createLogWarning(`Ignoring unsupported OBJ command: ${command}`, filename, lineIndex));
                }
            }
            const buffers = {
                position: new Float32Array(arrays.position).buffer,
                uv: undefined,
                normal: undefined
            };
            const importedAttributes = [];
            if (arrays.uv.length > 0) {
                importedAttributes.push("texture coordinates");
                buffers.uv = new Float32Array(arrays.uv).buffer;
            }
            if (arrays.normal.length > 0) {
                importedAttributes.push("normals");
                buffers.normal = new Float32Array(arrays.normal).buffer;
            }
            const importInfo = (importedAttributes.length > 0) ? ` with ${importedAttributes.join(", ")}` : "";
            log.push(index_1.createLogInfo(`Imported ${arrays.position.length / 3} vertices${importInfo}.`, filename));
            callback(log, { attributes: buffers });
        }

    }, { "./index": 18 }],
    20: [function(require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        require("./ui");
        require("./engine");
        require("./network");

    }, { "./engine": 16, "./network": 21, "./ui": 22 }],
    21: [function(require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        const ui_1 = require("./ui");
        const engine_1 = require("./engine");
        const ModelRenderer_1 = require("../../components/ModelRenderer");
        const ModelRendererUpdater_1 = require("../../components/ModelRendererUpdater");
        SupClient.i18n.load([{ root: `${window.location.pathname}/../..`, name: "modelEditor" }], () => {
            exports.socket = SupClient.connect(SupClient.query.project);
            exports.socket.on("connect", onConnected);
            exports.socket.on("disconnect", SupClient.onDisconnected);
        });
        const onEditCommands = {};

        function onConnected() {
            exports.data = {};
            exports.data.projectClient = new SupClient.ProjectClient(exports.socket, { subEntries: false });
            const modelActor = new SupEngine.Actor(engine_1.default.gameInstance, "Model");
            const modelRenderer = new ModelRenderer_1.default(modelActor);
            const config = { modelAssetId: SupClient.query.asset, materialType: "phong", color: "ffffff" };
            const subscriber = {
                onAssetReceived,
                onAssetEdited: (assetId, command, ...args) => {
                    if (onEditCommands[command] != null)
                        onEditCommands[command](...args);
                },
                onAssetTrashed: SupClient.onAssetTrashed
            };
            exports.data.modelUpdater = new ModelRendererUpdater_1.default(exports.data.projectClient, modelRenderer, config, subscriber);
        }

        function onAssetReceived() {
            const pub = exports.data.modelUpdater.modelAsset.pub;
            for (let index = 0; index < pub.animations.length; index++) {
                const animation = pub.animations[index];
                ui_1.setupAnimation(animation, index);
            }
            ui_1.default.filteringSelect.value = pub.filtering;
            ui_1.default.wrappingSelect.value = pub.wrapping;
            ui_1.default.unitRatioInput.value = pub.unitRatio.toString();
            ui_1.setupOpacity(pub.opacity);
            for (const mapName in pub.maps)
                if (pub.maps[mapName] != null)
                    ui_1.setupMap(mapName);
            for (const slotName in pub.mapSlots)
                ui_1.default.mapSlotsInput[slotName].value = pub.mapSlots[slotName] != null ? pub.mapSlots[slotName] : "";
        }
        onEditCommands["setProperty"] = (path, value) => {
            switch (path) {
                case "filtering":
                    ui_1.default.filteringSelect.value = value;
                    break;
                case "wrapping":
                    ui_1.default.wrappingSelect.value = value;
                    break;
                case "unitRatio":
                    ui_1.default.unitRatioInput.value = value.toString();
                    break;
                case "opacity":
                    ui_1.setupOpacity(value);
                    break;
            }
        };
        onEditCommands["newAnimation"] = (animation, index) => {
            ui_1.setupAnimation(animation, index);
        };
        onEditCommands["deleteAnimation"] = (id) => {
            const animationElt = ui_1.default.animationsTreeView.treeRoot.querySelector(`li[data-id="${id}"]`);
            ui_1.default.animationsTreeView.remove(animationElt);
            if (ui_1.default.selectedAnimationId === id)
                ui_1.updateSelectedAnimation();
        };
        onEditCommands["moveAnimation"] = (id, index) => {
            const animationElt = ui_1.default.animationsTreeView.treeRoot.querySelector(`li[data-id="${id}"]`);
            ui_1.default.animationsTreeView.insertAt(animationElt, "item", index);
        };
        onEditCommands["setAnimationProperty"] = (id, key, value) => {
            const animationElt = ui_1.default.animationsTreeView.treeRoot.querySelector(`li[data-id="${id}"]`);
            switch (key) {
                case "name":
                    animationElt.querySelector(".name").textContent = value;
                    break;
            }
        };
        onEditCommands["newMap"] = (name) => {
            ui_1.setupMap(name);
        };
        onEditCommands["renameMap"] = (oldName, newName) => {
            const pub = exports.data.modelUpdater.modelAsset.pub;
            const textureElt = ui_1.default.texturesTreeView.treeRoot.querySelector(`[data-name="${oldName}"]`);
            textureElt.dataset["name"] = newName;
            textureElt.querySelector("span").textContent = newName;
            for (const slotName in pub.mapSlots)
                if (ui_1.default.mapSlotsInput[slotName].value === oldName)
                    ui_1.default.mapSlotsInput[slotName].value = newName;
        };
        onEditCommands["deleteMap"] = (name) => {
            const textureElt = ui_1.default.texturesTreeView.treeRoot.querySelector(`li[data-name="${name}"]`);
            ui_1.default.texturesTreeView.remove(textureElt);
            const pub = exports.data.modelUpdater.modelAsset.pub;
            for (const slotName in pub.mapSlots)
                if (ui_1.default.mapSlotsInput[slotName].value === name)
                    ui_1.default.mapSlotsInput[slotName].value = "";
        };
        onEditCommands["setMapSlot"] = (slot, map) => {
            ui_1.default.mapSlotsInput[slot].value = map != null ? map : "";
        };

    }, { "../../components/ModelRenderer": 12, "../../components/ModelRendererUpdater": 13, "./engine": 16, "./ui": 22 }],
    22: [function(require, module, exports) {
        "use strict";
        Object.defineProperty(exports, "__esModule", { value: true });
        const network_1 = require("./network");
        const index_1 = require("./importers/index");
        const ModelAsset_1 = require("../../data/ModelAsset");
        const ResizeHandle = require("resize-handle");
        const TreeView = require("dnd-tree-view");
        const ui = {};
        exports.default = ui;
        // Setup resizable panes
        new ResizeHandle(document.querySelector(".sidebar"), "right");
        // Model upload
        const modelFileSelect = document.querySelector(".model input.file-select");
        modelFileSelect.addEventListener("change", onModelFileSelectChange);
        document.querySelector(".model button.upload").addEventListener("click", () => { modelFileSelect.click(); });
        // Primary map upload
        const primaryMapFileSelect = document.querySelector(".map input.file-select");
        primaryMapFileSelect.addEventListener("change", onPrimaryMapFileSelectChange);
        ui.mapUploadButton = document.querySelector(".map button.upload");
        ui.mapUploadButton.addEventListener("click", () => { primaryMapFileSelect.click(); });
        ui.mapDownloadButton = document.querySelector(".map button.download");
        ui.mapDownloadButton.addEventListener("click", () => {
            const textureName = network_1.data.modelUpdater.modelAsset.pub.mapSlots["map"];
            downloadTexture(textureName);
        });
        // Filtering
        ui.filteringSelect = document.querySelector(".filtering");
        ui.filteringSelect.addEventListener("change", onChangeFiltering);
        // Wrapping
        ui.wrappingSelect = document.querySelector(".wrapping");
        ui.wrappingSelect.addEventListener("change", onChangeWrapping);
        // Show skeleton
        const showSkeletonCheckbox = document.querySelector(".show-skeleton");
        showSkeletonCheckbox.addEventListener("change", onShowSkeletonChange);
        // Unit Ratio
        ui.unitRatioInput = document.querySelector("input.property-unitRatio");
        ui.unitRatioInput.addEventListener("change", onChangeUnitRatio);
        // Opacity
        ui.opacitySelect = document.querySelector(".opacity-select");
        ui.opacitySelect.addEventListener("change", onChangeOpacityType);
        ui.opacitySlider = document.querySelector(".opacity-slider");
        ui.opacitySlider.addEventListener("input", onChangeOpacity);
        ui.opacityNumber = document.querySelector(".property-opacity");
        ui.opacityNumber.addEventListener("input", onChangeOpacity);
        // Animations
        ui.animationsTreeView = new TreeView(document.querySelector(".animations-tree-view"), { dragStartCallback: () => true, dropCallback: onAnimationsTreeViewDrop });
        ui.animationsTreeView.on("selectionChange", updateSelectedAnimation);
        document.querySelector("button.new-animation").addEventListener("click", onNewAnimationClick);
        // Animation upload
        const animationFileSelect = document.querySelector(".upload-animation.file-select");
        animationFileSelect.addEventListener("change", onAnimationFileSelectChange);
        document.querySelector("button.upload-animation").addEventListener("click", () => { animationFileSelect.click(); });
        document.querySelector("button.rename-animation").addEventListener("click", onRenameAnimationClick);
        document.querySelector("button.delete-animation").addEventListener("click", onDeleteAnimationClick);
        // Advanced textures
        SupClient.setupCollapsablePane(document.querySelector(".advanced-textures"));
        ui.texturesTreeView = new TreeView(document.querySelector(".textures-tree-view"));
        ui.texturesTreeView.on("selectionChange", updateSelectedMap);
        ui.mapSlotsInput = {};
        for (const slotName in ModelAsset_1.default.schema["mapSlots"].properties) {
            ui.mapSlotsInput[slotName] = document.querySelector(`.map-${slotName}`);
            ui.mapSlotsInput[slotName].dataset["name"] = slotName;
            ui.mapSlotsInput[slotName].addEventListener("input", onEditMapSlot);
        }
        document.querySelector("button.new-map").addEventListener("click", onNewMapClick);
        const mapFileSelect = document.querySelector(".upload-map.file-select");
        mapFileSelect.addEventListener("change", onMapFileSelectChange);
        document.querySelector("button.upload-map").addEventListener("click", () => { mapFileSelect.click(); });
        document.querySelector("button.download-map").addEventListener("click", () => {
            if (ui.texturesTreeView.selectedNodes.length !== 1)
                return;
            const selectedNode = ui.texturesTreeView.selectedNodes[0];
            const textureName = selectedNode.dataset["name"];
            downloadTexture(textureName);
        });
        document.querySelector("button.rename-map").addEventListener("click", onRenameMapClick);
        document.querySelector("button.delete-map").addEventListener("click", onDeleteMapClick);
        // Error pane
        ui.errorPane = document.querySelector(".error-pane");
        ui.errorPaneStatus = ui.errorPane.querySelector(".header");
        ui.errorPaneInfo = ui.errorPaneStatus.querySelector(".info");
        ui.errorsTBody = ui.errorPane.querySelector(".content tbody");
        SupClient.setupCollapsablePane(ui.errorPane);

        function setImportLog(log) {
            let errorsCount = 0;
            let warningsCount = 0;
            let lastErrorRow = null;
            if (log == null)
                log = [];
            for (const entry of log) {
                // console.log(entry.file, entry.line, entry.type, entry.message);
                const logRow = document.createElement("tr");
                const positionCell = document.createElement("td");
                positionCell.textContent = (entry.line != null) ? (entry.line + 1).toString() : "";
                logRow.appendChild(positionCell);
                const typeCell = document.createElement("td");
                typeCell.textContent = entry.type;
                logRow.appendChild(typeCell);
                const messageCell = document.createElement("td");
                messageCell.textContent = entry.message;
                logRow.appendChild(messageCell);
                const fileCell = document.createElement("td");
                fileCell.textContent = entry.file;
                logRow.appendChild(fileCell);
                if (entry.type === "warning")
                    warningsCount++;
                if (entry.type !== "error") {
                    ui.errorsTBody.appendChild(logRow);
                    continue;
                }
                ui.errorsTBody.insertBefore(logRow, (lastErrorRow != null) ? lastErrorRow.nextElementSibling : ui.errorsTBody.firstChild);
                lastErrorRow = logRow;
                errorsCount++;
            }
            const errorsAndWarningsInfo = [];
            if (errorsCount > 1)
                errorsAndWarningsInfo.push(`${errorsCount} errors`);
            else if (errorsCount > 0)
                errorsAndWarningsInfo.push(`1 error`);
            else
                errorsAndWarningsInfo.push("No errors");
            if (warningsCount > 1)
                errorsAndWarningsInfo.push(`${warningsCount} warnings`);
            else if (warningsCount > 0)
                errorsAndWarningsInfo.push(`${warningsCount} warnings`);
            if (network_1.data == null || errorsCount > 0) {
                const info = (network_1.data == null) ? `Import failed — ` : "";
                ui.errorPaneInfo.textContent = info + errorsAndWarningsInfo.join(", ");
                ui.errorPaneStatus.classList.add("has-errors");
                return;
            }
            ui.errorPaneInfo.textContent = errorsAndWarningsInfo.join(", ");
            ui.errorPaneStatus.classList.remove("has-errors");
        }

        function onModelFileSelectChange(event) {
            if (event.target.files.length === 0)
                return;
            ui.errorsTBody.innerHTML = "";
            index_1.default(event.target.files, (log, result) => {
                event.target.parentElement.reset();
                setImportLog(log);
                if (result != null) {
                    network_1.data.projectClient.editAsset(SupClient.query.asset, "setModel", result.upAxisMatrix, result.attributes, result.bones);
                    if (result.maps != null)
                        network_1.data.projectClient.editAsset(SupClient.query.asset, "setMaps", result.maps);
                }
            });
        }

        function onPrimaryMapFileSelectChange(event) {
            ui.errorsTBody.innerHTML = "";
            ui.errorPaneInfo.textContent = "No errors";
            ui.errorPaneStatus.classList.remove("has-errors");
            const reader = new FileReader;
            const textureName = network_1.data.modelUpdater.modelAsset.pub.mapSlots["map"];
            const maps = {};
            reader.onload = (event) => {
                maps[textureName] = event.target.result;
                network_1.data.projectClient.editAsset(SupClient.query.asset, "setMaps", maps);
            };
            const element = event.target;
            reader.readAsArrayBuffer(element.files[0]);
            element.parentElement.reset();
            return;
        }

        function downloadTexture(textureName) {
            function triggerDownload(name) {
                const anchor = document.createElement("a");
                document.body.appendChild(anchor);
                anchor.style.display = "none";
                anchor.href = network_1.data.modelUpdater.modelAsset.mapObjectURLs[textureName];
                // Not yet supported in IE and Safari (http://caniuse.com/#feat=download)
                anchor.download = name + ".png";
                anchor.click();
                document.body.removeChild(anchor);
            }
            const options = {
                initialValue: SupClient.i18n.t("modelEditor:sidebar.advancedTextures.downloadInitialValue"),
                validationLabel: SupClient.i18n.t("common:actions.download")
            };
            if (SupApp != null) {
                triggerDownload(options.initialValue);
            } else {
                new SupClient.Dialogs.PromptDialog(SupClient.i18n.t("modelEditor:sidebar.advancedTextures.downloadPrompt"), options, (name) => {
                    if (name == null)
                        return;
                    triggerDownload(name);
                });
            }
        }

        function onChangeFiltering(event) { network_1.data.projectClient.editAsset(SupClient.query.asset, "setProperty", "filtering", event.target.value); }

        function onChangeWrapping(event) { network_1.data.projectClient.editAsset(SupClient.query.asset, "setProperty", "wrapping", event.target.value); }

        function onShowSkeletonChange(event) { network_1.data.modelUpdater.modelRenderer.setShowSkeleton(event.target.checked); }

        function onChangeUnitRatio(event) { network_1.data.projectClient.editAsset(SupClient.query.asset, "setProperty", "unitRatio", parseFloat(event.target.value)); }

        function onChangeOpacityType(event) { network_1.data.projectClient.editAsset(SupClient.query.asset, "setProperty", "opacity", event.target.value === "transparent" ? 1 : null); }

        function onChangeOpacity(event) {
            const opacity = parseFloat(event.target.value);
            if (isNaN(opacity))
                return;
            network_1.data.projectClient.editAsset(SupClient.query.asset, "setProperty", "opacity", opacity);
        }

        function onNewAnimationClick() {
            const options = {
                initialValue: SupClient.i18n.t("modelEditor:sidebar.animations.new.initialValue"),
                validationLabel: SupClient.i18n.t("common:actions.create")
            };
            new SupClient.Dialogs.PromptDialog(SupClient.i18n.t("modelEditor:sidebar.animations.new.prompt"), options, (name) => {
                if (name == null)
                    return;
                network_1.data.projectClient.editAsset(SupClient.query.asset, "newAnimation", name, null, null, (animationId) => {
                    ui.animationsTreeView.clearSelection();
                    ui.animationsTreeView.addToSelection(ui.animationsTreeView.treeRoot.querySelector(`li[data-id="${animationId}"]`));
                    updateSelectedAnimation();
                });
            });
        }

        function onAnimationFileSelectChange(event) {
            if (event.target.files.length === 0)
                return;
            const animationId = ui.selectedAnimationId;
            index_1.default(event.target.files, (log, result) => {
                event.target.parentElement.reset();
                setImportLog(log);
                if (network_1.data != null) {
                    if (result.animation == null) {
                        new SupClient.Dialogs.InfoDialog("No animation found in imported files");
                        return;
                    }
                    // TODO: Check if bones are compatible
                    network_1.data.projectClient.editAsset(SupClient.query.asset, "setAnimation", animationId, result.animation.duration, result.animation.keyFrames);
                }
            });
        }

        function onRenameAnimationClick() {
            if (ui.animationsTreeView.selectedNodes.length !== 1)
                return;
            const selectedNode = ui.animationsTreeView.selectedNodes[0];
            const animation = network_1.data.modelUpdater.modelAsset.animations.byId[selectedNode.dataset["id"]];
            const options = {
                initialValue: animation.name,
                validationLabel: SupClient.i18n.t("common:actions.rename")
            };
            new SupClient.Dialogs.PromptDialog(SupClient.i18n.t("modelEditor:sidebar.animations.renamePrompt"), options, (newName) => {
                if (newName == null)
                    return;
                network_1.data.projectClient.editAsset(SupClient.query.asset, "setAnimationProperty", animation.id, "name", newName);
            });
        }

        function onDeleteAnimationClick() {
            if (ui.animationsTreeView.selectedNodes.length === 0)
                return;
            const confirmLabel = SupClient.i18n.t("modelEditor:sidebar.animations.deleteConfirm");
            const validationLabel = SupClient.i18n.t("common:actions.delete");
            new SupClient.Dialogs.ConfirmDialog(confirmLabel, { validationLabel }, (confirm) => {
                if (!confirm)
                    return;
                for (const selectedNode of ui.animationsTreeView.selectedNodes)
                    network_1.data.projectClient.editAsset(SupClient.query.asset, "deleteAnimation", selectedNode.dataset["id"]);
            });
        }

        function onAnimationsTreeViewDrop(event, dropLocation, orderedNodes) {
            const animationIds = [];
            for (const animation of orderedNodes)
                animationIds.push(animation.dataset["id"]);
            const index = SupClient.getListViewDropIndex(dropLocation, network_1.data.modelUpdater.modelAsset.animations);
            for (let i = 0; i < animationIds.length; i++)
                network_1.data.projectClient.editAsset(SupClient.query.asset, "moveAnimation", animationIds[i], index + i);
            return false;
        }

        function updateSelectedAnimation() {
            const selectedAnimElt = ui.animationsTreeView.selectedNodes[0];
            if (selectedAnimElt != null)
                ui.selectedAnimationId = selectedAnimElt.dataset["id"];
            else
                ui.selectedAnimationId = null;
            const buttons = document.querySelectorAll(".animations-buttons button");
            for (let i = 0; i < buttons.length; i++) {
                const button = buttons[i];
                button.disabled = ui.selectedAnimationId == null && button.className !== "new-animation";
            }
            network_1.data.modelUpdater.config_setProperty("animationId", ui.selectedAnimationId);
        }
        exports.updateSelectedAnimation = updateSelectedAnimation;

        function setupAnimation(animation, index) {
            const liElt = document.createElement("li");
            liElt.dataset["id"] = animation.id;
            const nameSpan = document.createElement("span");
            nameSpan.className = "name";
            nameSpan.textContent = animation.name;
            liElt.appendChild(nameSpan);
            ui.animationsTreeView.insertAt(liElt, "item", index, null);
        }
        exports.setupAnimation = setupAnimation;

        function onEditMapSlot(event) {
            if (event.target.value !== "" && network_1.data.modelUpdater.modelAsset.pub.maps[event.target.value] == null)
                return;
            const slot = event.target.value !== "" ? event.target.value : null;
            network_1.data.projectClient.editAsset(SupClient.query.asset, "setMapSlot", event.target.dataset["name"], slot);
        }

        function onNewMapClick() {
            const options = {
                initialValue: "map",
                validationLabel: SupClient.i18n.t("common:actions.create")
            };
            new SupClient.Dialogs.PromptDialog(SupClient.i18n.t("modelEditor:sidebar.advancedTextures.newMapPrompt"), options, (name) => {
                if (name == null)
                    return;
                network_1.data.projectClient.editAsset(SupClient.query.asset, "newMap", name);
            });
        }

        function onMapFileSelectChange(event) {
            if (ui.texturesTreeView.selectedNodes.length !== 1)
                return;
            const textureName = ui.texturesTreeView.selectedNodes[0].dataset["name"];
            ui.errorsTBody.innerHTML = "";
            ui.errorPaneInfo.textContent = "No errors";
            ui.errorPaneStatus.classList.remove("has-errors");
            const reader = new FileReader;
            const maps = {};
            reader.onload = (event) => {
                maps[textureName] = event.target.result;
                network_1.data.projectClient.editAsset(SupClient.query.asset, "setMaps", maps);
            };
            const element = event.target;
            reader.readAsArrayBuffer(element.files[0]);
            element.parentElement.reset();
            return;
        }

        function onRenameMapClick() {
            if (ui.texturesTreeView.selectedNodes.length !== 1)
                return;
            const textureName = ui.texturesTreeView.selectedNodes[0].dataset["name"];
            const options = {
                initialValue: textureName,
                validationLabel: SupClient.i18n.t("common:actions.rename")
            };
            new SupClient.Dialogs.PromptDialog(SupClient.i18n.t("modelEditor:sidebar.advancedTextures.renameMapPrompt"), options, (newName) => {
                if (newName == null)
                    return;
                network_1.data.projectClient.editAsset(SupClient.query.asset, "renameMap", textureName, newName);
            });
        }

        function onDeleteMapClick() {
            if (ui.texturesTreeView.selectedNodes.length === 0)
                return;
            const confirmLabel = SupClient.i18n.t("modelEditor:sidebar.advancedTextures.deleteMapConfirm");
            const validationLabel = SupClient.i18n.t("common:actions.delete");
            new SupClient.Dialogs.ConfirmDialog(confirmLabel, { validationLabel }, (confirmed) => {
                if (!confirmed)
                    return;
                for (const selectedNode of ui.texturesTreeView.selectedNodes)
                    network_1.data.projectClient.editAsset(SupClient.query.asset, "deleteMap", selectedNode.dataset["name"]);
            });
        }

        function updateSelectedMap() {
            const buttons = document.querySelectorAll(".textures-buttons button");
            for (let i = 0; i < buttons.length; i++) {
                const button = buttons[i];
                if (button.className === "new-map")
                    continue;
                if (button.className === "delete-map")
                    button.disabled = ui.texturesTreeView.selectedNodes.length === 0;
                else
                    button.disabled = ui.texturesTreeView.selectedNodes.length !== 1;
            }
        }
        exports.updateSelectedMap = updateSelectedMap;

        function setupMap(mapName) {
            const liElt = document.createElement("li");
            liElt.dataset["name"] = mapName;
            const nameSpan = document.createElement("span");
            nameSpan.className = "name";
            nameSpan.textContent = mapName;
            liElt.appendChild(nameSpan);
            ui.texturesTreeView.insertAt(liElt, "item", 0, null);
        }
        exports.setupMap = setupMap;

        function setupOpacity(opacity) {
            if (opacity == null) {
                ui.opacitySelect.value = "opaque";
                ui.opacitySlider.parentElement.hidden = true;
                network_1.data.modelUpdater.modelRenderer.setOpacity(1);
            } else {
                ui.opacitySelect.value = "transparent";
                ui.opacitySlider.parentElement.hidden = false;
                ui.opacitySlider.value = opacity.toString();
                ui.opacityNumber.value = opacity.toString();
                network_1.data.modelUpdater.modelRenderer.setOpacity(opacity);
            }
        }
        exports.setupOpacity = setupOpacity;

    }, { "../../data/ModelAsset": 15, "./importers/index": 18, "./network": 21, "dnd-tree-view": 5, "resize-handle": 10 }]
}, {}, [20]);