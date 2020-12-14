import $ from './core';

/*
|-------------------------------------------------------------------------------
| ajax模块
|-------------------------------------------------------------------------------
|
*/

/**
 * 前端与后台进行交互的方式
 * ========================
 * - 直接通过地址栏请求页面
 * - 表单提交
 * - script节点加载脚本
 * - 通过XMLHttpRequest对象进行数据加载
 */

/**
 * AJAX的概念
 * ==========
 * AJAX指异步JavaScript及XML（Asynchronous JavaScript And XML）。
 * AJAX里的X指xml, 但Ajax通信和数据格式无关，也就是说这种技术不一定使用XML。
 * AJAX是一种在2005年由Google推广开来的编程模式。
 * AJAX不是一种新的编程语言，而是一种使用现有标准的新方法。
 * AJAX基于JavaScript和HTTP请求（HTTP request）。
 * 通过AJAX，您的JavaScript可使用JavaScript的XMLHttpRequest对象直接与服务器进行通信。通过这个对象，
 * 您的JavaScript可在不重载页面的情况下与Web服务器交换数据。从而节省用户操作，时间，提高用户体验。
 */

/**
 * 前台发送数据的格式，目前有三种
 * ==============================
 * 1. application/x-www-form-urlencoded  // 在发送前编码所有字符（默认）
 * 2. multipart/form-data  // 不对字符编码。在使用包含文件上传控件的表单时，必须使用该值。
 * 3. application/json
 * 4. text/xml
 * 5. text/plain  // 空格转换为 "+" 加号，但不对特殊字符编码。
 */

/**
 * AJAX使用步骤
 * ============
 * 1. 获取XMLHttpRequest对象：new XMLHttpRequest
 * 2. 绑定事件回调：onreadystatechange
 * 3. 判断处理状态：readyStage、status
 * 4. 打开一个请求：open()
 * 5. 设置请求头：setRequestHeader()
 * 6. 发送数据：send()
 */

/**
 * XMLHttpRequest对象
 * ==================
 * 
 * 属性
 * ====
 * - readyState
 *     XMLHttpRequest对象的状态
 *         IE:
 *         0 - Uninitialized: 初始化状态。XMLHttpRequest 对象已创建或已被 abort() 方法重置。。
 *         1 - Open:          open() 方法已调用，但是 send() 方法未调用。请求还没有被发送。
 *         2 - Send:          Send() 方法已调用，HTTP 请求已发送到 Web 服务器。未接收到响应。
 *         3 - Receiving:     所有响应头部都已经接收到。响应体开始接收但未完成。
 *         4 - Loaded:        HTTP 响应已经完全接收。
 *
 *         chrome: 
 *         0 - UNSENT:           代理被创建，但尚未调用 open() 方法。
 *         1 - OPENED:           open() 方法已经被调用。
 *         2 - HEADERS_RECEIVED: send() 方法已经被调用，并且头部和状态已经可获得。
 *         3 - LOADING:          下载中； responseText 属性已经包含部分数据。
 *         4 - DONE:             下载操作已完成。
 * - status
 *     服务器返回的状态码
 * - statusText
 *     服务器返回的状态文本
 * - responseText
 *     服务器返回的文本数据
 * - responseXML
 *     服务器返回的XML格式的数据
 *
 * 新版本属性：
 * - timeout
 *     设置HTTP请求的时限
 * - responseType
 *     设置返回数据的类型。
 *         arraybuffer、blob、document、json、text
 * - response
 *     返回相应的正文，返回的类型取决于responseType属性。
 *
 * ----------------------------------------
 *
 * 事件
 * ====
 * - readystatechange
 *     每次 readyState 属性改变的时候触发
 *
 * 新版本事件（只有Chrome和Firefox支持，IE和Edge不支持）：
 * - timeout
 *     超时时触发
 * - progress
 *     返回进度信息
 * - abort
 *     传输被用户取消
 * - error
 *     传输出现错误
 * - loadstart
 *     传输开始
 * - loadend
 *     传输结束（成功或失败）
 * - load
 *     传输成功完成
 *
 * 以上七个事件同时存在于 XMLHttpRequest 和 XMLHttpRequest.upload 对象上
 * 为 XMLHttpRequest 添加事件来跟踪下载时的进程。
 * 为 XMLHttpRequest.upload 添加事件来跟踪上传时的进程。
 *
 * 一般事件触发顺序：
 * xhr.onreadystatechange
 * xhr.onloadstart
 *     xhr.upload.onloadstart
 *     xhr.upload.onprogress
 *     xhr.upload.onload
 *     xhr.upload.onloadend
 * xhr.onprogress
 * xhr.onload
 * xhr.onloadend
 * 
 * 发生abort/timeout/error时的事件触发顺序：
 *     如果上传阶段还没有结束：
 *         xhr.onreadystatechange
 *         xhr.onloadstart
 *             xhr.upload.onloadstart
 *             xhr.upload.onprogress
 *             xhr.upload.[onabort或ontimeout或onerror]
 *             xhr.upload.onloadend
 *         xhr.onprogress
 *         xhr.[onabort或ontimeout或onerror]
 *         xhr.onloadend
 *         
 *     如果上传阶段已经结束：
 *         xhr.onreadystatechange
 *         xhr.onloadstart
 *             xhr.upload.onloadstart
 *             xhr.upload.onprogress
 *             xhr.upload.onload
 *             xhr.upload.onloadend
 *         xhr.onprogress
 *         xhr.[onabort或ontimeout或onerror]
 *         xhr.onloadend
 *
 * ------------------------------------------
 *
 * 方法
 * ====
 * - abort()
 *     取消当前响应
 * - getAllResponseHeaders()
 *     把HTTP响应头作为未解析的字符串返回。
 * - getResponseHeader()
 *     返回指定的 HTTP 响应头部的值。
 * - open()
 *     初始化新创建的请求，或重新初始化现有请求。
 *     注意：为已经激活的请求（已经调用过的请求）调用此方法open()相当于调用abort()。
 * - send()
 *     发送HTTP请求。
 * - setRequestHeader()
 *     设置请求头
 * - overrideMimeType()
 *     重写由服务器返回的MIME type。在send()之前被调用。
 *     其作用是：针对某些特定版本的mozillar浏览器的BUG进行修正。
 */


