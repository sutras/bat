import $ from './core';

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