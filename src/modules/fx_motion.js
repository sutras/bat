import $ from './core';

/*
|-------------------------------------------------------------------------------
| 入场、强调、退场动画模块
|-------------------------------------------------------------------------------
|
*/

// 基于现有animation规则的动画函数
// 主要用来实现入场、强调、退场的动画。
// 如果浏览器不支持animation动画，则直接跳到最后一步（省略动画过程），
// 因此此模块提供的函数也可用于不支持animation的浏览器，虽然不会有动画效果。
;(function() {
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