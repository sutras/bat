/**
 * @version v0.1.0
 * @link https://github.com/sutras/bat#readme
 * @license MIT
 */

(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.bat = factory());
}(this, (function () { 'use strict';

    var  
        // 无冲突处理
        _bat = window.bat,

        // 通过两个构造器和一个原型实现无new 实例化
        $ = function( selector, context ) {  // 第一个构造器
            return new $.fn.init( selector, context );  // 第二个构造器
        },

        rFormat = /\\?#\{([^{}]+)\}/mg,  // 简单模板匹配模式
        rWord = /[^, ]+/g,
        rQuickExpr = /^(?:#([\w-]+)|\.([\w-]+)|(\w+))$/,
        rHtml = /^(<[\w\W]+>)[^>]*$/,
        rTagName = /<([a-z][^\/\0>\x20\t\r\n\f]+)/i,
        core_concat = Array.prototype.concat,
        core_slice$1 = Array.prototype.slice,
        core_filter = Array.prototype.filter,
        core_toString = Object.prototype.toString,

        sandbox;

    // 将原型对象放到一个名字更短更好记的属性名中，方便扩展原型方法
    $.fn = $.prototype = {
        // 修正原型对象 constructor 的指向
        constructor: $,

        // bat 的对象构造器，用于替代 bat 来构造对象
        // 为什么把 init 函数放到 bat 原型对象上？无解。
        init: function( selector, context ) {
            var match, elem, elems;

            if ( selector == null ) {
                return this;
            }

            // 针对字符串
            if ( typeof selector === 'string' ) {
                // 确保context是一个元素节点
                context = context ? $.getContext( context ) : document;

                if ( ( match = rQuickExpr.exec( selector ) ) ) {
                    // id
                    if ( match[1] ) {
                        elem = document.getElementById( match[1] );
                        elems = elem ? [elem] : [];

                    // class
                    } else if ( match[2] ) {
                        elems = context.getElementsByClassName( match[2] );

                    // tag
                    } else {
                        elems = context.getElementsByTagName( match[3] );
                    }

                // html
                } else if ( ( match = rHtml.exec( selector ) ) ) {
                    elems = $.createNodes( match[1] );

                // 复杂的选择器
                } else {
                    try {
                        elems = context.querySelectorAll( selector );
                    } catch ( err ) {
                        elems = [];
                    }
                }

                this.selector = selector;

                return $.merge( this, elems );
            }

            // 函数则进行DOMready操作
            if ( typeof selector === 'function' ) {
                $.ready( selector );
                return;
            }

            // 节点、节点列表、、$对象、其他类型数据统统转换为数组并合并到this对象上
            return $.merge( this, $.toArray( selector ) );
        },

        // 转换为纯数组对象

        /**@doc
         * @method  bat.fn.valueOf()
         * @description 把bat对象转换为数组
         * @return {array} 转换后的数组
         */
        valueOf: function() {
            return core_slice$1.call( this );
        },
        
        /**@doc
         * @method  bat.fn.each()
         * @description 迭代当前bat对象
         * @param  {Function} fn 回调函数
         * @return {bat}      当前bat对象
         */
        each: function( fn ) {
            $.each( this, fn );
            return this;
        },

        // 传入数组/类数组对象，生成新的bat对象，并保存旧的bat对象
        pushStack: function( elems ) {
            var ret = $.merge( $(), elems );
            ret.selector = this.selector;
            ret.prevObject = this;
            return ret;
        },

        /**@doc
         * @method  bat.fn.end()
         * @description 结束当前链条中的最近筛选操作，并将匹配元素还原为之前的状态。
         * @return {bat} 前一个bat对象或新bat对象
         */
        end: function() {
            return this.prevObject || $();
        },

        /**@doc
         * @method  bat.fn.index()
         * @description 返回bat对象第一个元素在文档中的下标，或指定元素在bat对象中的下标。
         * @param  {Node|String|bat|null} selector  可选，要查询的节点，不传则将bat第一个元素作为此节点。
         * @return {Number}                         节点的下标
         */
        index: function( selector ) {
            if ( !this[0] ) {
                return -1;
            }
            var group = selector != null ? this : this[0].parentNode.children,
                node = selector != null ? $(selector)[0] : this[0];

            for ( var i = 0; i < group.length; i++ ) {
                if ( group[i] === node ) {
                    return i;
                }
            }
            return -1;
        },

        /**@doc
         * @property bat.fn.length
         * @description bat对象的元素个数
         * @type {Number}
         */
        length: 0
    };

    // 共用同一原型
    $.fn.init.prototype = $.fn;


    /**@doc
     * @method  bat.extend()
     * @description 只传递一个对象时为bat函数扩展属性/方法。
     *              两个及以上对象为第一个对象扩展属性/方法。
     *              若第一个参数为布尔值，可决定是否要深复制。
     * @return {Object} bat函数或第一个参数对象
     */
    /**@doc
     * @method  bat.fn.extend()
     * @description 用于扩展bat原型属性/方法。
     * @return {Object} 当前bat对象或第一个参数对象
     */
    $.extend = $.fn.extend = function() {
        var arguments$1 = arguments;

        var target = arguments[0],
            i = 1,
            l = arguments.length,
            options, name, src, copy, deep, copyIsArray, clone;

        // 深复制
        if ( typeof target === 'boolean' ) {
            deep = target;
            target = arguments[1];
            // 跳过 boolean 和 target
            i = 2;
        }

        // 只传递一个对象情况下，把对象合并到$或$.fn
        if ( l === i ) {
            // this 的强大之处：谁调用我，我指向谁
            target = this;
            --i;
        }

        for ( ; i < l; i++ ) {
            // 不处理null和undefined
            if ( ( options = arguments$1[i] ) != null ) {
                for ( name in options ) {
                    src = target[name];
                    copy = options[name];

                    // 防止有环
                    if ( target === copy ) {
                        continue;
                    }

                    // 深复制
                    if ( deep && copy && ( $.isPlainObject( copy ) ||
                            (copyIsArray = $.isArray(copy)) ) ) {
                        if ( copyIsArray ) {
                            copyIsArray = false;
                            clone = src && $.isArray(src) ? src : [];
                        } else {
                            clone = src && $.isPlainObject(src) ? src : {};
                        }

                        // 只克隆对象，不移动
                        target[ name ] = $.extend(deep, clone, copy);

                        // 不添加未定义的值
                    } else if ( copy !== void 0 ) {
                        target[ name ] = copy;
                    }
                }
            }
        }


        return target;
    };


    // ==========================================
    // 把原生的方法集成到，有些方法可能进行了增强
    // ==========================================

    // 返回原生方法的返回值
    /**@doc
     * @method bat.fn.indexOf()
     * @description 返回bat对象中指定元素的位置
     * @return {Number}        元素的位置
     */
    /**@doc
     * @method bat.fn.reduce()
     * @param {Function} fn 回调函数
     * @return {any}        累计后的结果
     */
    /**@doc
     * @method bat.fn.reduceRight()
     * @description 反向累计器
     * @param {Function} fn 回调函数
     * @return {any}        累计后的结果
     */
    /**@doc
     * @method bat.fn.some()
     * @description 检查bat对象中的元素是否至少有一个满足指定条件
     * @param {Function} fn 回调函数
     * @return {Boolean}        是否满足条件
     */
    /**@doc
     * @method bat.fn.every()
     * @description 检查bat对象中所有的元素是否都满足指定条件
     * @param {Function} fn 回调函数
     * @return {Boolean}        是否满足条件
     */
    ['indexOf', 'reduce', 'reduceRight', 'some', 'every'].forEach(function( method ) {
        $.fn[ method ] = function( filter ) {
            return Array.prototype[ method ].apply( this, arguments );
        };
    });

    // 返回新的bat对象
    /**@doc
     * @method bat.fn.slice()
     * @description 从bat对象中返回选定的元素，组成新的bat对象返回
     * @return {bat}         新的bat对象
     */
    /**@doc
     * @method bat.fn.splice()
     * @description 向数组中添加或删除元素，并将删除的元素，组成新的bat对象返回
     * @return {bat}         新的bat对象
     */
    /**@doc
     * @method bat.fn.map()
     * @description 将bat中的每个元素都传入提供的函数，并将其返回的结果组成新的bat对象
     * @param {Function} fn 回调函数，接收元素
     * @return {bat}         新的bat对象
     */
    /**@doc
     * @method bat.fn.pop()
     * @description 删除bat对象的最后一个元素，并将其组成新的bat对象返回
     * @return {bat}         新的bat对象
     */
    /**@doc
     * @method bat.fn.shift()
     * @description 删除bat对象的第一个元素，并将其组成新的bat对象返回
     * @return {bat}         新的bat对象
     */
    ['slice', 'splice', 'map', 'pop', 'shift'].forEach(function( method ) {
        $.fn[ method ] = function() {
            return this.pushStack( Array.prototype[ method ].apply( this, arguments ) );
        };
    });

    // 返回当前bat对象
    /**@doc
     * @method bat.fn.sort()
     * @description 对当前bat对象的元素进行排序
     * @param  {Function} fn 可选，规定排序顺序
     * @return {bat}         排序后的bat对象
     */
    /**@doc
     * @method bat.fn.reverse()
     * @description 颠倒数组中元素的顺序
     * @return {bat}         颠倒顺序后的bat对象
     */
    /**@doc
     * @method bat.fn.push()
     * @description 向bat对象的末尾添加一个或多个元素
     * @return {bat}         添加新元素后的bat对象
     */
    /**@doc
     * @method bat.fn.unshift()
     * @description 向bat对象的开头添加一个或多个元素
     * @return {bat}         添加新元素后的bat对象
     */
    ['sort', 'reverse', 'push', 'unshift'].forEach(function( method ) {
        $.fn[ method ] = function() {
            Array.prototype[ method ].apply( this, arguments );
            return this;
        };
    });

    $.fn.extend({
        /**@doc
         * @method bat.fn.concat()
         * @description 把一个或多个参数与当前bat对象元素合并，组成新的bat对象返回，参数可以为数组或类数组对象
         * @return {bat} 新的bat对象
         */
        concat: function() {
            var args = core_slice$1.call( arguments ).map(function( item, index ) {
                if ( $.isArrayLike( item ) && item.nodeName !== 'FORM' ) {
                    return core_slice$1.call( item );
                }
                return item;
            });
            return this.pushStack( core_concat.apply( this.valueOf(), args ) );
        },

        /**@doc
         * @method bat.fn.filter()
         * @description 把指定的元素，组成新的bat对象返回
         * @param  {selector|Function} filter 筛选的选择器或函数
         * @return {bat}                      新的bat对象
         */
        filter: function( selector ) {
            if ( typeof selector === 'function' ) {
                return this.pushStack( core_filter.call( this, selector ) );
            }
            var filter = $( selector );
            return this.pushStack( core_filter.call( this, function( node, index ) {
                for ( var i = 0; i < filter.length; i++ ) {
                    if ( filter[i] === node ) {
                        return true;
                    }
                }
            }) );
        }
    });

    // =====================
    // 对bat对象进行筛选操作
    // =====================
    $.fn.extend({
        /**@doc
         * @method  bat.fn.get()
         * @description 返回指定下标的元素，下标可以为负数，
         *              也可以使用方括号语法，但下标不能为负数，
         *              如果不传入参数或参数为 null，则返回 DOM 集合。
         * @param  {Number} index 下标
         * @return {any}           指定下标的元素
         */
        get: function( index ) {
            return index == null ? this.valueOf() : this[ index < 0 ? this.length + index : index ];
        },

        /**@doc
         * @method bat.fn.not()
         * @description 把指定元素以外的元素，组成新的bat对象返回
         * @param  {selector|Function} selector 筛选的选择器或函数
         * @return {bat}                        新的bat对象
         */
        not: function( selector ) {
            return this.pushStack( $.difference( this.get(), this.filter( selector ).get() ) );
        },

        // 取得指定索引的节点，组成新的$对象返回

        /**@doc
         * @method bat.fn.eq()
         * @description 把指定下标的元素，组成新的bat对象返回
         * @param {Number} index 下标
         * @return {bat}         新的bat对象
         */
        eq: function( index ) {
            return index === -1 ? this.slice( index ) : this.slice(index, index + 1);
        },

        /**@doc
         * @method bat.fn.gt()
         * @description 取得大于指定索引的元素，组成新的bat对象返回
         * @param  {Number} index 下标
         * @return {bat}          新的bat对象
         */
        gt: function( index ) {
            return this.slice( index + 1, this.length );
        },

        /**@doc
         * @method bat.fn.lt()
         * @description 取得小于指定索引的元素，组成新的bat对象返回
         * @param  {Number} index 下标
         * @return {bat}          新的bat对象
         */
        lt: function( index ) {
            return this.slice( 0, index );
        },

        /**@doc
         * @method bat.fn.first()
         * @description 取得第一个元素，组成新的bat对象返回
         * @param  {Number} index 下标
         * @return {bat}          新的bat对象
         */
        first: function() {
            return this.slice( 0, 1 );
        },

        /**@doc
         * @method bat.fn.last()
         * @description 取得最后一个元素，组成新的bat对象返回
         * @param  {Number} index 下标
         * @return {bat}          新的bat对象
         */
        last: function() {
            return this.slice( -1 );
        },

        /**@doc
         * @method bat.fn.even()
         * @description 取得下标为偶数的元素，组成新的bat对象返回
         * @return {bat}          新的bat对象
         */
        even: function() {
            return this.filter(function( node, index ) {
                return !( index & 1 );
            });
        },

        /**@doc
         * @method bat.fn.even()
         * @description 取得下标为奇数的元素，组成新的bat对象返回
         * @return {bat}          新的bat对象
         */
        odd: function() {
            return this.filter(function( node, index ) {
                return !!( index & 1 );
            });
        }
    });


    // ========
    // 类型判定
    // ========

    // 类名与类型的映射
    var class2type = {
        '[object HTMLDocument]': 'document',
        '[object HTMLCollection]': 'nodelist',
        '[object HTMLAllCollection]': 'nodelist',
        '[object NamedNodeMap]': 'attributes'
    };
    ['Boolean', 'Number', 'String', 'Array', 'Object', 'Null', 'Undefined', 'Function', 'Date', 'RegExp', 'Window', 'Arguments', 'Text', 'Attr', 'NodeList', 'DocumentFragment'].forEach(function( name ) {
        class2type[ '[object ' + name + ']' ] = name.toLowerCase();
    });

    $.extend({
        typeHooks: {
            'element': /\[object HTML[a-zA-Z]*Element\]/
        },

        /**@doc
         * @method  bat.type()
         * @description 判断变量的数据类型
         * @param  {any}            variate 要判断的变量
         * @param  {String}         str     可选，变量的类型；不传则将其类型返回
         * @return {Boolean|String}         变量的类型或是否为指定类型
         */
        type: function( variate, str ) {
            var objStr = core_toString.call( variate ),
                type = class2type[ objStr ],
                name;

            if ( !type ) {
                for ( name in $.typeHooks ) {
                    if ( $.typeHooks[ name ].test( objStr ) ) {
                        type = name;
                    }
                }
            }

            // 经过上面还匹配不到就只能“一切皆对象了”
            type = type || 'object';

            return str ? str === type : type;
        },

        /**@doc
         * @method  bat.isEmptyObject()
         * @description 判断variate是否为空对象
         * @param  {any}     variate 要判断的变量
         * @return {Boolean}         是否为空对象
         */
        isEmptyObject: function( variate ) {
            var name;
            if ( !$.isPlainObject( variate ) ) {
                return false;
            }
            for ( name in variate ) {
                return false;
            }
            return true;
        },

        /**@doc
         * @method  bat.isPlainObject()
         * @description 判断变量是否无格式对象，即通过对象字面量或new Object或Object.create(null)创建的对象。
         * @param  {any}     variate 要判断的变量
         * @return {Boolean}         是否为无格式对象
         */
        isPlainObject: function( variate ) {
            return core_toString.call( variate ) === '[object Object]';
        },

        /**@doc
         * @method  bat.isFunction()
         * @description 判断变量是否为函数
         * @param  {any}     variate 要判断的变量
         * @return {Boolean}         是否为函数
         */
        isFunction: function( variate ) {
            return typeof variate === 'function';
        },

        /**@doc
         * @method  bat.isArray()
         * @description 判断变量是否为数组
         * @param  {any}    variate 要判断的变量
         * @return {Boolean}        是否为数组
         */
        isArray: Array.isArray || function( variate ) {
            return core_toString.call( variate ) === '[object Array]';
        },

        /**@doc
         * @method  bat.isArrayLike()
         * @description 判断变量是否为类数组对象
         * @param  {any}     variate 要判断的变量
         * @return {Boolean}         是否为类数组对象
         */
        isArrayLike: function( variate ) {
            return variate != null &&
                typeof variate === 'object' &&
                isFinite( variate.length ) &&
                variate.length >= 0 &&
                variate.length === Math.floor( variate.length ) &&
                variate.length < 4294967296;
        },

        /**@doc
         * @method  bat.isNumber()
         * @description 判断变量是否为数值
         * @param  {any}     variate 要判断的变量
         * @return {Boolean}         是否为数值
         */
        isNumber: function( variate ) {
            return typeof variate === 'number' && isFinite( variate );
        },

        /**@doc
         * @method  bat.isWindow()
         * @description 判断变量是否为Window对象
         * @param  {any}     variate 要判断的变量
         * @return {Boolean}         是否为Window对象
         */
        isWindow: function( variate ) {
            return variate && variate === variate.window;
        },

        /**@doc
         * @method  bat.isDocument()
         * @description 判断变量是否为Document对象
         * @param  {any}     variate 要判断的变量
         * @return {Boolean}         是否为Document对象
         */
        isDocument: function( variate ) {
            return variate && variate.nodeType === 9;
        },

        /**@doc
         * @method  bat.isDocFrag()
         * @description 判断变量是否为DocumentFragment对象
         * @param  {any}     variate 要判断的变量
         * @return {Boolean}         是否为DocumentFragment对象
         */
        isDocFrag: function( variate ) {
            return variate && variate.nodeType === 11;
        },

        /**@doc
         * @method  bat.isElement()
         * @description 判断变量是否为Element对象
         * @param  {any}     variate 要判断的变量
         * @return {Boolean}         是否为Element对象
         */
        isElement: function( variate ) {
            return variate && variate.nodeType === 1;
        },

        /**@doc
         * @method  bat.isText()
         * @description 判断变量是否为Text对象
         * @param  {any}     variate 要判断的变量
         * @return {Boolean}         是否为Text对象
         */
        isText: function( variate ) {
            return variate && variate.nodeType === 3;
        },
    });


    // 有些节点不是随便就能生成的，需要有特定的父节点
    var wrapMap = {
        tbody: [1, '<table>', '</table>'],
        col: [2, '<table><colgroup>', '</colgroup></table>'],
        tr: [2, '<table><tbody>', '</tbody></table>'],
        td: [3, '<table><tbody><tr>', '</tr></tbody></table>'],
        _default: [0, '', '']
    };
    wrapMap.caption = wrapMap.tfoot = wrapMap.thead = wrapMap.colgroup = wrapMap.tbody;
    wrapMap.th = wrapMap.td;


    // ==================
    // 常用的函数、或属性
    // ==================
    $.extend({
        /**@doc
         * @property bat.version
         * @description 版本号
         * @type {String}
         */
        version: '0.1.0',

        // 获取上下文节点
        getContext: function( selector ) {
            var elem = $( selector )[0];
            return elem.nodeType === 1 || elem.nodeType === 9 ? elem : document;
        },

        /**@doc
         * @property bat.html
         * @description 保存着HTML元素的引用
         * @type {HTMLHtmlElement}
         */
        html: document.documentElement,

        /**@doc
         * @method bat.ready()
         * @description 等到HTML文档被加载完和解析完后执行回调
         * @param  {Function} fn 要执行的回调函数
         */
        ready: function( fn ) {
            var $ = this, done = false,
                completed = function() {
                    if ( !done ) {
                        done = true;
                        document.removeEventListener('DOMContentLoaded', completed, false);
                        window.removeEventListener('load', completed, false);
                        fn( $ );
                    }
                };

            if ( document.readyState === 'complete' ) {
                setTimeout( function() {
                    fn( $ );
                }, 0 );
            } else {
                document.addEventListener('DOMContentLoaded', completed, false);
                window.addEventListener('load', completed, false);
            }
        },

        /**@doc
         * @method bat.createNodes()
         * @description 创建DOM节点
         * @param  {String}   str 要转换为DOM节点的DOM字符串
         * @return {NodeList}     DOM节点列表
         */
        createNodes: function( str ) {
            var div, tag, wrap, depth;

            div = document.createElement('div');
            tag = rTagName.exec( str )[1].toLowerCase();

            wrap = wrapMap[ tag ] || wrapMap._default;
            depth = wrap[0];

            div.innerHTML = wrap[1] + str + wrap[2];

            while ( depth-- ) {
                div = div.firstChild;
            }

            return div.childNodes;
        },

        /**@doc
         * @method bat.each()
         * @description 迭代器
         * @param  {Array|String|ArrayLike|Object|Number}   param    要遍历的对象
         * @param  {Function}                               callback 回调函数，显式返回true可终止遍历器
         * @return {Array|String|ArrayLike|Object|Number}            返回param
         */
        each: function( param, callback ) {
            var i, l;

            if ( typeof callback !== 'function' ) {
                return;
            }

            if ( $.isArray( param ) || $.isArrayLike( param ) ) {
                for ( i = 0, l = param.length; i < l; i++ ) {
                    if ( callback.call( param[i], param[i], i, param ) === true ) {
                        break;
                    }
                }
            } else if ( $.isPlainObject( param ) ) {
                for ( i in param ) {
                    if ( callback.call( param[i], i, param[i], param ) === true ) {
                        break;
                    }
                }
            } else if ( typeof param === 'number' ) {
                for ( i = 0; i < param; i++ ) {
                    if ( callback.call( i + 1, i + 1, i, param ) === true ) {
                        break;
                    }
                }
            }
            return param;
        },

        /**@doc
         * @method bat.noConflict()
         * @description 无冲突处理
         * @return {Function} 返回bat函数
         */
        noConflict: function() {
            window.bat = _bat;
            return $;
        },

        // 打印出错误信息
        error: function( msg ) {
            console.error( '【batjs】' + msg );
        },

        // 空函数
        noop: function() {},

        /**@doc
         * @method bat.uniqid()
         * @description 生成一个唯一ID
         * @return {String} uuid
         */
        uniqid: function() {
            return ( Date.now() * 10000 + ~~( Math.random() * 10000 ) ).toString(36);
        },

        /**@doc
         * @method bat.throttle()
         * @description 函数节流
         * @param  {Function} fn        要被节流的函数
         * @param  {Number}   threshold 阈值
         * @return {Function}           节流后的函数
         */
        throttle: function( fn, threshold ) {
            var timer = null,
                first = true;

            return function() {
                var that = this, args = arguments;

                // 第一次执行
                if ( first ) {
                    fn.apply( this, args );
                    first = false;
                } else {
                    if ( timer ) {
                        return;
                    }

                    timer = setTimeout(function() {
                        clearTimeout( timer );
                        timer = null;
                        fn.apply( that, args );
                    }, threshold || 150);
                }
            };
        },
        
        /**@doc
         * @method bat.adjustArgs()
         * @description  调整参数，用于处理拥有复杂参数的方法。
         *               在 css animation/background 等方法中，参数个数是可选的，参数位置是随意的。
         *               此函数用于把杂乱的参数转换为指定规则的参数列表，再返回。
         *               我们可以通过整理后的参数，进一步处理代码逻辑。
         *               所传参数在符合规则的前提下，按照先到先得来排序。
         *               如果argRules为1，args为配置选项对象，后面的keys和rework不能少。
         * @param  {Array}           argRules  函数数组，判断参数是否符合指定特点。
         * @param  {Array|ArrayLike} args      参数列表，可以是arguments参数或其他数组/类数组对象。
         * @param  {Array}           keys      可选，对象的键名数组，表示是否将参数列表转换为对象格式。
         * @param  {Array}           rework    可选，函数数组，函数返回值作为参数的新值。
         * @return {Object|Array}              调整后的参数数组或对象。
         */
        adjustArgs: function( argRules, args, keys, rework ) {
            var newArgs = [], optall = {};

            if ( argRules === 1 ) {
                $.each(keys, function(key, i) {
                    optall[ key ] = rework[i]( args[key] );
                });
                return optall;
            } else {
                args = core_slice$1.call( args );

                $.each(argRules, function( rule ) {
                    for ( var i = 0, arg, fn; i < args.length; i++ ) {
                        if ( rule( args[i] ) ) {
                            arg = args.splice(i, 1)[0];
                            break;
                        }
                    }
                    // 传入rework，则按照规则重新修改值
                    fn = rework && rework[ newArgs.length ];
                    newArgs.push( fn && fn(arg) || arg );
                });

                // 有传入keys，则将其转换为对象的形式
                if ( keys ) {
                    $.each(keys, function(key, i) {
                        optall[key] = newArgs[i];
                    });

                    return optall;
                }
                return newArgs;
            }
        },

        /**@doc
         * @method bat.oneObject()
         * @description  创建一个对象，把所有键指定为相同的特定的值，值默认为1。
         * @param  {Array|string} keys 对象的键，可为数组或逗号/空格分割的字符串。
         * @param  {any}          val   对象键的值。
         * @return {Object}       新对象。
         */
        oneObject: function( keys, val ) {
            var result = {}, i;
            if ( typeof keys === 'string' ) {
                keys = keys.match( rWord ) || [];
            }
            val = val === void 0 ? 1 : val;
            for ( i = 0; i < keys.length; i++ ) {
                result[ keys[i] ] = val;
            }
            return result;
        },

        /**@doc
         * @method bat.sandbox()
         * @description 提供一个沙箱环境
         * @param  {Function} callback function(win, doc, html, body)
         */
        sandbox: function( callback ) {
            var win, doc, html, body;
            if ( !sandbox ) {
                sandbox = document.createElement('iframe');
                sandbox.style.cssText = 'position:absoltue;width:0;height:0;border:0;';
            }
            $.html.appendChild( sandbox );
            win = sandbox.contentWindow;
            doc = win.document;
            html = doc.documentElement;
            body = doc.body;
            // 针对IE
            if ( !html ) {
                html = doc.createElement('html');
                doc.appendChild(html);
            }
            // 针对IE
            if ( !body ) {
                body = doc.createElement('body');
                html.appendChild(body);
            }
            callback( win, doc, html, body );
            $.html.removeChild( sandbox );
        },

        /**@doc
         * @method bat.access()
         * @description 用于统一配置多态方法的读写访问，涉及到的方法主要分两大类：
         *              1. 拥有key：css、prop、attr、data
         *              2. 没有key：val、html、text、width、height、innerWidth、innerHeight
         *              access接口特点：set all get first。
         * @param  {bat}                    elems     bat对象
         * @param  {Function}               fn        function(elem[, key], val)，多态方法的主体
         * @param  {String|Object|null}     key       没有key的方法需传入null
         * @param  {any}                    value 
         * @param  {Boolean}                chainable 是否可以链式调用，如果是拥有key的方法，需要传递arguments.length === 0，
         *                                            表示什么都不传时可以进行链式调用
         * @return {bat|any}                          链式调用时返回bat对象，否则返回get到的值
         */
        access: function( elems, fn, key, value, chainable ) {
            var i = 0,
                length = elems.length,  // $对象的长度
                bulk = key == null,
                emptyGet, isFn;

            // 可以同时设置多个值
            if ( $.isPlainObject( key ) ) {
                chainable = true;  // 表示可以链式调用
                for ( i in key ) {
                    $.access( elems, fn, i, key[i], chainable, emptyGet, isFn );
                }

            // set
            } else if ( value !== void 0 ) {
                chainable = true;

                // 可以传入回调函数
                if ( typeof value === 'function' ) {
                    isFn = true;
                }

                // 对没有key的方法的set操作进行包装
                if ( bulk ) {
                    bulk = fn;
                    fn = function( elem, key, value ) {
                        return bulk( elem, value );
                    };
                }

                if ( fn ) {
                    for ( ; i < length; i++ ) {
                        fn( elems[i], key, isFn ?
                            value.call( elems[i], fn( elems[i], key ), i ) : value );
                    }
                }
            }

            return chainable ?
                elems :

                // get
                length ? 
                    fn( elems[0], key ) :
                    emptyGet;
        },

        /**@doc
         * @method bat.matches()
         * @description 判断某个元素是否匹配指定选择器，用于筛选、过滤、事件代理
         * @param  {Object} elem     要判断的元素
         * @param  {Object} selector 选择器
         * @return {Boolean}
         */
        matches: function( elem, selector ) {
            var matches;
            if ( elem.nodeType !== 1 ) {
                return;
            }
            // IE9++
            matches = elem.matches || elem.webkitMatchesSelector ||
                elem.mozMatchesSelector || elem.msMatchesSelector || elem.oMatchesSelector;

            return matches.call( elem, selector );
        },

        /**@doc
         * @method bat.Class()
         * @description 简单的编写类的方法
         * @param  {Class|Function}  parent=null 需要继承的父类
         * @param  {Object}          method      包含构造函数和原型方法的对象，
         *                                       构造函数必须命名为：__constructor（跟PHP的构造函数命名一样）
         * @return {Class|Function}              子类
         */
        Class: function( parent, method ) {
            if ( typeof parent !== 'function' ) {
                method = parent;
                parent = null;
            }
            method = method || {};

            function Class() {
                if ( parent ) {
                    parent.apply( this, arguments );
                }
                if ( method.__constructor ) {
                    method.__constructor.apply( this, arguments );
                }
            }

            if ( parent ) {
                Class.prototype = Object.create( parent.prototype );
                Class.prototype.constructor = Class;
            }
            for ( var name in method ) {
                if ( name !== '__constructor' ) {
                    Class.prototype[ name ] = method[ name ];
                }
            }
            return Class;
        }
    });


    // ==========
    // 数组的扩展
    // ==========
    $.extend({
        /**@doc
         * @method bat.toArray()
         * @description 把变量转换为数组类型
         * @param  {any}    variate 要被转换的变量
         * @return {Array}          返回新数组
         */
        toArray: function( variate ) {
            if ( variate == null ) {
                return [];
            }
            if ( $.isArray( variate ) ) {
                return variate;
            }
            // window对象和节点对象可能会包含length属性而被看做是类数组对象
            if ( variate === variate.window || variate.nodeType ) {
                return [ variate ];
            }
            if ( $.isArrayLike( variate ) ) {
                return core_slice$1.call( variate );
            }
            return [ variate ];
        },

        /**@doc
         * @method bat.unique( target )
         * @description 数组去重
         * @param  {Array} target 目标数组
         * @return {Array}        返回新数组
         */
        unique: function( target ) {
            var result = [], i = 0;

            for ( ; i < target.length; i++ ) {
                if ( target.indexOf( target[ i ] ) === i ) {
                    result.push( target[ i ] );
                }
            }
            return result;
        },

        /**@doc
         * @method bat.merge()
         * @description 把一个或多个数组/类数组对象的元素添加到第一个数组/类数组对象上
         * @return {Array} 第一个数组/类数组对象
         */
        merge: function() {
            var first = arguments[0],
                len = first.length,
                i = 1, j, l, curr;

            while ( (curr = arguments[ i++ ]) ) {
                l = curr.length;
                for ( j = 0; j < l; j++ ) {
                    first[ len++ ] = curr[ j ];
                }
            }
            first.length = len;
            return first;
        },

        // 对数组进行洗牌
        shuffle: function( target ) {
            var j, e, i = target.length;

            for ( ; i > 0;  ) {
                j = parseInt( Math.random() * i );
                e = target[ --i ];
                target[i] = target[j];
                target[j] = e;
            }
            return target;
        },

        // 从数组中随机抽选一个元素出来
        arrayRandom: function( target ) {
            return target[ Math.floor( Math.random() * target.length ) ];
        },

        /**@doc
         * @method bat.flat()
         * @description 对数组进行平坦化处理
         * @param  {Array}  target  目标数组
         * @param  {Number} depth=1 平坦的深度，0不平坦，Infinity返回一维数组
         * @return {Array}          平坦后的新数组
         */
        flat: function( target, depth ) {
            var result = [];
            
            depth = depth == null ? 1 : depth;

            target.forEach(function( item ) {
                if ( Array.isArray( item ) && depth > 0 ) {
                    result = result.concat( $.flat( item, depth - 1 ) );
                } else {
                    result.push( item );
                }
            });
            return result;
        },

        /**@doc
         * @method bat.compact()
         * @description 过滤数组中的null与undefined，返回新数组
         * @param  {Array} target 目标数组
         * @return {Array}        去掉null和undefined后的数组
         */
        compact: function( target ) {
            return target.filter(function( item ) {
                return item != null;
            });
        },

        /**@doc
         * @method bat.pluck()
         * @description 取得对象数组的每个元素的指定属性，组成新数组返回
         * @param  {Array}  target 目标数组
         * @param  {String} key    对象的键
         * @return {Array}         由对象指定值组成的新数组
         */
        pluck: function( target, key ) {
            var result = [],  prop;

            target.forEach(function( item ) {
                prop = item[ key ];
                if ( prop != null ) {
                    result.push( prop );
                }
            });
            return result;
        },

        /**@doc
         * @method bat.groupBy()
         * @description 根据指定条件进行分组，构成对象返回
         * @param  {Array}           target 目标数组
         * @param  {Function|String} val    function( value, index )，回调函数或对象属性
         * @return {Object}                 分完组后的对象
         */
        groupBy: function( target, val ) {
            var result = {},
                iterator = typeof val === 'function' ? val : function( obj ) {
                    return obj[ val ];
                };

            target.forEach(function( value, index ) {
                var key = iterator( value, index );
                ( result[ key ] || ( result[ key ] = [] ) ).push( value );
            });

            return result;
        },

        /**@doc
         * @method bat.sortBy()
         * @description 根据指定条件进行排序，通常用于对象数组
         * @param  {Array}    target  目标数组
         * @param  {Function} fn      function( item, index )，返回用于比较的对象属性值，item：对象，index：对象在数组中的下标
         * @param  {Object}   scope   参数fn的作用域对象
         * @return {Array}            排序后的新数组
         */
        sortBy: function( target, fn, scope ) {
            var array = target.map(function( item, index ) {
                return {
                    el: item,
                    ret: fn.call( scope, item, index )
                };
            }).sort(function( left, right ) {
                var a = left.ret, b = right.ret;
                // 字符串不能相减，但可以比较大小，显式返回大于0、小于0、0等于就可以满足sort函数的要求
                return a < b ? -1 : a > b ? 1 : 0;
            });
            return $.pluck( array, 'el' );
        },

        /**@doc
         * @method bat.union()
         * @description 对两个数组进行并集运算
         * @param  {Array} target 目标数组
         * @param  {Array} array  另一个数组
         * @return {Array}        运算后的数组
         */
        union: function( target, array ) {
            return $.unique( target.concat( array ) );
        },

        /**@doc
         * @method bat.intersect()
         * @description 对两个数组进行交集运算
         * @param  {Array} target 目标数组
         * @param  {Array} array  目标数组
         * @return {Array}        运算后的数组
         */
        intersect: function( target, array ) {
            return target.filter(function( n ) {
                return ~array.indexOf( n );
            });
        },

        /**@doc
         * @method bat.difference()
         * @description 对两个数组进行差集运算（相对补集）
         * @param  {Array} target 目标数组
         * @param  {Array} array  另一个数组
         * @return {Array}        运算后的数组
         */
        difference: function( target, array ) {
            return target.filter(function( n ) {
                return !~array.indexOf( n );
            });
        },

        /**@doc
         * @method bat.symmetricDifference()
         * @description 对两个数组进行对称差集运算
         * @param  {Array} target 目标数组
         * @param  {Array} array  另一个数组
         * @return {Array}        运算后的数组
         */
        symmetricDifference: function( target, array ) {
            return $.difference( target, array ).concat( $.difference( array, target ) );
        }
    });


    // ============
    // 字符串的扩展
    // ============
    $.extend({
        /**@doc
         * @method bat.camelize()
         * @description 把字符串转换为“驼峰”格式
         * @param  {String} target 将被转换的字符串
         * @return {String}        转换后的字符串
         */
        camelize: function( target ) {
            return target.replace( /[-_][^-_]/g, function( m ) {
                return m.charAt(1).toUpperCase();
            });
        },

        /**@doc
         * @method bat.hyphenize()
         * @description 把字符串转换为“连字符”格式
         * @param  {String} target 将被转换的字符串
         * @return {String}        转换后的字符串
         */
        hyphenize: function( target ) {
            return $.underscore( target ).replace( /_/g, '-' );
        },

        /**@doc
         * @method bat.underscore()
         * @description 把字符串转换为“下划线”格式
         * @param  {String} target 将被转换的字符串
         * @return {String}        转换后的字符串
         */
        underscore: function( target ) {
            return target.replace( /([a-z\d])([A-Z])/g, '$1_$2' ).
                replace( /\-/g, '_' ).toLowerCase();
        },

        /**@doc
         * @method bat.capitalize()
         * @description 首字母大写，其后字母小写
         * @param  {String} target 将被转换的字符串
         * @return {String}        转换后的字符串
         */
        capitalize: function( target ) {
            return target.charAt(0).toUpperCase() + target.slice(1).toLowerCase();
        },

        // 移除字符串中的HTML标签
        stripTags: function( target ) {
            return String( target || '' ).replace( /<[^>]+>/g, '' );
        },

        // 移除字符串中的所有script标签，弥补tripTags的不足
        stripScripts: function( target ) {
            return String( target || '' ).replace( /<script[^>]*>[\s\S]*?<\/script>/img, '' );
        },

        /**@doc
         * @method bat.escapeHTML()
         * @description 将HTML中特定字符转义为实体字符
         * @param  {String} target 将被转换的字符串
         * @return {String}        转换后的字符串
         */
        escapeHTML: function( target ) {
            return target.replace( /&/g, '&amp;' )
                .repalce( /</g, '&lt;' )
                .repalce( />/g, '&gt;' )
                .repalce( /"/g, '&quot;' )
                .repalce( /'/g, '&#39;' );
        },

        /**@doc
         * @method bat.unescapeHTML()
         * @description 将HTML实体字符还原为对应的字符
         * @param  {String} target 将被转换的字符串
         * @return {String}        转换后的字符串
         */
        unescapeHTML: function( target ) {
            return target.replace( /&amp;/g, '&' )
                .replace( /&lt;/g, '<' )
                .replace( /&gt;/g, '>' )
                .replace( /&quot;/g, '"' )
                .replace( /&#(\d+);/g, function( $0, $1 ) {
                    return String.fromCharCode( parseInt( $1, 10 ) );
                });
        },

        /**@doc
         * @method  bat.escapeRegExp()
         * @description 将字符串安全格式化为正则表达式的源码
         * @param  {String} target 将被转换的字符串
         * @return {String}        转换后的字符串
         */
        escapeRegExp: function( target ) {
            return target.replace( /([-.*+?^${}()|[\]\/\\])/g, '\\$1' );
        },

        /**@doc
         * @method bat.pad()
         * @description 填充字符
         * @param  {String}  target         基础字符
         * @param  {Number}  len            字符最大长度
         * @param  {String}  filling='0'    可选，要填充的字符
         * @param  {Boolean} right=false    可选，填充的方向
         * @param  {Number}  radix=10       可选，进制转换基数
         * @return {String}                 填充后的字符串
         */
        pad: function( target, len, filling, right, radix ) {
            var num = target.toString( radix || 10 );
            filling = filling || '0';
            while ( num.length < len ) {
                num = right ? num + filling : filling + num;
            }
            return num;
        },

        /**@doc
         * @method bat.format()
         * @description 轻量级的解决字符串拼接的方案，支持两种传参方式，数字占位符和命名占位符
         * @param  {String} target 模板字符串，插值符：#{}，转义插值符：\#{}
         * @param  {Object} data   要替换到模板中的数据
         * @return {String}        替换后的字符串
         */
        format: function( target, data ) {
            var arr = core_slice$1.call( arguments, 1 );
            return target.replace(rFormat, function( match, name ) {
                if ( match.charAt(0) == '\\' ) {
                    return match.slice(1);
                }
                var index = Number( name );
                if ( index >= 0 ) {
                    return arr[ index ];
                }
                if ( data && data[ name ] !== void 0 ) {
                    return data[ name ];
                }
                return '';
            });
        },
    });

    // ============
    // 数值的扩展
    // ============
    $.extend({
        /**@doc
         * @method bat.limit()
         * @description 确保数值在[n1, n2]闭区间之内
         * @param  {Number} target 目标数值
         * @param  {Number} n1     数值1
         * @param  {Number} n2     数值2
         * @return {Number}        限定后的值
         */
        limit: function( target, n1, n2 ) {
            var a = [n1, n2].sort();
            if ( target < a[0] ) {
                target = a[0];
            }
            if ( target > a[1] ) {
                target = a[1];
            }
            return target;
        },

        /**@doc
         * @method bat.nearer()
         * @description 求距离指定数值最近的那个数
         * @param  {Number} target 目标数值
         * @param  {Number} n1     数值1
         * @param  {Number} n2     数值2
         * @return {Number}        最近的值
         */
        nearer: function( target, n1, n2 ) {
            var dist1 = Math.abs( target - n1 ),
                dist2 = Math.abs( target - n2 );

            return dist1 < dist2 ? n1 : n2;
        },

        /**@doc
         * @method bat.random()
         * @description 生成两个数之间的随机数，可指定小数位数
         * @param  {Number} min=0     最小值
         * @param  {Number} max=1     最大值
         * @param  {Number} digits=0  小数位数
         * @return {Number}           随机数
         */
        random: function( min, max, digits ) {
            min = min || 0;
            max = max || 1;
            digits = Math.pow( 10, digits || 0 );
            return Math.round( ( Math.random() * ( max - min ) + min ) * digits ) / digits;
        }
    });

    /*
    |-------------------------------------------------------------------------------
    | cookie模块
    |-------------------------------------------------------------------------------
    |
    */

    var defaultCookieAttributes = {
        path: '/'
    };

    var cookie = {
        get: function( key ) {
            return decodeURIComponent(
                document.cookie.replace(
                    new RegExp("(?:(?:^|.*;)\\s*" +
                        encodeURIComponent(key).replace(/[-.+*]/g, "\\$&") +
                        "\\s*\\=\\s*([^;]*).*$)|^.*$"),
                    "$1"
                )
            ) || null;
        },

        set: function( key, value, attributes ) {
            var stringifiedAttributes = '',
                attributeName;

            if ( !key || /^(?:expires|max\-age|path|domain|secure)$/i.test(key) ) {
                return false;
            }

            attributes = $.extend( {}, defaultCookieAttributes, attributes );

            if ( typeof attributes.expires === 'number' ) {
                attributes.expires = new Date( Date.now() + attributes.expires * 864e5 );
            }
            if ( attributes.expires ) {
                attributes.expires = attributes.expires.toUTCString();
            }

            for ( attributeName in attributes ) {
                if ( !attributes[ attributeName ] ) {
                    continue;
                }

                stringifiedAttributes += '; ' + attributeName;

                if ( attributes[attributeName] === true ) {
                    continue;
                }
            }

            document.cookie = encodeURIComponent( key ) + "=" + encodeURIComponent( value ) + stringifiedAttributes;
            return true;
        },

        remove: function( key, attributes ) {
            return cookie.set( key, '', $.extend({}, attributes, {
                expires: -1
            }));
        },

        has: function( key ) {
            return ( new RegExp("(?:^|;\\s*)" +
                    encodeURIComponent( key ).replace(/[-.+*]/g, "\\$&") +
                    "\\s*\\=")
                ).test( document.cookie );
        }
    };

    $.extend({
        cookie: function( key, value, attributes ) {
            // get操作
            if ( value == null ) {
                return cookie.get( key );
            }
            // set操作
            cookie.set( key, value, attributes );
            return this;
        },

        removeCookie: function( key, attributes ) {
            cookie.remove( key, attributes );
            return this;
        },

        hasCookie: function( key ) {
            return cookie.has( key );
        }
    });

    /*
    |-------------------------------------------------------------------------------
    | 本地存储模块
    |-------------------------------------------------------------------------------
    |
    */

    $.extend({
        storage: function( key, value ) {
            var storage = window.localStorage;

            if ( arguments.length < 2 ) {
                return storage.getItem( key );
            }
            storage.setItem( key, value );
            return this;
        },
        removeStorage: function( key ) {
            var storage = window.localStorage;
            // storage允许null或undefined作为键（会隐式转换为字符串）
            if ( arguments.length === 0 ) {
                storage.clear();
            } else {
                storage.removeItem( key );
            }
            return this;
        }
    });

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
        function asap( fn ) {
            var img = new Image();
            var handler = function () {
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
          if (fn === noop) { return; }
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
          return new self.constructor(function (resolve, reject) {
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
          if ( newValue && (typeof newValue === 'object' || typeof newValue === 'function') ) {
            var then = getThen(newValue);
            // 确保then是可读的
            if (then === IS_ERROR) {
              return reject(self, LAST_ERROR);
            }

            // 如果结果是一个Promise对象
            if ( then === self.then && newValue instanceof Promise ) {
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
            Promise._onReject(self, newValue);  // 过程回调通知
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

        function Handler(onFulfilled, onRejected, promise){
          this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null;
          this.onRejected = typeof onRejected === 'function' ? onRejected : null;
          this.promise = promise;
        }


        // 同步调用传入Promise的参数函数
        // doResolve 是用来控制 调用 resolve 还是 reject
        function doResolve(fn, promise) {
          var done = false;  // 确保 resolve 和 reject 只调用一次
          var res = tryCallTwo(fn, function (value) {
            if (done) { return; }
            done = true;
            resolve(promise, value);
          }, function (reason) {
            if (done) { return; }
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
        Promise.prototype.finally = function (f) {
          return this.then(function (value) {
            return Promise.resolve(f()).then(function () {
              return value;
            });
          }, function (err) {
            return Promise.resolve(f()).then(function () {
              throw err;
            });
          });
        };

        /****************
         * done
         */
        Promise.prototype.done = function (onFulfilled, onRejected) {
          var self = arguments.length ? this.then.apply(this, arguments) : this;
          self.then(null, function (err) {
            setTimeout(function () {
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
        Promise.resolve = function (value) {
          if (value instanceof Promise) { return value; }

          if (value === null) { return NULL; }
          if (value === undefined) { return UNDEFINED; }
          if (value === true) { return TRUE; }
          if (value === false) { return FALSE; }
          if (value === 0) { return ZERO; }
          if (value === '') { return EMPTYSTRING; }

          if (typeof value === 'object' || typeof value === 'function') {
            try {
              var then = value.then;
              if (typeof then === 'function') {
                return new Promise(then.bind(value));
              }
            } catch (ex) {
              return new Promise(function (resolve, reject) {
                reject(ex);
              });
            }
          }
          return valuePromise(value);
        };

        Promise.all = function (arr) {
          var args = Array.prototype.slice.call(arr);

          return new Promise(function (resolve, reject) {
            if (args.length === 0) { return resolve([]); }
            var remaining = args.length;
            function res(i, val) {
              if (val && (typeof val === 'object' || typeof val === 'function')) {
                if (val instanceof Promise && val.then === Promise.prototype.then) {
                  while (val._state === 3) {
                    val = val._value;
                  }
                  if (val._state === 1) { return res(i, val._value); }
                  if (val._state === 2) { reject(val._value); }
                  val.then(function (val) {
                    res(i, val);
                  }, reject);
                  return;
                } else {
                  var then = val.then;
                  if (typeof then === 'function') {
                    var p = new Promise(then.bind(val));
                    p.then(function (val) {
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

        Promise.reject = function (value) {
          return new Promise(function (resolve, reject) {
            reject(value);
          });
        };

        Promise.race = function (values) {
          return new Promise(function (resolve, reject) {
            values.forEach(function(value){
              Promise.resolve(value).then(resolve, reject);
            });
          });
        };

        /* Prototype Methods */

        Promise.prototype['catch'] = function (onRejected) {
          return this.then(null, onRejected);
        };

        return Promise;  
    }
    $.Promise = typeof Promise === 'function' ? Promise : getPromise();

    /*
    |-------------------------------------------------------------------------------
    | 缓存模块
    |-------------------------------------------------------------------------------
    |
    */

    /**
     * 数据缓存
     * ========
     * 数据缓存就是在目标对象与缓存体间建立一对一的关系，然后在缓存体上操作数据。
     */

    /**
     * 缓存系统的各种实现的概述
     * ========================
     * 实现缓存系统主要有两大类。
     * 第一类：
     *     在对象与缓存体间通过uuid进行关联，uuid作为纽带，其存储方式有两种：
     *     1. 把uuid存放在对象的属性里。
     *     2. 通过valueOf方法闭包保存。
     *         备注：IE8及以下的DOM对象不支持valueOf方法。
     * 第二类：
     *     把对象与缓存体进行对应/映射。
     *     1. 建立两个数组，一个用来保存对象，一个用来保存缓存体，通过数组下标进行关联。
     *     2. 使用es6的WeakMap来实现。WeakMap对象是键/值对的集合。
     *        键为非空的对象，值可以为任意值。顾名思义，WeakMap译为弱映射，也就是说，
     *        其键名与键值被弱引用，当作为键名的对象被删除，那么对应的键值也会被清除出WeakMap对象。
     */

    /**
     * 通过重写 valueOf 来实现的缓存系统
     * ================================
     * 具体实现是，如果目标对象的 valueOf 传入一个特殊的对象，那么它就返回一个 UUID，
     * 然后通过 UUID 在 Data 实例的 cache 对象属性上开辟缓存体。
     * ===============================================================================
     * 这样一来，我们就不用区分它是 window 对象，使用 windowData 来做替身了；
     * 另外，我们也不用顾忌 embed、object、applet 这 3 种在 IE 下可能无法设置私有属性的元素节点。
     * 再有就是，不再把私有数据和用户数据混在一起，不再在用户对象上添加自定义属性。
     * ===============================================================================
     * 缺点：
     *     IE8及以下的DOM元素对象不支持valueOf方法。
     */

    function Data() {
        this.cache = {};
    }

    Data.prototype = {
        constructor: Data,
        locker: function( owner ) {
            var ovalueOf,

                // owner 拥有 valueOf 方法的对象
                // 首先我们检测一下它们 valueOf 方法有没有被重写，由于浏览器的差异性，
                // 我们通过觅得此三类对象的构造器进行原型重写的成本过大，只能对每一个实例的 valueOf 方法进行重写。
                // 检测方式为传入 Data 类，如果是返回 `object` 说明没有被重写，返回 `string` 则是被重写。
                // 这个字符串就是我们上面所说的 UUID，用于在缓存仓库上开辟缓存体。
                unlock = owner.valueOf( Data );

            // 这里的重写使用了 Object.defineProperty 方法，IE7 及以下浏览器不支持
            // Object.defineProperty 的第 3 个参数为对象，如果不显式设置 enumerable、writable、configurable，
            // 则会默认为 false，这也正如我们所期待的那样，我们不再希望人们来遍历它，重写它，再次动它的配置
            // 这个过程被 jQuery 称之为开锁，通过 valueOf 这扇大门，进入到仓库
            if ( typeof unlock !== 'string' ) {
                unlock = $.uniqid();
                ovalueOf = owner.valueOf;

                Object.defineProperty(owner, 'valueOf', {
                    value: function( pick ) {
                        if ( pick === Data ) {
                            return unlock;
                        }
                        return ovalueOf.apply( owner );
                    }
                });
            }

            // 开辟缓存体
            if ( !this.cache[ unlock ] ) {
                this.cache[ unlock ] = {};
            }

            return unlock;
        },

        set: function( owner, data, value ) {
            // 写方法
            var prop,
                cache,
                unlock;

            // 得到 uuid 与缓存体
            unlock = this.locker( owner );
            cache = this.cache[ unlock ];

            // 如果传入 3 个参数，第 2 个为字符串，那么直接在缓存体上添加新的键值对
            if ( typeof data === 'string' ) {
                cache[ data ] = value;
                // 如果传入 2 个参数，第 2 个为对象
            } else {
                // 如果缓存体还没有添加过任何对象，那么直接赋值，否则使用 for in 循环添加键值对
                if ( $.isEmptyObject( cache ) ) {
                    this.cache[ unlock ] = data;
                } else {
                    for ( prop in data ) {
                        cache[ prop ] = data[ prop ];
                    }
                }
            }
        },

        get: function( owner, key ) {
            // 读方法
            var cache = this.cache[ this.locker( owner ) ];
            // 如果只有一个参数，则返回整个缓存体
            return key === undefined ? cache : cache[ key ];
        },

        access: function( owner, key, value ) {
            // 决定是读方法还是写方法，然后做相应的操作
            if ( key === undefined || 
                    ( ( key && typeof key === 'string' ) && value === undefined ) ) {
                return this.get( owner, key );
            }
            this.set( owner, key, value );
            return value !== undefined ? value : key;
        },

        remove: function( owner, key ) {
            var l,
                i,
                unlock = this.locker( owner ),
                cache = this.cache[ unlock ];

            if ( !cache ) {
                return;
            }

            if ( !key ) {
                return this.discard( owner );
            }

            // 支持数组和空格分割的字符串来批量删除数据
            if ( typeof key === 'string' && key ) {
                key = key.split(/\s+/);
            }

            l = key.length;
            
            while ( l-- ) {
                delete cache[ key[ l ] ];

                i = '';

                // 遍历缓存体，如果 k 值没被改写（说明缓存体没数据），移除缓存体
                for ( i in cache ) {
                    break;
                } 
                if ( !i ) {
                    return this.discard( owner );
                }
            }
        },

        hasData: function( owner ) {  // 判定此对象是否缓存了数据
            return !$.isEmptyObject( this.cache[ this.locker( owner ) ] );
        },

        discard: function( owner ) {
            delete this.cache[ this.locker( owner ) ];
        }
    };

    var data_user, data_priv;

    // 保存用户数据
    data_user = new Data();
    // 保存私有数据
    data_priv = new Data();

    $.extend({
        hasData: function( elem ) {  // 判定是否缓存了数据
            return data_user.hasData( elem ) || data_priv.hasData( elem );
        },

        data: function( elem, name, data ) {  // 读/写用户数据
            return data_user.access( elem, name, data );
        },

        removeData: function( elem, name ) {  // 删除用户数据
            data_user.remove( elem, name );
        },

        _data: function( elem, name, data ) {  // 读/写私有数据
            return data_priv.access( elem, name, data );
        },

        _removeData: function( elem, name ) {  // 删除私有数据
            data_priv.remove( elem, name );
        },

        queue: function( elem, name, data ) {
            var queue;

            if ( elem ) {
                name = (name || 'fx') + 'Queue';

                queue = $._data( elem, name );

                if ( data ) {
                    if ( !queue || $.isArray( data ) ) {
                        queue = $._data( elem, name, $.toArray( data ) );
                    } else {
                        queue.push( data );
                    }
                }
                return queue || [];
            }
        },

        dequeue: function( elem, name ) {
            var queue, fn;

            if ( elem ) {
                queue = $.queue( elem, name );
                fn = queue.shift();

                // 添加一个守卫阻止动画队列自动出列
                if ( fn === 'inprogress' ) {
                    fn = queue.shift();
                }

                if ( fn ) {
                    if ( name === 'fx'  ) {
                        queue.unshift('inprogress');
                    }

                    // 调用函数回调，进行next操作（继续出列）
                    fn.call(elem, function() {
                        $.dequeue( elem, name );
                    });
                }

                // 队列为空，则删除元素队列
                if ( !queue.length ) {
                    $._removeData( elem, name + 'Queue' );
                }
            }
        },

        clearQueue: function( elem, name ) {
            return $.queue( elem, name, [] );
        }
    });

    $.fn.extend({
        data: function( name, data ) { 

            if ( data === void 0 ) {  // 读
                return $.data( this[0], name );
            }

            return this.each(function() {  // 写
                $.data( this, name, data );
            });
        },

        removeData: function( name ) {  // 删
            return this.each(function() {
                $.removeData( this, name );
            });
        },

        _data: function( name, data ) { 

            if ( data === void 0 ) {  // 读
                return $._data( this[0], name );
            }

            return this.each(function() {  // 写
                $._data( this, name, data );
            });
        },

        _removeData: function( name ) {  // 删
            return this.each(function() {
                $._removeData( this, name );
            });
        },

        queue: function( name, data ) {
            if ( typeof name !== 'string' ) {
                data = name;
                name = 'fx';
            }

            // getter
            if ( data === void 0 ) {
                return $.queue( this[0], name );
            }

            return this.each(function() {
                var queue = $.queue( this, name, data );

                // 如果是动画队列，且没有守卫（初次调用），则出列
                if ( name === 'fx' && queue[0] !== 'inprogress' ) {
                    $.dequeue( this, name );
                }
            });
        },

        dequeue: function( name ) {
            return this.each(function() {
                $.dequeue( this, name );
            });
        },

        clearQueue: function( name ) {
            return this.queue( name || 'fx', [] );
        }
    });

    /*
    |-------------------------------------------------------------------------------
    | 事件模块
    |-------------------------------------------------------------------------------
    |
    */

    /**
     * =========================================================================
     * 发布订阅模式，又叫观察者模式，它定义了对象间的一种一对多的依赖关系，
     * 当一个对象的状态发生改变时，所有依赖它的对象都将得到通知。
     * 在 javascript 开发中，我们一般用事件模型来替代传统的发布订阅模式。
     * =========================================================================
     * 发布订阅模式的作用：
     * 1. 发布订阅模式可以广泛用于异步编程，这是一种替代传递回调函数的方案。
     * 2. 发布订阅模式可以取代对象之间硬编码的通知机制，一个对象不再显式地调用
     * 另一个对象的某个接口。
     * =========================================================================
     * 发布订阅模式的优点：
     * 时间上的解耦，对象之间的解耦。
     * =========================================================================
     * 发布订阅模式的缺点：
     * 创建订阅者本身要消耗一定的时间和内存，而且当你订阅一个消息后，
     * 也许此消息最后都未发生，但这个订阅者会始终存在于内存中。
     * 另外，发布订阅模式虽然可以弱化对象之间的联系，但如果过度使用的话，
     * 对象和对象之间的必要联系将被深埋的背后，会导致程序难以跟踪维护和理解。
     * 特别是有多个发布者和订阅者嵌套到一起的时候，要跟踪一个bug不是件轻松的事情。
     */

    /**
     * 额外功能
     * ========
     * 1. 事件代理
     * 2. 命名空间
     * 3. 修复浏览器的差异性
     */

    /**
     * addEventListener的探究
     * =====================
     * - 相同事件，相同函数，相同阶段，只绑定一次。
     * - 事件发生，事件按照dom树从window到目标元素再回到window的顺序传播，
     *     对应着的阶段为捕获（window到目标元素）、处于元素、冒泡（目标元素到window）。
     * - 如果元素在捕获阶段触发事件，则执行捕获的函数；
     *     如果元素在处于元素阶段触发事件，则执行捕获和冒泡的函数（其顺序跟捕获和冒泡没有关系，先到先得）；
     *     如果元素处于冒泡阶段触发事件，则执行冒泡的函数。
     */

    /**
     * 事件委托/事件代理的实现
     * =======================
     * 事件委托也拥有冒泡和捕获阶段，因为是委托别人，所以其冒泡和捕获阶段也是被委托元素的。
     * 整个事件流是这样的：
     *     当被委托元素在捕获阶段触发事件，此时也可以获取ev.target（事件委托的根基），
     *     此时获取从被委托元素到ev.target之间的父子关系的元素存放到path数组里。
     *     先执行被委托元素的事件函数，此时如果在其回调函数里调用stopPropagation()或stopImmediatePropagation()
     *     将阻止委托元素的事件函数执行，不然则执行之。在委托元素事件函数里，也可以调用上诉两方法，
     *     将阻止事件从被委托元素继续向下捕获下去。
     *     而冒泡的实现，也是事件回传到被委托元素，**此时会先执委托元素的回调，再执行被委托元素的回调**，
     *     其中也可以调用上诉两方法来阻止事件传递或直接停止其后回调的执行。
     * 
     */

    /**
     * 事件在缓存系统中的数据结构：0
     * 
     * 5qi88mhjaq0000: {
     *     events: {
     *         mouseover: {
     *             bubbleCount: 2,
     *             captureCount: 2,
     *             captrue: f(),
     *             bubble: f(),
     *             handlers: [
     *                 {
     *                     capture: false,
     *                     data: undefined,
     *                     specialHandler: undefined,
     *                     guid: '1nof0l0yymtc00',
     *                     handler: f( ev ),
     *                     namespace: '',
     *                     origType: 'mouseenter',
     *                     selector: 'li',
     *                     type: 'mouseover'
     *                 }
     *             ]
     *         }
     *     },
     *     triggerInfo: {
     *         click: {
     *             data: [],
     *             onlyHandler: false,
     *             namespace: ''
     *         }
     *     }
     * }
     */


    function getPath( ev ) {
        var target = ev.target,
            curr = ev.currentTarget,
            path = [ target ];

        // 到被委托元素前就停止获取了
        while ( (target = target.parentNode) && target !== curr ) {
            path.push( target );
        }
        return path;
    }

    // 除了分发器的功能，还肩负着保存是否是捕获阶段的信息，
    // 在处于目标阶段，如果元素既绑定捕获事件又绑定冒泡事件，
    // 此元素的所有事件函数会被触发两次。
    function Dispatcher( capture ) {
        if ( !( this instanceof Dispatcher ) ) {
            return new Dispatcher( capture );
        }
        this.capture = capture;
    }
    Dispatcher.prototype.dispatch = function( ev ) {
        var elemData, events, typeInfo, handlers, handlerObj,
            path, i, j, cancelBubble, immediate, curr,
            currElem = ev.currentTarget, phase,  
            stopPropagation = ev.stopPropagation,
            stopImmediatePropagation = ev.stopImmediatePropagation,
            namespace, full, triggerInfo, triggerData;

        elemData = $._data( currElem );
        events = elemData.events;
        typeInfo = events[ ev.type ];
        handlers = typeInfo.handlers;

        triggerInfo = ( elemData.triggerInfo || {} )[ ev.type ] || {};
        namespace = triggerInfo.namespace;
        full = triggerInfo.full;

        // 事件阶段：1捕获，2处于目标，3冒泡
        phase = triggerInfo.onlyHandler ? 2 : ev.eventPhase;


        ev = $.event.fix( ev );
        // trigger时附加的数据
        if ( !( triggerData = triggerInfo.data ) ) {
            triggerData = triggerInfo.data = [];
        }
        triggerData.unshift( ev );

        $._removeData( currElem, 'triggerInfo' );

        ev.stopPropagation = function() {
            cancelBubble = true;
            stopPropagation.call( ev );
        };
        ev.stopImmediatePropagation = function() {
            cancelBubble = true;
            immediate = true;
            stopImmediatePropagation.call( ev );
        };

        // 事件代理
        function handleDelegate( capture ) {
            path = getPath( ev );
            if ( capture ) {
                path.reverse();
            }
            for ( j = 0, curr; ( curr = path[ j++ ] ); ) {
                for ( i = 0; ( handlerObj = handlers[i++] ); ) {
                    if ( handlerObj.selector && handlerObj.capture === capture && $.matches( curr, handlerObj.selector ) ) {
                        if ( reallyHandler( curr ) === true ) {
                            return true;
                        }
                    }
                }
                // 用户调用 stopPropagation()
                if ( cancelBubble ) {
                    return true;
                }
            }
        }

        // 元素自身事件函数
        function handleSelf( onTarget, capture ) {
            for ( i = 0; ( handlerObj = handlers[ i++ ] ); ) {
                if ( ( onTarget || capture === handlerObj.capture ) && !handlerObj.selector ) {
                    if ( reallyHandler( currElem ) === true ) {
                        return true;
                    }
                }
            }
            if ( cancelBubble ) {
                return true;
            }
        }

        function reallyHandler( elem ) {
            if ( namespace ) {
                if ( full ) {
                    if ( namespace !== handlerObj.namespace ) {
                        return;
                    }
                } else {
                    if ( $.difference( namespace.split('.'), handlerObj.namespace.split('.') ).length !== 0 ) {
                        return;
                    }
                }
            }

            ev.$handlerObj = handlerObj;
            ev.$data = handlerObj.data;
            ( ev.type !== handlerObj.origType && handlerObj.specialHandler ? 
                    handlerObj.specialHandler : handlerObj.handler ).apply( elem, triggerData );

            // 用户调用 stopImmediatePropagation()
            if ( immediate ) {
                return true;
            }
        }

        // 处于目标阶段
        if ( phase === 2 ) {
            // 处于目标阶段时，既绑定捕获又绑定冒泡，只执行冒泡
            if ( typeInfo.bubbleCount > 0 && typeInfo.captureCount > 0 && this.capture ) {
                return;
            }

            handleSelf( true );

        // 捕获阶段
        } else if ( phase === 1 ) {
            if ( handleSelf( false, true ) === true ) {
                return;
            }

            handleDelegate( true );

        // 冒泡阶段
        } else if ( phase === 3 ) {
            if ( handleDelegate( false ) === true ) {
                return;
            }

            handleSelf( false, false );
        }
    };

    $.event = {
        // add 方法的主要目的是，将用户的所有传递参数，并成一个 handlerObj 对象
        // 放到元素对应的缓存体中的 events 对象的某个事件队列中，然后绑定一个回调。
        // 这个回调会处理用户的所有回调，因此对于每一个元素的每一个事件，它只绑定一次。
        add: function( elem, types, selector, data, capture, handler ) {
            var elemData, events, typeInfo, handlers, handlerObj,
                special, namespace, full, type, l = arguments.length, tns,
                dispatcher, dispatch;

            if ( !elem || !types || !handler || !(elemData = $._data( elem )) ) {
                return;
            }

            // 为此元素在缓存系统开辟一个空间存放其所有事件处理器
            if ( !(events = elemData.events) ) {
                events = elemData.events = {};
            }

            // 可以同时为多个事件类型绑定处理程序
            types = types.match(/\S+/g);
            l = types.length;

            while ( l-- ) {
                type = types[l];
                tns = rTypeNamespace.exec( type );

                type = tns[1];  // 取得真正的事件

                if ( !type ) {
                    continue;
                }

                namespace = tns[2].split('.').sort().join('.');  // 修正命名空间

                full = tns[3] === 'full';  // 是否匹配完整的命名空间

                capture = capture ? true : false;  // 转换为布尔值（为了好看）

                special = $.event.special[ type ] || {};

                if ( special.getType ) {
                    type = special.getType();
                } else {
                    type = ( selector ? special.delegateType : special.bingType ) || type;
                }

                // 设置全局唯一标识符
                if ( !handler.guid ) {
                    handler.guid = $.uniqid();
                }

                if ( !(typeInfo = events[ type ]) ) {
                    typeInfo = events[ type ] = {};
                }
                if ( !(handlers = typeInfo.handlers) ) {
                    handlers = typeInfo.handlers = [];
                }
                if ( !typeInfo.captureCount ) {
                    typeInfo.captureCount = 0;
                }
                if ( !typeInfo.bubbleCount ) {
                    typeInfo.bubbleCount = 0;
                }

                if ( capture ) {
                    typeInfo.captureCount++;
                } else {
                    typeInfo.bubbleCount++;
                }

                handlerObj = {
                    guid: handler.guid,
                    data: data,
                    handler: handler,
                    specialHandler: special.handler,
                    namespace: namespace,
                    full: full,
                    selector: selector || '',
                    type: type,
                    origType: tns[1],
                    capture: capture
                };

                handlers.push( handlerObj );

                // 同一事件、同一阶段，只绑定一次（拥有一个分发器）
                if ( capture && typeInfo.captureCount === 1 || !capture && typeInfo.bubbleCount === 1 ) {
                    dispatcher = Dispatcher( capture );
                    dispatch = dispatcher.dispatch.bind( dispatcher );
                    typeInfo[ capture ? 'capture' : 'bubble' ] = dispatch;
                    elem.addEventListener( type, dispatch, capture );
                }
            }
        },

        remove: function( elem, types, selector, capture, handler ) {
            var elemData, events, typeInfo, special,
                type, origType, l, tns, namespace, full, i, handlerObj,
                mSelector, mHandler, mCapture, mNs, mType;

            function removeHandlerObj() {
                for ( i = 0; ( handlerObj = typeInfo.handlers[i++] ); ) {
                    mType = origType ? handlerObj.origType === origType : 1;
                    mSelector = selector ? handlerObj.selector === selector : 1;
                    mHandler = handler ? handlerObj.handler.guid === handler.guid : 1;
                    mCapture = typeof capture === 'boolean' ? handlerObj.capture === capture : 1;
                    mNs = tns[2] ?
                        full ?
                            namespace === handlerObj.namespace :
                            $.difference( namespace.split('.'), handlerObj.namespace.split('.') ).length === 0 :
                        1;

                    if ( mType && mNs && mSelector && mCapture && mHandler ) {
                        typeInfo.handlers.splice( --i, 1 );
                        typeInfo[ ( handlerObj.capture ? 'capture' : 'bubble' ) + 'Count' ]--;
                    }
                }
                if ( typeInfo.captureCount <= 0 ) {
                    elem.removeEventListener( type, typeInfo.capture, true );
                }
                if ( typeInfo.bubbleCount <= 0 ) {
                    elem.removeEventListener( type, typeInfo.bubble, false );
                }
                removeType();
            }

            function removeType() {
                if ( typeInfo.handlers.length === 0 ) {
                    delete events[ type ];

                    type = '';

                    // 如果events里面没有数据，清除events
                    for ( type in events ) {
                        break;
                    }
                    if ( !type ) {
                        $.event.remove( elem );
                    }
                }
            }

            if ( !(elemData = $._data( elem )) ) {
                return;
            }
            if ( !(events = elemData.events) ) {
                return;
            }

            if ( !types ) {
                // off()
                if ( capture == null ) {
                    for ( type in events ) {
                        typeInfo = events[ type ];
                        elem.removeEventListener( type, typeInfo.capture, true );
                        elem.removeEventListener( type, typeInfo.bubble, false );
                    }
                    $._removeData( elem, 'events' );

                // off(true)、off(false)
                } else {
                    capture = capture ? true : false;

                    for ( type in events ) {
                        typeInfo = events[ type ];

                        for ( i = 0; ( handlerObj = typeInfo.handlers[i++] ); ) {
                            if ( handlerObj.capture === capture ) {
                                typeInfo.handlers.splice( --i, 1 );
                                typeInfo[ ( capture ? 'capture' : 'bubble' ) + 'Count' ]--;
                            }
                        }

                        elem.removeEventListener( type, typeInfo[ capture ? 'capture' : 'bubble' ], capture );

                        removeType();
                    }
                }
                return;
            }

            types = types.match(/\S+/g);
            l = types.length;

            while ( l-- ) {
                type = types[l];
                tns = rTypeNamespace.exec( type );
                origType = type = tns[1];  // 取得真正的事件
                namespace = tns[2].split('.').sort().join('.');
                full = tns[3] === 'full';

                // off(type[namespace] [, selector] [, capture] [, handler])
                if ( type ) {
                    if ( ( special = $.event.special[ type ] ) && special.getType ) {
                        type = special.getType();
                    }
                    if ( !( typeInfo = events[ type ] ) ) {
                        continue;
                    }
                    removeHandlerObj();

                // off(namespace [, selector] [, capture] [, handler])
                } else {
                    for ( type in events ) {
                        typeInfo = events[ type ];
                        removeHandlerObj();
                    }
                }
            }
        },

        // 派发事件
        trigger: function( el, type, data, onlyHandler/*内部使用*/ ) {
            var ev, tns, namespace, full, special, elemData, events, typeInfo, triggerInfo;

            tns = rTypeNamespace.exec( type );
            type = tns[1];
            namespace = tns[2].split('.').sort().join('.');
            full = tns[3] === 'full';

            // 修复type
            special = $.event.special[ type ] || {};
            type = special.getType ? special.getType() : type;


            if ( !type ) {
                return;
            }

            if ( onlyHandler && (
                !( elemData = $._data( el ) ) ||
                !( events = elemData.events ) || 
                !( typeInfo = events[ type ] ) )
            ) {
                return;
            }

            // triggerData用于保存trigger时发送到事件函数的数据
            if ( !( triggerInfo = $._data( el, 'triggerInfo' ) ) ) {
                triggerInfo = $._data( el, 'triggerInfo', {} );
            }

            triggerInfo[ type ] = {
                // 传到trigger的数据参数可在事件函数实参中获取
                data: $.toArray( data ),
                // 绑定的事件函数会根据命名空间来匹配进而调用对应的函数
                namespace: namespace,
                full: full
            };

            ev = document.createEvent('HTMLEvents');
            ev.initEvent( type, true, true );

            if ( onlyHandler ) {
                triggerInfo.onlyHandler = true;
                ( typeInfo.capture || typeInfo.bubble )( ev );
            } else {
                // 触发原生事件
                if ( special.trigger ) {
                    special.trigger( el );
                } else {
                    el.dispatchEvent( ev );
                }
            }
        },


        // trigger：用于触发原生事件（如果有的话）
        // getType：用来获取浏览器支持的事件
        // handler：用来包装替代原事件函数，当满足指定条件时才会触发原事件函数
        // fixEvent：用于修复event事件对象，是不同浏览器的event对象属性和行为一致
        // 
        // 
        // 不建议使用focusin和focusout事件，如果需要事件传播的话，使用focus和blur事件，并设置捕获阶段触发。
        // 对于想使用focus和blur事件来实现事件委托时，必须通过捕获的方式，即调用on方法时，传入true参数。
        // 为什么？因为能力有限T_T
        special: {
            mousewheel: {
                getType: function() {
                    return 'onmousewheel' in window ? 'mousewheel' : 'DOMMouseScroll';
                }
            },
            transitionend: {
                getType: function() {
                    return window.TransitionEvent ? 'transitionend' : 'webkitTransitionEnd';
                }
            },
            blur: {
                trigger: function( el ) {
                    if ( el === document.activeElement && el.blur ) {
                        el.blur();
                    }
                }
            },
            focus: {
                trigger: function( el ) {
                    if ( el !== document.activeElement && el.focus ) {
                        el.focus();
                    }
                }
            },
            click: {
                trigger: function( el ) {
                    if ( el.click ) {
                        el.click();
                    }
                }
            },
            submit: {
                trigger: function( el ) {
                    if ( this.submit ) {
                        el.submit();
                    }
                }
            },
            reset: {
                trigger: function( el ) {
                    if ( el.reset ) {
                        el.reset();
                    }
                }
            },
            select: {
                trigger: function( el ) {
                    if ( el.select ) {
                        el.select();
                    }
                }
            },
            DOMMouseScroll: {
                fixEvent: function( ev ) {
                    ev.wheelDelta = ev.detail > 0 ? -120 : 120;
                }
            }
        },

        // 修复event对象，磨平浏览器之间的差异
        fix: function( ev ) {
            var special = $.event.special[ ev.type ] || {};

            if ( special.fixEvent ) {
                special.fixEvent( ev );
            }
            return ev;
        }
    };

    // special MouseEvent
    $.each({
        mouseenter: 'mouseover',
        mouseleave: 'mouseout',
        pointerenter: "pointerover",
        pointerleave: "pointerout"
    }, function( orig, fix ) {
        $.event.special[ orig ] = {
            getType: function() {
                return fix;
            },
            handler: function( ev ) {
                var related = ev.relatedTarget;

                if ( !related || ( related !== this && !this.contains( related ) ) ) {
                    return ev.$handlerObj.handler.apply( this, arguments );
                }
            }
        };
    });

    // special Css3Event
    $.each({
        'animationstart': 'webkitAnimationStart',
        'animationiteration': 'webkitAnimationIteration',
        'animationend': 'webkitAnimationEnd'
    }, function( orig, fix ) {
        $.event.special[ orig ] = {
            getType: function() {
                return window.AnimationEvent ? orig : fix;
            }
        };
    });


    var argRulesOn = [
        function( types )    { return typeof types === 'string' || $.isPlainObject( types ); },
        function( selector ) { return typeof selector === 'string'; },
        function( data )     { return $.isPlainObject( data ); },
        function( capture )  { return typeof capture === 'boolean'; },
        function( handler )  { return typeof handler === 'function'; },
        function( one )      { return typeof one === 'number'; }
    ];
    var argRulesOff = [
        function( types )    { return typeof types === 'string' || $.isPlainObject( types ); },
        function( selector ) { return typeof selector === 'string'; },
        function( capture )  { return typeof capture === 'boolean'; },
        function( handler )  { return typeof handler === 'function'; }
    ];

    $.fn.extend({
        // 第一个参数若为对象类型，只能是映射事件/程序程序的对象
        on: function( types, selector, data, capture, handler, one ) {
            var type, args, origFn;

            // types 参数可能是个对象
            if ( $.isPlainObject( types ) ) {
                for ( type in types ) {
                    this.on( type, selector, data, capture, types[type], one );
                }
                return this;
            }

            // 参数调整
            args = $.adjustArgs( argRulesOn, arguments );

            // 第一个元素会被elem替换
            args.unshift( null );

            if ( one === 1 ) {
                origFn = args[5];
                handler = function( ev ) {
                    $( this ).off( args[1], args[2], args[4], args[5] );
                    return origFn.apply( this, arguments );
                };
                args.splice( 5, 1, handler );
            }

            return this.each(function() {
                args[0] = this;
                $.event.add.apply( this, args );
            });
        },

        one: function( types, selector, data, capture, handler ) {
            return this.on( types, selector, data, capture, handler, 1 );
        },
        off: function( types, selector, capture, handler ) {
            var type, args;

            // 当 types 为事件/处理程序的键值对对象
            if ( $.isPlainObject( types ) ) {
                for ( type in types ) {
                    this.off( type, selector, capture, types[ type ] );
                }
                return this;
            }

            // 参数调整
            args = $.adjustArgs( argRulesOff, arguments );

            args.unshift( null );

            return this.each(function() {
                args[0] = this;

                $.event.remove.apply( this, args );
            });
        },
        trigger: function( type, data ) {
            return this.each(function() {
                $.event.trigger( this, type, data );
            });
        },
        // 只调用绑定的函数，不派发事件
        triggerHandler: function( type, data ) {
            var elem = this[0];
            if ( elem ) {
                return $.event.trigger( elem, type, data, true );
            }
        }
    });


    // 批量添加快捷事件方法
    ['blur', 'focus', 'focusin', 'focusout', 'load', 'resize', 'scroll', 'unload', 'click', 'dblclick',
            'mousedown', 'mouseup', 'mousemove', 'mouseover', 'mouseout', 'mouseenter', 'mouseleave', 'mousewheel',
            'change', 'select', 'submit', 'keydown', 'keypress', 'keyup', 'error', 'contextmenu'].forEach(function( type ) {
        $.fn[ type ] = function( selector, data, capture, handler ) {
            return arguments.length > 0 ?
                this.on( type, selector, data, capture, handler ) : this.trigger( type );
        };
    });

    $.fn.hover = function( fnOver, fnOut ) {
        this.mouseenter( fnOver ).mouseleave( fnOut || fnOver );
    };



    /**
     * +----------+
     * | 更新日志 |
     * +----------+
     *
     * 2019-5-20 15:19
     * ===============
     * 在事件的命名空间里添加了full机制，即只有完整匹配命名空间才能移除或触发事件。
     * 用法，在命名空间后面添加 !full 字符串，例如：'animationend.bat.fx!full'
     */

    /*
    |-------------------------------------------------------------------------------
    | ajax模块
    |-------------------------------------------------------------------------------
    |
    */

    /**
     * 前端与后台进行交互的方式
     * ========================
     * - 直接通过地址栏请求页面
     * - 表单提交
     * - script节点加载脚本
     * - 通过XMLHttpRequest对象进行数据加载
     */

    /**
     * AJAX的概念
     * ==========
     * AJAX指异步JavaScript及XML（Asynchronous JavaScript And XML）。
     * AJAX里的X指xml, 但Ajax通信和数据格式无关，也就是说这种技术不一定使用XML。
     * AJAX是一种在2005年由Google推广开来的编程模式。
     * AJAX不是一种新的编程语言，而是一种使用现有标准的新方法。
     * AJAX基于JavaScript和HTTP请求（HTTP request）。
     * 通过AJAX，您的JavaScript可使用JavaScript的XMLHttpRequest对象直接与服务器进行通信。通过这个对象，
     * 您的JavaScript可在不重载页面的情况下与Web服务器交换数据。从而节省用户操作，时间，提高用户体验。
     */

    /**
     * 前台发送数据的格式，目前有三种
     * ==============================
     * 1. application/x-www-form-urlencoded  // 在发送前编码所有字符（默认）
     * 2. multipart/form-data  // 不对字符编码。在使用包含文件上传控件的表单时，必须使用该值。
     * 3. application/json
     * 4. text/xml
     * 5. text/plain  // 空格转换为 "+" 加号，但不对特殊字符编码。
     */

    /**
     * AJAX使用步骤
     * ============
     * 1. 获取XMLHttpRequest对象：new XMLHttpRequest
     * 2. 绑定事件回调：onreadystatechange
     * 3. 判断处理状态：readyStage、status
     * 4. 打开一个请求：open()
     * 5. 设置请求头：setRequestHeader()
     * 6. 发送数据：send()
     */

    /**
     * XMLHttpRequest对象
     * ==================
     * 
     * 属性
     * ====
     * - readyState
     *     XMLHttpRequest对象的状态
     *         IE:
     *         0 - Uninitialized: 初始化状态。XMLHttpRequest 对象已创建或已被 abort() 方法重置。。
     *         1 - Open:          open() 方法已调用，但是 send() 方法未调用。请求还没有被发送。
     *         2 - Send:          Send() 方法已调用，HTTP 请求已发送到 Web 服务器。未接收到响应。
     *         3 - Receiving:     所有响应头部都已经接收到。响应体开始接收但未完成。
     *         4 - Loaded:        HTTP 响应已经完全接收。
     *
     *         chrome: 
     *         0 - UNSENT:           代理被创建，但尚未调用 open() 方法。
     *         1 - OPENED:           open() 方法已经被调用。
     *         2 - HEADERS_RECEIVED: send() 方法已经被调用，并且头部和状态已经可获得。
     *         3 - LOADING:          下载中； responseText 属性已经包含部分数据。
     *         4 - DONE:             下载操作已完成。
     * - status
     *     服务器返回的状态码
     * - statusText
     *     服务器返回的状态文本
     * - responseText
     *     服务器返回的文本数据
     * - responseXML
     *     服务器返回的XML格式的数据
     *
     * 新版本属性：
     * - timeout
     *     设置HTTP请求的时限
     * - responseType
     *     设置返回数据的类型。
     *         arraybuffer、blob、document、json、text
     * - response
     *     返回相应的正文，返回的类型取决于responseType属性。
     *
     * ----------------------------------------
     *
     * 事件
     * ====
     * - readystatechange
     *     每次 readyState 属性改变的时候触发
     *
     * 新版本事件（只有Chrome和Firefox支持，IE和Edge不支持）：
     * - timeout
     *     超时时触发
     * - progress
     *     返回进度信息
     * - abort
     *     传输被用户取消
     * - error
     *     传输出现错误
     * - loadstart
     *     传输开始
     * - loadend
     *     传输结束（成功或失败）
     * - load
     *     传输成功完成
     *
     * 以上七个事件同时存在于 XMLHttpRequest 和 XMLHttpRequest.upload 对象上
     * 为 XMLHttpRequest 添加事件来跟踪下载时的进程。
     * 为 XMLHttpRequest.upload 添加事件来跟踪上传时的进程。
     *
     * 一般事件触发顺序：
     * xhr.onreadystatechange
     * xhr.onloadstart
     *     xhr.upload.onloadstart
     *     xhr.upload.onprogress
     *     xhr.upload.onload
     *     xhr.upload.onloadend
     * xhr.onprogress
     * xhr.onload
     * xhr.onloadend
     * 
     * 发生abort/timeout/error时的事件触发顺序：
     *     如果上传阶段还没有结束：
     *         xhr.onreadystatechange
     *         xhr.onloadstart
     *             xhr.upload.onloadstart
     *             xhr.upload.onprogress
     *             xhr.upload.[onabort或ontimeout或onerror]
     *             xhr.upload.onloadend
     *         xhr.onprogress
     *         xhr.[onabort或ontimeout或onerror]
     *         xhr.onloadend
     *         
     *     如果上传阶段已经结束：
     *         xhr.onreadystatechange
     *         xhr.onloadstart
     *             xhr.upload.onloadstart
     *             xhr.upload.onprogress
     *             xhr.upload.onload
     *             xhr.upload.onloadend
     *         xhr.onprogress
     *         xhr.[onabort或ontimeout或onerror]
     *         xhr.onloadend
     *
     * ------------------------------------------
     *
     * 方法
     * ====
     * - abort()
     *     取消当前响应
     * - getAllResponseHeaders()
     *     把HTTP响应头作为未解析的字符串返回。
     * - getResponseHeader()
     *     返回指定的 HTTP 响应头部的值。
     * - open()
     *     初始化新创建的请求，或重新初始化现有请求。
     *     注意：为已经激活的请求（已经调用过的请求）调用此方法open()相当于调用abort()。
     * - send()
     *     发送HTTP请求。
     * - setRequestHeader()
     *     设置请求头
     * - overrideMimeType()
     *     重写由服务器返回的MIME type。在send()之前被调用。
     *     其作用是：针对某些特定版本的mozillar浏览器的BUG进行修正。
     */


    // http://www.ruanyifeng.com/blog/2012/09/xmlhttprequest_level_2.html
    /**
     * 老版本的缺点
     * ============
     * - 只支持文本数据的传送，无法用来读取和上传二进制文件。
     * - 传送和接受数据时，没有进度信息，只能提示有没有完成。
     * - 受到“同域限制”，只能向同一域名的服务器发送数据。
     *
     * 新版本的功能
     * ============
     * - 可以设置HTTP请求的时限。
     * - 可以使用FormData对象管理表单数据。
     * - 可以上传文件。
     * - 可以请求不同域名下的数据（跨域请求）。
     * - 可以获取服务器端的二进制数据。
     * - 可以获取数据传输的进度信息。
     */

    /**
     * 其他关联知识点
     * ==============
     * - Blob 处理二进制
     * - BlobURL
     * - File
     * - FileReader
     * - FileWriter
     * - URL
     * - URLSearchParams
     * - ArrayBuffer
     * - Iterator
     */

    /**
     * 实现ajax - 功能需求
     * ===================
     * - 取得XMLHttpRequest
     *     既然不必兼容旧版本的IE，直接通过new XMLHttpRequest来获取。
     * - 事件绑定与状态维护
     *     - loadstart事件：一开头就执行，没有难度
     *     - error/load/loadend事件：判定status状态码
     *     - timeout事件：通过setTimeout实现
     *     - abort事件：一个开关的事情
     *     - progress事件：通过事件对象的loaded与total属性计算得到
     *
     * - 成功/失败
     *     2xx和304：成功，其他失败
     * - 发送请求与数据
     *     - get请求，将参数转换成querystring
     */

    /**
     * FormData对象
     * ============
     * 
     * 兼容性
     * ======
     * IE10+
     * 
     * 作用
     * ====
     * 将数据编译成键值对，以便用XMLHttpRequest来发送数据。
     * 即可发送表单数据，也可以发送带键数据。
     *
     * 方法
     * ====
     * 1. append( key, val ): 追加数据
     * 2. delete( key ): 删除数据
     * 3. set( key, val ): 修改键的值（没有则创建）（之后保存一对键值）
     * 4. get( key ): 获取指定键的值
     * 5. getAll( key ): 获取指定键的所有值，返回一个数组
     * 6. has( key ): 判断是由有指定键
     * 7. forEach(callback(val, key)): 遍历FormData对象
     * 8. keys(): 返回一个由键组成的遍历器对象
     * 9. values(): 返回一个由值组成的遍历器对象
     * 10. entries()：返回一个由键值组成的遍历器对象
     *
     * 使用
     * ====
     * 1. 实例化时可以传递一个form元素
     * 2. 将FormData对象传递进XMLHttpRequest.send()方法。
     */

    /**
     * URL对象
     * =======
     * 
     * 兼容性
     * ======
     * 兼容性不太好，一两个属性兼容IE10+，有些属性也需要高版本的Chrome、Firefox、Edge。
     *
     * 作用
     * ====
     * 用于解析、构造、规范化和编码URL。
     *
     * 使用
     * ====
     * 一般只用一个类方法 - URL.createObjectURL()：
     *     本地图片预览，传入file对象，返回一个地址，将其设定给img标签的src即可进行图片预览。
     *         
     * 此功能也可以通过 FileReader 对象实现：
     *     var reader = new FileReader();
     *     fileReader.readAsDataURL( file );
     *     reader.onload = function() {
     *         console.log( reader.result );
     *     };
     */


    $.extend({
        parseXML: function( text ) {
            var xml;
            if ( !text || typeof text !== "string" ) {
                return null;
            }

            try {
                xml = ( new window.DOMParser() ).parseFromString( text, "text/xml" );
            } catch ( e ) {
                xml = undefined;
            }
            if ( !xml || !xml.documentElement || xml.getElementsByTagName( "parsererror" ).length ) {
                $.error( "Invalid XML: " + text );
            }
            return xml;
        },
        parseJSON: function( text ) {
            try {
                return JSON.parse( text );
            } catch (e) {
                return null;   
            }
        },
        parseHTML: function( text ) {
            var fragment = document.createDocumentFragment(),
                wrapper = document.createElement('div'),
                firstChild;

            wrapper.innerHTML = text;

            while ( ( firstChild = wrapper.firstChild ) ) {
                fragment.appendChild( firstChild );
            }

            return fragment;
        },
        parseJS: function( text ) {
            var script = document.createElement('script');
            script.text = text;
            document.head.appendChild( script ).parentNode.removeChild( script );
        },
        parseHeaders: function( text ) {
            var o = {};
            text.split(/\r?\n/).forEach(function( str ) {
                var m;
                if ( ( m = str.match(/^([^:]+): (.+)$/) ) ) {
                    o[ m[1] ] = m[2];
                }
            });
            return o;
        },
        // 把对象转换为查询字符串格式
        // traditional为真，既传统的就不加中括号
        param: function( o, traditional ) {
            var s = [], i, j;

            for ( i in o ) {
                if ( Array.isArray( o[i] ) ) {
                    for ( j = 0; j < o[i].length; j++ ) {
                        s.push( encodeURIComponent( i ) + ( traditional ? '' : '[]' ) + '=' +
                            encodeURIComponent( o[i][j] ) );
                    }
                } else {
                    s.push( encodeURIComponent( i ) + '=' + encodeURIComponent( o[i] ) );
                }
            }

            return s.join('&');
        },
        // 把查询字符串格式转换为对象
        unparam: function( s ) {
            var o = {};

            if ( !s ) {
                return o;
            }

            s.split('&').forEach(function( kv ) {
                var a = kv.split('='),
                    k = decodeURIComponent( a[0] || '' ).replace(/\[\]$/, ''),
                    v = decodeURIComponent( a[1] || '' );

                addKv( o, k, v );
            });

            return o;
        }
    });

    $.fn.extend({
        // 将用作提交的表单元素的值编译成字符串
        serialize: function( traditional ) {
            return $.param( this.serializeObject(), traditional );
        },

        // 将用作提交的表单元素的值编译成对象
        serializeObject: function() {
            var ret = [], o = {};

            this.each(function() {
                if ( this.nodeName === 'FORM' ) {
                    ret = ret.concat( core_slice.call( this.elements ) );
                } else {
                    ret.push( this );
                }
            });

            ret.filter(function( elem ) {
                return elem.name && !elem.disabled &&
                    /^input|select|textarea$/i.test( elem.nodeName ) &&
                    !/^submit|button|image|reset|file$/i.test( elem.type ) &&
                    ( elem.checked || !/^checkbox|radio$/.test( elem.type ) );
            }).forEach(function( elem ) {
                addKv( o, elem.name, elem.value );
            });

            return o;
        }
    });


    $.ajaxSettings = {
        // 请求的接口地址
        url: '',
        // 请求的方法
        method: 'GET',
        // 是否异步请求
        async: true,
        // 发送到服务器的数据：字符串、plain对象、FormData对象（需设置processData为false）
        data: '',
        // 发送数据前是否进行处理
        processData: true,
        // 是否以传统方式处理数据（不加中括号）
        traditional: false,
        // 是否携带cookie信息
        withCredentials: false,
        // 发送到服务器的数据的编码类型: form-data
        contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
        // 设置服务器响应数据的类型：arraybuffer, blob, json, text, document, stream
        responseType: '',
        // 请求超时时间
        timeout: 0,
        // 设置请求头
        headers: {

        },
        accepts: {
            xml: 'application/xml, text/xml',
            html: 'text/html',
            document: 'text/html',
            text: 'text/plain',
            json: 'application/json, text/javascript',
            script: 'application/javascript, text/javascript',
            _default: '*/'.concat('*') 
        },
        // 是否在服务器数据改变时获取新数据
        isModified: false,
        // 响应HTTP访问认证请求的用户名
        username: null,
        // 响应HTTP访问认证请求的密码
        password: null,

        // 设置请求成功的状态码
        validateStatus: function( status ) {
            return status >= 200 && status < 300 || status === 304;
        },

        // 上传进度回调
        uploadProgress: null,
        // 下载进度回调
        downloadProgress: null,

        // 请求发送前的回调
        beforeSend: null,
        // 请求成功后的回调
        success: null,
        // 请求失败时的回调
        error: null,
        // 请求完成后的回调
        complete: null
    };

    // 往o对象添加键值对，如果存在相同的键，
    // 则将对应的值转换为数组来保存数据
    function addKv( o, k, v ) {
        if ( k in o ) {
            if ( Array.isArray( o[ k ] ) ) {
                o[ k ].push( v );
            } else {
                ( o[ k ] = [ o[ k ] ] ).push( v );
            }
        } else {
            o[ k ] = v;
        }
    }

    // 响应对象
    // jsonp会在success回调里接收一个json对象，
    // 其他情况下success异或error都会接收一个响应对象。
    function Response( s, xhr ) {
        this.url = s.url.indexOf('http') === 0 ?
            s.url :
            s.url.indexOf('//') === 0 ?
                location.protocol + s.url :
                s.url.indexOf('/') ?
                    location.origin + s.url :
                    location.href.slice(0, location.href.lastIndexOf('/') + 1) + s.url;
        this.data = xhr.response;
        this.headers = $.parseHeaders( xhr.getAllResponseHeaders() );
        this.ok = xhr.status >= 200 && xhr.status < 400;
        this.status = xhr.status;
        this.statusText = xhr.statusText;
        this.config = s;
    }

    $.extend({
        // 全局配置ajax
        ajaxSetup: function( settings ) {
            $.extend( $.ajaxSettings, settings );
        },
        ajax: function( s ) {
            return new $.Promise(function( resolve, reject ) {
                var xhr, state, response, headers;

                s = $.extend( true, {}, $.ajaxSettings, s );

                // 1. 处理数据
                // 把数据转换成可以发送到服务器的格式
                if ( $.isPlainObject( s.data ) && s.processData ) {
                    s.data = $.param( s.data, s.traditional );
                }

                // 如果是get请求，把数据添加到url后面
                if ( s.data && s.method.toLowerCase() === 'get' ) {
                    s.url += ( s.url.indexOf('?') > -1 ? '&' : '?' ) + s.data;
                    s.data = null;
                }

                // 2. 创建XMLHttpRequest对象
                xhr = new XMLHttpRequest();

                // 3. 初始化请求
                // 必须放在setRequestHeader方法之前
                xhr.open( s.method, s.url, s.async, s.username, s.password );

                // 4. 处理请求头
                headers = $.extend( {
                    'X-Requested-With': 'XMLHttpRequest'
                }, s.headers );

                if ( s.data && s.processData ) {
                    headers['Content-Type'] = s.contentType;
                }
                headers.Accept = s.responseType && s.accepts[ s.responseType ] ?
                    s.accepts[ s.responseType ] + ', */*' :
                    s.accepts._default;

                for ( var i in headers ) {
                    xhr.setRequestHeader( i, headers[ i ] );
                }

                // 5. 设置是否携带cookie信息（用于跨域请求）
                xhr.withCredentials = s.withCredentials;

                // 6. 超时处理
                xhr.timeout = s.timeout;

                // 7. 设置响应的类型
                xhr.responseType = s.responseType;

                // 8. 绑定事件函数
                xhr.onreadystatechange = onreadystatechange;

                // 上传回调
                if ( xhr.upload && s.uploadProgress ) {
                    xhr.upload.addEventListener('progress', function( ev ) {
                        s.uploadProgress.call( this, ev );
                    });
                }
                // 下载回调
                if ( xhr.onprogress && s.downloadProgress ) {
                    xhr.addEventListener('progress', function( ev ) {
                        s.downloadProgress.call( this, ev );
                    });
                }

                // 9. 发送请求前的处理
                if ( s.beforeSend && ( s.beforeSend( xhr, s ) === false ) ) {
                    xhr.abort();
                    return false;
                }

                // 10. 发送请求
                xhr.send( s.data );

                function success() {
                    if ( s.success ) {
                        s.success( response );
                    }
                    resolve( response  );
                }

                function error() {
                    if ( s.error ) {
                        s.error( response );
                    }
                    reject( response );
                }

                function complete() {
                    if ( s.complete ) {
                        s.complete( response );
                    }
                }

                function onreadystatechange() {
                    if ( xhr.readyState === 4 ) {
                        response = new Response( s, xhr, state );

                        ( s.validateStatus( xhr.status ) ? success : error )();

                        complete();
                    }
                }
            });
        },
        getScript: function( url, callback ) {
            return new $.Promise(function( resolve, reject ) {
                var script = document.createElement('script');
                script.async = true;
                script.src = url;
                script.onload = function() {
                    if ( callback ) {
                        callback();
                    }
                    resolve();
                };
                script.onerror = function() {
                    reject();
                };
                document.head.appendChild( script );
            });
        },
        getStyle: function( url ) {
            var link = document.createElement('link');
            link.rel = 'stylesheet';
            link.type = 'text/css';
            link.href = url;
            document.head.appendChild( link );
        },
        getJSON: function( url, data, callback ) {
            if ( typeof data === 'function' ) {
                callback = data;
                data = null;
            }

            return $.ajax({
                url: url,
                data: data,
                responseType: 'json',
                success: function( res ) {
                    if ( typeof callback === 'function' ) {
                        callback( res.data );
                    }
                }
            });
        }
    });

    ['get', 'post', 'put', 'delete', 'head', 'patch'].forEach(function( method ) {
        $[ method ] = function( url, data, options ) {
            options = $.extend( {
                method: method.toUpperCase(),
                url: url,
                data: data
            }, options || {} );
            return $.ajax( options );
        };
    });



    /**
     * JSONP原理
     * =========
     * 利用 script 标签的 src 属性没有跨域限制的特性，
     * 浏览器端动态添加一个 script 标签，以 URL 查询字段的形式把数据提交到服务器。
     * 服务器端返回一段调用某个函数（唯一，由前端动态生成）的js代码，
     * 再以传递函数参数的形式，把数据传递到客户端。
     * 
     * php后台可能会有这样的处理：
     * $_GET['callbak'] . '(' . $data . ')';
     */

    /**@doc
     * @name bat.jsonpSettings
     * @description 全局jsonp配置对象
     * @type {Object}
     * @property {Boolean}  cache=false        是否缓存数据
     * @property {Object}   data=''            发送到服务器的数据
     * @property {String}   scriptCharset=null 设置脚本的编码
     * @property {String}   name='callback'    回调函数字段名
     * @property {String}   callbackName=null  回调函数字段值（默认系统生成随机数）
     * @property {Boolean}  traditional=false  是否以传统方式处理数据（不加中括号）
     * @property {Function} success=null       成功回调
     * @property {Function} error=null         失败回调
     * @property {Function} complete=null      成功/失败回调
     */
    $.jsonpSettings = {
        cache: false,
        data: '',
        scriptCharset: null,
        name: 'callback',
        callbackName: null,
        traditional: false,
        success: null,
        error: null,
        complete: null
    };

    /**@doc
     * @method bat.jsonp()
     * @description 发送一个jsonp请求，用于跨域请求数据。
     * @param  {String} url     发送get请求的URL
     * @param  {Object} options 配置选项对象，可通过修改 bat.jsonpSettings 对象来进行全局jsonp配置。
     * @return {Promise}        Promise对象
     */
    $.jsonp = function( url, options ) {
        return new $.Promise(function( resolve, reject ) {
            var callbackName, script, head = document.head, segments = {};

            options = $.extend( true, {}, $.jsonpSettings, options );

            // 上传的数据
            if ( $.isPlainObject( options.data ) ) {
                $.extend( segments, options.data );
            }

            // 回调函数名字段
            callbackName = options.callbackName ||'jsonp' + Date.now() + ( Math.random() + '' ).slice(-8);
            segments[ options.name ] = callbackName;

            // 缓存字段
            if ( !options.cache ) {
                segments._t = Date.now();
            }

            // 生成url
            url += ( url.indexOf('?') > -1 ? '&' : '?' ) + $.param( segments, options.traditional );

            window[ callbackName ] = function( data ) {
                if ( options.success ) {
                    options.success( data );
                }
                resolve( data );

                complete();
            };

            function complete() {
                if ( options.complete ) {
                    options.complete();
                }
                head.removeChild( script );
                delete window[ callbackName ];
            }

            script = document.createElement('script');
            script.src = url;
            script.async = true;
            if ( options.scriptCharset ) {
                script.charset = scriptCharset;
            }

            script.onerror = function() {
                if ( options.error ) {
                    options.error();
                }
                reject();
                complete();
            };

            // 异步请求，避免卡死
            setTimeout(function() {
                head.appendChild( script );
            }, 0);
        });
    };

    /*
    |-------------------------------------------------------------------------------
    | 元素属性模块
    |-------------------------------------------------------------------------------
    |
    */

    $.fn.extend({
        // 添加类名，多个类名之间用空格隔开
        addClass: function( classes ) {
            return this.each(function( elem ) {
                if ( elem.nodeType === 1 && typeof classes === 'string' ) {
                    elem.className = $.union( elem.className.match(/\S+/g) || [], classes.match(/\S+/g) || [] ).join(' ');
                }
            });
        },
        // 删除类名，多个类名之间用空格隔开，不传入第二个参数则清空类名
        removeClass: function( classes ) {
            return this.each(function( elem ) {
                if ( elem.nodeType === 1 ) {
                    elem.className = classes == null ? '' : 
                        $.difference(
                                elem.className.match(/\S+/g) || [],
                                ( typeof classes === 'string' ? classes : '' ).match(/\S+/g) || []
                            ).join(' ');
                }
            });
        },
        // 多个类名之间用空格隔开
        // state: 一个布尔值（不止是真值/假值），用于判断样式是否应该被添加或移除。
        toggleClass: function( classes, state ) {
            return this.each(function( elem ) {
                if ( elem.nodeType === 1 && typeof classes === 'string' ) {
                    return state != null ?
                        ( state ? $(elem).addClass( classes ) : $(elem).removeClass( classes ) ) :
                        elem.className = $.symmetricDifference(
                                elem.className.match(/\S+/g) || [],
                                classes.match(/\S+/g) || []
                            ).join(' ');
                }
            });
        },
        // 多个类名之间用空格隔开，
        // 可以传入第三个参数说明是every或者some行为。默认包含一个都返回true
        hasClass: function( classes, every ) {
            var elem = this[0], src, arg;
            
            if ( elem.nodeType === 1 && typeof classes === 'string' ) {
                src = elem.className.match(/\S+/g) || [];
                arg = classes.match(/\S+/g) || [];
                return every ? $.difference( arg, src ).length === 0 : $.intersect( arg, src ).length > 0;
            }
        },
        attr: function( key, val ) {
            return $.access(this, function( elem, key, val ) {
                if ( elem.nodeType === 1 ) {
                    return val === undefined ? elem.getAttribute( key ) : elem.setAttribute( key, val );
                }
            }, key, val, arguments.length === 0);
        },
        removeAttr: function( key ) {
            return this.each(function( elem ) {
                if ( elem.nodeType === 1 ) {
                    elem.removeAttribute( key );
                }
            });
        },
        hasAttr: function( key ) {
            var elem = this[0];
            if ( elem && elem.nodeType === 1 ) {
                return elem.hasAttribute( key );
            }
            return false;
        },
        prop: function( key, val ) {
            return $.access(this, function( elem, key, val ) {
                return val === undefined ? elem[ key ] : elem[ key ] = val;
            }, key, val, arguments.length === 0);
        },
        removeProp: function( key ) {
            return this.each(function() {
                try {
                    this[ key ] = void 0;
                    delete this[ key ];
                } catch (e) {}
            });
        },
        val: function( val ) {
            var ret = $.access(this, function( elem, val ) {
                return val === null ? ( elem.value || '' ) : elem.value = val;
            }, null, val);

            // 确保返回字符串或bat对象
            return ret == null ? '' : ret;
        }
    });

    /*
    |-------------------------------------------------------------------------------
    | css模块
    |-------------------------------------------------------------------------------
    |
    */

    // 所有浏览器的前缀（太多了，效率低下，何时来个秦皇一统六国）
    var prefixes = ['', '-webkit-', '-moz-', '-ms-', '-o-'];

    // css属性名与其兼容当前浏览器的属性名（驼峰命名格式）的映射缓存
    var cssProps = {
        background: 'background-color'
    };

    // 元素与其默认display值的映射缓存
    var cacheDisplay = $.extend( $.oneObject("a,abbr,b,span,strong,em,font,i,kbd", "inline"),
        $.oneObject("div,h1,h2,h3,h4,h5,h6,section,p", "block") );

    // 不需要加单位的css属性值的集合（有些属性的单位是可选的，比如line-height）
    $.cssNumber = $.oneObject('columnCount,fillOpacity,fontSizeAdjust,fontWeight,lineHeight,opacity,orphans,widows,zIndex,zoom,rotate,order,flexGrow,flexShrink,scrollLeft,scrollTop');

    var cssExpand = ['Top', 'Right', 'Bottom', 'Left'];
    var boxRange = ['padding$', 'border$Width', 'margin$'];

    // 处理复合赋值运算符
    function compound( src, val, oper ) {
        switch ( oper ) {
            case '+=': return src + val;
            case '-=': return src - val;
            case '*=': return src * val;
            case '/=': return src / val;
            case '%=': return src % val;
        }
        return val;
    }

    // 避免border-box中宽或高小于padding和border之和导致获取的宽高值为0
    function getBorderBoxSize( elem, name ) {
        var style = elem.style,
            prop = $.getCssProp('box-sizing'),
            boxSizing = style[ prop ],
            val;

        style[ prop ] = 'content-box';
        val = parseFloat( getStyle( elem, name ) );
        style[ prop ] = boxSizing;
        return val;
    }

    // 单位换算
    function convertUnit( elem, prop, target, unit, isRaw, isBorderBox ) {
        var cur = target,
            scale = 1,
            maxIterations = 20;

        if ( unit !== 'px' && cur ) {
            do {
                // 确保scale不为0
                scale = scale || ".5";
                cur = cur / scale;
                elem.style[ prop ] = cur + unit;
            } while (
                scale !== ( scale = parseFloat( isRaw ? 
                    isBorderBox ? getBorderBoxSize( elem, prop ) : getStyle( elem, prop ) :
                    $.css( elem, prop ) ) / target ) &&
                scale !== 1 &&
                --maxIterations
            );
        }

        return cur;
    }

    // 在IE下（包括IE9、10），盒子模型为border-box时，使用getComputedStyle方法获取到的宽高只包含content；
    // 而使用currentStyle属性则和标准浏览器行为一致，但是如果没有显式设置宽高，获取的值为auto；
    // 因此IE下获取宽高时，还是使用getComputedStyle，然后当盒子模型为border-box时，为其加上padding和border。
    function getStyle( elem, prop ) {
        return elem.ownerDocument.defaultView.getComputedStyle( elem )[ $.getCssProp( prop ) ];
    }

    function setStyle$1( elem, prop, val ) {
        elem.style[ $.getCssProp( prop ) ] = val;
    }

    function isBorderBox( elem ) {
        return getStyle( elem, 'box-sizing' ) === 'border-box';
    }

    $.cssHooks = {
        _default: {
            set: function( elem, prop, val ) {
                setStyle$1( elem, prop, val );
            },
            get: function( elem, prop ) {
                return getStyle( elem, prop );
            }
        },
        userSelect: {
            set: function( elem, key, val ) {
                if ( $.getCssProp( key ) ) {
                    $.cssHooks._default.set( elem, key, val );
                } else {
                    var allow = val.toLowerCase() === 'none' ? 'on' : '',
                        elems = elem.getElementsByTagName('*'),
                        i = 0, el;

                    elem.setAttribute( 'unselectable', allow );
                    while ( (el = elems[ i++ ]) ) {
                        if ( !/^(?:iframe|textarea|input|select)$/i.test( el.tagName ) ) {
                            el.setAttribute( 'unselectable', allow );
                        }
                    }
                }
            },
            get: function( elem, key ) {
                return $.getCssProp( key ) ? $.cssHooks._default.get( elem, key ) : elem.getAttribute('unselectable');
            }
        }
    };

    ['width', 'height'].forEach(function( key ) {
        $.cssHooks[ key ] = {
            // 可以获取隐藏元素的宽高
            get: function( elem, prop ) {
                return getWidthOrHeight( elem, prop, true, 2, false,
                    !!elem.currentStyle && isBorderBox( elem ) ) + 'px';
            }
        };
    });

     ['scrollTop', 'scrollLeft'].forEach(function( key ) {
        $.cssHooks[ key ] = {
            get: function( elem, prop ) {
                return elem[ prop ];
            },
            set: function( elem, prop, val ) {
                elem[ prop ] = val;
            }
        };

        $.fn[ key ] = function( val ) {
            return $.access( this, function( elem, val ) {
                // set
                if ( val != null ) {
                    elem[ key ] = val;
                }

                // get
                return elem[ key ];
            }, null, val);
        };
    });


    // 获取可计算属性值的信息
    function getOperationalInfo$1( elem, prop, val ) {
        var parts, oper, newVal, newUnit, srcVal, srcUnit;

        // 非数值
        if ( !( parts = rCssNumVal.exec( val ) ) ) {
            return;
        }

        oper = parts[1];  // 操作符
        newVal = parseFloat( parts[2] );  // 数值
        newUnit = parts[3] ? parts[3] : $.cssNumber[prop] ? '' : 'px'; // 单位（有必要时自动添加单位）

        // 原来的样式值
        parts = rCssNumVal.exec( $.css( elem, prop ) );
        srcVal = parts ? parseFloat( parts[2] ) : 0;
        srcUnit = parts ? parts[3] : '';

        // 单位换算
        if ( srcVal && srcUnit !== newUnit ) {
            srcVal = convertUnit( elem, prop, srcVal, newUnit );
        }

        // 处理复合赋值运算符
        newVal = compound( srcVal, newVal, oper );

        return {
            srcVal: srcVal,  // 调整单位后的初始值
            newVal: newVal,
            unit: newUnit
        };
    }

    $.extend({
        // CSS样式操作
        css: function( elem, key, val ) {
            var hookGet, hookSet, prop, valInfo;
            if ( !elem || !key ) { return; }

            // 批处理
            if ( $.isPlainObject( key ) ) {
                for ( prop in key ) {
                    $.css( elem, prop, key[ prop ] );
                }
                return;
            }

            hookGet = $.cssHooks[ key ] && $.cssHooks[ key ].get || $.cssHooks._default.get;
            hookSet = $.cssHooks[ key ] && $.cssHooks[ key ].set || $.cssHooks._default.set;

            if ( val !== void 0 ) {
                // 处理复合赋值运算符
                if ( ( valInfo = getOperationalInfo$1( elem, key, val ) ) ) {
                    val = valInfo.newVal + valInfo.unit;
                }

                hookSet( elem, key, val );
            } else {
                return hookGet( elem, key );
            }
        },

        // 获取元素默认的display值
        getDisplay: function( nodeName ) {
            nodeName = nodeName.toLowerCase();

            if ( !cacheDisplay[ nodeName ] ) {
                // 在沙箱里面进行操作
                $.sandbox(function( win, doc, html, body ) {
                    var node = doc.createElement( nodeName ), val;
                    body.appendChild( node );
                    val = $.css( node, 'display' );
                    // 缓存起来
                    cacheDisplay[ nodeName ] = val;
                });
            }
            return cacheDisplay[ nodeName ];
        },

        // 传入一个CSS属性名，转换为兼容当前浏览器的属性名，如果没有兼容当前浏览器的属性就返回null。
        // 有则将其缓存起来，下次直接返回缓存的结果。
        getCssProp: function( name, host ) {
            var i = 0, fitName, l = prefixes.length;
            if ( cssProps[ name ] ) {
                return cssProps[ name ];
            }

            host = host || $.html.style;
            for ( ; i < l; i++ ) {
                fitName = prefixes[ i ] + name;
                if ( fitName in host ) {
                    // 缓存并返回
                    return ( cssProps[ name ] = fitName );
                }
            }
            return null;
        }
    });

    $.fn.extend({
        css: function( key, val ) {
            return $.access(this, function( elem, key, val ) {
                return $.css( elem, key, val );
            }, key, val, arguments.length === 0);
        },
        // 获取元素的绝对坐标（相对于document的坐标）
        offset: function() {
            var elem = this[0], top = 0, left = 0;
            if ( elem && elem.nodeType === 1 ) {
                while ( elem.offsetParent ) {
                    top += elem.offsetTop;
                    left += elem.offsetLeft;
                    elem = elem.offsetParent;
                }
                return  { top: top, left: left };
            }
        },
        // 获取元素的相对坐标（相对于离元素最近的含有定位信息的祖先元素）
        position: function() {
            var elem = this[0];
            if ( elem && elem.nodeType === 1 ) {
                return {
                    top: elem.offsetTop,
                    left: elem.offsetLeft
                };
            }
        },
    });

    // 秽土转生
    // 隐藏的元素和行内元素获取的宽高为auto，需要将其转化为数值
    // 当display为none时，设置display为对应的非inline
    function rebirthOfDirtySoil( elem ) {
        var seal = [];

        $(elem).parents().concat( elem ).each(function( el ) {
            var style, display;
            display = $.css( el, 'display');

            if ( display === 'none' || display === 'inline' ) {
                display = $.getDisplay( el.nodeName );

                if ( display === 'inline' ) {
                    display = 'inline-block';
                }

                style = el.getAttribute('style') || '';

                el.setAttribute( 'style', style + 'display:' + display + ' !important' );

                seal.push({
                    node: el,
                    style: style
                });
            }

        });
        return seal;
    }

    // 秽土转生·解
    function relieveRebirthOfDirtySoil( seal ) {
        if ( Array.isArray( seal ) ) {
            for ( var i = 0, obj; ( obj = seal[i++] ); ) {
                obj.node.setAttribute( 'style', obj.style );
            }
        }
    }

    $.tempDisplay = function( elem, callback ) {
        var seal = rebirthOfDirtySoil( elem);

        if ( typeof callback === 'function' ) {
            callback.call( elem, elem );
        }

        relieveRebirthOfDirtySoil( seal );
    };
    $.fn.tempDisplay = function( callback ) {
        return this.each(function( elem ) {
            $.tempDisplay( elem, callback );
        });
    };


    /**
     * 获取元素宽高的集化操作
     * @param  {object} elem       要获取其宽高的元素
     * @param  {number} level      等级
     *                                 0：width
     *                                 1：width + padding
     *                                 2：width + padding + border
     *                                 3：width + padding + border + margin
     * @param  {boolean} horizontal 要获取宽或高
     * @return {number}  size       宽或高
     */


    // level            method                  content-box（由内到外）             border-box（由外到内）
    // 0                width                   val                                 val - border - padding
    // 1                innerWidth              val + padding                       val - border
    // 2                outerWidth              val + padding + border              val
    // 3                outerWidth(true)        val + padding + border + margin     val + margin
    function getWidthOrHeight( elem, name, isRaw, level, isBorderBox, isIEBorderBox ) {
        var size, i = 0, j, k, m = 1, seal, range;

        // 先将隐藏元素显示出来
        if ( getStyle( elem, name ) === 'auto' ) {
            seal = rebirthOfDirtySoil( elem );
        }
        size = parseFloat( getStyle( elem, name ) );

        if ( !isRaw || isIEBorderBox ) {
            range = boxRange.slice();

            k = name === 'width' ? 1 : 0;

            if ( isBorderBox ) {
                range.reverse();
                if ( level === 3 ) {
                    level = 1;
                } else {
                    i = 1;
                    level = 3 - level;
                    m = -m;
                }
            }

            for ( ; i < level; i++ ) {
                for ( j = k; j < 4; j += 2 ) {
                    size += parseFloat( getStyle( elem, range[i].replace( '$', cssExpand[j] ) ) ) * m;
                }
            }
        }

        relieveRebirthOfDirtySoil( seal );

        return size;
    }

    // 盒子尺寸、盒子范围、单位、符合运算符
    // level            method                  content-box（由内到外）             border-box（由外到内）
    // 0                width                   val                                 val + border + padding
    // 1                innerWidth              val - padding                       val + border
    // 2                outerWidth              val - padding - border              val
    function setWidthOrHeight( elem, name, method, level, val, isBorderBox ) {
        var parts, oper, newVal, unit, srcVal,
            i = 0, j, k, m = -1,
            range = boxRange.slice(),
            style = elem.style;

        // 非数值
        if ( !( parts = rCssNumVal.exec( val ) ) ) {
            return;
        }

        oper = parts[1];  // 操作符
        newVal = parseFloat( parts[2] );  // 数值
        unit = parts[3] || 'px'; // 单位

        if ( newVal < 0 ) {
            newVal = 0;
        }

        // 处理复合运算符
        // 获取原始值进行单位换算，将复合运算后的值作为新的值
        if ( rCompOper.test( oper ) ) {
            srcVal = $( elem )[ method ]();
            srcVal = convertUnit( elem, name, srcVal, unit, true, isBorderBox );
            newVal = compound( srcVal, newVal, oper );
        }

        style[ name ] = newVal + unit;

        k = name === 'width' ? 1 : 0;

        if ( isBorderBox ) {
            range.reverse();
            level = 3 - level;
            i = 1;
            m = -m;
        }

        if ( isBorderBox && level > 1 || level ) {
            newVal = isBorderBox ? getBorderBoxSize( elem, name ) : parseFloat( getStyle( elem, name ) );

            for ( ; i < level; i++ ) {
                for ( j = k; j < 4; j += 2 ) {
                    newVal += parseFloat( getStyle( elem, range[i].replace( '$', cssExpand[j] ) ) ) * m;
                }
            }

            if ( newVal < 0 ) {
                newVal = 0;
            }

            newVal = convertUnit( elem, name, newVal, unit, true );

            style[ name ] = newVal + unit;
        }
    }

    // width()、height()
    // innerWidth()、innerHeight()
    // outerWidth()、outerHeight()
    $.each({ Height: 'height', Width: 'width' }, function( postfix, name ) {
        $.each({'': 0, 'inner': 1, 'outer': 2}, function( prefix, level ) {
            var method = prefix ? prefix + postfix : name;

            $.fn[ method ] = function( val ) {
                var l = level;
                if ( val === true && level === 2 ) {
                    l = 3;
                    val = undefined;
                }

                return $.access(this, function( elem, val ) {
                    // set
                    if ( typeof val === 'number' || typeof val === 'string' ) {
                        setWidthOrHeight( elem, name, method, l, val, isBorderBox( elem ) );
                    // get
                    } else {
                        // 处理视窗
                        if ( elem && elem.window === elem ) {
                            return elem[ ( level === 2 ? 'outer' : 'inner' ) + postfix ];
                        }
                        // 处理文档
                        if ( elem && elem.nodeType === 9 ) {
                            return Math.max(
                                elem.body['scroll' + postfix],
                                elem.documentElement['scroll' + postfix],
                                elem.body['offset' + postfix],
                                elem.documentElement['offset' + postfix],
                                elem.body['client' + postfix],
                                elem.documentElement['client' + postfix]
                            );
                        }
                        return getWidthOrHeight( elem, name, false, l, isBorderBox( elem ) );
                    }
                }, null, val);
            };
        });
    });

    /*
    |-------------------------------------------------------------------------------
    | 节点模块
    |-------------------------------------------------------------------------------
    |
    */

    function dir( cur, dir, until, include ) {
        var ret = [],
            truncate = until !== undefined;
        
        while ( ( cur = cur[ dir ] ) ) {
            if ( truncate && $( cur ).is( until ) ) {
                if ( include ) {
                    ret.push( cur );
                }
                break;
            }
            ret.push( cur );
        }

        return ret;
    }

    function closest( cur, dir, until ) {
        while ( ( cur = cur[ dir ] ) ) {
            if ( $( cur ).is( until ) ) {
                return cur;
            }
        }
    }

    function siblings( cur, attr, elem ) {
        var ret = [];

        for ( ; cur; cur = cur[ attr ] ) {
            if ( cur !== elem ) {
                ret.push( cur );
            }
        }

        return ret;
    }

    function cleanData( elems ) {
        elems = elems.nodeType === 1 ? [elems] : core_slice.call( elems );

        elems.forEach(function( el ) {
            $.event.remove( el );
            $.removeData( el );
            $._removeData( el );
        });
    }

    // 在DOM家族中进行查找
    $.each({
        next: function( elem ) {
            return elem.nextElementSibling;
        },
        prev: function( elem ) {
            return elem.previousElementSibling;
        },
        nextAll: function( elem ) {
            return dir( elem, 'nextElementSibling' );
        },
        prevAll: function( elem ) {
            return dir( elem, 'previousElementSibling' );
        },
        nextUntil: function( elem, until, include ) {
            return dir( elem, 'nextElementSibling', until, include );
        },
        prevUntil: function( elem, until, include ) {
            return dir( elem, 'previousElementSibling', until, include );
        },
        prevClosest: function( elem, until ) {
            return closest( elem, 'previousElementSibling', until );
        },
        nextClosest: function( elem, until ) {
            return closest( elem, 'nextElementSibling', until );
        },
        siblings: function( elem ) {
            return siblings( (elem.parentNode || {}).firstElementChild, 'nextElementSibling', elem );
        },

        firstChild: function( elem ) {
            return elem.firstElementChild;
        },
        lastChild: function( elem ) {
            return elem.lastElementChild;
        },
        children: function( elem ) {
            return elem.children;
        },

        parent: function( elem ) {
            return elem.parentElement;
        },
        parents: function( elem ) {
            return dir( elem, 'parentElement' );
        },
        parentsUntil: function( elem, until, include ) {
            return dir( elem, 'parentElement', until, include );
        },
        // 返回最先匹配的祖先元素
        closest: function( elem, until ) {
            return closest( elem, 'parentElement', until );
        },
        parentClosest: function( elem, until ) {
            return closest( elem, 'parentElement', until );
        },

        // 获取离元素最近的含有定位信息的祖先元素
        // 隐藏元素的offsetParent为null
        offsetParent: function( elem ) {
            return elem.offsetParent || $.html;
        }
    }, function( name, fn ) {
        $.fn[ name ] = function( filter, until, include ) {
            var ret = [], bakUnitl;

            name = name.toLowerCase();

            // until|closest后缀的方法调换filter和until参数
            if ( name.indexOf('until') > -1 || name.indexOf('closest') > -1 ) {
                bakUnitl = until;
                until = filter;
                filter = bakUnitl;
            }

            this.each(function( el ) {
                var elems;
                if ( el && ( el.nodeType === 1 || el.nodeType === 11 ) ) {
                    elems = fn( el, until, include );

                    if ( elems ) {
                        if ( elems.nodeType === 1 ) {
                            ret.push( elems );
                        } else {
                            $.merge( ret, elems );
                        }
                    }

                }
            });

            // 去重效率低
            ret = $.unique( ret );

            if ( typeof filter === 'string' ) {
                ret = ret.filter(function( el ) {
                    // 使用try...catch...语句，避免传入非法参数导致报错，报错的都不会匹配
                    try {
                        return $.matches( el, filter );
                    } catch ( err ) {
                        return false;
                    }
                });
            }

            return this.pushStack( ret );
        };
    });

    // 查找后代元素
    $.fn.find = function( selector ) {
        var ret = [];

        if ( selector ) {
            this.each(function( el ) {
                var elems;
                if ( el && ( el.nodeType === 1 || el.nodeType === 11 ) ) {
                    elems = $( selector, el );

                    if ( elems ) {
                        if ( elems.nodeType === 1 ) {
                            ret.push( elems );
                        } else {
                            $.merge( ret, elems );
                        }
                    }

                }
            });
        }

        // 去重效率低
        ret = $.unique( ret );

        return this.pushStack( ret );
    };


    /******
     * 插入
     */
    $.insertHooks = {
        before: function( el, node ) {
            el.parentNode.insertBefore( node, el );
        },
        prepend: function( el, node ) {
            el.insertBefore( node, el.firstChild );
        },
        append: function( el, node ) {
            el.appendChild( node );
        },
        after: function( el, node ) {
            el.parentNode.insertBefore( node, el.nextSibling );
        },
        replaceWith: function( el, node ) {
            el.parentNode.replaceChild( node, el );
            cleanData( el );
        },
        beforeHTML: function( el, html ) {
            el.insertAdjacentHTML( 'beforeBegin', html );
        },
        prependHTML: function( el, html ) {
            el.insertAdjacentHTML( 'afterBegin', html );
        },
        appendHTML: function( el, html ) {
            el.insertAdjacentHTML( 'beforeEnd', html );
        },
        afterHTML: function( el, html ) {
            el.insertAdjacentHTML( 'afterEnd', html );
        },
        replaceWithHTML: function( el, html ) {
            el.insertAdjacentHTML( 'afterEnd', html );
            cleanData( el );
            el.parentNode.removeChild( el );
        }
    };

    // before()、prepend()、append()、after()、replaceWith()
    ['before', 'prepend', 'append', 'after', 'replaceWith'].forEach(function( name ) {
        $.fn[ name ] = function() {
            return domManipulate( this, name, arguments );
        };
    });

    // dom的巧妙处理
    function domManipulate( nodes, name, args ) {
        // 我们只允许向元素节点内部插入东西，因此需要转换为纯正的元素节点集合
        var handler = $.insertHooks[ name ],
            domManip = function( arg ) {
                if ( arg == null ) {
                    return;
                }

                // 如果是元素节点、文本节点或文档碎片
                if ( arg.nodeType ) {
                    nodes.each(function( el, i ) {
                        // 第一个不需要克隆
                        handler( el, i ? arg.cloneNode( true ) : arg );
                    });

                // 如果传入节点列表、$对象，将转换为文档碎片
                } else if ( $.isArrayLike( arg ) ) {
                    var fragment = document.createDocumentFragment();

                    // 必须转换为数组，当arg是“动态集合”时，下面的push操作会把节点从当前集合删掉，导致找不到节点的问题。
                    arg = core_slice.call( arg );

                    nodes.each(function( el, i ) {
                        fragment = fragment.cloneNode( false );

                        $.each(arg, function( node ) {
                            fragment.appendChild( i ? node.cloneNode( true ) : node );
                        });

                        handler( el, fragment );
                    });

                // 传入字符串、其他
                } else {
                    nodes.each(function( el ) {
                        $.insertHooks[ name + 'HTML']( el, arg );
                    });
                }
            };

        nodes = nodes.filter(function( item ) {
            return !!item.nodeType;
        });


        // 插入方法类似于push函数，可以传入多个值
        $.each(args, function( arg ) {
            // 函数
            if ( typeof arg === 'function' ) {
                nodes.each(function( el, i ) {
                    domManip( arg.call( el, el.innerHTML, i ) );
                });

            // 其他
            } else {
                domManip( arg );
            }
        });

        return nodes;
    }

     // 插入的反转方法
     // insertBefore()、prependTo()、appendTo()、insertAfter()、replaceAll()
    $.each({
        before: 'insertBefore',
        prepend: 'prependTo',
        append: 'appendTo',
        after: 'insertAfter',
        replaceWith: 'replaceAll'
    }, function( original, name ) {
        $.fn[ name ] = function( selector ) {
            $( selector )[ original ]( this );
            return this;
        };
    });


    $.fn.extend({
        // 把匹配的所有元素都放到html的最深层元素下，html元素会放到匹配到的第一个元素的位置
        wrapAll: function( html ) {
            if ( typeof html === 'function' ) {
                return this.each(function( el, i ) {
                    $( el ).wrapAll( html.call( el, el, i ) );
                });
            }
            if ( this[0] ) {
                var wrap = $( html, this[0].ownerDocument ).eq(0).clone(true);
                if ( this[0].parentNode ) {
                    wrap.insertBefore( this[0] );
                }
                // 返回最底层的元素，并把this下的元素插入到此元素
                wrap.map(function( el ) {
                    while ( el.firstChild && el.firstChild.nodeType === 1 ) {
                        el = el.firstChild;
                    }
                    return el;
                }).append( this );
            }
            return this;
        },
        // 通过HTML把每个匹配到的元素单独包裹起来
        // wrap基于wrapAll方法
        wrap: function( html ) {
            return this.each(function( el, i ) {
                $( el ).wrapAll( typeof html === 'function' ? html.call( el, el, i ) : html );
            });
        },
        // 通过HTML把匹配到的每个元素的内容单独包裹起来
        wrapInner: function( html ) {
            return this.each(function() {
                $( this ).contents().wrapAll( typeof html === 'function' ? html.call( el, el, i ) : html );
            });
        },
        unwrap: function() {
            return this.parent().each(function() {
                $( this ).replaceWith( this.childNodes );
            }).end();
        },
        // 获得匹配的第一个元素的所有子节点
        contents: function() {
            return this.pushStack( this[0] && this[0].childNodes || [] );
        },
        is: function( selector ) {
            if ( !selector ) {
                return false;
            }
            for ( var i = 0; i < this.length; i++ ) {
                if ( typeof selector === 'string' ) {
                    if ( $.matches( this[i], selector ) ) {
                        return true;
                    }
                } else {
                    if ( $( selector ).index( this[i] ) !== -1 ) {
                        return true;
                    }
                }
            }
            return false;
        },
        clone: function( deep ) {
            var cloneNodes = [];
            this.each(function() {
                if ( this.cloneNode && this.nodeType !== 9 ) {
                    cloneNodes.push( this.cloneNode( deep ) );
                }            
            });
            return $( cloneNodes );
        },

        // 清空匹配的元素集合中所有的子节点
        empty: function() {
            return this.each(function( el ) {
                cleanData( el.querySelectorAll('*') );
                el.innerHTML = '';
            });
        },

        //删除匹配到的元素，不保留数据
        remove: function( keepData ) {
            return this.each(function( el ) {
                if ( el.parentNode ) {
                    if ( !keepData ) {
                        cleanData( el.querySelectorAll('*') );
                        cleanData( el );
                    }
                    el.parentNode.removeChild( el );
                }
            });
        },

        //删除匹配到的元素，保留数据
        detach: function() {
            return this.remove( true );
        },

        // 判断匹配元素列表的第一个节点是否包含指定节点
        compare: function( node, code ) {
            node = $( node );

            return this[0] && this[0].nodeType && node[0] && node[0].nodeType ?
                code === 0 ?
                    this[0] === node[0] :
                    ( this[0].compareDocumentPosition( node[0] ) & code ) === code :
                false;
        }
    });


    // html()、text()
    $.each({html: 'innerHTML', text: 'textContent'}, function( key, prop ) {
        $.fn[ key ] = function( val ) {
            return $.access(this, function( elem, val ) {
                return val == null ? elem[ prop ] : elem[ prop ] = val;
            }, null, val);
        };
    });

    // ============================ Fx类 ============================
    function Fx$1( elem, opts, key ) {
        this.elem = elem;
        this.opts = opts;
        this.key = key;
        this.duration = this.opts.duration;
    }
    $.extend(Fx$1.prototype, {
        custom: function( step ) {
            this.from = step.from;
            this.to = step.to;
            this.unit = step.unit;
            this.total = this.to - this.from;
            this.start = Date.now();

            var self = this;
            function f( gotoEnd ) {
                return self.frame( gotoEnd );
            }
            f.elem = this.elem;

            Fx$1.timeline.push( f );
            Fx$1.running();
        },
        step: function() {
            this.opts.step.call( this.elem, this );
        },
        frame: function( gotoEnd ) {
            var progress, done, i,
                time = Date.now() - this.start;

            if ( gotoEnd || time >= this.duration ) {
                this.elem.style[ this.key ] = this.to + this.unit;
                this.step();

                done = true;
                this.opts.curAnim[ this.key ] = true;

                for ( i in this.opts.curAnim  ) {
                    if ( this.opts.curAnim[i] === false ) {
                        done = false;
                    }
                }

                if ( done ) {
                    this.opts.complete.call( this.elem );
                    this.opts.next();
                }
                return true;
            }

            progress = this.opts.easing( time / this.duration );

            this.elem.style[ this.key ] = progress * this.total + this.from + this.unit;

            $.css( this.elem, this.key, progress * this.total + this.from + this.unit );
        }
    });
    $.extend(Fx$1, {
        // 中央队列/时间轴
        timeline: [],

        timer: null,

        fps: 50,

        interval: 1000 / Fx$1.fps,

        running: function() {
            if ( !Fx$1.timer ) {
                Fx$1.timer = setInterval(function() {
                    var timers = Fx$1.timeline;
                    for ( var i = 0; i < timers.length; i++ ) {
                        if ( timers[i]() ) {
                            timers.splice( i--, 1 );
                        }
                        if ( timers.length === 0 ) {
                            clearInterval( Fx$1.timer );
                            Fx$1.timer = null;
                        }
                    }
                }, Fx$1.interval);
            }
        }
    });

    //CSSStyleRule的模板
    var classRuleTpl = '.#{className}{' +
            $.getCssProp('animation') +
                ': #{frameName} #{duration}ms cubic-bezier(#{easing}) #{count} #{direction}; ' +
            $.getCssProp('animation-fill-mode') + ': #{fillMode};' +
        '}';
    //CSSKeyframesRule的模板
    var frameRuleTpl = '@' + ( $.getCssProp('animation') || '' ).match(/^(?:-[^-]+-|)/) + 
            'keyframes #{frameName} {' +
                '0%{ #{from} }' +
                '100%{ #{to} }' +
            '}';

    // === pause resume ===
    $.fn.extend({
        // 暂停当前动画 - 仅在animation动画有效
        pause: function() {
            return this.each(function() {
                setStyle( this, 'animation-play-state', 'paused' );
            });
        },

        // 继续当前动画 - 仅在animation动画有效
        resume: function() {
            return this.each(function() {
                setStyle( this, 'animation-play-state', 'running' );
            });
        }
    });

    /**
     * +----------+
     * | 更新日志 |
     * +----------+
     * 
     * 2019-5-20
     * ===============
     * animationend事件会冒泡，当子元素触发此事件时，
     * 如未阻止，则祖先元素也会触发。
     * 因此需要判断事件目标和事件处理函数中的元素是否为同一个。
     */

    /*
    |-------------------------------------------------------------------------------
    | 动画模块
    |-------------------------------------------------------------------------------
    |
    */

    $.fx = {
        // 是否使用css动画引擎
        css: true,

        // 缓动公式
        easing: {
            js: {
                linear: function( k ) {
                    return k;
                },
                swing: function( k ) {
                    return 0.5 - Math.cos( k * Math.PI ) / 2;
                },
                ease: function( k ) {
                    return 0.5 - Math.cos( k * Math.PI ) / 2;
                },
                easeIn: function( k ) {
                    return 1 - Math.cos(k * Math.PI / 2);
                },
                easeOut: function( k ) {
                    return Math.sin(k * Math.PI / 2);
                },
                easeInOut: function( k ) {
                    return 0.5 - Math.cos( k * Math.PI ) / 2;
                }
            },
            css: {
                linear: [0.250, 0.250, 0.750, 0.750],
                swing: [0.250, 0.100, 0.250, 1.000],
                ease: [0.250, 0.100, 0.250, 1.000],
                easeIn: [0.420, 0.000, 1.000, 1.000],
                easeOut: [0.000, 0.000, 0.580, 1.000],
                easeInOut: [0.420, 0.000, 0.580, 1.000]
            }
        },
    };

    // $.fx.animation：是否支持animation动画，只读属性
    Object.defineProperty( $.fx, 'animation', {
        value: !!( window.AnimationEvent || window.WebKitAnimationEvent ),
        writable: false
    });

    // $.fx.engine：框架当前使用的引擎，只读属性
    Object.defineProperty( $.fx, 'engine', {
        get: function() {
            return $.fx.animation && $.fx.css ? 'css' : 'js';
        },
        set: function() {}
    });

    // === $.fn.animate方法的参数规则 ===
    var animateArgRules = [
        function( p ) { return typeof p === 'number' || ( p === 'slow' || p === 'normal' || p === 'fast' ); },
        function( p ) { return typeof p === 'string'; },
        function( p ) { return typeof p === 'function'; },
        function( p ) { return typeof p === 'function'; },
        function( p ) { return typeof p === 'boolean' || typeof p === 'string'; }
    ];

    var animateArgReworkRules = [
        function( p ) { return ( {slow: 600, normal: 400, fast: 200}[p] || (p != null ? p : 400) ); },
        function( p ) {
            var easing = $.fx.easing[ $.fx.engine === 'css' ? 'css': 'js' ];
            return easing[ p ] || easing.ease;
        },
        function( p ) { return p || function() {}; },
        function( p ) { return p || function() {}; },
        function( p ) { return p == null || p === true ? 'fx' : p; }
    ];

    var animateArgNames = ['duration', 'easing', 'complete', 'step', 'queue'];

    // 分解样式
    function decompose( hidden, node, props ) {
        var processed = [], srcValues = $._data( node, 'bat.fx.srcCss' );

        // 分解原始材料，进行加工，保存到from和to里
        $.each(props, function( key, val ) {
            var from, to, unit,
                srcValue, illegal, valInfo;

            // 内置动画
            if ( val === 'show' || val === 'hide' || val === 'toggle' ) {
                srcValue = parseFloat( srcValues[ key ] );
                unit = $.cssNumber[key] ? '' : 'px';

                if ( val === 'toggle' ) {
                    val = hidden ? 'show' : 'hide';
                }
                from = val === 'show' ? 0 : srcValue;
                to = val === 'show' ? srcValue : 0;

            // 数值类型
            } else if ( ( valInfo = getOperationalInfo( node, key, val ) ) ) {
                from = valInfo.srcVal;
                to = valInfo.newVal;
                unit = valInfo.unit;

            // 其他
            } else {
                illegal = true;
                processed.push({
                    key: key,
                    to: val,
                    unit: ''
                });
            }

            if ( !illegal ) {
                processed.push({
                    key: key,
                    from: from,
                    to: to,
                    unit: unit
                });
            }
        });

        return processed;
    }

    function beforeAnimation( node, props, optall, startAnimation ) {
        var hidden, effect, preprocess, processed;

        // 元素不在文档上跳过当前动画
        if ( !$.html.contains( node ) ) {
            return optall.next();
        }

        // effect: show/hide/toggle/others
        for ( effect in props ) {
            effect = props[ effect ];
            break;
        }

        // 这里可能要做某些处理, 比如隐藏元素要进行动画, display值不能为none
        hidden = $.css(node, 'display') === 'none';
        preprocess = AnimationPreprocess[ effect ];

        // 当前状态和未来状态一样，跳过当前，开始下一个动画
        if ( preprocess && preprocess( hidden, node, props, optall ) === false ) {
            return optall.next();
        }

        // 获取处理后的样式
        processed = decompose( hidden, node, props );

        // 调用finish方法，或者duration为0时，立即跳到最后状态（同步操作）
        if ( optall.finish || optall.duration === 0 ) {
            processed.forEach(function( step ) {
                node.style[ step.key ] = step.to + step.unit;
                optall.step();
            });
            return optall.complete.call( node );
        }

        if ( processed.length === 0 ) {
            return optall.next();
        }

        startAnimation( node, optall, processed );
    }

    // === 动画预处理 ===
    var AnimationPreprocess = {
        show: function( hidden, node, props, optall ) {
            var display, style = node.style, overflows, old,
                srcStyle = {}, srcCss = {};

            // 已显示元素执行显示动画，直接执行回调
            if ( !hidden ) {
                optall.complete.call( node );
                return false;
            }

            // 保存内置动画的样式值
            // 把所有属性值设为0
            for ( var prop in props ) {
                srcStyle[ prop ] = style[ prop ];
                srcCss[ prop ] = $.css( node, prop );
                $.css( node, prop, 0 );
            }
            $._data( node, 'bat.fx.srcCss', srcCss );

            // 涉及到宽高的还需要保存并设置溢出隐藏。
            if ( 'width' in props || 'height' in props ) {
                overflows = [style.overflow, style.overflowX, style.overflowY];
                style.overflow = 'hidden';
            }

            // 获取display值
            display = $._data( node, 'bat.fx.display' );
            if ( !display ) {
                display = $.getDisplay( node.nodeName );
            }

            // 获取行内元素的溢出隐藏的display值
            if ( overflows && display === 'inline' && $.css( node, 'float' ) === 'none' ) {
                display = 'inline-block';
            }

            // 显示元素
            style.display = display;
            $._removeData( node, 'bat.fx.display' );

            old = optall.complete;
            // 动画结束，恢复溢出隐藏和行内样式
            optall.complete = function() {
                if ( overflows ) {
                    ['', 'X', 'Y'].forEach(function( postfix, index ) {
                        style['overflow' + postfix] = overflows[index];
                    });
                }

                // 恢复行内样式
                for ( var prop in srcStyle ) {
                    style[ prop ] = srcStyle[ prop ];
                }

                old.call( node );
            };
        },
        hide: function( hidden, node, props, optall ) {
            var display, style = node.style, overflows, old,
                srcStyle = {}, srcCss = {};

            // 已隐藏元素执行隐藏动画，直接执行回调
            if ( hidden ) {
                optall.complete.call( node );
                return false;
            }

            // 保存display值
            display = $.css( node, 'display' );
            $._data( node, 'bat.fx.display', display );

            // 保存内置动画的样式值
            for ( var prop in props ) {
                srcStyle[ prop ] = style[ prop ];
                srcCss[ prop ] = $.css( node, prop );
            }
            $._data( node, 'bat.fx.srcCss', srcCss );

            // 涉及到宽高的还需要保存并设置溢出隐藏。
            // 如果是缩放操作
            // 确保内容不会溢出,记录原来的overflow属性，
            // 因为IE在改变overflowX与overflowY时，overflow不会发生改变
            if ( 'width' in props || 'height' in props ) {
                overflows = [style.overflow, style.overflowX, style.overflowY];
                style.overflow = 'hidden';
            }

            // 处理行内元素的溢出隐藏
            if ( overflows && display === 'inline' && $.css( node, 'float' ) === 'none' ) {
                display = 'inline-block';
            }

            // 动画结束，设置display为none，把属性值恢复为原始值，如果有设置溢出隐藏，要恢复原样。
            old = optall.complete;
            optall.complete = function() {
                // 隐藏元素
                node.style.display = 'none';

                // 恢复行内样式
                for ( var prop in srcStyle ) {
                    style[ prop ] = srcStyle[ prop ];
                }

                // 恢复溢出隐藏
                if ( overflows ) {
                    ['', 'X', 'Y'].forEach(function( postfix, index ) {
                        style['overflow' + postfix] = overflows[index];
                    });
                }

                // 执行回调
                old.call( node );
            };
        },
        toggle: function( hidden ) {
            return AnimationPreprocess[hidden ? 'show' : 'hide'].apply( null, arguments );
        }
    };

    /**@doc
     * $.fn.fx|$.fn.animate
     */
    $.fn.fx = $.fn.animate = function( props, optall ) {
        var name, p, startAnimation, doAnimation;

        // 参数调整
        optall = $.isPlainObject( optall ) ?
            $.adjustArgs( 1, optall, animateArgNames, animateArgReworkRules ) :
            $.adjustArgs( animateArgRules, core_slice.call( arguments, 1 ), animateArgNames, animateArgReworkRules );


        optall.id = $.uniqid();  // 此对象引用的所有元素都共用同一类名，类名是通过此id加工而来

        // 给属性加上私有前缀
        for ( name in props ) {
            p = $.getCssProp(name) || name;
            if ( name !== p ) {
                props[p] = props[name];
                delete props[name];
            }
        }

        // 当前动画引擎是预置类型，而不是运行时类型
        startAnimation = $.fx.engine === 'js' ? startAnimationJs : startAnimationCss;

        // 使用函数表达式，避免某些打包压缩工具提示有关this的警告信息
        doAnimation = function( next, finish ) {
            var opts = $.extend( {}, optall, {
                next: typeof next === 'function' ? next : $.noop,
                finish: finish === true,
                // 添加唯一id，用于唯一标识回调函数
                uid: $.uniqid()
            });

            beforeAnimation( this, $.extend( {}, props ), opts, startAnimation );
        };

        // 同步（立即执行）或异步（入列）
        return optall.queue === false ?
            this.each( doAnimation ) :
            this.queue( optall.queue, doAnimation );
    };

    // === 各种合成动画 ===
    var fxAttrs = [
        ['height', 'marginTop', 'marginBottom', 'borderTopWidth', 'borderBottomWidth', 'paddingTop', 'paddingBottom'],
        ['width', 'marginLeft', 'marginRight', 'borderLeftWidth', 'borderRightWidth', 'paddingLeft', 'paddingRight'],
        ['opacity']
    ];

    function genFx( type, start, end ) {  // 生成属性包
        var attrs = fxAttrs.concat.apply([], fxAttrs.slice(start, end)),
            obj = {}, i = 0, name;

        for ( ; (name = attrs[i++]); ) {
            obj[name] = type;
        }
        return obj;
    }

    $.each({
        show:           genFx('show', 0),
        hide:           genFx('hide', 0),
        toggle:         genFx('toggle', 0),
        slideDown:      genFx('show', 0, 1),
        slideUp:        genFx('hide', 0, 1),
        slideToggle:    genFx('toggle', 0, 1),
        slideLeft:      genFx('hide', 1, 2),
        slideRight:     genFx('show', 1, 2),
        slideToggleX:   genFx('toggle', 1, 2),
        fadeIn:         genFx('show', 2),
        fadeOut:        genFx('hide', 2),
        fadeToggle:     genFx('toggle', 2)
    }, function( name, obj ) {
        $.fn[name] = function() {
            var args = [].concat.apply([ obj ], arguments);
            return this.fx.apply( this, args );
        };
    });

    $.fn.extend({
        fadeTo: function( to ) {
            return this.fx.apply( this, [{opacity: to}].concat( core_slice.call( arguments, 1 ) ) );
        },
        delay: function( time, queue ) {
            return this.queue( queue || 'fx', function( next ) {
                setTimeout(function() {
                    next();
                }, time);
            });
        },

        /**
         * @param  {string} queue       指定要操作的队列，默认fx
         * @param  {boolean} clearQueue 清空队列
         * @param  {boolean} gotoEnd    立刻结束把动画跳转到最后一帧
         */
        stop: function( name, clearQueue, gotoEnd ) {
            if ( typeof name !== 'string' ) {
                // 当调用stop方法时，gotoEnd为true或false
                // 当元素自动运动完，gotoEnd为undefined
                gotoEnd = clearQueue || false;
                clearQueue = name;
                name = void 0;
            }

            // 清空队列
            if ( clearQueue ) {
                this.clearQueue( name );
            }

            this.each(function( node ) {
                var timers, i, type;

                type = $._data( node, 'bat.fx.type' );

                if ( type === 'js' ) {
                    timers = Fx.timeline;

                    // 查找完成当前元素的动画
                    for ( i = timers.length; i--; ) {
                        if ( node === timers[i].elem ) {
                            if ( gotoEnd ) {
                                timers[i]( true );
                            }
                            timers.splice( i, 1 );
                        }
                    }
                } else if ( type === 'css' || type === 'motion' ) {
                    $.event.trigger( node, 'animationend.bat.fx', [ gotoEnd, true ] );
                }
            });

            if ( !gotoEnd ) {
                this.dequeue( name );
            }

            return this;
        },
        finish: function( name ) {
            name = name || 'fx';

            return this.each(function( node ) {
                var timers, i, queue, length, type;

                type = $._data( node, 'bat.fx.type' );

                // 获取队列
                queue = $.queue( node, name );
                length = queue ? queue.length : 0;

                // 清空队列
                $.queue( node, name, [] );

                if ( type === 'js' ) {
                    timers = Fx.timeline;

                    // 查找并完成当前元素的动画
                    for ( i = timers.length; i--; ) {
                        if ( node === timers[i].elem ) {
                            timers[i]( true );
                            timers.splice( i, 1 );
                        }
                    }
                } else if ( type === 'css' || type === 'motion' ) {
                    $.event.trigger( node, 'animationend.bat.fx', [ true, true ] );
                }


                // 完成队列里的动画
                for ( i = 0; i < length; i++ ) {
                    if ( typeof queue[i] === 'function' ) {
                        queue[i].call( node, null, true );
                    }
                }
            });
        }
    });

    (function() {
        ['In', 'Out', ''].forEach(function( type ) {
            $.fn['motion' + type] = function( className, complete ) {
                var optall;

                if ( typeof className !== 'string' || className === '' ) {
                    return this;
                }
                if ( typeof complete !== 'function' ) {
                    complete = $.noop;
                }

                optall = {
                    uid: $.uniqid(),
                    complete: complete,
                    className: className
                };

                return this.queue(function( next, finish ) {
                    var opts = $.extend( {}, optall, {
                        finish: finish === true,
                        next: next,
                        type: type
                    });
                    startAnimation( this, opts );
                });
            };
        });

        function startAnimation( node, optall ) {
            var hidden, preprocess, $node = $( node );

            // 确保元素存在文档中
            if ( !$.html.contains( node ) ) {
                return optall.next();
            }

            hidden = $.css( node, 'display' ) === 'none';

            preprocess = AnimationPreprocess[ optall.type ];
            if ( preprocess && preprocess( hidden, node, optall ) === false ) {
                return optall.next();
            }

            // 调用finish或者当前浏览器不支持animation动画时，立即执行complete函数
            if ( optall.finish || !$.fx.animation ) {
                optall.complete.call( node );
                return;
            }

            $._data( node, 'bat.fx.type', 'motion' );

            $node.on('animationend.bat.fx', function fn( ev, gotoEnd, isTrigger ) {
                // 确保事件目标和事件处理程序的元素为同一个
                if ( ev.currentTarget !== ev.target ) {
                    return;
                }
                ev.stopPropagation();

                $node.off( 'animationend.bat.fx', fn );

                $._removeData( node, 'bat.fx.type' );

                $node.removeClass( optall.className );

                // 只有动画完成，或强制动画完成才执行完成回调
                if ( gotoEnd !== false ) {
                    optall.complete.call( node );
                }

                // 继续出列
                optall.next();
            });

            $node.addClass( optall.className );
        }
        
        // motionIn操作会先把隐藏的元素显示出来，再进行动画（元素隐藏与否，最终都会进行动画）
        // motion则只会在显示状态才进行动画效果，在隐藏状态会立即执行回调函数。
        // motionOut类似于motion，但在运动完会隐藏元素
        var AnimationPreprocess = {
            In: function( hidden, node, optall ) {
                var display;

                if ( hidden ) {
                    // 获取display值
                    display = $._data( node, 'bat.fx.display' );
                    if ( !display ) {
                        display = $.getDisplay( node.nodeName );
                    }

                    // 显示元素
                    $.css( node, 'display', display );
                    $._removeData( node, 'bat.fx.display' );
                }
            },
            Out: function( hidden, node, optall ) {
                var old, display;
                
                if ( hidden ) {
                    optall.complete.call( node );
                    return false;
                }

                // 保存display值
                display = $.css( node, 'display' );
                $._data( node, 'bat.fx.display', display );

                old = optall.complete;
                optall.complete = function() {
                    // 隐藏元素
                    $.css( node, 'display', 'none' );
                    old.call( node );
                };
            },
            '': function( hidden, node, optall ) {
                if ( hidden ) {
                    optall.complete.call( node );
                    return false;
                }
            }
        };
    })();

    return $;

})));
