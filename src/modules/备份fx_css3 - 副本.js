// ===========================================================
// 基于CSS animation的动画引擎
// ===========================================================
// 原理：通过【添加类名】与插入【样式规则】的方式来实现CSS动画引擎。
// ===========================================================
// 具体：
// 通过link或style标签元素的【sheet】属性访问其【样式表对象CSSStyleSheet】，
// document的【styleSheets】属性亦会返回文档上所有的【样式表列表对象StyleSheetList】。
// 
// 而样式表对象下的【cssRules】属性对应着【样式规则列表对象CSSRuleList】，里面包含了所有的【样式规则对象】。
// 
// 而样式规则对象至少有五种类型：
// 1. CSSStyleRule：CSS样式规则
//      这是最早的类型，通过此对象的【selectorText】取得此样式规则的选择器；
//      通过【cssText】属性获取此css规则的css文本。
// 2. CSSKeyframesRule：CSS关键帧规则
//      可以通过里面的【name、cssText、keyText】属性进行一些操作。
// 3. CSSFontFaceRule：CSS字体规则
//      用于加载自定义字体
// 4. CSSMediaRule：CSS媒体查询规则
//      著名的响应式布局需要用到
// 5. CSSSupportsRule
// 6. CSSPageRule
// 
// ============================================================
// 样式表对象CSSStyleSheet原型方法：
// CSSStyleSheet.deleteRule( index )
//      从当前样式表对象中删除样式规则，IE9+
// CSSStyleSheet.insertRule( rule [, index] )
//      将新的样式规则插入到当前样式表，IE9+
// CSSStyleSheet.removeRule()
//      从当前样式表对象中删除样式规则，w3school说特定于IE，当chrome也有此方法（但是不能用）
// CSSStyleSheet.addRule()
//      将新的样式规则插入到当前样式表，w3school说特定于IE，当chrome也有此方法（但是不能用）
// 
// ============================================================
// 使用CSS实现动画引擎，有几个好处：
// 1. 它自带了【缓动参数】给你用。
// 2. 不需要你计算【原始值】，它自行内部计算。
// 3. 【颜色值】不用你转换为RGB数组。
// 4. 轻松完成【倒带动画】，通过设置animation-iteration-count: 2, 
//      animation-direction: alternate。
// 5. 像【hide特效】需要我们在动画结束时，将样式还原为初始值，
//      在css3则只需animation-fill-mode设置为backwards。（虽说如此，但最终还是照搬了jQuery那一套）
// 6. 至于【暂停与继续】，其实就是控制animation-play-state。
// 
// ============================================================
// 动画队列的说明：
// 动画分两种方式，同步和异步。同步则立刻进行动画，异步则将动画入列。下面详细讲解动画的队列。
// 动画队列的控制是通过底层的$.queue和$.dequeue来控制的。
// 
// 1. 通过调用$.fn.animate方法或者其他合成动画（底层仍然调用animate），让动画入列。
// 2. 每次入列都会判断动画队列是否有“守护者”，没有则调用$.dequeue方法让动画出列，进而执行动画；
//      如果有“守护者”则不操作。每一次出列都会重新放入“守护者”，避免执行动画过程中有入列操作而出列。
// 3. 出列操作会调用出列的函数，并把下一次出列操作放入一个匿名函数并传递给出列的函数。
//      如果动画结束，或者其他情况需要执行下一个函数，可以通过执行这个匿名函数。
// 4. 每次调用$.dequeue都会判断还有没有函数的排队，没有则删除队列。


