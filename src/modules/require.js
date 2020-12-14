
/**
 * +------------------------------+
 * |  模块加载器                  |
 * +------------------------------+
 *
 * 伪AMD规范
 * ================================================
 * 好处：
 * （1）实现js文件的异步加载，避免网页失去响应；
 * （2）管理模块之间的依赖性，便于代码的编写和维护。
 * ================================================
 * 模块加载路径
 * data-main：指定网页程序的主模块。
 * ================================================
 * 循环依赖：
 * 待完善
 * ================================================
 * 接口
 * -----
 * 接口主要有两个，define与require。
 * define参数为define(id?, deps?, factory)，第一个参数为ID，
 * 第二个参数为依赖列表，第三个参数为工厂方法。
 * 
 * 前两个可选，如果不定义ID，则为匿名模块，加载器运用一些“魔术”，
 * 能够让它辨识自己叫什么。模块ID约等于模块在工程中的路径。
 *
 * deps和factory有个约定，deps有多少个元素，factory就有多少个参数，位置一一对应。
 *
 * define中还有一个amd对象，里面储存着模块的相关信息。
 *
 * require的参数情况为require(deps, callback)，第一个参数为依赖列表，第二个为回调。
 * deps和callback的关系跟define一样。
 * ===================================================
 * 加载器所在路径的探知
 * --------------------
 * 
 */