// http://www.ruanyifeng.com/blog/2012/09/xmlhttprequest_level_2.html
/**
 * 老版本的缺点
 * ============
 * - 只支持文本数据的传送，无法用来读取和上传二进制文件。
 * - 传送和接受数据时，没有进度信息，只能提示有没有完成。
 * - 受到“同域限制”，只能向同一域名的服务器发送数据。
 *
 * 新版本的功能
 * ============
 * - 可以设置HTTP请求的时限。
 * - 可以使用FormData对象管理表单数据。
 * - 可以上传文件。
 * - 可以请求不同域名下的数据（跨域请求）。
 * - 可以获取服务器端的二进制数据。
 * - 可以获取数据传输的进度信息。
 */

/**
 * 其他关联知识点
 * ==============
 * - Blob 处理二进制
 * - BlobURL
 * - File
 * - FileReader
 * - FileWriter
 * - URL
 * - URLSearchParams
 * - ArrayBuffer
 * - Iterator
 */

/**
 * 实现ajax - 功能需求
 * ===================
 * - 取得XMLHttpRequest
 *     既然不必兼容旧版本的IE，直接通过new XMLHttpRequest来获取。
 * - 事件绑定与状态维护
 *     - loadstart事件：一开头就执行，没有难度
 *     - error/load/loadend事件：判定status状态码
 *     - timeout事件：通过setTimeout实现
 *     - abort事件：一个开关的事情
 *     - progress事件：通过事件对象的loaded与total属性计算得到
 *
 * - 成功/失败
 *     2xx和304：成功，其他失败
 * - 发送请求与数据
 *     - get请求，将参数转换成querystring
 */

/**
 * FormData对象
 * ============
 * 
 * 兼容性
 * ======
 * IE10+
 * 
 * 作用
 * ====
 * 将数据编译成键值对，以便用XMLHttpRequest来发送数据。
 * 即可发送表单数据，也可以发送带键数据。
 *
 * 方法
 * ====
 * 1. append( key, val ): 追加数据
 * 2. delete( key ): 删除数据
 * 3. set( key, val ): 修改键的值（没有则创建）（之后保存一对键值）
 * 4. get( key ): 获取指定键的值
 * 5. getAll( key ): 获取指定键的所有值，返回一个数组
 * 6. has( key ): 判断是由有指定键
 * 7. forEach(callback(val, key)): 遍历FormData对象
 * 8. keys(): 返回一个由键组成的遍历器对象
 * 9. values(): 返回一个由值组成的遍历器对象
 * 10. entries()：返回一个由键值组成的遍历器对象
 *
 * 使用
 * ====
 * 1. 实例化时可以传递一个form元素
 * 2. 将FormData对象传递进XMLHttpRequest.send()方法。
 */

