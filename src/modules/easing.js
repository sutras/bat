import $ from './core';

/*
|-------------------------------------------------------------------------------
| 缓动公式模块
|-------------------------------------------------------------------------------
|
*/

$.extend( $.fx.easing.js, {
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

$.extend( $.fx.easing.css, {
    linear: [0.250, 0.250, 0.750, 0.750],
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
});