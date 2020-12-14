import $ from './core';

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

function setStyle( elem, prop, val ) {
    elem.style[ $.getCssProp( prop ) ] = val;
}

function isBorderBox( elem ) {
    return getStyle( elem, 'box-sizing' ) === 'border-box';
}

function isHidden( elem ) {
    if ( !elem.ownerDocument.contains( elem ) ) {
        return true;
    }

    do {
        if ( getStyle( elem, 'display' ) === 'none' ) {
            return true;
        }
    } while ( ( elem = elem.parentNode ) && elem.nodeType === 1 );

    return false;
}

$.cssHooks = {
    _default: {
        set: function( elem, prop, val ) {
            setStyle( elem, prop, val );
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
function getOperationalInfo( elem, prop, val ) {
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
        if ( !elem || !key ) return;

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
            if ( ( valInfo = getOperationalInfo( elem, key, val ) ) ) {
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
    var seal = rebirthOfDirtySoil( elem, seal );

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
    var parts, oper, newVal, unit, target, srcVal,
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