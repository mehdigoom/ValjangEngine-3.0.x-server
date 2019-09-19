(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
(function (process,global,setImmediate){
/*!
 * async
 * https://github.com/caolan/async
 *
 * Copyright 2010-2014 Caolan McMahon
 * Released under the MIT license
 */
(function () {

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

    async.noConflict = function () {
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

    var _isArray = Array.isArray || function (obj) {
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
        return _map(Array(count), function (v, i) { return i; });
    }

    function _reduce(arr, iterator, memo) {
        _arrayEach(arr, function (x, i, a) {
            memo = iterator(memo, x, i, a);
        });
        return memo;
    }

    function _forEachOf(object, iterator) {
        _arrayEach(_keys(object), function (key) {
            iterator(object[key], key);
        });
    }

    function _indexOf(arr, item) {
        for (var i = 0; i < arr.length; i++) {
            if (arr[i] === item) return i;
        }
        return -1;
    }

    var _keys = Object.keys || function (obj) {
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
                case 0: return func.call(this, rest);
                case 1: return func.call(this, arguments[0], rest);
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
        return function (value, index, callback) {
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
    async.each = function (arr, iterator, callback) {
        return async.eachOf(arr, _withoutIndex(iterator), callback);
    };

    async.forEachSeries =
    async.eachSeries = function (arr, iterator, callback) {
        return async.eachOfSeries(arr, _withoutIndex(iterator), callback);
    };


    async.forEachLimit =
    async.eachLimit = function (arr, limit, iterator, callback) {
        return _eachOfLimit(limit)(arr, _withoutIndex(iterator), callback);
    };

    async.forEachOf =
    async.eachOf = function (object, iterator, callback) {
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
    async.eachOfSeries = function (obj, iterator, callback) {
        callback = _once(callback || noop);
        obj = obj || [];
        var nextKey = _keyIterator(obj);
        var key = nextKey();
        function iterate() {
            var sync = true;
            if (key === null) {
                return callback(null);
            }
            iterator(obj[key], key, only_once(function (err) {
                if (err) {
                    callback(err);
                }
                else {
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
    async.eachOfLimit = function (obj, limit, iterator, callback) {
        _eachOfLimit(limit)(obj, iterator, callback);
    };

    function _eachOfLimit(limit) {

        return function (obj, iterator, callback) {
            callback = _once(callback || noop);
            obj = obj || [];
            var nextKey = _keyIterator(obj);
            if (limit <= 0) {
                return callback(null);
            }
            var done = false;
            var running = 0;
            var errored = false;

            (function replenish () {
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
                    iterator(obj[key], key, only_once(function (err) {
                        running -= 1;
                        if (err) {
                            callback(err);
                            errored = true;
                        }
                        else {
                            replenish();
                        }
                    }));
                }
            })();
        };
    }


    function doParallel(fn) {
        return function (obj, iterator, callback) {
            return fn(async.eachOf, obj, iterator, callback);
        };
    }
    function doParallelLimit(fn) {
        return function (obj, limit, iterator, callback) {
            return fn(_eachOfLimit(limit), obj, iterator, callback);
        };
    }
    function doSeries(fn) {
        return function (obj, iterator, callback) {
            return fn(async.eachOfSeries, obj, iterator, callback);
        };
    }

    function _asyncMap(eachfn, arr, iterator, callback) {
        callback = _once(callback || noop);
        arr = arr || [];
        var results = _isArrayLike(arr) ? [] : {};
        eachfn(arr, function (value, index, callback) {
            iterator(value, function (err, v) {
                results[index] = v;
                callback(err);
            });
        }, function (err) {
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
    async.reduce = function (arr, memo, iterator, callback) {
        async.eachOfSeries(arr, function (x, i, callback) {
            iterator(memo, x, function (err, v) {
                memo = v;
                callback(err);
            });
        }, function (err) {
            callback(err, memo);
        });
    };

    async.foldr =
    async.reduceRight = function (arr, memo, iterator, callback) {
        var reversed = _map(arr, identity).reverse();
        async.reduce(reversed, memo, iterator, callback);
    };

    async.transform = function (arr, memo, iterator, callback) {
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
        eachfn(arr, function (x, index, callback) {
            iterator(x, function (v) {
                if (v) {
                    results.push({index: index, value: x});
                }
                callback();
            });
        }, function () {
            callback(_map(results.sort(function (a, b) {
                return a.index - b.index;
            }), function (x) {
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
                iterator(x, function (v) {
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

    async.sortBy = function (arr, iterator, callback) {
        async.map(arr, function (x, callback) {
            iterator(x, function (err, criteria) {
                if (err) {
                    callback(err);
                }
                else {
                    callback(null, {value: x, criteria: criteria});
                }
            });
        }, function (err, results) {
            if (err) {
                return callback(err);
            }
            else {
                callback(null, _map(results.sort(comparator), function (x) {
                    return x.value;
                }));
            }

        });

        function comparator(left, right) {
            var a = left.criteria, b = right.criteria;
            return a < b ? -1 : a > b ? 1 : 0;
        }
    };

    async.auto = function (tasks, concurrency, callback) {
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
            _arrayEach(listeners.slice(0), function (fn) {
                fn();
            });
        }

        addListener(function () {
            if (!remainingTasks) {
                callback(null, results);
            }
        });

        _arrayEach(keys, function (k) {
            if (hasError) return;
            var task = _isArray(tasks[k]) ? tasks[k]: [tasks[k]];
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
                }
                else {
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
                return runningTasks < concurrency && _reduce(requires, function (a, x) {
                    return (a && results.hasOwnProperty(x));
                }, true) && !results.hasOwnProperty(k);
            }
            if (ready()) {
                runningTasks++;
                task[task.length - 1](taskCallback, results);
            }
            else {
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

        function parseTimes(acc, t){
            if(typeof t === 'number'){
                acc.times = parseInt(t, 10) || DEFAULT_TIMES;
            } else if(typeof t === 'object'){
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
                    task(function(err, result){
                        seriesCallback(!err || finalAttempt, {err: err, result: result});
                    }, wrappedResults);
                };
            }

            function retryInterval(interval){
                return function(seriesCallback){
                    setTimeout(function(){
                        seriesCallback(null);
                    }, interval);
                };
            }

            while (opts.times) {

                var finalAttempt = !(opts.times-=1);
                attempts.push(retryAttempt(opts.task, finalAttempt));
                if(!finalAttempt && opts.interval > 0){
                    attempts.push(retryInterval(opts.interval));
                }
            }

            async.series(attempts, function(done, data){
                data = data[data.length - 1];
                (wrappedCallback || opts.callback)(data.err, data.result);
            });
        }

        // If a callback is passed, run this as a controll flow
        return opts.callback ? wrappedTask() : wrappedTask;
    };

    async.waterfall = function (tasks, callback) {
        callback = _once(callback || noop);
        if (!_isArray(tasks)) {
            var err = new Error('First argument to waterfall must be an array of functions');
            return callback(err);
        }
        if (!tasks.length) {
            return callback();
        }
        function wrapIterator(iterator) {
            return _restParam(function (err, args) {
                if (err) {
                    callback.apply(null, [err].concat(args));
                }
                else {
                    var next = iterator.next();
                    if (next) {
                        args.push(wrapIterator(next));
                    }
                    else {
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

        eachfn(tasks, function (task, key, callback) {
            task(_restParam(function (err, args) {
                if (args.length <= 1) {
                    args = args[0];
                }
                results[key] = args;
                callback(err);
            }));
        }, function (err) {
            callback(err, results);
        });
    }

    async.parallel = function (tasks, callback) {
        _parallel(async.eachOf, tasks, callback);
    };

    async.parallelLimit = function(tasks, limit, callback) {
        _parallel(_eachOfLimit(limit), tasks, callback);
    };

    async.series = function(tasks, callback) {
        _parallel(async.eachOfSeries, tasks, callback);
    };

    async.iterator = function (tasks) {
        function makeCallback(index) {
            function fn() {
                if (tasks.length) {
                    tasks[index].apply(null, arguments);
                }
                return fn.next();
            }
            fn.next = function () {
                return (index < tasks.length - 1) ? makeCallback(index + 1): null;
            };
            return fn;
        }
        return makeCallback(0);
    };

    async.apply = _restParam(function (fn, args) {
        return _restParam(function (callArgs) {
            return fn.apply(
                null, args.concat(callArgs)
            );
        });
    });

    function _concat(eachfn, arr, fn, callback) {
        var result = [];
        eachfn(arr, function (x, index, cb) {
            fn(x, function (err, y) {
                result = result.concat(y || []);
                cb(err);
            });
        }, function (err) {
            callback(err, result);
        });
    }
    async.concat = doParallel(_concat);
    async.concatSeries = doSeries(_concat);

    async.whilst = function (test, iterator, callback) {
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

    async.doWhilst = function (iterator, test, callback) {
        var calls = 0;
        return async.whilst(function() {
            return ++calls <= 1 || test.apply(this, arguments);
        }, iterator, callback);
    };

    async.until = function (test, iterator, callback) {
        return async.whilst(function() {
            return !test.apply(this, arguments);
        }, iterator, callback);
    };

    async.doUntil = function (iterator, test, callback) {
        return async.doWhilst(iterator, function() {
            return !test.apply(this, arguments);
        }, callback);
    };

    async.during = function (test, iterator, callback) {
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

    async.doDuring = function (iterator, test, callback) {
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
        }
        else if(concurrency === 0) {
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
            if(data.length === 0 && q.idle()) {
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
            return function(){
                workers -= 1;

                var removed = false;
                var args = arguments;
                _arrayEach(tasks, function (task) {
                    _arrayEach(workersList, function (worker, index) {
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
            push: function (data, callback) {
                _insert(q, data, false, callback);
            },
            kill: function () {
                q.drain = noop;
                q.tasks = [];
            },
            unshift: function (data, callback) {
                _insert(q, data, true, callback);
            },
            process: function () {
                while(!q.paused && workers < q.concurrency && q.tasks.length){

                    var tasks = q.payload ?
                        q.tasks.splice(0, q.payload) :
                        q.tasks.splice(0, q.tasks.length);

                    var data = _map(tasks, function (task) {
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
            length: function () {
                return q.tasks.length;
            },
            running: function () {
                return workers;
            },
            workersList: function () {
                return workersList;
            },
            idle: function() {
                return q.tasks.length + workers === 0;
            },
            pause: function () {
                q.paused = true;
            },
            resume: function () {
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

    async.queue = function (worker, concurrency) {
        var q = _queue(function (items, cb) {
            worker(items[0], cb);
        }, concurrency, 1);

        return q;
    };

    async.priorityQueue = function (worker, concurrency) {

        function _compareTasks(a, b){
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
            if(data.length === 0) {
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
        q.push = function (data, priority, callback) {
            _insert(q, data, priority, callback);
        };

        // Remove unshift function
        delete q.unshift;

        return q;
    };

    async.cargo = function (worker, payload) {
        return _queue(worker, 1, payload);
    };

    function _console_fn(name) {
        return _restParam(function (fn, args) {
            fn.apply(null, args.concat([_restParam(function (err, args) {
                if (typeof console === 'object') {
                    if (err) {
                        if (console.error) {
                            console.error(err);
                        }
                    }
                    else if (console[name]) {
                        _arrayEach(args, function (x) {
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

    async.memoize = function (fn, hasher) {
        var memo = {};
        var queues = {};
        var has = Object.prototype.hasOwnProperty;
        hasher = hasher || identity;
        var memoized = _restParam(function memoized(args) {
            var callback = args.pop();
            var key = hasher.apply(null, args);
            if (has.call(memo, key)) {   
                async.setImmediate(function () {
                    callback.apply(null, memo[key]);
                });
            }
            else if (has.call(queues, key)) {
                queues[key].push(callback);
            }
            else {
                queues[key] = [callback];
                fn.apply(null, args.concat([_restParam(function (args) {
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

    async.unmemoize = function (fn) {
        return function () {
            return (fn.unmemoized || fn).apply(null, arguments);
        };
    };

    function _times(mapper) {
        return function (count, iterator, callback) {
            mapper(_range(count), iterator, callback);
        };
    }

    async.times = _times(async.map);
    async.timesSeries = _times(async.mapSeries);
    async.timesLimit = function (count, limit, iterator, callback) {
        return async.mapLimit(_range(count), limit, iterator, callback);
    };

    async.seq = function (/* functions... */) {
        var fns = arguments;
        return _restParam(function (args) {
            var that = this;

            var callback = args[args.length - 1];
            if (typeof callback == 'function') {
                args.pop();
            } else {
                callback = noop;
            }

            async.reduce(fns, args, function (newargs, fn, cb) {
                fn.apply(that, newargs.concat([_restParam(function (err, nextargs) {
                    cb(err, nextargs);
                })]));
            },
            function (err, results) {
                callback.apply(that, [err].concat(results));
            });
        });
    };

    async.compose = function (/* functions... */) {
        return async.seq.apply(null, Array.prototype.reverse.call(arguments));
    };


    function _applyEach(eachfn) {
        return _restParam(function(fns, args) {
            var go = _restParam(function(args) {
                var that = this;
                var callback = args.pop();
                return eachfn(fns, function (fn, _, cb) {
                    fn.apply(that, args.concat([cb]));
                },
                callback);
            });
            if (args.length) {
                return go.apply(this, args);
            }
            else {
                return go;
            }
        });
    }

    async.applyEach = _applyEach(async.eachOf);
    async.applyEachSeries = _applyEach(async.eachOfSeries);


    async.forever = function (fn, callback) {
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
        return _restParam(function (args) {
            var callback = args.pop();
            args.push(function () {
                var innerArgs = arguments;
                if (sync) {
                    async.setImmediate(function () {
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
        return function (callback) {
            return callback.apply(this, args);
        };
    });

    async.wrapSync =
    async.asyncify = function asyncify(func) {
        return _restParam(function (args) {
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
        define([], function () {
            return async;
        });
    }
    // included directly via <script> tag
    else {
        root.async = async;
    }

}());

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("timers").setImmediate)
},{"_process":2,"timers":3}],2:[function(require,module,exports){
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
(function (setImmediate,clearImmediate){
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
}).call(this,require("timers").setImmediate,require("timers").clearImmediate)
},{"process/browser.js":2,"timers":3}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("./ui");
require("./network");

},{"./network":5,"./ui":6}],5:[function(require,module,exports){
"use strict";
/// <reference path="../../typescriptAPI/TypeScriptAPIPlugin.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
const ui_1 = require("./ui");
const async = require("async");
exports.data = {
    clientId: null,
    projectClient: null,
    typescriptWorker: new Worker("typescriptWorker.js"),
    assetsById: {},
    asset: null,
    fileNames: [],
    files: {},
    fileNamesByScriptId: {}
};
SupClient.i18n.load([{ root: `${window.location.pathname}/../..`, name: "scriptEditor" }], () => {
    exports.socket = SupClient.connect(SupClient.query.project);
    exports.socket.on("welcome", onWelcome);
    exports.socket.on("disconnect", SupClient.onDisconnected);
});
const onAssetCommands = {};
onAssetCommands["editText"] = (operationData) => {
    ui_1.default.errorPaneStatus.classList.add("has-draft");
    ui_1.default.editor.receiveEditText(operationData);
};
onAssetCommands["applyDraftChanges"] = () => {
    ui_1.default.errorPaneStatus.classList.remove("has-draft");
};
let allScriptsReceived = false;
const scriptSubscriber = {
    onAssetReceived: (id, asset) => {
        exports.data.assetsById[id] = asset;
        const fileName = `${exports.data.projectClient.entries.getPathFromId(id)}.ts`;
        const file = { id: id, text: id === SupClient.query.asset ? asset.pub.draft : asset.pub.text, version: asset.pub.revisionId.toString() };
        exports.data.files[fileName] = file;
        if (id === SupClient.query.asset) {
            ui_1.setupEditor(exports.data.clientId);
            SupClient.setEntryRevisionDisabled(false);
            exports.data.asset = asset;
            ui_1.start(exports.data.asset);
        }
        if (!allScriptsReceived) {
            if (Object.keys(exports.data.files).length === exports.data.fileNames.length) {
                allScriptsReceived = true;
                exports.data.typescriptWorker.postMessage({ type: "setup", fileNames: exports.data.fileNames, files: exports.data.files });
                scheduleErrorCheck();
            }
        }
        else {
            // All scripts have been received so this must be a newly created script
            exports.data.typescriptWorker.postMessage({ type: "addFile", fileName, index: exports.data.fileNames.indexOf(fileName), file });
            scheduleErrorCheck();
        }
    },
    onAssetRestored: (id, asset) => {
        exports.data.assetsById[id] = asset;
        if (id === SupClient.query.asset) {
            exports.data.asset = asset;
            if (ui_1.default.selectedRevision === "current") {
                ui_1.start(exports.data.asset);
                updateWorkerFile(id, asset.pub.draft, asset.pub.revisionId.toString());
            }
        }
        else {
            updateWorkerFile(id, asset.pub.text, asset.pub.revisionId.toString());
        }
    },
    onAssetEdited: (id, command, ...args) => {
        if (id !== SupClient.query.asset) {
            if (command === "applyDraftChanges") {
                const fileName = `${exports.data.projectClient.entries.getPathFromId(id)}.ts`;
                const asset = exports.data.assetsById[id];
                const file = exports.data.files[fileName];
                file.text = asset.pub.text;
                file.version = asset.pub.revisionId.toString();
                exports.data.typescriptWorker.postMessage({ type: "updateFile", fileName, text: file.text, version: file.version });
                scheduleErrorCheck();
            }
            return;
        }
        if (ui_1.default.selectedRevision === "current" && onAssetCommands[command] != null)
            onAssetCommands[command].apply(exports.data.asset, args);
    },
    onAssetTrashed: (id) => {
        if (id !== SupClient.query.asset)
            return;
        ui_1.default.editor.clear();
        if (ui_1.default.errorCheckTimeout != null)
            clearTimeout(ui_1.default.errorCheckTimeout);
        if (ui_1.default.completionTimeout != null)
            clearTimeout(ui_1.default.completionTimeout);
        SupClient.onAssetTrashed();
    },
};
function updateWorkerFile(id, text, version) {
    const fileName = `${exports.data.projectClient.entries.getPathFromId(id)}.ts`;
    const file = exports.data.files[fileName];
    file.text = text;
    file.version = version;
    exports.data.typescriptWorker.postMessage({ type: "updateFile", fileName, text: file.text, version: file.version });
    scheduleErrorCheck();
}
exports.updateWorkerFile = updateWorkerFile;
const entriesSubscriber = {
    onEntriesReceived: (entries) => {
        entries.walk((entry) => {
            if (entry.type !== "script")
                return;
            const fileName = `${exports.data.projectClient.entries.getPathFromId(entry.id)}.ts`;
            exports.data.fileNames.push(fileName);
            exports.data.fileNamesByScriptId[entry.id] = fileName;
            exports.data.projectClient.subAsset(entry.id, "script", scriptSubscriber);
        });
    },
    onEntryAdded: (newEntry, parentId, index) => {
        if (newEntry.type !== "script")
            return;
        const fileName = `${exports.data.projectClient.entries.getPathFromId(newEntry.id)}.ts`;
        let i = 0;
        exports.data.projectClient.entries.walk((entry) => {
            if (entry.type !== "script")
                return;
            if (entry.id === newEntry.id)
                exports.data.fileNames.splice(i, 0, fileName);
            i++;
        });
        exports.data.fileNamesByScriptId[newEntry.id] = fileName;
        exports.data.projectClient.subAsset(newEntry.id, "script", scriptSubscriber);
    },
    onEntryMoved: (id, parentId, index) => {
        const entry = exports.data.projectClient.entries.byId[id];
        if (entry.type != null && entry.type !== "script")
            return;
        const renameFile = (entry) => {
            if (entry.type == null) {
                for (const child of entry.children)
                    renameFile(child);
            }
            else if (entry.type === "script") {
                const oldFileName = exports.data.fileNamesByScriptId[entry.id];
                const newFileName = `${exports.data.projectClient.entries.getPathFromId(entry.id)}.ts`;
                exports.data.fileNames.splice(exports.data.fileNames.indexOf(oldFileName), 1);
                let i = 0;
                exports.data.projectClient.entries.walk((nextEntry) => {
                    if (nextEntry.type !== "script")
                        return;
                    if (nextEntry.id === entry.id)
                        exports.data.fileNames.splice(i, 0, newFileName);
                    i++;
                });
                exports.data.fileNamesByScriptId[entry.id] = newFileName;
                const file = exports.data.files[oldFileName];
                exports.data.files[newFileName] = file;
                if (newFileName !== oldFileName)
                    delete exports.data.files[oldFileName];
                exports.data.typescriptWorker.postMessage({ type: "removeFile", fileName: oldFileName });
                exports.data.typescriptWorker.postMessage({ type: "addFile", fileName: newFileName, index: exports.data.fileNames.indexOf(newFileName), file });
            }
        };
        renameFile(entry);
        scheduleErrorCheck();
    },
    onSetEntryProperty: (id, key, value) => {
        const entry = exports.data.projectClient.entries.byId[id];
        if ((entry.type != null && entry.type !== "script") || key !== "name")
            return;
        const renameFile = (entry) => {
            if (entry.type == null) {
                for (const child of entry.children)
                    renameFile(child);
            }
            else if (entry.type === "script") {
                const oldFileName = exports.data.fileNamesByScriptId[entry.id];
                const newFileName = `${exports.data.projectClient.entries.getPathFromId(entry.id)}.ts`;
                if (newFileName === oldFileName)
                    return;
                const scriptIndex = exports.data.fileNames.indexOf(oldFileName);
                exports.data.fileNames[scriptIndex] = newFileName;
                exports.data.fileNamesByScriptId[entry.id] = newFileName;
                const file = exports.data.files[oldFileName];
                exports.data.files[newFileName] = file;
                delete exports.data.files[oldFileName];
                exports.data.typescriptWorker.postMessage({ type: "removeFile", fileName: oldFileName });
                exports.data.typescriptWorker.postMessage({ type: "addFile", fileName: newFileName, index: exports.data.fileNames.indexOf(newFileName), file });
            }
        };
        renameFile(entry);
        scheduleErrorCheck();
    },
    onEntryTrashed: (id) => {
        const fileName = exports.data.fileNamesByScriptId[id];
        if (fileName == null)
            return;
        exports.data.fileNames.splice(exports.data.fileNames.indexOf(fileName), 1);
        delete exports.data.files[fileName];
        delete exports.data.fileNamesByScriptId[id];
        exports.data.typescriptWorker.postMessage({ type: "removeFile", fileName });
        scheduleErrorCheck();
    },
};
let isCheckingForErrors = false;
let hasScheduledErrorCheck = false;
let activeCompletion;
let nextCompletion;
exports.data.typescriptWorker.onmessage = (event) => {
    switch (event.data.type) {
        case "errors":
            ui_1.refreshErrors(event.data.errors);
            isCheckingForErrors = false;
            if (hasScheduledErrorCheck)
                startErrorCheck();
            break;
        case "completion":
            if (nextCompletion != null) {
                activeCompletion = null;
                startAutocomplete();
                return;
            }
            for (const item of event.data.list) {
                item.render = (parentElt, data, item) => {
                    parentElt.style.maxWidth = "100em";
                    const rowElement = document.createElement("div");
                    rowElement.style.display = "flex";
                    parentElt.appendChild(rowElement);
                    const kindElement = document.createElement("div");
                    kindElement.style.marginRight = "0.5em";
                    kindElement.style.width = "6em";
                    kindElement.textContent = item.kind;
                    rowElement.appendChild(kindElement);
                    const nameElement = document.createElement("div");
                    nameElement.style.marginRight = "0.5em";
                    nameElement.style.width = "15em";
                    nameElement.style.fontWeight = "bold";
                    nameElement.textContent = item.name;
                    rowElement.appendChild(nameElement);
                    const infoElement = document.createElement("div");
                    infoElement.textContent = item.info;
                    rowElement.appendChild(infoElement);
                };
            }
            const from = { line: activeCompletion.cursor.line, ch: activeCompletion.token.start };
            const to = { line: activeCompletion.cursor.line, ch: activeCompletion.token.end };
            activeCompletion.callback({ list: event.data.list, from, to });
            activeCompletion = null;
            break;
        case "quickInfo":
            if (ui_1.default.infoTimeout == null) {
                ui_1.default.infoElement.textContent = event.data.text;
                ui_1.default.editor.codeMirrorInstance.addWidget(ui_1.default.infoPosition, ui_1.default.infoElement, false);
            }
            break;
        case "parameterHint":
            ui_1.clearParameterPopup();
            if (event.data.texts != null)
                ui_1.showParameterPopup(event.data.texts, event.data.selectedItemIndex, event.data.selectedArgumentIndex);
            break;
        case "definition":
            if (window.parent != null) {
                const entry = SupClient.findEntryByPath(exports.data.projectClient.entries.pub, event.data.fileName);
                SupClient.openEntry(entry.id, { line: event.data.line, ch: event.data.ch });
            }
            break;
    }
};
let isTabActive = true;
let errorCheckPending = false;
window.addEventListener("message", (event) => {
    if (event.data.type === "deactivate" || event.data.type === "activate") {
        isTabActive = event.data.type === "activate";
        if (isTabActive && errorCheckPending)
            startErrorCheck();
    }
});
function startErrorCheck() {
    if (isCheckingForErrors)
        return;
    isCheckingForErrors = true;
    hasScheduledErrorCheck = false;
    errorCheckPending = false;
    exports.data.typescriptWorker.postMessage({ type: "checkForErrors" });
}
function scheduleErrorCheck() {
    if (ui_1.default.errorCheckTimeout != null)
        clearTimeout(ui_1.default.errorCheckTimeout);
    if (!isTabActive) {
        errorCheckPending = true;
        return;
    }
    ui_1.default.errorCheckTimeout = window.setTimeout(() => {
        hasScheduledErrorCheck = true;
        if (!isCheckingForErrors)
            startErrorCheck();
    }, 300);
}
exports.scheduleErrorCheck = scheduleErrorCheck;
function startAutocomplete() {
    if (activeCompletion != null)
        return;
    activeCompletion = nextCompletion;
    nextCompletion = null;
    exports.data.typescriptWorker.postMessage({
        type: "getCompletionAt",
        tokenString: activeCompletion.token.string,
        name: exports.data.fileNamesByScriptId[SupClient.query.asset],
        start: activeCompletion.start
    });
}
function setNextCompletion(completion) {
    nextCompletion = completion;
    if (activeCompletion == null)
        startAutocomplete();
}
exports.setNextCompletion = setNextCompletion;
function onWelcome(clientId) {
    exports.data.clientId = clientId;
    loadPlugins();
}
function loadPlugins() {
    SupClient.fetch(`/systems/${SupCore.system.id}/plugins.json`, "json", (err, pluginsInfo) => {
        async.each(pluginsInfo.list, (pluginName, cb) => {
            SupClient.loadScript(`/systems/${SupCore.system.id}/plugins/${pluginName}/bundles/typescriptAPI.js`, cb);
        }, (err) => {
            // Read API definitions
            let globalDefs = "";
            const actorComponentAccessors = [];
            const plugins = SupCore.system.getPlugins("typescriptAPI");
            for (const pluginName in plugins) {
                const plugin = plugins[pluginName];
                if (plugin.defs != null)
                    globalDefs += plugin.defs;
                if (plugin.exposeActorComponent != null)
                    actorComponentAccessors.push(`${plugin.exposeActorComponent.propertyName}: ${plugin.exposeActorComponent.className};`);
            }
            globalDefs = globalDefs.replace("// INSERT_COMPONENT_ACCESSORS", actorComponentAccessors.join("\n    "));
            exports.data.fileNames.push("lib.d.ts");
            exports.data.files["lib.d.ts"] = { id: "lib.d.ts", text: globalDefs, version: "" };
            exports.data.projectClient = new SupClient.ProjectClient(exports.socket);
            exports.data.projectClient.subEntries(entriesSubscriber);
        });
    });
}

},{"./ui":6,"async":1}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const network_1 = require("./network");
const ui = {};
exports.default = ui;
ui.selectedRevision = "current";
let defaultPosition;
window.addEventListener("message", (event) => {
    if (event.data.type === "setRevision")
        onSelectRevision(event.data.revisionId);
    else if (event.data.type === "activate")
        ui.editor.codeMirrorInstance.focus();
    else if (event.data.type === "setState") {
        const line = parseInt(event.data.state.line, 10);
        const ch = parseInt(event.data.state.ch, 10);
        if (ui.editor != null)
            ui.editor.codeMirrorInstance.getDoc().setCursor({ line, ch });
        else
            defaultPosition = { line, ch };
    }
});
// Parameter hint popup
ui.parameterElement = document.querySelector(".popup-parameter");
ui.parameterElement.parentElement.removeChild(ui.parameterElement);
ui.parameterElement.style.display = "";
const parameterPopupKeyMap = {
    "Esc": () => { clearParameterPopup(); },
    "Up": () => { updateParameterHint(ui.selectedSignatureIndex - 1); },
    "Down": () => { updateParameterHint(ui.selectedSignatureIndex + 1); },
    "Enter": () => {
        const selectedSignature = ui.signatureTexts[ui.selectedSignatureIndex];
        if (selectedSignature.parameters.length === 0)
            return;
        const cursorPosition = ui.editor.codeMirrorInstance.getDoc().getCursor();
        let text = "";
        for (let parameterIndex = 0; parameterIndex < selectedSignature.parameters.length; parameterIndex++) {
            if (parameterIndex !== 0)
                text += ", ";
            text += selectedSignature.parameters[parameterIndex];
        }
        ui.editor.codeMirrorInstance.getDoc().replaceRange(text, cursorPosition, null);
        const endSelection = { line: cursorPosition.line, ch: cursorPosition.ch + selectedSignature.parameters[0].length };
        ui.editor.codeMirrorInstance.getDoc().setSelection(cursorPosition, endSelection);
    },
    "Tab": () => {
        const selectedSignature = ui.signatureTexts[ui.selectedSignatureIndex];
        if (selectedSignature.parameters.length === 0)
            return;
        if (ui.selectedArgumentIndex === selectedSignature.parameters.length - 1)
            return;
        const cursorPosition = ui.editor.codeMirrorInstance.getDoc().getCursor();
        cursorPosition.ch += 2;
        const endSelection = { line: cursorPosition.line, ch: cursorPosition.ch + selectedSignature.parameters[ui.selectedArgumentIndex + 1].length };
        ui.editor.codeMirrorInstance.getDoc().setSelection(cursorPosition, endSelection);
    }
};
function clear() {
    document.querySelector(".loading").hidden = false;
    document.querySelector(".text-editor-container").hidden = true;
    ui.editor.setText("");
    ui.errorPaneInfo.textContent = SupClient.i18n.t("common:states.loading");
    ui.errorPaneStatus.classList.toggle("has-draft", false);
    ui.errorPaneStatus.classList.toggle("has-errors", false);
    clearErrors();
}
exports.clear = clear;
function start(asset) {
    document.querySelector(".loading").hidden = true;
    document.querySelector(".text-editor-container").hidden = false;
    ui.editor.setText(asset.pub.draft);
    ui.errorPaneStatus.classList.toggle("has-draft", asset.hasDraft && ui.selectedRevision === "current");
    if (ui.selectedRevision !== "current")
        ui.editor.codeMirrorInstance.setOption("readOnly", true);
    else if (defaultPosition != null)
        ui.editor.codeMirrorInstance.getDoc().setCursor(defaultPosition);
}
exports.start = start;
// Setup editor
function setupEditor(clientId) {
    const textArea = document.querySelector(".text-editor");
    ui.editor = new TextEditorWidget(network_1.data.projectClient, clientId, textArea, {
        mode: "text/typescript",
        extraKeys: {
            "Ctrl-S": () => { applyDraftChanges({ ignoreErrors: false }); },
            "Cmd-S": () => { applyDraftChanges({ ignoreErrors: false }); },
            "Ctrl-Alt-S": () => { applyDraftChanges({ ignoreErrors: true }); },
            "Cmd-Alt-S": () => { applyDraftChanges({ ignoreErrors: true }); },
            "Ctrl-Space": () => {
                scheduleParameterHint();
                scheduleCompletion();
            },
            "Cmd-Space": () => {
                scheduleParameterHint();
                scheduleCompletion();
            },
            "Shift-Ctrl-F": () => { onGlobalSearch(); },
            "Shift-Cmd-F": () => { onGlobalSearch(); },
            "F8": () => {
                const cursor = ui.editor.codeMirrorInstance.getDoc().getCursor();
                const token = ui.editor.codeMirrorInstance.getTokenAt(cursor);
                if (token.string === ".")
                    token.start = token.end;
                let start = 0;
                for (let i = 0; i < cursor.line; i++)
                    start += ui.editor.codeMirrorInstance.getDoc().getLine(i).length + 1;
                start += cursor.ch;
                network_1.data.typescriptWorker.postMessage({
                    type: "getDefinitionAt",
                    name: network_1.data.fileNamesByScriptId[SupClient.query.asset],
                    start
                });
            }
        },
        editCallback: onEditText,
        sendOperationCallback: (operation) => {
            network_1.data.projectClient.editAsset(SupClient.query.asset, "editText", operation, network_1.data.asset.document.getRevisionId());
        }
    });
    ui.previousLine = -1;
    SupClient.setupCollapsablePane(ui.errorPane, () => { ui.editor.codeMirrorInstance.refresh(); });
    ui.editor.codeMirrorInstance.on("keyup", (instance, event) => {
        clearInfoPopup();
        // "("" character triggers the parameter hint
        if (event.keyCode === 53 ||
            (ui.parameterElement.parentElement != null && event.keyCode !== 27 && event.keyCode !== 38 && event.keyCode !== 40))
            scheduleParameterHint();
        // Ignore Ctrl, Cmd, Escape, Return, Tab, arrow keys, F8
        if (event.ctrlKey || event.metaKey || [27, 9, 13, 37, 38, 39, 40, 119, 16].indexOf(event.keyCode) !== -1)
            return;
        // If the completion popup is active, the hint() method will automatically
        // call for more autocomplete, so we don't need to do anything here.
        if (ui.editor.codeMirrorInstance.state.completionActive != null && ui.editor.codeMirrorInstance.state.completionActive.active())
            return;
        scheduleCompletion();
    });
    ui.editor.codeMirrorInstance.on("cursorActivity", () => {
        const currentLine = ui.editor.codeMirrorInstance.getDoc().getCursor().line;
        if (Math.abs(currentLine - ui.previousLine) >= 1)
            clearParameterPopup();
        else if (ui.parameterElement.parentElement != null)
            scheduleParameterHint();
        ui.previousLine = currentLine;
    });
    ui.editor.codeMirrorInstance.on("endCompletion", () => {
        ui.completionOpened = false;
        if (ui.parameterElement.parentElement != null)
            ui.editor.codeMirrorInstance.addKeyMap(parameterPopupKeyMap);
    });
}
exports.setupEditor = setupEditor;
let localVersionNumber = 0;
function onEditText(text, origin) {
    const localFileName = network_1.data.fileNamesByScriptId[SupClient.query.asset];
    const localFile = network_1.data.files[localFileName];
    localFile.text = text;
    localVersionNumber++;
    localFile.version = `l${localVersionNumber}`;
    // We ignore the initial setValue
    if (origin !== "setValue") {
        network_1.data.typescriptWorker.postMessage({ type: "updateFile", fileName: localFileName, text: localFile.text, version: localFile.version });
        network_1.scheduleErrorCheck();
    }
}
function onSelectRevision(revisionId) {
    if (revisionId === "restored") {
        ui.selectedRevision = "current";
        ui.editor.codeMirrorInstance.setOption("readOnly", false);
        return;
    }
    ui.selectedRevision = revisionId;
    clear();
    if (ui.selectedRevision === "current") {
        network_1.data.asset = network_1.data.assetsById[SupClient.query.asset];
        start(network_1.data.asset);
        network_1.updateWorkerFile(SupClient.query.asset, network_1.data.asset.pub.draft, network_1.data.asset.pub.revisionId.toString());
    }
    else {
        network_1.data.projectClient.getAssetRevision(SupClient.query.asset, "script", ui.selectedRevision, (id, asset) => {
            start(asset);
            network_1.updateWorkerFile(SupClient.query.asset, asset.pub.draft, `l${localVersionNumber}`);
        });
    }
}
// Error pane
ui.errorPane = document.querySelector(".error-pane");
ui.errorPaneStatus = ui.errorPane.querySelector(".header");
ui.errorPaneInfo = ui.errorPaneStatus.querySelector(".info");
const errorsContent = ui.errorPane.querySelector(".content");
ui.errorsTBody = errorsContent.querySelector("tbody");
ui.errorsTBody.addEventListener("click", onErrorTBodyClick);
function clearErrors() {
    ui.editor.codeMirrorInstance.operation(() => {
        // Remove all previous errors
        for (const textMarker of ui.editor.codeMirrorInstance.getDoc().getAllMarks()) {
            if (textMarker.className !== "line-error")
                continue;
            textMarker.clear();
        }
        ui.editor.codeMirrorInstance.clearGutter("line-error-gutter");
        ui.errorsTBody.innerHTML = "";
    });
}
function refreshErrors(errors) {
    clearErrors();
    ui.saveButton.hidden = false;
    ui.saveWithErrorsButton.hidden = true;
    if (errors.length === 0) {
        ui.errorPaneInfo.textContent = SupClient.i18n.t("scriptEditor:errors.noErrors");
        ui.errorPaneStatus.classList.remove("has-errors");
        return;
    }
    ui.errorPaneStatus.classList.add("has-errors");
    let selfErrorsCount = 0;
    let lastSelfErrorRow = null;
    // Display new ones
    ui.editor.codeMirrorInstance.operation(() => {
        for (const error of errors) {
            const errorRow = document.createElement("tr");
            errorRow.dataset["line"] = error.position.line.toString();
            errorRow.dataset["character"] = error.position.character.toString();
            const positionCell = document.createElement("td");
            positionCell.textContent = (error.position.line + 1).toString();
            errorRow.appendChild(positionCell);
            const messageCell = document.createElement("td");
            messageCell.textContent = error.message;
            errorRow.appendChild(messageCell);
            const scriptCell = document.createElement("td");
            errorRow.appendChild(scriptCell);
            if (error.file !== "") {
                errorRow.dataset["assetId"] = network_1.data.files[error.file].id;
                scriptCell.textContent = error.file.substring(0, error.file.length - 3);
            }
            else
                scriptCell.textContent = "Internal";
            if (error.file !== network_1.data.fileNamesByScriptId[SupClient.query.asset]) {
                ui.errorsTBody.appendChild(errorRow);
                continue;
            }
            ui.errorsTBody.insertBefore(errorRow, (lastSelfErrorRow != null) ? lastSelfErrorRow.nextElementSibling : ui.errorsTBody.firstChild);
            lastSelfErrorRow = errorRow;
            selfErrorsCount++;
            const line = error.position.line;
            ui.editor.codeMirrorInstance.getDoc().markText({ line, ch: error.position.character }, { line, ch: error.position.character + error.length }, { className: "line-error" });
            const gutter = document.createElement("div");
            gutter.className = "line-error-gutter";
            gutter.innerHTML = "●";
            ui.editor.codeMirrorInstance.setGutterMarker(line, "line-error-gutter", gutter);
        }
        const otherErrorsCount = errors.length - selfErrorsCount;
        const selfErrorsValue = SupClient.i18n.t(`scriptEditor:errors.${selfErrorsCount > 1 ? "severalErrors" : "oneError"}`, { errors: selfErrorsCount.toString() });
        const selfErrors = SupClient.i18n.t("scriptEditor:errors.selfErrorsInfo", { errors: selfErrorsValue.toString() });
        const otherErrorsValue = SupClient.i18n.t(`scriptEditor:errors.${otherErrorsCount > 1 ? "severalErrors" : "oneError"}`, { errors: otherErrorsCount.toString() });
        const otherErrors = SupClient.i18n.t("scriptEditor:errors.otherErrorsInfo", { errors: otherErrorsValue.toString() });
        if (selfErrorsCount > 0) {
            ui.saveButton.hidden = true;
            ui.saveWithErrorsButton.hidden = false;
            if (otherErrorsCount === 0)
                ui.errorPaneInfo.textContent = selfErrors;
            else
                ui.errorPaneInfo.textContent = SupClient.i18n.t("scriptEditor:errors.bothErrorsInfo", { selfErrors, otherErrors });
        }
        else
            ui.errorPaneInfo.textContent = otherErrors;
    });
}
exports.refreshErrors = refreshErrors;
function onErrorTBodyClick(event) {
    let target = event.target;
    while (true) {
        if (target.tagName === "TBODY")
            return;
        if (target.tagName === "TR")
            break;
        target = target.parentElement;
    }
    const assetId = target.dataset["assetId"];
    if (assetId == null)
        return;
    const line = target.dataset["line"];
    const character = target.dataset["character"];
    if (assetId === SupClient.query.asset) {
        ui.editor.codeMirrorInstance.getDoc().setCursor({ line: parseInt(line, 10), ch: parseInt(character, 10) });
        ui.editor.codeMirrorInstance.focus();
    }
    else {
        if (window.parent != null)
            SupClient.openEntry(assetId, { line, ch: character });
    }
}
// Save buttons
ui.saveButton = ui.errorPane.querySelector(".draft button.save");
ui.saveButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    applyDraftChanges({ ignoreErrors: false });
});
ui.saveWithErrorsButton = ui.errorPane.querySelector(".draft button.save-with-errors");
ui.saveWithErrorsButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    applyDraftChanges({ ignoreErrors: true });
});
function applyDraftChanges(options) {
    ui.saveButton.disabled = true;
    ui.saveWithErrorsButton.disabled = true;
    ui.saveButton.textContent = SupClient.i18n.t("common:states.saving");
    if (options.ignoreErrors)
        ui.saveWithErrorsButton.textContent = SupClient.i18n.t("common:states.saving");
    network_1.data.projectClient.editAssetNoErrorHandling(SupClient.query.asset, "applyDraftChanges", options, (err) => {
        if (err != null && err !== "foundSelfErrors") {
            new SupClient.Dialogs.InfoDialog(err);
            SupClient.onDisconnected();
            return;
        }
        ui.saveButton.disabled = false;
        ui.saveWithErrorsButton.disabled = false;
        ui.saveButton.textContent = SupClient.i18n.t("common:actions.applyChanges");
        ui.saveWithErrorsButton.textContent = SupClient.i18n.t("common:actions.applyChangesWithErrors");
    });
}
// Info popup
ui.infoElement = document.createElement("div");
ui.infoElement.classList.add("popup-info");
document.addEventListener("mouseout", (event) => { clearInfoPopup(); });
let previousMousePosition = { x: -1, y: -1 };
document.addEventListener("mousemove", (event) => {
    if (ui.editor == null)
        return;
    // On some systems, Chrome (at least v43) generates
    // spurious "mousemove" events every second or so.
    if (event.clientX === previousMousePosition.x && event.clientY === previousMousePosition.y)
        return;
    previousMousePosition.x = event.clientX;
    previousMousePosition.y = event.clientY;
    clearInfoPopup();
    ui.infoTimeout = window.setTimeout(() => {
        ui.infoPosition = ui.editor.codeMirrorInstance.coordsChar({ left: event.clientX, top: event.clientY });
        if (ui.infoPosition.outside)
            return;
        let start = 0;
        for (let i = 0; i < ui.infoPosition.line; i++)
            start += ui.editor.codeMirrorInstance.getDoc().getLine(i).length + 1;
        start += ui.infoPosition.ch;
        ui.infoTimeout = null;
        network_1.data.typescriptWorker.postMessage({
            type: "getQuickInfoAt",
            name: network_1.data.fileNamesByScriptId[SupClient.query.asset],
            start
        });
    }, 200);
});
function clearInfoPopup() {
    if (ui.infoElement.parentElement != null)
        ui.infoElement.parentElement.removeChild(ui.infoElement);
    if (ui.infoTimeout != null)
        clearTimeout(ui.infoTimeout);
}
function showParameterPopup(texts, selectedItemIndex, selectedArgumentIndex) {
    ui.signatureTexts = texts;
    ui.selectedArgumentIndex = selectedArgumentIndex;
    updateParameterHint(selectedItemIndex);
    const position = ui.editor.codeMirrorInstance.getDoc().getCursor();
    const coordinates = ui.editor.codeMirrorInstance.cursorCoords(position, "page");
    ui.parameterElement.style.top = `${Math.round(coordinates.top - 30)}px`;
    ui.parameterElement.style.left = `${coordinates.left}px`;
    document.body.appendChild(ui.parameterElement);
    if (!ui.completionOpened)
        ui.editor.codeMirrorInstance.addKeyMap(parameterPopupKeyMap);
}
exports.showParameterPopup = showParameterPopup;
function updateParameterHint(index) {
    if (index < 0)
        index = ui.signatureTexts.length - 1;
    else if (index >= ui.signatureTexts.length)
        index = 0;
    ui.selectedSignatureIndex = index;
    ui.parameterElement.querySelector(".item").textContent = `(${index + 1}/${ui.signatureTexts.length})`;
    const text = ui.signatureTexts[index];
    let prefix = text.prefix;
    let parameter = "";
    let suffix = "";
    for (let parameterIndex = 0; parameterIndex < text.parameters.length; parameterIndex++) {
        let parameterItem = text.parameters[parameterIndex];
        if (parameterIndex < ui.selectedArgumentIndex) {
            if (parameterIndex !== 0)
                prefix += ", ";
            prefix += parameterItem;
        }
        else if (parameterIndex === ui.selectedArgumentIndex) {
            if (parameterIndex !== 0)
                prefix += ", ";
            parameter = parameterItem;
        }
        else {
            if (parameterIndex !== 0)
                suffix += ", ";
            suffix += parameterItem;
        }
    }
    ui.parameterElement.querySelector(".prefix").textContent = prefix;
    ui.parameterElement.querySelector(".parameter").textContent = parameter;
    suffix += text.suffix;
    ui.parameterElement.querySelector(".suffix").textContent = suffix;
}
function clearParameterPopup() {
    if (ui.parameterElement.parentElement != null)
        ui.parameterElement.parentElement.removeChild(ui.parameterElement);
    ui.editor.codeMirrorInstance.removeKeyMap(parameterPopupKeyMap);
}
exports.clearParameterPopup = clearParameterPopup;
function scheduleParameterHint() {
    if (ui.parameterTimeout != null)
        clearTimeout(ui.parameterTimeout);
    ui.parameterTimeout = window.setTimeout(() => {
        const cursor = ui.editor.codeMirrorInstance.getDoc().getCursor();
        const token = ui.editor.codeMirrorInstance.getTokenAt(cursor);
        if (token.string === ".")
            token.start = token.end;
        let start = 0;
        for (let i = 0; i < cursor.line; i++)
            start += ui.editor.codeMirrorInstance.getDoc().getLine(i).length + 1;
        start += cursor.ch;
        network_1.data.typescriptWorker.postMessage({
            type: "getParameterHintAt",
            name: network_1.data.fileNamesByScriptId[SupClient.query.asset],
            start
        });
        ui.parameterTimeout = null;
    }, 100);
}
function hint(instance, callback) {
    const cursor = ui.editor.codeMirrorInstance.getDoc().getCursor();
    const token = ui.editor.codeMirrorInstance.getTokenAt(cursor);
    if (token.string === ".")
        token.start = token.end;
    let start = 0;
    for (let i = 0; i < cursor.line; i++)
        start += ui.editor.codeMirrorInstance.getDoc().getLine(i).length + 1;
    start += cursor.ch;
    network_1.setNextCompletion({ callback, cursor, token, start });
}
hint.async = true;
const hintCustomKeys = {
    "Up": (cm, commands) => { commands.moveFocus(-1); },
    "Down": (cm, commands) => { commands.moveFocus(1); },
    "Enter": (cm, commands) => { commands.pick(); },
    "Tab": (cm, commands) => { commands.pick(); },
    "Esc": (cm, commands) => { commands.close(); },
};
function scheduleCompletion() {
    if (ui.completionTimeout != null)
        clearTimeout(ui.completionTimeout);
    ui.completionTimeout = window.setTimeout(() => {
        ui.completionOpened = true;
        if (ui.parameterElement.parentElement != null)
            ui.editor.codeMirrorInstance.removeKeyMap(parameterPopupKeyMap);
        ui.editor.codeMirrorInstance.showHint({ completeSingle: false, customKeys: hintCustomKeys, hint });
        ui.completionTimeout = null;
    }, 100);
}
// Global search
function onGlobalSearch() {
    if (window.parent == null) {
        // TODO: Find a way to make it work? or display a message saying that you can't?
        return;
    }
    const options = {
        placeholder: SupClient.i18n.t("scriptEditor:globalSearch.placeholder"),
        initialValue: ui.editor.codeMirrorInstance.getDoc().getSelection(),
        validationLabel: SupClient.i18n.t("common:actions.search")
    };
    new SupClient.Dialogs.PromptDialog(SupClient.i18n.t("scriptEditor:globalSearch.prompt"), options, (text) => {
        if (text == null) {
            ui.editor.codeMirrorInstance.focus();
            return;
        }
        window.parent.postMessage({ type: "openTool", name: "search", state: { text } }, window.location.origin);
    });
}

},{"./network":5}]},{},[4]);
