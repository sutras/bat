/* 
* @Author: batJS
* @Date:   2018-09-06 17:03:12
* @Last Modified by:   batJS
* @Last Modified time: 2018-09-06 18:02:03
*/

/**
 * 说明：
 * 使用js实现替换元素
 *
 * 兼容性：
 * 支持IE11+、Firefox、chrome的浏览器
 *
 * 使用：
 * 只需要引用JavaScript与按照文档编写HTML，不用写一行JavaScript代码就能让插件运行起来。
 * <div class="object-fit" data-fit="cover" data-width="720" data-height="1280"></div>
 */
(function() {
    function ObjectFit( el ) {
        this.init( el );
    }
    ObjectFit.prototype = {
        constructor: ObjectFit,
        init: function( el ) {
            var data;

            this.el = typeof el === 'string' ? document.querySelector( el ) : el;
            data = this.el.dataset;
            this.width = data.width;
            this.height = data.height;
            this.fit = data.fit;

            this.setStyle();
            this.setFit();
        },
        setStyle: function() {
            var style = this.el.style;
            style.position = 'absolute';
            style.left = '50%';
            style.top = '50%';
            style.width = this.width + 'px';
            style.height = this.height + 'px';
        },
        setFit: function() {
            var stageRatio = this.width / this.height;
                scaleX = 1, scaleY = 1, s = this;

            function scale() {
                var w = window.innerWidth,
                    h = window.innerHeight,
                    viewRatio = w / h;

                switch ( s.fit ) {
                    case 'contain':
                        scaleX = scaleY = stageRatio < viewRatio ? h / s.height : w / s.width;
                        break;
                    case 'cover':
                        scaleX = scaleY = stageRatio < viewRatio ? w / s.width : h / s.height;
                        break;
                    case 'fill':
                        scaleX = w / s.width;
                        scaleY = h / s.height;
                }

                s.el.style.transform = 'translate(-50%,-50%) scale(' + scaleX + ',' + scaleY + ')';
            }
            scale();
            window.addEventListener('resize', scale);
        }
    };

    $$('.object-fit').forEach(function( o ) {
        new ObjectFit( o );
    });
})();