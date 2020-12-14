(function() {
    var perfix = ['webkit', 'moz'];
    for ( var i = 0; i < perfix.length && !window.requestAnimationFrame; ++i ) {
        window.requestAnimationFrame = window[ perfix[i] + 'RequestAnimationFrame' ];
        window.cancelAnimationFrame =
            window[ perfix[i] + 'CancelAnimationFrame' ] || 
            window[ perfix[i] + 'CancelRequestAnimationFrame' ];
    }

    if ( !window.requestAnimationFrame ) {
        window.requestAnimationFrame = function(callback, element) {
            var id = setTimeout(callback, 1000 / 60);
            return id;
        };
    }

    if ( !window.cancelAnimationFrame ) {
        window.cancelAnimationFrame = function( id ) {
            clearTimeout( id );
        };
    }
})();

/**
 * 游戏工具函数
 */
var gameUtils = {
    // 计算两点之间的距离
    calcTowPointsDistance: function( x1, y1, x2, y2 ) {
        return Math.sqrt( Math.pow( x1 - x2, 2 ) + Math.pow( y1 - y2, 2 ) );
    },

    // 随机生成一个给定两个数之间的随机数
    // digit 指定小数位数，默认取整
    getRandom: function( start, end, digit ) {
        return parseFloat( ( Math.random() * ( end - start ) + start ).toFixed( digit ) );
    },

    // 线性插值，每一次趋近的距离
    // cur：当前值，aim：目标值，ratio：百分比（趋近的距离与总距离比率）
    lerpDistance: function( cur, aim, ratio ) {
        return cur - ( cur - aim ) * ratio;
    },

    // 线性插值，每一次趋近的角度
    // cur：当前角度，aim：目标角度，ratio：百分比（趋近的角度与总角度比率）
    // 此函数会取两边间较小的角度
    lerpAngle: function( cur, aim, ratio ) {
        var angle = cur - aim;

        if ( angle > Math.PI ) {
            angle -= 2 * Math.PI;
        }
        if ( angle < -Math.PI ) {
            angle += 2 * Math.PI;
        }
        return cur - angle * ratio;
    },

    // 判断两物体是否碰撞，对象必须提供 x,y,w,h 属性
    // overlap 允许重叠的大小
    // a        c     
    //  +----+   +----+
    //  | o1 |   | o2 |
    //  +----+   +----+
    //        b        d
    hitTest: function( o1, o2 ) {
        var
            ax = o1.x,      ay = o1.y,
            bx = ax + o1.w, by = ay + o1.h,
            cx = o2.x,      cy = o2.y,
            dx = cx + o2.w, dy = cy + o2.h;

        if ( (ax >= cx && ax <= dx || bx >= cx && bx <= dx)
                && (ay >= cy && ay <= dy || by >= cy && by <= dy) ) {
            return true;
        }
        return false;
    },

    // 创建二维数组
    matrix: function(rows, cols, init) {
        var arr = [], i, j, columns;

        for ( i = 0; i < rows; ++i ) {
            columns = [];
            for ( j = 0; j < cols; ++j ) {
                columns[j] = init;
            }
            arr[i] = columns;
        }
        return arr;
    },

    // 测试当前帧率
    // 使用方法：
    // 调用此函数，并在每次渲染时调用其返回的函数
    FPSTest: function() {
        var canvas = document.createElement('canvas'),
            ctx = canvas.getContext('2d'),
            num = 0;

        canvas.style.cssText = 
            "position: fixed; top: 0; right: 0; z-index: 999;" +
            " width: 100px; height: 40px;" +
            " background: rgba(0,0,0,.5);";
        canvas.width = 100;
        canvas.height = 40;

        document.body.appendChild( canvas );

        setInterval(function() {
            ctx.clearRect(0, 0, 100, 50);
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.font = '20px Arial';
            ctx.fillStyle = '#fff';
            ctx.fillText('FPS: ' + num, 10, 10 );
            num = 0;
        }, 1000);

        return function() {
            num++;
        };
    },

    // 滤镜
    filter: {
        // 负片/底片
        // 算法：255 - 当前的RGB值
        negative: function( data ) {
            var i;
            for ( i = 0; i < data.length; i += 4 ) {     
                data[i] = 255 - data[i];
                data[i + 1] = 255 - data[i + 1];
                data[i + 2] = 255 - data[i + 2];
            }
            return data;
        },
        // 灰度
        // 算法：计算 RGB 平均值
        gray: function( data ) {
            var average, i;
            for ( i = 0; i < data.length; i += 4 ) {
                average = (data[i] + data[i + 1] + data[i + 2]) / 3;
                data[i] = data[i + 1] = data[i + 2] = average;
            }
            return data;
        },
        // 浮雕
        // 算法：当前 RGB 减去相邻的 GRB 得到的值再加上128
        // 优化：接着使用灰度算法
        relievo: function( data ) {
            var average, i;
            for ( i = 0; i < data.length; i += 4 ) {
                data[i] = data[i] - data[i + 4] + 128;
                data[i + 1] = data[i + 1] - data[i + 5] + 128;
                data[i + 2] = data[i + 2] - data[i + 6] + 128;
            }
            return this.gray( data );
        },
        // 黑白
        // 算法：计算 RGB 平均值并进行上下取舍
        monochrome: function( data ) {
            var average, i;
            for ( i = 0; i < data.length; i += 4 ) {
                average = (data[i] + data[i + 1] + data[i + 2]) / 3
                    > 128 ? 255 : 0;
                data[i] = data[i + 1] = data[i + 2] = average;
            }
            return data;
        }
    }
};
