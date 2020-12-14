import $ from './core';

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
        path, i, j, node, cancelBubble, immediate, curr,
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
        var type, args, origFn, origArgs = arguments;

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