var 
    // 无冲突处理
    _bat = window.bat,

    // 通过两个构造器和一个原型实现无new 实例化
    $ = function( selector, context ) {  // 第一个构造器
        return new $.fn.init( selector, context );  // 第二个构造器
    },

    rFormat = /\\?#\{([^{}]+)\}/mg,  // 简单模板匹配模式
    rWord = /[^, ]+/g,
    rNumSrc = /[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source,
    rNum = new RegExp('^' + rNumSrc + '$'),
    rCompOper = /^[+\-*\/%]=$/,  // 复合赋值运算符
    // 匹配css带有数字的属性值，单位可选
    rCssNumVal = new RegExp('^([+\\-/*%]=|)(' + rNumSrc + ')([a-z]+|%|)$', 'i'),
    rTypeNamespace = /^([^\.!]+|)((?:\.[^\.!]+)+|)(?:!(.*))?$/,
    rQuickExpr = /^(?:#([\w-]+)|\.([\w-]+)|(\w+))$/,
    rHtml = /^(<[\w\W]+>)[^>]*$/,
    rTagName = /<([a-z][^\/\0>\x20\t\r\n\f]+)/i,
    rXhtmlTag = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([a-z][^\/\0>\x20\t\r\n\f]*)[^>]*)\/>/gi,

    core_concat = Array.prototype.concat,
    core_slice = Array.prototype.slice,
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
        return core_slice.call( this );
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
        if ( ( options = arguments[i] ) != null ) {
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
        var args = core_slice.call( arguments ).map(function( item, index ) {
            if ( $.isArrayLike( item ) && item.nodeName !== 'FORM' ) {
                return core_slice.call( item );
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
            args = core_slice.call( args );

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
            return core_slice.call( variate );
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
        var arr = core_slice.call( arguments, 1 );
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

export default $;