(function() {
    function toCssText( obj ) {
        var s = '';
        for ( var i in obj ) {
            s += i + ':' + obj[i] + ';';
        }
        return s;
    }

    //CSSStyleRule的模板
    var classRuleTpl = '.#{className}{' +
            $.getCssProp('animation') +
                ': #{frameName} #{duration} #{easing} #{count} #{direction}; ' +
            $.getCssProp('animation-fill-mode') + ': #{fillMode};' +
        '}';
    //CSSKeyframesRule的模板
    var frameRuleTpl = '@' + $.getCssProp('animation').match(/^(?:-[^-]+-|)/) + 
            'keyframes #{frameName} {' +
                '0%{ #{from} }' +
                '100%{ #{to} }' +
            '}';

    // 缓动公式（look，比jquery.easing.1.3.js的一百三十多行少很多吧）
    $.easing = {
        linear: [0.250, 0.250, 0.750, 0.750],
        swing: [0.250, 0.100, 0.250, 1.000],
        ease: [0.250, 0.100, 0.250, 1.000],
        easeIn: [0.420, 0.000, 1.000, 1.000],
        easeOut: [0.000, 0.000, 0.580, 1.000],
        easeInOut: [0.420, 0.000, 0.580, 1.000],
        easeInQuad: [0.550, 0.085, 0.680, 0.530],
        easeInCubic: [0.550, 0.055, 0.675, 0.190],
        easeInQuart: [0.895, 0.030, 0.685, 0.220],
        easeInQuint: [0.755, 0.050, 0.855, 0.060],
        easeInSine: [0.470, 0.000, 0.745, 0.715],
        easeInExpo: [0.950, 0.050, 0.795, 0.035],
        easeInCirc: [0.600, 0.040, 0.980, 0.335],
        easeInBack: [0.600, -0.280, 0.735, 0.045],
        easeOutQuad: [0.250, 0.460, 0.450, 0.940],
        easeOutCubic: [0.215, 0.610, 0.355, 1.000],
        easeOutQuart: [0.165, 0.840, 0.440, 1.000],
        easeOutQuint: [0.230, 1.000, 0.320, 1.000],
        easeOutSine: [0.390, 0.575, 0.565, 1.000],
        easeOutExpo: [0.190, 1.000, 0.220, 1.000],
        easeOutCirc: [0.075, 0.820, 0.165, 1.000],
        easeOutBack: [0.175, 0.885, 0.320, 1.275],
        easeInOutQuad: [0.455, 0.030, 0.515, 0.955],
        easeInOutCubic: [0.645, 0.045, 0.355, 1.000],
        easeInOutQuart: [0.770, 0.000, 0.175, 1.000],
        easeInOutQuint: [0.860, 0.000, 0.070, 1.000],
        easeInOutSine: [0.445, 0.050, 0.550, 0.950],
        easeInOutExpo: [1.000, 0.000, 0.000, 1.000],
        easeInOutCirc: [0.785, 0.135, 0.150, 0.860],
        easeInOutBack: [0.680, -0.550, 0.265, 1.550],
        custom: [0.000, 0.350, 0.500, 1.300],
        random: [Math.random().toFixed(3),
            Math.random().toFixed(3),
            Math.random().toFixed(3),
            Math.random().toFixed(3)]
    };


    // $.fn.animation方法的参数规则
    var argRules = [
        function( p ) { return typeof p === 'number' || /^(slow|normal|fast)$/.test(p); },
        function( p ) { return typeof p === 'string'; },
        function( p ) { return $.isFunction( p ); },
        function( p ) { return $.isFunction( p ); },
        function( p ) { return typeof p === 'boolean' || typeof p === 'string'; }
    ];

    var argReworkRules = [
        function( p ) { return ( {slow: 600, normal: 400, fast: 200}[p] || (p != null ? p : 400) ) + 'ms'; },
        function( p ) { return 'cubic-bezier(' + ( $.easing[ p ] || $.easing.ease ).join(',') + ')'; },
        function( p ) { return p || function() {}; },
        function( p ) { return p || function() {}; },
        function( p ) { return p == null || p === true ? 'fx' : p; }
    ];

    var argNames = ['duration', 'easing', 'complete', 'step', 'queue'];

    // 引擎的主函数
    $.fn.animate = $.fn.fx = function( props, optall ) {
        var name, p;

        // 参数调整
        optall = $.isPlainObject( optall ) ?
            $.adjustArgs( 1, optall, argNames, argReworkRules ) :
            $.adjustArgs( argRules, $.toArray( arguments ).slice(1), argNames, argReworkRules );

        optall.id = $.uniqid();  // 此对象引用的所有元素都共用同一类名，类名是通过此id加工而来

        // 给属性加上私有前缀
        for ( name in props ) {
            p = $.getCssProp(name) || name;
            if ( name !== p ) {
                props[p] = props[name];
                delete props[name];
            }
        }

        // 同步（立即执行）或异步（入列）
        return this[ optall.queue === false ? 'each' : 'queue' ](function( next ) {
            optall.next = $.isFunction( next ) ? next : $.noop;
            startAnimation( this, props, $.extend( {}, optall ) );
        });
    };


    // 保存着类名与数字的映射，表示有多少个元素在共用此类名，
    // 当没有元素共用此类名时，调用stopAnimation来移除css规则。
    var AnimationRegister = {};


    // 用于立即执行元素的动画。
    // 具体做法是，分解原始材料来构建和插入样式规则，
    // 绑定事件函数，给元素添加指定类名。
    function startAnimation( node, props, optall ) {
        var queueName = optall.queue || 'sync',
            className = 'class_' + queueName + '_' + optall.id,
            frameName = 'keyframe' + queueName + '_' + optall.id,
            hidden, preprocess, from = {}, to = {}, count, effect, commonData;

        // 如果元素不在文档上，跳过当前动画
        if ( !document.contains( node ) ) {
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
        if ( preprocess && preprocess( node, hidden, props, optall ) === false ) {
            return optall.next();
        }

        if ( !( commonData = AnimationRegister[ className ] ) ) {
            commonData = AnimationRegister[ className ] = {};
        }

        if ( !commonData.count ) {
            commonData.count = 0;
        }

        // 当count为零时进行分解与插入样式规则，
        // 否则共用同一个类名，没必要重复分解、插入
        if ( commonData.count === 0 ) {
            // 分解原始材料，进行加工，保存到from和to里
            $.each(props, function( key, val ) {
                var selector, start, end, unit,
                    sourceVal,  // 原始值
                    parts, oper, delta, illegal, ani, valInfo;

                if ( /^toggle|show|hide$/.test( val ) ) {
                    sourceVal = parseFloat( $._data( node, 'sourceVal' )[ key ] );
                    unit = $.cssNumber[key] ? '' : 'px';

                    if ( val === 'toggle' ) {
                        val = hidden ? 'show' : 'hide';
                    }
                    start = val === 'show' ? 0 : sourceVal;
                    end = val === 'show' ? sourceVal : 0;

                // 数值类型
                } else if ( (parts = rcssnumval.exec( val )) ) {
                    valInfo = cssVal( node, key, parts );
                    start = valInfo[0];
                    end = valInfo[1];
                    unit = valInfo[2];

                // 其他
                } else {
                    start = $.css( node, key );
                    end = val;

                    illegal = true;
                }

                selector = $.hyphenize( key );

                from[ selector ] = illegal ? start : start + unit;
                to[ selector ] = illegal ? end : end + unit;
            });

            // 填充数据，插入样式规则
            insertCSSRule( $.format(classRuleTpl, {
                className: className,
                frameName: frameName,
                duration: optall.duration,
                easing: optall.easing,
                fillMode: 'none',
                count: optall.revert ? 2 : 1,
                direction: optall.revert ? 'alternate' : 'normal'
            }) );
            insertCSSRule( $.format(frameRuleTpl, {
                frameName: frameName,
                from: toCssText( from ),
                to: toCssText( to )
            }) );

            // 共用同一类名的元素共享的数据
            commonData.to = to;
        }

        // 记录共用同一类名的元素个数
        commonData.count++;

        // 对元素的运动状态做一个记录，便于stop()方法对元素的操作（是否执行gotoEnd）
        $._data( node, 'busy', true );

        $(node).one('animationend.bat.fx', function( ev, gotoEnd ) {
            var i;

            if ( gotoEnd === false ) {
                // 保存当前样式
                for ( i in commonData.to ) {
                    node.style[i] = $.css( node, i );
                }
            } else {
                // 保存最后的样式
                // show|hide|toggle不需要
                if ( !/^toggle|show|hide$/.test( effect ) ) {
                    for ( i in commonData.to ) {
                        node.style[i] = commonData.to[i];
                    }
                }
                optall.complete.call( node );  // 执行回调
            }
            node.classList.remove( className );  // 移除类名
            stopAnimation( className, frameName );  // 尝试移除插入的样式规则
            $._removeData( node, 'busy' );  // 释放运动状态
            optall.next();  // 继续出列
        }, false);

        // 万事俱备，添加类名后元素就真正动起来了！
        node.classList.add( className );
    }


    // 尝试移除startAnimation插入的样式规则（当没有元素使用此类名）
    function stopAnimation( className, frameName ) {
        if ( --AnimationRegister[ className ].count <= 0 ) {
            delete AnimationRegister[ className ];
            deleteCSSRule('.' + className);  // 删除css规则
            deleteKeyFrames( frameName );  // 删除关键帧规则
        }
    }


    // ============================ 动画的预处理 ===========================
    // 目前预处理只针对内置的show和hide系列动画
    // 应该可以对所有动画都执行预处理，因为隐藏的元素不能进行animation动画，
    // 导致animationend事件不触发，造成一系列问题。
    // 
    // 基于js的动画则不存在这个问题。
    var AnimationPreprocess = {
        show: function( node, hidden, props, optall ) {
            if ( !hidden ) {
                return false;
            }
            var style = node.style,
                overflows,
                old = optall.complete,
                display;

            // 1. 先保存原属性值
            // 2. 把所有属性值设为0
            $._data( node, 'sourceVal', (function() {
                var o = {};
                for ( var prop in props ) {
                    o[ prop ] = $.css( node, prop );
                }
                return o;
            })() );

            // 3. 涉及到宽高的还需要保存并设置溢出隐藏。
            if ( 'width' in props || 'height' in props ) {
                overflows = [style.overflow, style.overflowX, style.overflowY];
                style.overflow = 'hidden';
            }

            // 4. 把display设为非none
            // display:none可没法进行animation动画，如果之前的hide操作有保存其display，则将其恢复
            display = $._data( node, 'display' );
            if ( !display || display === 'none' ) {
                display = $.getDisplay( node.nodeName );
            }
            // 没设置浮动的行内样式可不会溢出隐藏
            if ( display === 'inline' && $.css(node, 'float') === 'none' ) {
                display = 'inline-block';
            }
            style.display = display;
            $._removeData( node, 'display' );

            optall.complete = function() {
                // 6. 动画结束：如果有设置溢出隐藏，要恢复原样。
                if ( overflows ) {
                    ['', 'X', 'Y'].forEach(function( postfix, index ) {
                        style['overflow' + postfix] = overflows[index];
                    });
                }

                old.call( node );
            };
        },

        hide: function( node, hidden, props, optall ) {
            if ( hidden ) {
                return false;
            }
            var style = node.style,
                computedStyle = window.getComputedStyle(node, null),
                overflows,
                old = optall.complete,
                source = {}, i, display;

            // 1. 先保存原属性值
            $._data( node, 'sourceVal', (function() {
                var o = {};
                for ( var prop in props ) {
                    o[ prop ] = $.css( node, prop );
                }
                return o;
            })() );

            // 2. 保存display（在show操作时恢复为此display）
            $._data( node, 'display', computedStyle.display );

            // 3. 涉及到宽高的还需要保存并设置溢出隐藏。
            // 如果是缩放操作
            // 确保内容不会溢出,记录原来的overflow属性，
            // 因为IE在改变overflowX与overflowY时，overflow不会发生改变
            if ( 'width' in props || 'height' in props ) { 
                overflows = [style.overflow, style.overflowX, style.overflowY];
                style.overflow = 'hidden';
            }

            optall.complete = function() {
                // 5. 动画结束：设置display为none，把属性值恢复为原始值，如果有设置溢出隐藏，要恢复原样。
                node.style.display = 'none';

                if ( overflows ) {
                    ['', 'X', 'Y'].forEach(function( postfix, index ) {
                        style['overflow' + postfix] = overflows[index];
                    });
                }
                old.call( node );
            };
        },
        toggle: function( node, hidden ) {
            return AnimationPreprocess[hidden ? 'show' : 'hide'].apply( null, arguments );
        }
    };


    // ============================ 样式规则操作 ============================

    // 动画引擎产生的样式规则全部放入这个style元素里
    var styleElement;

    // 动态插入一条样式规则
    function insertCSSRule( rule ) {
        var sheet, cssRules;
        if ( !styleElement ) {
            styleElement = document.createElement('style');
            document.head.appendChild( styleElement );
        }
        sheet = styleElement.sheet;  // css样式表对象
        cssRules = sheet.cssRules;  // css规则列表对象
        sheet.insertRule(rule, cssRules.length);  // 通过压栈的方式添加样式规则
    }

    // 删除一条样式规则
    function deleteCSSRule( ruleName, keyframes ) {
        var prop = keyframes ? 'name' : 'selectorText',
            sheet, cssRules, rule, i = 0;

        if ( styleElement ) {
            sheet = styleElement.sheet;  // css样式表对象
            cssRules = sheet.cssRules;  // css规则列表对象
            for ( ; (rule = cssRules[i++]) !== void 0; ) {
                if ( rule[prop] === ruleName ) {
                    sheet.deleteRule( --i );
                    break;
                }
            }
        }
    }

    // 删除一条@keyframes样式规则
    function deleteKeyFrames( name ) {
        deleteCSSRule( name, true );
    }


    // ============================ 各种合成动画 ============================
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
        slideToggleHor: genFx('toggle', 1, 2),
        fadeIn:         genFx('show', 2),
        fadeOut:        genFx('hide', 2),
        fadeToggle:     genFx('toggle', 2)
    }, function( name, obj ) {
        $.fn[name] = function() {
            var args = [].concat.apply([ obj ], arguments);
            return this.fx.apply( this, args );
        };
    });


    // ============================ stop delay pause resume ====================
    //  如果clearQueue为true，是否清空列队
    //  如果gotoEnd 为true，是否跳到此动画最后一帧
    //  
    //  停止动画和暂停动画不一样，
    //  暂停只是暂时停止，还能进行未完成的动画，
    //  停止就不能进行未完成的动画了。
    $.fn.extend({
        fadeTo: function( to ) {
            return this.fx.apply( this, [{opacity: to}].concat( $.toArray( arguments ).slice(1) ) );
        },

        // 暂停当前动画 - 仅在animation动画有效
        pause: function() {
            return this.each(function() {
                this.style[ $.getCssProp('animation-play-state') ] = 'paused';
            });
        },

        // 继续当前动画 - 仅在animation动画有效
        resume: function() {
            return this.each(function() {
                this.style[ $.getCssProp('animation-play-state') ] = 'running';
            });
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
                gotoEnd = clearQueue || false;  // false用于区分是否是调用stop但不gotoEnd还是不调用stop自然就不gotoEnd
                clearQueue = name;
                name = void 0;
            }

            // 清空队列
            if ( clearQueue ) {
                this.clearQueue( name );
            }

            this.each(function( node ) {
                if ( $._data( node, 'busy' ) ) {
                    // 手动触发事件（必须要调用animationend事件）
                    $.event.trigger( node, 'animationend.bat.fx', gotoEnd );
                }
            });

            return this;
        }

    });

})();