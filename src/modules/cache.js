import $ from './core';

/*
|-------------------------------------------------------------------------------
| 缓存模块
|-------------------------------------------------------------------------------
|
*/

/**
 * 数据缓存
 * ========
 * 数据缓存就是在目标对象与缓存体间建立一对一的关系，然后在缓存体上操作数据。
 */

/**
 * 缓存系统的各种实现的概述
 * ========================
 * 实现缓存系统主要有两大类。
 * 第一类：
 *     在对象与缓存体间通过uuid进行关联，uuid作为纽带，其存储方式有两种：
 *     1. 把uuid存放在对象的属性里。
 *     2. 通过valueOf方法闭包保存。
 *         备注：IE8及以下的DOM对象不支持valueOf方法。
 * 第二类：
 *     把对象与缓存体进行对应/映射。
 *     1. 建立两个数组，一个用来保存对象，一个用来保存缓存体，通过数组下标进行关联。
 *     2. 使用es6的WeakMap来实现。WeakMap对象是键/值对的集合。
 *        键为非空的对象，值可以为任意值。顾名思义，WeakMap译为弱映射，也就是说，
 *        其键名与键值被弱引用，当作为键名的对象被删除，那么对应的键值也会被清除出WeakMap对象。
 */

/**
 * 通过重写 valueOf 来实现的缓存系统
 * ================================
 * 具体实现是，如果目标对象的 valueOf 传入一个特殊的对象，那么它就返回一个 UUID，
 * 然后通过 UUID 在 Data 实例的 cache 对象属性上开辟缓存体。
 * ===============================================================================
 * 这样一来，我们就不用区分它是 window 对象，使用 windowData 来做替身了；
 * 另外，我们也不用顾忌 embed、object、applet 这 3 种在 IE 下可能无法设置私有属性的元素节点。
 * 再有就是，不再把私有数据和用户数据混在一起，不再在用户对象上添加自定义属性。
 * ===============================================================================
 * 缺点：
 *     IE8及以下的DOM元素对象不支持valueOf方法。
 */

function Data() {
    this.cache = {};
}

Data.prototype = {
    constructor: Data,
    locker: function( owner ) {
        var ovalueOf,

            // owner 拥有 valueOf 方法的对象
            // 首先我们检测一下它们 valueOf 方法有没有被重写，由于浏览器的差异性，
            // 我们通过觅得此三类对象的构造器进行原型重写的成本过大，只能对每一个实例的 valueOf 方法进行重写。
            // 检测方式为传入 Data 类，如果是返回 `object` 说明没有被重写，返回 `string` 则是被重写。
            // 这个字符串就是我们上面所说的 UUID，用于在缓存仓库上开辟缓存体。
            unlock = owner.valueOf( Data );

        // 这里的重写使用了 Object.defineProperty 方法，IE7 及以下浏览器不支持
        // Object.defineProperty 的第 3 个参数为对象，如果不显式设置 enumerable、writable、configurable，
        // 则会默认为 false，这也正如我们所期待的那样，我们不再希望人们来遍历它，重写它，再次动它的配置
        // 这个过程被 jQuery 称之为开锁，通过 valueOf 这扇大门，进入到仓库
        if ( typeof unlock !== 'string' ) {
            unlock = $.uniqid();
            ovalueOf = owner.valueOf;

            Object.defineProperty(owner, 'valueOf', {
                value: function( pick ) {
                    if ( pick === Data ) {
                        return unlock;
                    }
                    return ovalueOf.apply( owner );
                }
            });
        }

        // 开辟缓存体
        if ( !this.cache[ unlock ] ) {
            this.cache[ unlock ] = {};
        }

        return unlock;
    },

    set: function( owner, data, value ) {
        // 写方法
        var prop,
            cache,
            unlock;

        // 得到 uuid 与缓存体
        unlock = this.locker( owner );
        cache = this.cache[ unlock ];

        // 如果传入 3 个参数，第 2 个为字符串，那么直接在缓存体上添加新的键值对
        if ( typeof data === 'string' ) {
            cache[ data ] = value;
            // 如果传入 2 个参数，第 2 个为对象
        } else {
            // 如果缓存体还没有添加过任何对象，那么直接赋值，否则使用 for in 循环添加键值对
            if ( $.isEmptyObject( cache ) ) {
                this.cache[ unlock ] = data;
            } else {
                for ( prop in data ) {
                    cache[ prop ] = data[ prop ];
                }
            }
        }
    },

    get: function( owner, key ) {
        // 读方法
        var cache = this.cache[ this.locker( owner ) ];
        // 如果只有一个参数，则返回整个缓存体
        return key === undefined ? cache : cache[ key ];
    },

    access: function( owner, key, value ) {
        // 决定是读方法还是写方法，然后做相应的操作
        if ( key === undefined || 
                ( ( key && typeof key === 'string' ) && value === undefined ) ) {
            return this.get( owner, key );
        }
        this.set( owner, key, value );
        return value !== undefined ? value : key;
    },

    remove: function( owner, key ) {
        var l,
            i,
            unlock = this.locker( owner ),
            cache = this.cache[ unlock ];

        if ( !cache ) {
            return;
        }

        if ( !key ) {
            return this.discard( owner );
        }

        // 支持数组和空格分割的字符串来批量删除数据
        if ( typeof key === 'string' && key ) {
            key = key.split(/\s+/);
        }

        l = key.length;
        
        while ( l-- ) {
            delete cache[ key[ l ] ];

            i = '';

            // 遍历缓存体，如果 k 值没被改写（说明缓存体没数据），移除缓存体
            for ( i in cache ) {
                break;
            } 
            if ( !i ) {
                return this.discard( owner );
            }
        }
    },

    hasData: function( owner ) {  // 判定此对象是否缓存了数据
        return !$.isEmptyObject( this.cache[ this.locker( owner ) ] );
    },

    discard: function( owner ) {
        delete this.cache[ this.locker( owner ) ];
    }
};

