import $ from './core';

/*
|-------------------------------------------------------------------------------
| cookie模块
|-------------------------------------------------------------------------------
|
*/

var defaultCookieAttributes = {
    path: '/'
};

var cookie = {
    get: function( key ) {
        return decodeURIComponent(
            document.cookie.replace(
                new RegExp("(?:(?:^|.*;)\\s*" +
                    encodeURIComponent(key).replace(/[-.+*]/g, "\\$&") +
                    "\\s*\\=\\s*([^;]*).*$)|^.*$"),
                "$1"
            )
        ) || null;
    },

    set: function( key, value, attributes ) {
        var stringifiedAttributes = '',
            attributeName;

        if ( !key || /^(?:expires|max\-age|path|domain|secure)$/i.test(key) ) {
            return false;
        }

        attributes = $.extend( {}, defaultCookieAttributes, attributes );

        if ( typeof attributes.expires === 'number' ) {
            attributes.expires = new Date( Date.now() + attributes.expires * 864e5 );
        }
        if ( attributes.expires ) {
            attributes.expires = attributes.expires.toUTCString();
        }

        for ( attributeName in attributes ) {
            if ( !attributes[ attributeName ] ) {
                continue;
            }

            stringifiedAttributes += '; ' + attributeName;

            if ( attributes[attributeName] === true ) {
                continue;
            }
        }

        document.cookie = encodeURIComponent( key ) + "=" + encodeURIComponent( value ) + stringifiedAttributes;
        return true;
    },

    remove: function( key, attributes ) {
        return cookie.set( key, '', $.extend({}, attributes, {
            expires: -1
        }));
    },

    has: function( key ) {
        return ( new RegExp("(?:^|;\\s*)" +
                encodeURIComponent( key ).replace(/[-.+*]/g, "\\$&") +
                "\\s*\\=")
            ).test( document.cookie );
    }
};

$.extend({
    cookie: function( key, value, attributes ) {
        // get操作
        if ( value == null ) {
            return cookie.get( key );
        }
        // set操作
        cookie.set( key, value, attributes );
        return this;
    },

    removeCookie: function( key, attributes ) {
        cookie.remove( key, attributes );
        return this;
    },

    hasCookie: function( key ) {
        return cookie.has( key );
    }
});