import $ from './core';

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