(function() {
    var
        // 记录每个模块的加载情况与其他的信息
        modules = {},
        // 正在加载中的模块列表（保存模块的id）
        loadings = [],
        // 指向 require.config 的短变量
        config,
        head = DOC.head,
        // 处理掉href中hash与所有特殊符号，生成长命名空间
        rMakeId = /(#.+|\W)/g,
        // 删除url中类似 /admin/.. 的字符（A的儿子的父亲还是A）
        rDeuce = /\/\w+\/\.\./g,
        // 匹配url中hash和search部分
        rHashSearch = /[?#].*/,
        // 提取 e.stack中的 最后一个url
        rExtractUrl = /[\s\S]*((?:http|https|ftp|dns|smtp|pop3|dhcp|telnet|nfs):\/\/[a-z0-9\-\.]+(?::\d+)?.+?)(?::\d+)?:\d+/,
        rWord = /[^, ]+/g,
        expose = +new Date();

    // 获取当前 javascript 文件的绝对路径，传入true表示获取元素对象
    function getCurrAbsPath( getScript ) {
        var stack, absPath, scripts, script, len;
        // Firefox、Chrome
        if ( DOC.currentScript ) {
            return getScript ? DOC.currentScript : DOC.currentScript.src;
        }

        try {
            a.b.c();
        } catch(e) {
            stack = e.stack || e.fileName || e.sourceURL || e.stacktrace;
        }

        // IE10、低版本Chrome
        if ( stack ) {
            absPath = rExtractUrl.exec( stack )[1];
            if ( absPath ) {
                if ( getScript ) {
                    scripts = DOC.scripts;
                    for ( len = scripts.length - 1; script = scripts[len--]; ) {
                        if ( script.src === absPath ) {
                            return script;
                        }
                    }
                } else {
                    return absPath;
                }
            }
        }

        // IE8-9
        scripts = DOC.scripts;
        for ( len = scripts.length - 1; script = scripts[len--]; ) {
            if ( script.className !== expose && script.readyState === 'interactive' ) {
                script.className = expose;
                return getScript ? script : script.src;
            }
        }
        console.log('获取不到当前文件路径');
    }

    // 检测是否存在循环依赖
    function checkCycle(deps, nick) {
        if ( !deps ) {
            return;
        }
        for ( var len = deps.length, d; d = deps[--len]; ) {
            if ( modules[d].state !== 2 && 
                    (d === nick || checkCycle(modules[d].deps, nick)) ) {
                return true;
            }
        }
    }

    // 在用户加载模块之前及 script.onload 后各执行一次，
    // 检测模块的依赖情况，如果模块没有任何依赖或state都为2，
    // 则调用 fireFactory 方法。
    function checkDeps() {
        loadings.forEach(function(id, i) {
            var moduleObj = modules[id],
                deps = moduleObj.deps,
                d, l;

            // 判断是否所有依赖模块的状态都为2
            for ( l = deps.length; d = deps[--l]; ) {
                if ( modules[d] && modules[d].state !== 2 ) {
                    return;
                } 
            }

            if ( moduleObj !== 2 ) {
                loadings.splice(i, 1);
                fireFactory(id, moduleObj.deps, moduleObj.factory);
                // 如果成功，则再执行一次，以防有些模块就差本模块没有安装好。
                checkDeps();
            }
        });
    }

    /**
     * 从modules对象取得依赖列表中的各模块的返回值，
     * 执行factory, 完成规范模块的安装（非规范模块需onload完）
     * @param {String} id  模块ID
     * @param {Array} deps 依赖列表
     * @param {Function} factory 模块工厂
     * @return {All} ret 模块工厂的返回值
     */
    function fireFactory(id, deps, factory, shim) {
        var args = [], module, ret;

        // 获取依赖的模块暴露的对象
        deps.forEach(function(id) {
            args.push( modules[id].exports );
        });

        module = Object(modules[id]);
        // 执行工厂函数，获取返回值
        ret = factory.apply(null, args);

        // 规范模块调用完工厂函数，完成模块安装
        // 非规范模块onload完即可完成安装
        if ( !modules[id].informal ) {
            module.state = 2;
        }
        if (ret !== void 0) {
            modules[id].exports = ret;
        }
        return ret;
    }

    // 检查js的加载情况，用于调试
    function checkFinish(script, success) {
        var id = script.src;
        script.onload = script.onerror = null;
        if ( success ) {
            console.log('Success：' + id);
        } else {
            setTimeout(function() {
                head.removeChild(script);
            });
            console.log('Fail：' + id);
        }
    }

    function loadJS(url, callback) {
        var script = DOC.createElement('script');
        script.onload = function() {
            if ( bat.isFunction( callback ) ) {
                callback();
            }
            checkFinish(script, true);
            checkDeps();
        };
        script.onerror = function() {
            checkFinish(script, false);
        };
        script.src = url;
        script.charset = 'utf-8';
        script.async = true;
        head.appendChild(script);
        console.log('Loading：' + script.src);
    }

    function loadCSS(url) {
        var id = url.replace(rMakeId, ''),
            link;
        if ( !DOC.getElementById(id) ) {
            var link = DOC.createElement('link');
            link.rel = 'stylesheet';
            link.href = url;
            link.id = id;
            head.appendChild(link );
        }
    }

    // 用于把ID转换为url，再调用loadJS，loadCSS，或者调用 require 方法
    function loadJSCSS(url, parent) {
        var shim, first, isAlias, postfix, src = url;

        // 别名机制
        if ( isAlias = config.alias[src] ) {
            // shim机制
            if ( typeof isAlias === 'object' ) {
                shim = isAlias;
                src = shim.src || src;
            }
        }

        // 把相对路径变为绝对路径
        if ( !/^\w+:.*/.test(src) ) {
            parent = parent.slice(0, parent.lastIndexOf('/') );
            first = src.charAt(0);

            // 当前目录
             if ( src.slice(0, 2) === './' ) {
                src = parent + src.slice(1);

            // 根目录
            } else if ( first === '/' ) {
                src = location.protocol + '//' + location.host + src;

            // 父目录
            } else if ( src.slice(0, 2) === '..' ) {
                src = parent + '/' + src;
                src = src.replace(rDeuce, '');

            // 当前目录
            } else {
                src = parent + '/' + src;
            }
        }

        // 删掉链接中?#部分
        src = src.replace(rHashSearch, '');

        if ( /\.(css|js)$/.test(src) ) {
            postfix =  RegExp.$1;
        }
        // 没有后缀
        if ( !postfix ) {
            src += '.js';
            postfix = 'js';
        }

        // 到这一步，src 已变为完整的绝对路径
        // 准备加载JS
        if ( postfix === 'js' ) {
            // 防止重复加载模块
            if ( modules[src] ) {
                return src;
            }

            modules[src] = {};

            // shim机制
            // 因为非规范模块没有调用 require 方法，
            // 所以让加载器去调用 require 方法，传入非规范模块 src 作为id
            // 规范模块都是以其所在的js文件的路径作为id
            if ( shim ) {
                require(shim.deps || '', function() {
                    // 所有依赖的模块安装完，执行回调函数，
                    // 这时候才加载非规范模块，等非规范模块加载完即可完成安装
                    loadJS(src, function() {
                        modules[src].exports = WIN[shim.exports];
                        modules[src].state = 2;
                        checkDeps();
                    });
                }, src);

            // 规范模块直接加载js
            } else {
                loadJS(src);
            }
            return src;

        // 加载CSS
        } else {
            loadCSS(src);
        }
    }

    function require(depends, factory, shim/*内部参数*/) {
        var
            // 用于检测它的依赖是否都为2
            deps = [],
            // 用于保存依赖模块的返回值
            args = [],
            // 需要安装的模块数
            dn = 0,
            // 已安装完的模块数
            cn = 0,
            // 1. 当前调用 require 函数的所在的文件路径
            // 2. 可传入特定的 id（用于shim）
            id = shim || getCurrAbsPath();

        // 参数调整
        if ( typeof depends === 'function' ) {
            factory = depends;
            depends = [];
        }

        // 加载依赖模块，并保存依赖模块的id
        // 允许通过空格/逗号分隔的字符串或者数组来保存依赖列表
        String(depends).replace(rWord, function(el) {
            var url = loadJSCSS(el, id);
            if ( url ) {
                dn++;
                // 依赖模块之前可能已加载
                if ( modules[url] && modules[url].state === 2 ) {
                    cn++;
                }
                deps.push( url );
            }
        });

        // 创建一个对象，记录模块的加载情况与其他的信息
        modules[id] = {
            id: id,
            factory: factory,
            deps: deps,
            state: 1
        };

        // 给非规范模块添加标识
        if ( shim ) {
            modules[id]['informal'] = true;
        }

        // 所依赖的模块之前都已完成安装，则安装此模块
        if ( dn === cn ) {
            fireFactory(id, deps, factory);

        // 放到正在加载列表，等待 checkDeps 处理
        } else {
            loadings.push(id);
        }

        checkDeps();
    };
    require.amd = modules;
    require.loadings = loadings;

    // 配置
    config = require.config = function(options) {
        if ( bat.isPlainObject(options) ) {
            bat.extend(true, require.config, options);
        }
    };
    config.alias = {};

    bat.require = require;

    // 执行“主模块”的代码
    // “主模块”指整个网页的入口代码。类似于 C 语言的 main() 函数
    (function() {
        var currScript = getCurrAbsPath(true),
            mainUrl = currScript.getAttribute('data-main');

        if ( !mainUrl ) {
            return;
        }

        loadJSCSS(mainUrl, WIN.location.href);
    })();
})();