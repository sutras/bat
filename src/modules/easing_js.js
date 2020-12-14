import $ from './core';

/*
|-------------------------------------------------------------------------------
| js缓动公式模块
|-------------------------------------------------------------------------------
|
*/

$.extend( $.easing, {
    linear: function( k ) {
        return k;
    },
    easeInQuad: function( k ) {
        return k * k;
    },
    easeOutQuad: function( k ) {
        return k * (2 - k);
    },
    easeInOutQuad: function( k ) {
        if ((k *= 2) < 1) return 0.5 * k * k;
        return - 0.5 * (--k * (k - 2) - 1);
    },
    easeInCubic: function( k ) {
        return k * k * k;
    },
    easeOutCubic: function( k ) {
        return --k * k * k + 1;
    },
    easeInOutCubic: function( k ) {
        if ((k *= 2) < 1) return 0.5 * k * k * k;
        return 0.5 * ((k -= 2) * k * k + 2);
    },
    easeInQuart: function( k ) {
        return k * k * k * k;
    },
    easeOutQuart: function( k ) {
        return 1 - (--k * k * k * k);
    },
    easeInOutQuart: function( k ) {
        if ((k *= 2) < 1) return 0.5 * k * k * k * k;
        return - 0.5 * ((k -= 2) * k * k * k - 2);
    },
    easeInQuint: function( k ) {
        return k * k * k * k * k;
    },
    easeOutQuint: function( k ) {
        return --k * k * k * k * k + 1;
    },
    easeInOutQuint: function( k ) {
        if ((k *= 2) < 1) return 0.5 * k * k * k * k * k;
        return 0.5 * ((k -= 2) * k * k * k * k + 2);
    },
    easeInSine: function( k ) {
        return 1 - Math.cos(k * Math.PI / 2);
    },
    easeOutSine: function( k ) {
        return Math.sin(k * Math.PI / 2);
    },
    easeInOutSine: function( k ) {
        return 0.5 * (1 - Math.cos(Math.PI * k));
    },
    easeInExpo: function( k ) {
        return k === 0 ? 0 : Math.pow(1024, k - 1);
    },
    easeOutExpo: function( k ) {
        return k === 1 ? 1 : 1 - Math.pow(2, - 10 * k);
    },
    easeInOutExpo: function( k ) {
        if (k === 0) return 0;
        if (k === 1) return 1;
        if ((k *= 2) < 1) return 0.5 * Math.pow(1024, k - 1);
        return 0.5 * (- Math.pow(2, - 10 * (k - 1)) + 2);
    },
    easeInCirc: function( k ) {
        return 1 - Math.sqrt(1 - k * k);
    },
    easeOutCirc: function( k ) {
        return Math.sqrt(1 - (--k * k));
    },
    easeInOutCirc: function( k ) {
        if ((k *= 2) < 1) return - 0.5 * (Math.sqrt(1 - k * k) - 1);
        return 0.5 * (Math.sqrt(1 - (k -= 2) * k) + 1);
    },
    easeInElastic: function( k ) {
        if (k === 0) return 0;
        if (k === 1) return 1;
        return -Math.pow(2, 10 * (k - 1)) * Math.sin((k - 1.1) * 5 * Math.PI);
    },
    easeOutElastic: function( k ) {
        if (k === 0) return 0;
        if (k === 1) return 1;
        return Math.pow(2, -10 * k) * Math.sin((k - 0.1) * 5 * Math.PI) + 1;
    },
    easeInOutElastic: function( k ) {
        if (k === 0) return 0;
        if (k === 1) return 1;
        k *= 2;
        if (k < 1) return -0.5 * Math.pow(2, 10 * (k - 1)) * Math.sin((k - 1.1) * 5 * Math.PI);
        return 0.5 * Math.pow(2, -10 * (k - 1)) * Math.sin((k - 1.1) * 5 * Math.PI) + 1;
    },
    easeInBack: function( k ) {
        var s = 1.70158;
        return k * k * ((s + 1) * k - s);
    },
    easeOutBack: function( k ) {
        var s = 1.70158;
        return --k * k * ((s + 1) * k + s) + 1;
    },
    easeInOutBack: function( k ) {
        var s = 1.70158 * 1.525;
        if ((k *= 2) < 1) return 0.5 * (k * k * ((s + 1) * k - s));
        return 0.5 * ((k -= 2) * k * ((s + 1) * k + s) + 2);
    },
    easeInBounce: function( k ) {
        return 1 - $.easing.easeOutBounce(1 - k);
    },
    easeOutBounce: function( k ) {
        if (k < (1 / 2.75)) {
            return 7.5625 * k * k;
        } else if (k < (2 / 2.75)) {
            return 7.5625 * (k -= (1.5 / 2.75)) * k + 0.75;
        } else if (k < (2.5 / 2.75)) {
            return 7.5625 * (k -= (2.25 / 2.75)) * k + 0.9375;
        } else {
            return 7.5625 * (k -= (2.625 / 2.75)) * k + 0.984375;
        }
    },
    easeInOutBounce: function( k ) {
        if (k < 0.5) return $.easing.easeInBounce(k * 2) * 0.5;
        return $.easing.easeOutBounce(k * 2 - 1) * 0.5 + 0.5;
    }
});