/**
 * URL对象
 * =======
 * 
 * 兼容性
 * ======
 * 兼容性不太好，一两个属性兼容IE10+，有些属性也需要高版本的Chrome、Firefox、Edge。
 *
 * 作用
 * ====
 * 用于解析、构造、规范化和编码URL。
 *
 * 使用
 * ====
 * 一般只用一个类方法 - URL.createObjectURL()：
 *     本地图片预览，传入file对象，返回一个地址，将其设定给img标签的src即可进行图片预览。
 *         
 * 此功能也可以通过 FileReader 对象实现：
 *     var reader = new FileReader();
 *     fileReader.readAsDataURL( file );
 *     reader.onload = function() {
 *         console.log( reader.result );
 *     };
 */


$.extend({
    parseXML: function( text ) {
        var xml;
        if ( !text || typeof text !== "string" ) {
            return null;
        }

        try {
            xml = ( new window.DOMParser() ).parseFromString( text, "text/xml" );
        } catch ( e ) {
            xml = undefined;
        }
        if ( !xml || !xml.documentElement || xml.getElementsByTagName( "parsererror" ).length ) {
            $.error( "Invalid XML: " + text );
        }
        return xml;
    },
    parseJSON: function( text ) {
        try {
            return JSON.parse( text );
        } catch (e) {
            return null;   
        }
    },
    parseHTML: function( text ) {
        var fragment = document.createDocumentFragment(),
            wrapper = document.createElement('div'),
            firstChild;

        wrapper.innerHTML = text;

        while ( ( firstChild = wrapper.firstChild ) ) {
            fragment.appendChild( firstChild );
        }

        return fragment;
    },
    parseJS: function( text ) {
        var script = document.createElement('script');
        script.text = text;
        document.head.appendChild( script ).parentNode.removeChild( script );
    },
    parseHeaders: function( text ) {
        var o = {};
        text.split(/\r?\n/).forEach(function( str ) {
            var m;
            if ( ( m = str.match(/^([^:]+): (.+)$/) ) ) {
                o[ m[1] ] = m[2];
            }
        });
        return o;
    },
    // 把对象转换为查询字符串格式
    // traditional为真，既传统的就不加中括号
    param: function( o, traditional ) {
        var s = [], i, j;

        for ( i in o ) {
            if ( Array.isArray( o[i] ) ) {
                for ( j = 0; j < o[i].length; j++ ) {
                    s.push( encodeURIComponent( i ) + ( traditional ? '' : '[]' ) + '=' +
                        encodeURIComponent( o[i][j] ) );
                }
            } else {
                s.push( encodeURIComponent( i ) + '=' + encodeURIComponent( o[i] ) );
            }
        }

        return s.join('&');
    },
    // 把查询字符串格式转换为对象
    unparam: function( s ) {
        var o = {};

        if ( !s ) {
            return o;
        }

        s.split('&').forEach(function( kv ) {
            var a = kv.split('='),
                k = decodeURIComponent( a[0] || '' ).replace(/\[\]$/, ''),
                v = decodeURIComponent( a[1] || '' );

            addKv( o, k, v );
        });

        return o;
    }
});

$.fn.extend({
    // 将用作提交的表单元素的值编译成字符串
    serialize: function( traditional ) {
        return $.param( this.serializeObject(), traditional );
    },

    // 将用作提交的表单元素的值编译成对象
    serializeObject: function() {
        var ret = [], o = {};

        this.each(function() {
            if ( this.nodeName === 'FORM' ) {
                ret = ret.concat( core_slice.call( this.elements ) );
            } else {
                ret.push( this );
            }
        });

        ret.filter(function( elem ) {
            return elem.name && !elem.disabled &&
                /^input|select|textarea$/i.test( elem.nodeName ) &&
                !/^submit|button|image|reset|file$/i.test( elem.type ) &&
                ( elem.checked || !/^checkbox|radio$/.test( elem.type ) );
        }).forEach(function( elem ) {
            addKv( o, elem.name, elem.value );
        });

        return o;
    }
});


