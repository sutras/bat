// 莫尔斯电码
(function() {
    // 字母与莫尔斯电码的映射
    var morseCodeMap = {
        "A": ".-",
        "B": "-...",
        "C": "-.-.",
        "D": "-..",
        "E": ".",
        "F": "..-.",
        "G": "--.",
        "H": "....",
        "I": "..",
        "J": ".---",
        "K": "-.-",
        "L": ".-..",
        "M": "--",
        "N": "-.",
        "O": "---",
        "P": ".--.",
        "Q": "--.-",
        "R": ".-.",
        "S": "...",
        "T": "-",
        "U": "..-",
        "V": "...-",
        "W": ".--",
        "X": "-..-",
        "Y": "-.--",
        "Z": "--..",
        "1": ".----",
        "2": "..---",
        "3": "...--",
        "4": "....-",
        "5": ".....",
        "6": "-....",
        "7": "--...",
        "8": "---..",
        "9": "----.",
        "0": "----",
        ".": ".-.-.-",
        ",": "--..--",
        "?": "..--..",
        ":": "---...",
        ";": "-.-.-.",
        "-": "-....-",
        "/": "-..-.",
        "\"": ".-..-.",
        "'": ".----.",
        "(": "-.--.",
        ")": "-.--.-",
        "=": "-...-",
        "+": ".-.-.",
        "$": "...-..-",
        "¶": ".-.-..",
        "_": "..--.-"
    };

    // 把字母编码成莫尔斯电码
    function encodeMorse( str ) {
        var aChar, i = 0, el;

        str = str.toUpperCase().replace(/\s+/g, ' ');
        aChar = str.split('');

        for ( ; i < aChar.length; i++ ) {
            aChar.splice(i, 1, morseCodeMap[ aChar[i] ] || 
                (aChar[i] === ' ' ? '' : aChar[i]));
        }

        return aChar.join(' ');
    }

    // 把莫尔斯电码编码成字母
    function decodeMorse( morseStr ) {
        var newMorseCodeMap = {}, i, aMorseChar;
        for ( i in morseCodeMap ) {
            newMorseCodeMap[ morseCodeMap[i] ] = i;
        }

        aMorseChar = morseStr.split(' ');

        for ( i = 0; i < aMorseChar.length; i++ ) {
            aMorseChar.splice(i, 1, newMorseCodeMap[ aMorseChar[i] ] || (aMorseChar[i] === '' ? ' ' : aMorseChar[i]));
        }

        return aMorseChar.join('');
    }
})();

// 加载脚本文件
function loadScript( url, callback ) {
    var script = document.createElement('script');
    script.charset = 'utf-8';
    script.async = true;
    script.src = url;
    document.body.appendChild( script );

    // 如果没有回调函数，单纯地加载js，就没必要监听是否加载完了
    if ( typeof callback !== 'function' ) {
        return;
    }

    if ( script.readyState ) {  // ie
        script.onreadystatechange = function() {
            if ( script.readyState == 'complete' || script.readyState == 'loaded' ) {
                script.onreadystatechange = null;
                callback();
            }
        };
    } else {  // 非IE
        script.onload = function() {
            script.onload = null;
            callback();
        };
    }
}

// 加载样式文件
// 加载完或者404都会执行回调
function loadStyle( url, callback ) {
    var head, node;

    head = document.getElementsByTagName('head')[0];
    node = document.createElement('link');
    node.rel = 'stylesheet';
    node.href = url;
    head.appendChild( node );

    // 如果没有回调函数，单纯地加载css，就没必要监听是否加载完了
    if ( typeof callback !== 'function' ) {
        return;
    }

    function poll( node, callback ) {
        var isLoaded = false;

        if ( node.sheet ) {
            isLoaded = true;
        }

        if ( isLoaded ) {
            // 给浏览器一点时间来渲染
            setTimeout(function() {
                callback();
            }, 1);
        } else {
            // 不使用定时器，在chrome下会报以下错误：
            // Uncaught RangeError: Maximum call stack size exceeded
            setTimeout(function() {
                poll(node, callback);
            }, 0);
        }
    }

    // for IE6-9 and Opera
    if ( node.attachEvent ) {
        node.attachEvent('onload', callback);

    // for Firefox, Chrome, Safari
    } else {
        setTimeout(function() {
            poll(node, callback);
        }, 0);  // for cache
    }
}


