/* 
* @Author: batJS
* @Date:   2019-02-20 10:15:39
* @Last Modified by:   batJS
* @Last Modified time: 2019-02-20 12:02:28
*/

/*********************
 * 第一种 jQuery tools
 */

// 1. 使用IIFE方式，避免全局变量污染
(function( $ ) {

    // 2. 编写内部类（如果插件规模很大，应当使用面向对象的写法）
    var Plugin = function() {

    };
    Plugin.prototype = {};

    // 3. 编写插件接口
    $.fn.pluginname = function( options ) {
        var args = [].slice.call( arguments, 1 );

        // 4. 遍历匹配元素的集合
        return this.each(function() {
            var ui = $._data( this, pluginname );
            if ( !ui ) {
                var opts = $.extend(true, {}, $.fn.pluginname.defaults,
                    typeof options === 'object' ? options : {} );

                ui = new Plugin( opts, this );
                $._data( this, pluginname, ui );
            }
            if ( typeof options === 'string' && typeof ui[options] == 'function' ) {
                ui[options].apply( ui, args );
            }
        });
    };

    $.fn.pluginname.defaults = {};

})( jQuery );

// 使用插件
$('.selector').pluginname('methodName');



/*****************
 * 第二种 boostrap
 */

// 1. 使用IIFE方式，避免全局变量污染
!function( $ ){
    'use strict';

    // 2. 编写内部类
    var toggle = '[data-toggle=dropdown]';
    var Dropdown = function( element ) {
        var $el = $(element).on('click.dropdown.data-api', this.toggle);
        $('html').on('click.dropdown.data-api', function() {
            $el.paren().removeClass('open');
        });
    };

    Dropdown.prototype = {
        constructor: Dropdown,
        toggle: function(e) {

        },
        keydown: function(e) {

        }
    };

    // 3. 编写插件接口
    var old = $.fn.dropdown;
    $.fn.dropdown = function( option ) {
        // 4. 遍历匹配元素的集合
        return this.each(function() {
            var $this = $(this),
                data = $this.data('dropdown');

            if ( !data ) {
                $this.data('dropdown', (data = new Dropdown(Tthis)));
            }
            if ( typeof option === 'string' ) {
                data[option].call( $this );
            }
        });
    };

    // 5. 暴露类名
    $.fn.dropdown.Constructor = Dropdown;

    // 6. 无冲突处理
    $.fn.dropdown.noConflict = function() {
        $.fn.dropdown = old;
        return this;
    };

    // 7. 事件代理，智能初始化
    $(document)
        .on('click.dropdown.data-api', clearMenus)
        .on('click.dropdown.data-api', '.dropdown form', function(e) {
            e.stopPropagation();
        })
        .on('click.dropdown-menu', function(e) {
            e.stopPropagation();
        })
        .on('click.dropdown.data-api', toggle, Dropdown.prototype.toggle)
        .on('keydown.dropdown.data-api', toggle + ', [role=menu]', Dropdown.prototype.keydown);
}( jQuery );



/******************
 * 第三种 jQuery UI
 */
$.widget('ui.button', {
    version: '@VERSION',
    defaultElement: '<button>',
    options: {

    },
    _create: function() {},
    widget: function() {
        return this.buttonElement;
    },
    _destroy: function() {},
    _setOption: function( key, value ) {},
    refresh: function() {}
});

// 使用插件

// 设置N个配置项
$('.selector').accordion({heightStyle: 'fill', {active: 2}});
// 读方法
$('.selector').accordion('option', 'active');
// 写方法
$('.selector').accordion('option', 'active', 2);
// 让插件不可用
$('.selector').accordion('option', 'disabled', true);
$('.selector').accordion('disable');
// 让插件可用
$('.selector').accordion('option', 'disabled', false);
$('.selector').accordion('enable');
// 销毁插件
$('.selector').accordion('destory');
// 获取UI最外围元素
$('.selector').accordion('widget');


/***********************
 * 第四种 jQuery easy UI
 */
(function($) {
    $.parser = {
        atuo: true,
        onComplete: function( contenxt ) {

        },
        plugins: ['draggable', 'droppable', 'resizable', 'pagination',
        'linkbutton', 'menu', 'menubutton', 'splitbutton', 'progressbar',
        'tree', 'combobox', 'combotree', 'combogrid', 'numberbox','validatebox', 'searchbox',
        'numberspinner', 'timespinner', 'calendar', 'datebox', 'datetimebox', 'slider',
        'layout', 'panel', 'dategrid', 'propertygrid', 'treegrid', 'tabs', 'accordion',
        'window', 'dialog'],
        parse: function( context ) {
            var aa = [];
            
        }
    };
});