import $ from './core';

/*
|-------------------------------------------------------------------------------
| Promise 模块
|-------------------------------------------------------------------------------
|
*/

/**
 * ES6 Promise对象简介
 * ===================
 * 1. 含义
 *     Promise是异步编程的一种解决方案，比传统的解决方案（回调函数和事件）更合理和更强大。
 *
 * 2. 特点
 *     (1) 对象状态不受外界影响。
 *     (2) 一旦状态改变就不会再变，任何时候都可以得到这个结果。
 *
 * 3. 优点
 *     (1) 将异步操作以同步操作的流程表达出来，避免回调地狱。
 *     (2) Promise对象提供统一接口，使得控制异步操作更加容易。
 *
 * 4. 缺点
 *     (1) 无法取消Promise，一旦新建它就会立即执行，无法中途取消。
 *     (2) 如果不设置回调函数，Promise内部抛出的错误，不会反应到外部。
 *     (3) 当处于pending状态时，无法得知目前进展到哪一个阶段（刚刚开始还是即将完成）。
 *
 * 5. 使用
 *     (1) 实例化一个Promise对象
 *     (2) 传入一个函数，函数接受两个参数：resolve、reject。
 *     (3) 通过调用Promise对象的方法：then、catch、finally来执行相应的操作。
 *
 * 6. 状态
 *     pending、resolved、rejected
 *
 * 7. Promise原型方法
 *     (1) then
 *     (2) catch
 *     (3) finally
 *
 * 8. Promise类方法
 *     (1) all : 用于将多个Promise实例，包装成一个新的Promise实例。
 *     (2) race : 用于将多个Promise实例，包装成一个新的Promise实例。
 *     (3) reject : 将现有对象转为Promise对象，该实例状态为rejected
 *     (4) resolve : 将现有对象转为Promise对象，该实例状态为resolved
 * 
 */