$.ajaxSettings = {
    // 请求的接口地址
    url: '',
    // 请求的方法
    method: 'GET',
    // 是否异步请求
    async: true,
    // 发送到服务器的数据：字符串、plain对象、FormData对象（需设置processData为false）
    data: '',
    // 发送数据前是否进行处理
    processData: true,
    // 是否以传统方式处理数据（不加中括号）
    traditional: false,
    // 是否携带cookie信息
    withCredentials: false,
    // 发送到服务器的数据的编码类型: form-data
    contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
    // 设置服务器响应数据的类型：arraybuffer, blob, json, text, document, stream
    responseType: '',
    // 请求超时时间
    timeout: 0,
    // 设置请求头
    headers: {

    },
    accepts: {
        xml: 'application/xml, text/xml',
        html: 'text/html',
        document: 'text/html',
        text: 'text/plain',
        json: 'application/json, text/javascript',
        script: 'application/javascript, text/javascript',
        _default: '*/'.concat('*') 
    },
    // 是否在服务器数据改变时获取新数据
    isModified: false,
    // 响应HTTP访问认证请求的用户名
    username: null,
    // 响应HTTP访问认证请求的密码
    password: null,

    // 设置请求成功的状态码
    validateStatus: function( status ) {
        return status >= 200 && status < 300 || status === 304;
    },

    // 上传进度回调
    uploadProgress: null,
    // 下载进度回调
    downloadProgress: null,

    // 请求发送前的回调
    beforeSend: null,
    // 请求成功后的回调
    success: null,
    // 请求失败时的回调
    error: null,
    // 请求完成后的回调
    complete: null
};

// 往o对象添加键值对，如果存在相同的键，
// 则将对应的值转换为数组来保存数据
function addKv( o, k, v ) {
    if ( k in o ) {
        if ( Array.isArray( o[ k ] ) ) {
            o[ k ].push( v );
        } else {
            ( o[ k ] = [ o[ k ] ] ).push( v );
        }
    } else {
        o[ k ] = v;
    }
}

// 响应对象
// jsonp会在success回调里接收一个json对象，
// 其他情况下success异或error都会接收一个响应对象。
function Response( s, xhr ) {
    this.url = s.url.indexOf('http') === 0 ?
        s.url :
        s.url.indexOf('//') === 0 ?
            location.protocol + s.url :
            s.url.indexOf('/') ?
                location.origin + s.url :
                location.href.slice(0, location.href.lastIndexOf('/') + 1) + s.url;
    this.data = xhr.response;
    this.headers = $.parseHeaders( xhr.getAllResponseHeaders() );
    this.ok = xhr.status >= 200 && xhr.status < 400;
    this.status = xhr.status;
    this.statusText = xhr.statusText;
    this.config = s;
}

$.extend({
    // 全局配置ajax
    ajaxSetup: function( settings ) {
        $.extend( $.ajaxSettings, settings );
    },
    ajax: function( s ) {
        return new $.Promise(function( resolve, reject ) {
            var data, xhr, timer, state, response, headers;

            s = $.extend( true, {}, $.ajaxSettings, s );

            // 1. 处理数据
            // 把数据转换成可以发送到服务器的格式
            if ( $.isPlainObject( s.data ) && s.processData ) {
                s.data = $.param( s.data, s.traditional );
            }

            // 如果是get请求，把数据添加到url后面
            if ( s.data && s.method.toLowerCase() === 'get' ) {
                s.url += ( s.url.indexOf('?') > -1 ? '&' : '?' ) + s.data;
                s.data = null;
            }

            // 2. 创建XMLHttpRequest对象
            xhr = new XMLHttpRequest();

            // 3. 初始化请求
            // 必须放在setRequestHeader方法之前
            xhr.open( s.method, s.url, s.async, s.username, s.password );

            // 4. 处理请求头
            headers = $.extend( {
                'X-Requested-With': 'XMLHttpRequest'
            }, s.headers );

            if ( s.data && s.processData ) {
                headers['Content-Type'] = s.contentType;
            }
            headers.Accept = s.responseType && s.accepts[ s.responseType ] ?
                s.accepts[ s.responseType ] + ', */*' :
                s.accepts._default;

            for ( var i in headers ) {
                xhr.setRequestHeader( i, headers[ i ] );
            }

            // 5. 设置是否携带cookie信息（用于跨域请求）
            xhr.withCredentials = s.withCredentials;

            // 6. 超时处理
            xhr.timeout = s.timeout;

            // 7. 设置响应的类型
            xhr.responseType = s.responseType;

            // 8. 绑定事件函数
            xhr.onreadystatechange = onreadystatechange;

            // 上传回调
            if ( xhr.upload && s.uploadProgress ) {
                xhr.upload.addEventListener('progress', function( ev ) {
                    s.uploadProgress.call( this, ev );
                });
            }
            // 下载回调
            if ( xhr.onprogress && s.downloadProgress ) {
                xhr.addEventListener('progress', function( ev ) {
                    s.downloadProgress.call( this, ev );
                });
            }

            // 9. 发送请求前的处理
            if ( s.beforeSend && ( s.beforeSend( xhr, s ) === false ) ) {
                xhr.abort();
                return false;
            }

            // 10. 发送请求
            xhr.send( s.data );

            function success() {
                if ( s.success ) {
                    s.success( response );
                }
                resolve( response  );
            }

            function error() {
                if ( s.error ) {
                    s.error( response );
                }
                reject( response );
            }

            function complete() {
                if ( s.complete ) {
                    s.complete( response );
                }
            }

            function onreadystatechange() {
                if ( xhr.readyState === 4 ) {
                    response = new Response( s, xhr, state );

                    ( s.validateStatus( xhr.status ) ? success : error )();

                    complete();
                }
            }
        });
    },
    getScript: function( url, callback ) {
        return new $.Promise(function( resolve, reject ) {
            var script = document.createElement('script');
            script.async = true;
            script.src = url;
            script.onload = function() {
                if ( callback ) {
                    callback();
                }
                resolve();
            };
            script.onerror = function() {
                reject();
            };
            document.head.appendChild( script );
        });
    },
    getStyle: function( url ) {
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = url;
        document.head.appendChild( link );
    },
    getJSON: function( url, data, callback ) {
        if ( typeof data === 'function' ) {
            callback = data;
            data = null;
        }

        return $.ajax({
            url: url,
            data: data,
            responseType: 'json',
            success: function( res ) {
                if ( typeof callback === 'function' ) {
                    callback( res.data );
                }
            }
        });
    }
});

