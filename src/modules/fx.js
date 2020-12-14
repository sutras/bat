import $ from './core';

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