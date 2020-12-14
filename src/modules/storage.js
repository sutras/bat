import $ from './core';

/*
|-------------------------------------------------------------------------------
| 本地存储模块
|-------------------------------------------------------------------------------
|
*/

$.extend({
    storage: function( key, value ) {
        var storage = window.localStorage;

        if ( arguments.length < 2 ) {
            return storage.getItem( key );
        }
        storage.setItem( key, value );
        return this;
    },
    removeStorage: function( key ) {
        var storage = window.localStorage;
        // storage允许null或undefined作为键（会隐式转换为字符串）
        if ( arguments.length === 0 ) {
            storage.clear();
        } else {
            storage.removeItem( key );
        }
        return this;
    }
});