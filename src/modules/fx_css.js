import $ from './core';

/*
|-------------------------------------------------------------------------------
| css3动画模块
|-------------------------------------------------------------------------------
|
*/

// 
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
            ': #{frameName} #{duration}ms cubic-bezier(#{easing}) #{count} #{direction}; ' +
        $.getCssProp('animation-fill-mode') + ': #{fillMode};' +
    '}';
//CSSKeyframesRule的模板
var frameRuleTpl = '@' + ( $.getCssProp('animation') || '' ).match(/^(?:-[^-]+-|)/) + 
        'keyframes #{frameName} {' +
            '0%{ #{from} }' +
            '100%{ #{to} }' +
        '}';

// 用于立即执行元素的动画。
// 具体做法是，分解原始材料来构建和插入样式规则，
// 绑定事件函数，给元素添加指定类名。
function startAnimationCss( node, optall, processed ) {
    var $node = $( node ),
        name = '_' + optall.uid,
        observer;

    // 记录当前的运动状态
    $._data( node, 'bat.fx.type', 'css' );

    // 插入规则
    insertRules( node, name, optall, processed );

    // 避免元素在运动期间意外删除导致animation暂停而不触发animationend事件
    // IE11、Chrome26、Firefox14
    if ( typeof MutationObserver === "function" ) {
        observer = new MutationObserver(function( mutations ) {
            for ( var i = 0, mutation; ( mutation = mutations[i++] ); ) {
                // 当元素被移除出DOM，或者其display或祖先display为none时清空队列，执行回调
                if ( mutation.type === 'attributes' &&
                        ( mutation.attributeName === 'class' || mutation.attributeName === 'style' ) &&
                        isHidden( node ) ||
                        mutation.type === 'childList' &&
                        mutation.removedNodes.length > 0 &&
                        core_slice.call( mutation.removedNodes ).indexOf( node ) !== -1 ) {

                    // 清空队列
                    // 因为元素处于无法进行animation动画的状态，
                    // 队列里的动画也不会再次执行
                    $node.clearQueue( optall.queue );
                    // 手动触发animationend事件
                    // 也会执行complete函数
                    $.event.trigger( node, 'animationend.bat.fx', [ true, true ] );
                    return;
                }
            }
        });

        observer.observe( node.ownerDocument.body, {
            attributes: true,
            childList: true,
            subtree: true
        });
    }

    // 绑定回调
    // animation动画不像js动画一样可以同时执行多个动画，
    // 因为animation属性只有一个，一个元素设置多一个animation属性会进行覆盖，
    // 等待新的animation执行完并移除对应的animation属性，前一个animation才会生效。
    $node.on('animationend.bat.fx', function fn( ev, gotoEnd, isTrigger ) {
        // 并不是所有的animationend事件都能执行此函数以下代码
        if ( ev.currentTarget !== ev.target || 
            ev.animationName !== name && !isTrigger ) {
            return;
        }

        ev.stopPropagation();

        // 为什么用在回调里移除事件函数而不是通过one绑定呢？
        // 因为子元素事件会冒泡到此元素，会无意中调用一次性的回调函数
        $node.off( 'animationend.bat.fx', fn );

        // 阻止实例继续接收通知
        if ( observer ) {
            observer.disconnect();
        }

        // gotoEnd === false ?
        //  stop强制元素停止到当前状态，并保存当前样式
        //  : 元素自行运动完，或stop强制使其运动完，并保存最后的样式
        processed.forEach(function( step ) {
            node.style[ step.key ] = gotoEnd === false ? $.css( node, step.key ) : step.to + step.unit;
        });

        // 移除插入的样式规则
        stopAnimation( name );

        // 移除类名
        $node.removeClass( name );

        // 释放运动状态
        $._removeData( node, 'bat.fx.type' );

        // 自行或强制运动完
        if ( gotoEnd !== false ) {
            // 执行回调
            optall.complete.call( node );

            // 继续出列
            // 如果停止且未运动完，则由stop方法进行出列操作
            optall.next();
        }
    }, false);

    // 添加类名，进行动画
    $node.addClass( name );
}

// 插入规则
function insertRules( node, name, optall, processed ) {
    var from = {}, to = {};

    processed.forEach(function( step ) {
        var key = $.hyphenize( step.key );
        from[ key ] = step.hasOwnProperty('from') ? step.from + step.unit : $.css( node, key );
        to[ key ] = step.to + step.unit;
    });

    // 插入样式规则
    insertCSSRule( $.format(classRuleTpl, {
        className: name,
        frameName: name,
        duration: optall.duration,
        easing: optall.easing.join(','),
        fillMode: 'both',
        count: optall.revert ? 2 : 1,
        direction: optall.revert ? 'alternate' : 'normal'
    }) );

    // 插入关键帧规则
    insertCSSRule( $.format(frameRuleTpl, {
        frameName: name,
        from: toCssText( from ),
        to: toCssText( to )
    }) );
}


// 移除startAnimation插入的样式规则
function stopAnimation( name ) {
    deleteCSSRule('.' + name);  // 删除css规则
    deleteKeyFrames( name );  // 删除关键帧规则
}


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