// 针对图片已缓存而不再触发onload事件，
// 可以使用image对象的 “complete” 属性判断图片是否加载完毕。
function loadImage( url, success, error ) {
    var image = new Image();
    image.src = url;  // 设置完src，就会立即下载图片，并不需要添加到DOM树上

    if ( typeof success === 'function' ) {
        // 所有浏览器都支持
        image.onload = function() {
            image.onload = null;
            success.call( image );
        };
    }
    if ( typeof error === 'function' ) {
        // 所有浏览器都支持
        image.onerror = function() {
            image.onerror = null;
            error.call( image );
        };
    }
}

// 作用：保留一个数或其他类型值（会转换为数值）指定长度的小数位，
//      不会进行四舍五入，Number.toFixed()会进行四舍五入。
// 说明：string toDecimal( mixed num [, int digit=0] )
function toDecimal( num, digit ) {
    var zero = '',
        rnum = /^([+-]?\d+)(\.\d+)?(?:[eE][+-]?\d+|)$/;

    num = Number( num );

    if ( digit ) {
        zero = Array( digit + 1 ).join(0);
    }

    if ( !num ) {
        if ( !digit ) {
            return '0';
        }
        return '0.' + zero;
    }

    return num.toString().replace(rnum, function( match, integer, decimals ) {
        if ( !digit ) {
            return integer;
        }
        return decimals === void 0 ? 
            integer + '.' + zero :
            integer + (decimals + zero).slice(0, digit + 1);
    });
}


/************
 * 日期的扩展
 */
$.extend({
    // 传入两个Date类型的日期，求出他们相隔多少天
    getDatePeriod: function( date1, date2 ) {
        return Math.abs( date1 - date2 ) / 1000 / 60 / 60 / 24;
    },

    // 传入一个Date类型的日期，求出它所在月的第一天
    getFirstDateInMonth: function( date ) {
        return new Date( date.getFullYear(), date.getMonth(), 1 );
    },

    // 传入一个Date类型的日期，求出它所在月的最后一天
    getLastDateInMonth: function( date ) {
        // 月份+1会跑到下一个月，但设置日为0，则为所在月的最后一天
        return new Date( date.getFullYear(), date.getMonth() + 1, 0 );
    },

    // 传入一个Date类型的日期，求出它所在季度的第一天
    getFirstDateInQuarter: function( date ) {
        return new Date( date.getFullYear(), ~~( date.getMonth() / 3 ) * 3, 1 );
    },

    // 传入一个Date类型的日期，求出它所在季度的最后一天
    getLastDateInQuarter: function( date ) {
        return new Date( date.getFullYear(), ~~( date.getMonth() / 3 ) * 3 + 3, 0 );
    },

    // 传入一个Date类型的日期，判断是否是闰年
    isLeapYear: function( date ) {
        var y = data.getFullYear();
        return y % 400 === 0 || y % 4 === 0 && y % 100 !== 0;
    },

    // 传入一个Date类型的日期，取得当前月的天数
    getDaysInMonth: function( date ) {
        return $.getLastDateInMonth( date ).getDate();
    }
});


var WeakMap = (function() {
    if ( typeof WeakMap === 'function' ) {
        return WeakMap;
    }
    return (function() {
        function WeakMap() {
            this.keys = [];
            this.values = [];
        }
        var p = WeakMap.prototype;
        p.set = function( key, value ) {
            var i;
            if ( (i = $.indexOf( this.keys, key )) === -1 ) {
                this.keys.push( key );
                return this.values.push( value );
            }
            this.values[i] = value;
        };
        p.get = function( key ) {
            return this.values[ $.indexOf( this.keys, key ) ];
        };
        p.has = function( key ) {
            return $.indexOf( this.keys, key ) === -1 ? false : true;
        };
        p.delete = function( key ) {
            var i;
            if ( (i = $.indexOf( this.keys, key )) !== -1 ) {
                this.keys.splice(i, 1);
                this.values.splice(i, 1);
                return true;
            }
            return false;
        };
        return WeakMap;
    })();
})(),

//判断用户设备是否为移动端
/**@doc
 * @method bat.isMobile()
 * @description  判断是否是移动端
 * @return {Boolean} [description]
 */
var isMobile = function() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
},