['get', 'post', 'put', 'delete', 'head', 'patch'].forEach(function( method ) {
    $[ method ] = function( url, data, options ) {
        options = $.extend( {
            method: method.toUpperCase(),
            url: url,
            data: data
        }, options || {} );
        return $.ajax( options );
    };
});



/**
 * JSONP原理
 * =========
 * 利用 script 标签的 src 属性没有跨域限制的特性，
 * 浏览器端动态添加一个 script 标签，以 URL 查询字段的形式把数据提交到服务器。
 * 服务器端返回一段调用某个函数（唯一，由前端动态生成）的js代码，
 * 再以传递函数参数的形式，把数据传递到客户端。
 * 
 * php后台可能会有这样的处理：
 * $_GET['callbak'] . '(' . $data . ')';
 */

/**@doc
 * @name bat.jsonpSettings
 * @description 全局jsonp配置对象
 * @type {Object}
 * @property {Boolean}  cache=false        是否缓存数据
 * @property {Object}   data=''            发送到服务器的数据
 * @property {String}   scriptCharset=null 设置脚本的编码
 * @property {String}   name='callback'    回调函数字段名
 * @property {String}   callbackName=null  回调函数字段值（默认系统生成随机数）
 * @property {Boolean}  traditional=false  是否以传统方式处理数据（不加中括号）
 * @property {Function} success=null       成功回调
 * @property {Function} error=null         失败回调
 * @property {Function} complete=null      成功/失败回调
 */
$.jsonpSettings = {
    cache: false,
    data: '',
    scriptCharset: null,
    name: 'callback',
    callbackName: null,
    traditional: false,
    success: null,
    error: null,
    complete: null
};

/**@doc
 * @method bat.jsonp()
 * @description 发送一个jsonp请求，用于跨域请求数据。
 * @param  {String} url     发送get请求的URL
 * @param  {Object} options 配置选项对象，可通过修改 bat.jsonpSettings 对象来进行全局jsonp配置。
 * @return {Promise}        Promise对象
 */
$.jsonp = function( url, options ) {
    return new $.Promise(function( resolve, reject ) {
        var callbackName, script, head = document.head, segments = {};

        options = $.extend( true, {}, $.jsonpSettings, options );

        // 上传的数据
        if ( $.isPlainObject( options.data ) ) {
            $.extend( segments, options.data );
        }

        // 回调函数名字段
        callbackName = options.callbackName ||'jsonp' + Date.now() + ( Math.random() + '' ).slice(-8);
        segments[ options.name ] = callbackName;

        // 缓存字段
        if ( !options.cache ) {
            segments._t = Date.now();
        }

        // 生成url
        url += ( url.indexOf('?') > -1 ? '&' : '?' ) + $.param( segments, options.traditional );

        window[ callbackName ] = function( data ) {
            if ( options.success ) {
                options.success( data );
            }
            resolve( data );

            complete( data );
        };

        function complete() {
            if ( options.complete ) {
                options.complete();
            }
            head.removeChild( script );
            delete window[ callbackName ];
        }

        script = document.createElement('script');
        script.src = url;
        script.async = true;
        if ( options.scriptCharset ) {
            script.charset = scriptCharset;
        }

        script.onerror = function() {
            if ( options.error ) {
                options.error();
            }
            reject();
            complete();
        };

        // 异步请求，避免卡死
        setTimeout(function() {
            head.appendChild( script );
        }, 0);
    });
};