var data_user, data_priv;

// 保存用户数据
data_user = new Data();
// 保存私有数据
data_priv = new Data();

$.extend({
    hasData: function( elem ) {  // 判定是否缓存了数据
        return data_user.hasData( elem ) || data_priv.hasData( elem );
    },

    data: function( elem, name, data ) {  // 读/写用户数据
        return data_user.access( elem, name, data );
    },

    removeData: function( elem, name ) {  // 删除用户数据
        data_user.remove( elem, name );
    },

    _data: function( elem, name, data ) {  // 读/写私有数据
        return data_priv.access( elem, name, data );
    },

    _removeData: function( elem, name ) {  // 删除私有数据
        data_priv.remove( elem, name );
    },

    queue: function( elem, name, data ) {
        var queue;

        if ( elem ) {
            name = (name || 'fx') + 'Queue';

            queue = $._data( elem, name );

            if ( data ) {
                if ( !queue || $.isArray( data ) ) {
                    queue = $._data( elem, name, $.toArray( data ) );
                } else {
                    queue.push( data );
                }
            }
            return queue || [];
        }
    },

    dequeue: function( elem, name ) {
        var queue, fn;

        if ( elem ) {
            queue = $.queue( elem, name );
            fn = queue.shift();

            // 添加一个守卫阻止动画队列自动出列
            if ( fn === 'inprogress' ) {
                fn = queue.shift();
            }

            if ( fn ) {
                if ( name === 'fx'  ) {
                    queue.unshift('inprogress');
                }

                // 调用函数回调，进行next操作（继续出列）
                fn.call(elem, function() {
                    $.dequeue( elem, name );
                });
            }

            // 队列为空，则删除元素队列
            if ( !queue.length ) {
                $._removeData( elem, name + 'Queue' );
            }
        }
    },

    clearQueue: function( elem, name ) {
        return $.queue( elem, name, [] );
    }
});

$.fn.extend({
    data: function( name, data ) { 
        var _this = this;

        if ( data === void 0 ) {  // 读
            return $.data( this[0], name );
        }

        return this.each(function() {  // 写
            $.data( this, name, data );
        });
    },

    removeData: function( name ) {  // 删
        return this.each(function() {
            $.removeData( this, name );
        });
    },

    _data: function( name, data ) { 
        var _this = this;

        if ( data === void 0 ) {  // 读
            return $._data( this[0], name );
        }

        return this.each(function() {  // 写
            $._data( this, name, data );
        });
    },

    _removeData: function( name ) {  // 删
        return this.each(function() {
            $._removeData( this, name );
        });
    },

    queue: function( name, data ) {
        if ( typeof name !== 'string' ) {
            data = name;
            name = 'fx';
        }

        // getter
        if ( data === void 0 ) {
            return $.queue( this[0], name );
        }

        return this.each(function() {
            var queue = $.queue( this, name, data );

            // 如果是动画队列，且没有守卫（初次调用），则出列
            if ( name === 'fx' && queue[0] !== 'inprogress' ) {
                $.dequeue( this, name );
            }
        });
    },

    dequeue: function( name ) {
        return this.each(function() {
            $.dequeue( this, name );
        });
    },

    clearQueue: function( name ) {
        return this.queue( name || 'fx', [] );
    }
});
