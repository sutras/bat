import $ from './core';

/*
|-------------------------------------------------------------------------------
| js动画模块
|-------------------------------------------------------------------------------
|
*/

/**
 * fps通俗地说,叫刷新率,在1秒内更新多少次画面。
 * 根据人眼睛的视觉停留效应,若前一幅画像留在大脑中的印象还没消失,
 * 后一幅画像就接踵而至,而且两幅画面间的差别很小,就会有“动的感觉。
 * 那么停留多少毫秒最合适呢?我们不但要照顾人的眼睛,还要顾及一下显示器的显示速度与浏览器的渲染速度。
 * 根据外国的统计, 25毫秒为最佳数值。
 * 其实,这个数值我们应该当作常识来记住。
 * 联想一下,日本动画好像有个规定是1秒30张画,中国的是1秒24张。
 * 用1秒去除以张数,就得到每幅画面停留的时间。
 * 日本的那个27.77毫秒已经很接近我们的25毫秒了,
 * 因为浏览器的渲染速度明显不如电视机的渲染速度, 尤其是IE6这个拉后腿的。
 */

/**
 * 一个参数的缓动公式
 * =========================================================
 * 缓动公式有一个参数的，也有四个参数的。基于一个参数的缓动公式的动画原理如下：
 * 参数：【时间进度】
 * 返回值：【新时间进度】
 * 通过时间进度的变化来控制样式值的变化。
 * 
 * 随着时间的推移，各个值的变化如下：
 * 1. 【时间进度】
 *     从 0 到 1，公式：(当前时间 - 开始时间) / 总时间
 * 2. 调用缓动公式后返回的【新时间进度】
 * 3. 基于【新时间进度】的【当前样式值】
 *     公式：开始样式值 + 新时间进度 * 样式值总变化量
 *
 * 如上，随着时间的推移，【时间进度】会变为100%，当【时间进度】变为100%时，动画结束。
 * 【时间进度】为100%时，【新时间进度】也为100%，【当前样式值】会变为【最终样式值】。
 */

/**
 * 五个(四个)参数的缓动公式
 * =========================================================
 * 如上，easing函数有五个参数，但是第一个参数似乎并没有参与运算，所以也就是四个参数了。
 * 四个参数的含义如下：
 * 1. t：当前经过的时间，也就是（当前时间 - 开始时间）
 * 2. b：起始的样式值
 * 3. c：变化的总样式值
 * 4. d：总时间
 *
 * 返回值：当前的样式值。
 *
 * 随着时间的推移，easing函数直接返回当前样式值，很显然，相对比上面的一个参数的缓动公式，
 * 四个参数的缓动公式帮你处理了更多的逻辑代码。只要传入几个参数，都可以得到想要的结果。
 * 因此四个参数的缓动公式代码的文件比一个参数的稍微大一点。
 */

/**
 * 实现思路
 * ====================================================================================
 * 在jQuery中：
 *
 * jQuery.timers = [];  // 中央队列
 * jQuery.timersId = null;  // 定时器
 * 
 * 1. 调用$.fn.animate会把函数插入元素对应的子队列，这时会判断一下队列有没有守卫，
 *     没有则执行出列操作，有则只能等待dequeue才能出列。
 *
 * 2. 当子队列函数出列时，会遍历样式属性，【【每个属性会生成一个jquery.fx对象实例】】，然后调用此对象的custom方法。
 * 
 * 3. custom方法接受开始值、结束值和单位，把step函数push到timers里。并在未开启定时器时开启定时器。
 * 
 * 4. 定时器会定时遍历timers数组，然后执行里面的step函数，并接受其返回值，
 * 返回true（动画未完成），则等待下次循环继续执行；
 * 如果此函数返回false（代表动画完成），则移除此函数。
 * 
 * 5. 在动画完成时，会执行complete方法，此函数体里除了执行用户的回调函数之外，
 * 还会执行dequeue出列方法，这时又回到了步骤2。
 */