function getPromise() {
    function noop() {}

    // 状态:
    //
    // 0 - 等待中
    // 1 - 满足条件，值为 _value
    // 2 - 拒绝条件，值为 _value
    // 3 - 采用另一个Promise的状态和值
    //
    // 一旦状态值不为0， 那么这个Promise将不可以被修改.



    // 在正式声明Promise之前，为了减少try catch在代码中显示，定义了几个工具函数，
    // 一起的还有LAST_ERROR 和 IS_ERROR。
    var LAST_ERROR = null;
    var IS_ERROR = {};

    // 用于异步执行回调函数
    function asap(fn) {
        var img = new Image();
        var handler = function() {
            img.removeEventListener("load", handler, false);
            img.removeEventListener("error", handler, false);
            fn();
        };
        img.addEventListener("load", handler, false);
        img.addEventListener("error", handler, false);
        img.src = "data:image/png," + Math.random();
    }

    // 获取参数对象的then属性
    function getThen(obj) {
        try {
            return obj.then;
        } catch (ex) {
            LAST_ERROR = ex;
            return IS_ERROR;
        }
    }

    // 调用目标函数，使用一个参数
    function tryCallOne(fn, a) {
        try {
            return fn(a);
        } catch (ex) {
            LAST_ERROR = ex;
            return IS_ERROR;
        }
    }

    // 调用目标函数，使用两个参数
    function tryCallTwo(fn, a, b) {
        try {
            fn(a, b);
        } catch (ex) {
            LAST_ERROR = ex;
            return IS_ERROR;
        }
    }

    // Promise构造函数
    function Promise(fn) {
        // 必须通过new调用
        if (typeof this !== 'object') {
            throw new TypeError('Promises must be constructed via new');
        }
        // 必须传入一个函数
        if (typeof fn !== 'function') {
            throw new TypeError('Promise constructor\'s argument is not a function');
        }
        this._deferredState = 0;
        this._state = 0;
        this._value = null;
        this._deferreds = null;
        // 如果传入一个空函数，直接返回；否则，调用doResolve
        if (fn === noop) return;
        doResolve(fn, this);
    }
    Promise._onHandle = null;
    Promise._onReject = null;
    Promise._noop = noop;

    // safeThen和then的用法基本一致，都是创建一个异步的空回调res，
    // 然后使用onFulfilled、onRejected和res来创建 Handler
    Promise.prototype.then = function(onFulfilled, onRejected) {
        if (this.constructor !== Promise) {
            return safeThen(this, onFulfilled, onRejected);
        }
        var res = new Promise(noop);
        handle(this, new Handler(onFulfilled, onRejected, res));
        return res;
    };

    function safeThen(self, onFulfilled, onRejected) {
        return new self.constructor(function(resolve, reject) {
            var res = new Promise(noop);
            res.then(resolve, reject);
            handle(self, new Handler(onFulfilled, onRejected, res));
        });
    }

    function handle(self, deferred) {
        // 获取最底层状态依赖的Promise对象
        while (self._state === 3) {
            self = self._value;
        }
        // 提供给外部的进度回调
        if (Promise._onHandle) {
            Promise._onHandle(self);
        }
        if (self._state === 0) {
            if (self._deferredState === 0) {
                self._deferredState = 1;
                self._deferreds = deferred;
                return;
            }
            if (self._deferredState === 1) {
                self._deferredState = 2;
                self._deferreds = [self._deferreds, deferred];
                return;
            }
            self._deferreds.push(deferred);
            return;
        }
        handleResolved(self, deferred);
    }

    function handleResolved(self, deferred) {
        asap(function() {
            var cb = self._state === 1 ? deferred.onFulfilled : deferred.onRejected;
            if (cb === null) {
                if (self._state === 1) {
                    resolve(deferred.promise, self._value);
                } else {
                    reject(deferred.promise, self._value);
                }
                return;
            }
            var ret = tryCallOne(cb, self._value);
            if (ret === IS_ERROR) {
                reject(deferred.promise, LAST_ERROR);
            } else {
                resolve(deferred.promise, ret);
            }
        });
    }

    function resolve(self, newValue) {
        // Promise Resolution Procedure: https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
        // Promise的解决结果不能是自身（自己返回自己然后等待自己，循环）
        if (newValue === self) {
            // 调用reject
            return reject(
                self,
                new TypeError('A promise cannot be resolved with itself.')
            );
        }
        if (newValue && (typeof newValue === 'object' || typeof newValue === 'function')) {
            var then = getThen(newValue);
            // 确保then是可读的
            if (then === IS_ERROR) {
                return reject(self, LAST_ERROR);
            }

            // 如果结果是一个Promise对象
            if (then === self.then && newValue instanceof Promise) {
                self._state = 3;
                self._value = newValue;
                finale(self);
                return;

                // 如果是函数，继续调用doResolve
            } else if (typeof then === 'function') {
                doResolve(then.bind(newValue), self);
                return;
            }
        }

        // 如果不是以上情况（对象或数组）
        self._state = 1;
        self._value = newValue;
        finale(self);
    }

    function reject(self, newValue) {
        self._state = 2;
        self._value = newValue;
        if (Promise._onReject) {
            Promise._onReject(self, newValue); // 过程回调通知
        }
        finale(self);
    }

    function finale(self) {
        if (self._deferredState === 1) {
            handle(self, self._deferreds);
            self._deferreds = null;
        }
        if (self._deferredState === 2) {
            for (var i = 0; i < self._deferreds.length; i++) {
                handle(self, self._deferreds[i]);
            }
            self._deferreds = null;
        }
    }

    function Handler(onFulfilled, onRejected, promise) {
        this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null;
        this.onRejected = typeof onRejected === 'function' ? onRejected : null;
        this.promise = promise;
    }


    // 同步调用传入Promise的参数函数
    // doResolve 是用来控制 调用 resolve 还是 reject
    function doResolve(fn, promise) {
        var done = false; // 确保 resolve 和 reject 只调用一次
        var res = tryCallTwo(fn, function(value) {
            if (done) return;
            done = true;
            resolve(promise, value);
        }, function(reason) {
            if (done) return;
            done = true;
            reject(promise, reason);
        });

        // 如果在未调用resolve或reject函数前出错了，直接调用reject
        if (!done && res === IS_ERROR) {
            done = true;
            reject(promise, LAST_ERROR);
        }
    }

    /****************
     * finally
     */
    Promise.prototype.finally = function(f) {
        return this.then(function(value) {
            return Promise.resolve(f()).then(function() {
                return value;
            });
        }, function(err) {
            return Promise.resolve(f()).then(function() {
                throw err;
            });
        });
    };

    /****************
     * done
     */
    Promise.prototype.done = function(onFulfilled, onRejected) {
        var self = arguments.length ? this.then.apply(this, arguments) : this;
        self.then(null, function(err) {
            setTimeout(function() {
                throw err;
            }, 0);
        });
    };


    /****************
     * es6-extensions
     */
    var TRUE = valuePromise(true);
    var FALSE = valuePromise(false);
    var NULL = valuePromise(null);
    var UNDEFINED = valuePromise(undefined);
    var ZERO = valuePromise(0);
    var EMPTYSTRING = valuePromise('');

    function valuePromise(value) {
        var p = new Promise(Promise._noop);
        p._state = 1;
        p._value = value;
        return p;
    }
    Promise.resolve = function(value) {
        if (value instanceof Promise) return value;

        if (value === null) return NULL;
        if (value === undefined) return UNDEFINED;
        if (value === true) return TRUE;
        if (value === false) return FALSE;
        if (value === 0) return ZERO;
        if (value === '') return EMPTYSTRING;

        if (typeof value === 'object' || typeof value === 'function') {
            try {
                var then = value.then;
                if (typeof then === 'function') {
                    return new Promise(then.bind(value));
                }
            } catch (ex) {
                return new Promise(function(resolve, reject) {
                    reject(ex);
                });
            }
        }
        return valuePromise(value);
    };

    Promise.all = function(arr) {
        var args = Array.prototype.slice.call(arr);

        return new Promise(function(resolve, reject) {
            if (args.length === 0) return resolve([]);
            var remaining = args.length;

            function res(i, val) {
                if (val && (typeof val === 'object' || typeof val === 'function')) {
                    if (val instanceof Promise && val.then === Promise.prototype.then) {
                        while (val._state === 3) {
                            val = val._value;
                        }
                        if (val._state === 1) return res(i, val._value);
                        if (val._state === 2) reject(val._value);
                        val.then(function(val) {
                            res(i, val);
                        }, reject);
                        return;
                    } else {
                        var then = val.then;
                        if (typeof then === 'function') {
                            var p = new Promise(then.bind(val));
                            p.then(function(val) {
                                res(i, val);
                            }, reject);
                            return;
                        }
                    }
                }
                args[i] = val;
                if (--remaining === 0) {
                    resolve(args);
                }
            }
            for (var i = 0; i < args.length; i++) {
                res(i, args[i]);
            }
        });
    };

    Promise.reject = function(value) {
        return new Promise(function(resolve, reject) {
            reject(value);
        });
    };

    Promise.race = function(values) {
        return new Promise(function(resolve, reject) {
            values.forEach(function(value) {
                Promise.resolve(value).then(resolve, reject);
            });
        });
    };

    /* Prototype Methods */

    Promise.prototype['catch'] = function(onRejected) {
        return this.then(null, onRejected);
    };

    return Promise;
}
$.Promise = typeof Promise === 'function' ? Promise : getPromise();