/**
 * show/hide/toggle最终的结果就是把display的none和其他值进行转换。
 * 只不过在转换时添加一个过渡效果。把特定的属性的值在0和原始值间进行转换。
 * 因此在过渡前可以保存元素的相关属性值，在变换之后再设置回来。
 *
 * show操作：
 * display：none - > 非none
 * 1. 先保存原属性值
 * 2. 把所有属性值设为0
 * 3. 把display设为非none
 * 4. 进行动画：把属性值从0到原始值
 * 5. 动画结束：null
 *
 * hide操作：
 * display：非none - > none
 * 1. 先保存原属性值
 * 2. 保存display（在show操作时恢复为此display）
 * 3. 进行动画：把属性值从原始值到0
 * 4. 动画结束：把属性值恢复为原始值
 *
 * 注意点：
 * 1. 在进行动画预处理的时候，就需要获取元素的开始值（hide操作）或结束值（show），
 *     不然在遍历属性时才获取，会在show操作时出现小问题：
 *     因为在预处理时，会把display设为非none，这时元素已经显示了，
 *     等到动画真正执行时才把元素样式值从0到默认值过渡，就出现了元素会先闪现一下。
 *     因此预处理时就需要把元素样式值设为0（所以必须先获取元素的原始值，不然值都为0了）。
 */

/**
 * stop()方法思路
 * ============================================================
 * 调用stop方法有四种情况：
 * 1. stop(false, false)
 *     在当前样式停止，队列不为空则开始下一个动画
 * 2. stop(true, false)
 *     清空队列，在当前样式停止。因队列被清空，因此动画结束
 * 3. stop(false, true)
 *     在最后样式停止，队列不为空则开始下一个动画
 * 4. stop(true, true);
 *     清空队列，在最后样式停止。因队列被清空，因此动画结束
 */

function startAnimationJs( node, optall, processed ) {
    // 记录当前的运动状态
    $._data( node, 'bat.fx.type', 'js' );

    // 记录元素样式属性，当所有属性值都到达最终值，则元素完成最终动画（调用complete回调）。
    optall.curAnim = {};
    
    processed.forEach(function( step ) {
        if ( step.hasOwnProperty('from') ) {
            optall.curAnim[ step.key ] = false;
            var ani = new Fx( node, optall, step.key );
            ani.custom( step );

        // 直接设置不符合动画需求的值
        } else {
            node.style[ step.key ] = step.to;
        }
    });
}

// ============================ Fx类 ============================
function Fx( elem, opts, key ) {
    this.elem = elem;
    this.opts = opts;
    this.key = key;
    this.duration = this.opts.duration;
}
$.extend(Fx.prototype, {
    custom: function( step ) {
        this.from = step.from;
        this.to = step.to;
        this.unit = step.unit;
        this.total = this.to - this.from;
        this.start = Date.now();

        var self = this;
        function f( gotoEnd ) {
            return self.frame( gotoEnd );
        }
        f.elem = this.elem;

        Fx.timeline.push( f );
        Fx.running();
    },
    step: function() {
        this.opts.step.call( this.elem, this );
    },
    frame: function( gotoEnd ) {
        var progress, done, i,
            time = Date.now() - this.start;

        if ( gotoEnd || time >= this.duration ) {
            this.elem.style[ this.key ] = this.to + this.unit;
            this.step();

            done = true;
            this.opts.curAnim[ this.key ] = true;

            for ( i in this.opts.curAnim  ) {
                if ( this.opts.curAnim[i] === false ) {
                    done = false;
                }
            }

            if ( done ) {
                this.opts.complete.call( this.elem );
                this.opts.next();
            }
            return true;
        }

        progress = this.opts.easing( time / this.duration );

        this.elem.style[ this.key ] = progress * this.total + this.from + this.unit;

        $.css( this.elem, this.key, progress * this.total + this.from + this.unit );
    }
});
$.extend(Fx, {
    // 中央队列/时间轴
    timeline: [],

    timer: null,

    fps: 50,

    interval: 1000 / Fx.fps,

    running: function() {
        if ( !Fx.timer ) {
            Fx.timer = setInterval(function() {
                var timers = Fx.timeline;
                for ( var i = 0; i < timers.length; i++ ) {
                    if ( timers[i]() ) {
                        timers.splice( i--, 1 );
                    }
                    if ( timers.length === 0 ) {
                        clearInterval( Fx.timer );
                        Fx.timer = null;
                    }
                }
            }, Fx.interval);
        }
    }
});