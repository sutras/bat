/**
 * 移动端支持的四个事件
 * --------------------
 * touchstart：
 * 当在屏幕上按下手指时触发
 * 
 * touchmove：
 * 当在屏幕上移动手指时触发
 * 
 * touchend：
 * 当在屏幕上抬起手指时触发
 * 
 * touchcancel：
 * 当一些更高级别的事件发生的时候（如电话接入或者弹出信息）会触发touchcancel，
 * 一般会在touchcancel时暂停游戏、存档等操作。
 */

/**
 * TouchList对象，以下属性都可以获取TouchList对象
 * ----------------------------------------------
 * changedTouches：
 * 涉及当前事件的所有手指的列表
 *
 * targetTouches：
 * 位于该元素上的所有手指的列表
 *
 * touches：
 * 位于屏幕上的所有手指的列表
 */

/**
 * pageX pageY 
 * clientX clientY offsetX offsetY screenX screenY layerX layerY
 */

/**
 * doubletap 事件思路
 * ------------------
 * 1. 两次tap成立
 * 2. 两次tap间隔时间不超过指定值
 * 3. 两次tap距离不超过指定大小
 *
 * tap1结束之后，获取手指离开屏幕时的时间 lastTapTime，以及坐标 lastTapPoint
 * tap2结束之后，用 tap2的startTime - lastTapTime，大于，不成立；小于，继续往下
 * 用tap2 startPoint 和 lastTapPoint进行计算，距离大于指定值，不成立，否则，成立
 * 
 * 成立时，清除数据
 * 不成立时，把tap2 当做下一次doubletap的tap1
 */

/**
 * press 事件思路
 * --------------
 * 手指按下，指定时间后，如果手指一直在屏幕上，且移动的距离不超过指定值，则发送事件
 */

/**
 * pan 事件
 * --------
 * panleft、panright、panup、pandown：手指在屏幕上平移时会持续触发
 *
 * 实现：
 * panmove时把手指前一次坐标和当前坐标做一个计算，根据角度值来区分方向
 */

/**
 * 两根筷子思路（用于rotate和pinch）
 * --------------------------------
 * 必须得有且只有两根手指。
 * 获取最先接触屏幕的两根手指A、B，期间忽略其他添加进来的手指。
 * 如果A、B其中一个（比如A）离开屏幕，
 * 则把A离开后再添加进来的手指（比如C）和仍在屏幕的B组成一双筷子。
 * 如果A、B都离开屏幕，则把手指A、B离开后再添加进来的两根手指组合成一双筷子。
 *
 * 创建一个数组用来存放组成筷子的手指。数组的长度为2，存放的是手指的identifier。
 *
 * target问题：
 * 如果组成筷子的两根手指都离开屏幕，则把新添加进来的第一根手指所在的target作为新的target。
 * 如果两根手指同时触碰屏幕，则取changedTouches的第一个元素的target。
 * 否则都使用旧的target。
 * 所以这个数组还将用来保存target。
 *
 * 问题：
 * 在chopsticks.remove()方法中，如果快速接触屏幕并松开（快速点击），当chopsticks长度小于2时，
 * 此手指会被保存到chopsticks里，且不会被删除（即使手指离开了屏幕）。
 */

/**
 * rotate思路
 * ----------
 * 最主要和最重要的点就是以下的代码了（高手写的代码，还没研读明白。。。惭愧。。。）
 * 
 *  chopsticks.rotation = chopsticks.getAngle() - chopsticks.startAngle;
 *  
 *  while ( Math.abs( chopsticks.rotation - chopsticks.beforeRotation ) > 90 &&
 *          count++ < 50 ) {
 *      if ( chopsticks.beforeRotation < 0 ) {
 *          chopsticks.rotation -= 180;
 *      } else {
 *          chopsticks.rotation += 180;
 *      }
 *  }
 */


;(function( $ ) {
    var utils = {};

    // 判断是否支持touch事件
    utils.supportTouch = 'ontouchstart' in window;

    // 计算两点之间的距离
    utils.getTowPointsDistance = function( p1, p2 ) {
        return Math.sqrt( Math.pow( p1.x - p2.x, 2 ) + Math.pow( p1.y - p2.y, 2 ) );
    };

    // 根据箭头获取角度，值的范围是：-PI到PI
    utils.getAngleAtan2 = function( p1, p2 ) {
        return Math.atan2( p2.y - p1.y, p2.x - p1.x ) * 180 / Math.PI;
    };

    // 根据箭头获取角度，值的范围是：0到PI
    utils.getAngle180 = function( p1, p2 ) {
        var angle = Math.atan( (p1.y - p2.y) / (p2.x - p1.x) ) * 180 / Math.PI;
        return angle < 0 ? angle + 180 : angle;
    };

    // 根据角度返回方向
    utils.getDirFromAngle = function( angle ) {
        var dir = {
            right: angle <= 45 && angle >= -45,
            left: angle <= -135 || angle >= 135,
            up: angle < -45 && angle > -135,
            down: angle < 135 && angle > 45
        };
        for ( var d in dir ) {
            if ( dir[d] ) {
                return d;
            }
        }
    };

    // 获取事件发生时在屏幕上的手指数
    utils.getLenOfTouches = function( ev ) {
        return ev.touches ? ev.touches.length : 
            isMouseDown ? 1 : 0;
    };

    // 获取事件发生时在屏幕上的所有手指的位置
    utils.getPosOfTouches = function( ev ) {
        var pos = [], i = 0, touch;
        if ( utils.supportTouch ) {
            for ( ; (touch = ev.touches[i++]); ) {
                pos.push({
                    x: touch.pageX,
                    y: touch.pageY
                });
            }
        } else {
            pos.push({
                x: ev.pageX,
                y: ev.pageY
            });
        }
        return pos;
    };


    /************************************************
     * fingers对象
     * 保存在屏幕中的所有的手指，手指离开屏幕会被删除
     */

    // 保存所有手指的信息
    var fingers = {
        // 记录按下时手指的信息
        add: function( touches, callback ) {
            var i = 0, touch, finger;

            for ( ; (touch = touches[i++]); ) {
                finger = this[ touch.identifier ] = {
                    startPoint: {
                        x: touch.pageX,
                        y: touch.pageY
                    },
                    recordPoint: {
                        x: touch.pageX,
                        y: touch.pageY
                    },
                    currentPoint: {
                        x: touch.pageX,
                        y: touch.pageY
                    },
                    tracks: [
                        {
                            x: touch.pageX,
                            y: touch.pageY,
                            time: Date.now()
                        }
                    ],
                    startTime: Date.now(),
                    currentTime: Date.now(),
                    startTarget: touch.target
                };

                if ( typeof callback === 'function' ) {
                    callback( finger );
                }
            }
        },

        // 更新在屏幕上的手指的信息
        update: function( touches, callback ) {
            var i = 0, touch, finger, tracks;

            for ( ; (touch = touches[i++]); ) {
                finger = this[ touch.identifier ];

                finger.currentPoint = {
                    x: touch.pageX,
                    y: touch.pageY
                };
                finger.currentTime = Date.now();

                if ( typeof callback === 'function' ) {
                    callback( finger );
                }
            }
        },

        // 更新轨迹
        updateTracks: function( finger, callback ) {
            var i = 0, tracks;

            // 更新轨迹
            tracks = finger.tracks;
            tracks.push({
                x: finger.currentPoint.x,
                y: finger.currentPoint.y,
                time: Date.now()
            });
            if ( tracks.length > 3  ) {
                tracks.splice( 0, tracks.length - 3 );
            }

            if ( typeof callback === 'function' ) {
                callback( finger );
            }
        },

        // 移除掉不在屏幕上的手指的信息
        // touchend 事件触发时调用
        remove: function( touches ) {
            var i = 0, touch;

            for ( ; (touch = touches[i++]); ) {
                delete this[ touch.identifier ];
            }
        },

        // 获取起始点到当前点（结束点）之间的距离
        getStartDistance: function( finger ) {
            return utils.getTowPointsDistance( finger.startPoint, finger.currentPoint );
        },

        // 获取记录点到当前点之间的距离
        getRecordDistance: function( finger ) {
            return utils.getTowPointsDistance( finger.recordPoint, finger.currentPoint );
        },

        // 获取从起始点到结束点的方向
        getDirWhenEnd: function( finger ) {
            var angle = utils.getAngleAtan2( finger.startPoint, finger.currentPoint );
            return utils.getDirFromAngle( angle );
        },

        // 获取记录点到当前点的方向
        getDirWhenMoving: function( finger ) {
            var angle = utils.getAngleAtan2( finger.recordPoint, finger.currentPoint );
            return utils.getDirFromAngle( angle );
        },

        getSpeed: function( finger ) {
            var tracks = finger.tracks, distance, duration,
                len = tracks.length, before, after;

            if ( len < 2 ) {
                return 0;
            }

            if ( len === 2 ) {
                before = tracks[0];
                after = tracks[1];
            } else {
                before = tracks[ len - 3];
                after = tracks[ len - 2];
            }

            distance = utils.getTowPointsDistance( before, after );
            duration = after.time - before.time;
            return distance / duration || 0;
        },

        // 获取一根手指的有效期（从按下到抬起之间的时间）
        getExpires: function( finger ) {
            return finger.currentTime - finger.startTime;
        }
    };



    /*******************************************
     * chopsticks 对象
     */
    // 筷子，两根足以
    var chopsticks = [];
    chopsticks.beforeRotation = chopsticks.rotation = 0;

    // 判断是否是一双筷子
    chopsticks.isPaired = function() {
        return this.length === 2;
    };

    // 更新筷子，如果返回true，说明筷子数由0或1变为2
    chopsticks.update = function( /*changedTouches*/touches ) {
        var len = this.length, changed;

        switch ( len ) {
            case 0:
                this.target = touches[0].target;
                this.push( touches[0].identifier );
                if ( touches.length > 1 ) {
                    this.push( touches[1].identifier );
                }
                break;
            case 1:
                this.push( touches[0].identifier );
                break;
        }

        changed = len !== this.length;

        if ( changed && this.length === 2 ) {
            return true;
        }
    };

    // 移除筷子，如果返回true，说明筷子由两根变少
    chopsticks.remove = function( /*changedTouches*/touches, ev ) {
        var i = 0, j = 0, touch, identifier,
            len = this.length, changed;

        for ( ; (touch = touches[i++]); ) {
            for ( ; j < len; ) {
                if ( touch.identifier === this[j++] ) {
                    this.splice(--j, 1);
                }
            }
        }

        changed = len !== this.length;

        /**！！！！！！！！！！！！！！！！！！！！！
         * 这条语句非常有用，解决了一个大bug：
         * 当两根手指同时接触屏幕时，bug就产生了，只会触发pinchend事件，
         * 而pinchstart和pinchmove永远不会触发，目前还找不到原因。
         * 但是，通过判断如果没有手指在屏幕上，则清空chopsticks数组，似乎可以解决问题。
         */
        if ( utils.getLenOfTouches(ev) === 0 ) {
            chopsticks.length = 0;
        }

        if ( changed && len === 2 ) {
            return true;
        }
    };

    // 获取两根筷子间的距离
    chopsticks.getDistance = function() {
        return utils.getTowPointsDistance( fingers[this[0]].currentPoint, fingers[this[1]].currentPoint );
    };

    // 获取两根筷子间的角度
    chopsticks.getAngle = function() {
        var p1 = fingers[this[0]].currentPoint;
        var p2 = fingers[this[1]].currentPoint;
        return parseInt( utils.getAngle180(p1, p2), 10 );
    };

    // 判断移动的是否是筷子
    chopsticks.isMove = function( /*changedTouches*/touches ) {
        for ( var i = 0, touch; (touch = touches[i++]); ) {
            for ( var j = 0, id; (id = this[j++]); ) {
                if ( touch.identifier === id ) {
                    return true;
                }
            }
        }
    };


    // 配置
    var config = {
        tap: true,  // 是否支持tap事件
        doubletap: true,  // 是否支持doubletap事件
        tapMaxTime: 650,  // 触发单击的最大时长
        tapMaxDistance: 5,  // 触发单击的最大误差距离
        doubleTabMaxTime: 300,  // 双击间的最大时长
        doubleTabMaxDistance: 45,  // 双击间的最大误差距离

        press: true,  // 是否支持按压事件
        pressMinTime: 650,  // 触发按压的最小时长
        pressMaxDistance: 5,  // 触发按压的最大误差距离

        swipe: true,  // 是否支持滑动事件
        swipeMaxTime: 300,  // 触发滑动的最大时长
        swipeMinDistance: 30,  // 触发滑动的最小距离

        pan: true,  // 是否支持pan事件
        panInterval: 20,  // 多长时间存储一下当前点坐标
        panMinDistance: 5,  // 前后滑动需要超过的距离

        rotate: false,  // 是否支持rotate事件

        pinch: false,  // 是否支持pinch事件
        pinchMinDistance: 5,  // 前后缩放至少要大于此距离
    };

    var eventList = {
        TAP: 'tap',
        DOUBLE_TAP: 'doubletap',

        PRESS_DOWN: 'pressdown',
        PRESS_MOVE: 'pressmove',
        PRESS_UP: 'pressup',

        PAN_START: 'panstart',
        PAN_MOVE: 'panmove',
        PAN_END: 'panend',
        PAN_CANCEL: 'pancancel',
        PAN_LEFT: 'panleft',
        PAN_RIGHT: 'panright',
        PAN_UP: 'panup',
        PAN_DOWN: 'pandown',

        SWIPE: 'swipe',
        SWIPE_LEFT: 'swipeleft',
        SWIPE_RIGHT: 'swiperight',
        SWIPE_UP: 'swipeup',
        SWIPE_DOWN: 'swipedown',

        PINCH_START: 'pinchstart',
        PINCH_MOVE: 'pinchmove',
        PINCH_END: 'pinchend',
        PINCH_IN: 'pinchin',
        PINCH_OUT: 'pinchout',

        ROTATE_START: 'rotatestart',
        ROTATE_MOVE: 'rotatemove',
        ROTATE_END: 'rotateend',
        ROTATE_LEFT: 'rotateleft',
        ROTATE_RIGHT: 'rotateright',
    };

    var lastTapTime = 0;  // 记录最后一次tap的时间
    var lastTapPoint = null;  // 记录最后一次tap的坐标
    var doubleTapStatus = 0;  // 双击成立的状态

    var isMouseDown = false;

    var gestures = {
        tap: function( ev, finger ) {
            var eventObj;

            if ( !config.tap ) {
                return;
            }

            if ( fingers.getExpires( finger ) <= config.tapMaxTime &&
                    fingers.getStartDistance( finger ) <= config.tapMaxDistance ) {

                eventObj = {
                    originalEvent: ev,
                    x: finger.currentPoint.x,
                    y: finger.currentPoint.y
                };

                // 触发tap事件
                $( finger.startTarget ).trigger( eventList.TAP, eventObj );

                doubleTapStatus++;

                if ( doubleTapStatus === 2 ) {
                    if ( finger.startTime - lastTapTime <= config.doubleTabMaxTime &&
                            utils.getTowPointsDistance( lastTapPoint, finger.startPoint ) <= config.doubleTabMaxDistance ) {
                        $( finger.startTarget ).trigger( eventList.DOUBLE_TAP, eventObj );
                        doubleTapStatus = 0;
                    } else {
                        doubleTapStatus--;
                    }
                }

                lastTapTime = Date.now();
                lastTapPoint = {
                    x: finger.currentPoint.x,
                    y: finger.currentPoint.y
                };
            }
        },
        swipe: function( ev, finger ) {
            var eventObj, direction;

            if ( !config.swipe ) {
                return;
            }

            if ( fingers.getExpires( finger ) <= config.swipeMaxTime &&
                    fingers.getStartDistance( finger ) >= config.swipeMinDistance ) {

                direction = fingers.getDirWhenEnd( finger );

                eventObj = {
                    originalEvent: ev,
                    direction: direction
                };

                $( finger.startTarget ).trigger( eventList.SWIPE, eventObj);

                switch ( direction ) {
                    case 'up':
                        $( finger.startTarget ).trigger( eventList.SWIPE_UP, eventObj);
                        break;
                    case 'down':
                        $( finger.startTarget ).trigger( eventList.SWIPE_DOWN, eventObj);
                        break;
                    case 'right':
                        $( finger.startTarget ).trigger( eventList.SWIPE_RIGHT, eventObj);
                        break;
                    case 'left':
                        $( finger.startTarget ).trigger( eventList.SWIPE_LEFT, eventObj);
                        break;
                }
            }
        },
        press: {
            down: function( ev, finger ) {
                if ( !config.press ) {
                    return;
                }

                finger.pressTimer = setTimeout(function() {
                    if ( fingers.getStartDistance( finger ) <= config.pressMaxDistance ) {
                        finger.isPress = true;
                        $( finger.startTarget ).trigger( eventList.PRESS_DOWN, {
                            originalEvent: ev,
                            x: finger.currentPoint.x,
                            y: finger.currentPoint.y
                        });
                    }
                }, config.pressMinTime);
            },
            move: function( ev, finger ) {
                if ( !config.press ) {
                    return;
                }

                if ( finger.isPress ) {
                    $( finger.startTarget ).trigger( eventList.PRESS_MOVE, {
                        originalEvent: ev,
                        x: finger.currentPoint.x,
                        y: finger.currentPoint.y
                    });
                }
            },
            up: function( ev, finger ) {
                if ( !config.press ) {
                    return;
                }

                if ( finger.pressTimer ) {
                    clearTimeout( finger.pressTimer );
                    finger.pressTimer = null;
                }
                if ( finger.isPress ) {
                    finger.isPress = false;
                    $( finger.startTarget ).trigger( eventList.PRESS_UP, {
                        originalEvent: ev,
                        x: finger.currentPoint.x,
                        y: finger.currentPoint.y
                    });
                }
            }
        },
        pan: {
            down: function( ev, finger ) {
                if ( !config.pan ) {
                    return;
                }

                $( ev.target ).trigger( eventList.PAN_START, {
                    originalEvent: ev
                });
                finger.panTimer = setInterval(function() {
                    fingers.updateTracks( finger );
                }, config.panInterval);
            },
            move: function( ev, finger ) {
                var eventObj, direction;

                if ( !config.pan ) {
                    return;
                }

                if ( fingers.getRecordDistance( finger ) >= config.panMinDistance ) {
                    direction = fingers.getDirWhenMoving( finger );
                    eventObj = {
                        originalEvent: ev,
                        direction: direction,
                        x: finger.currentPoint.x,
                        y: finger.currentPoint.y
                    };

                    $( ev.target ).trigger( eventList.PAN_MOVE, eventObj);

                    switch ( direction ) {
                        case 'up':
                            $( finger.startTarget ).trigger( eventList.PAN_UP, eventObj);
                            break;
                        case 'down':
                            $( finger.startTarget ).trigger( eventList.PAN_DOWN, eventObj);
                            break;
                        case 'right':
                            $( finger.startTarget ).trigger( eventList.PAN_RIGHT, eventObj);
                            break;
                        case 'left':
                            $( finger.startTarget ).trigger( eventList.PAN_LEFT, eventObj);
                            break;
                    }

                    finger.recordPoint.x = finger.currentPoint.x;
                    finger.recordPoint.y = finger.currentPoint.y;
                }
            },
            up: function( ev, finger ) {
                if ( !config.pan ) {
                    return;
                }

                ev.speed = fingers.getSpeed( finger );
                $( ev.target ).trigger( eventList.PAN_END, {
                    originalEvent: ev,
                    x: finger.currentPoint.x,
                    y: finger.currentPoint.y,
                    speed: fingers.getSpeed( finger )
                });

                if ( finger.panTimer ) {
                    clearInterval( finger.panTimer );
                    finger.panTimer = null;
                }
            }
        },
        rotate: {
            down: function( ev ) {
                if ( !config.rotate ) {
                    return;
                }

                chopsticks.startAngle = chopsticks.getAngle();
                $( chopsticks.target ).trigger( eventList.ROTATE_START, {
                    originalEvent: ev,
                    rotation: chopsticks.rotation
                });
            },
            move: function( ev ) {
                var eventType, count = 0, eventObj;
                if ( !config.rotate ) {
                    return;
                }

                /**************************
                 * 没研读明白就直接拿来用了
                 */
                chopsticks.rotation = chopsticks.getAngle() - chopsticks.startAngle;

                while ( Math.abs( chopsticks.rotation - chopsticks.beforeRotation ) > 90 &&
                        count++ < 50 ) {
                    if ( chopsticks.beforeRotation < 0 ) {
                        chopsticks.rotation -= 180;
                    } else {
                        chopsticks.rotation += 180;
                    }
                }
                // **************************

                // 角度较之前有所改变才触发事件
                if ( chopsticks.rotation !== chopsticks.beforeRotation ) {
                    chopsticks.beforeRotation = chopsticks.rotation;

                    eventObj = {
                        originalEvent: ev,
                        rotation: chopsticks.rotation
                    };

                    $( chopsticks.target ).trigger( eventList.ROTATE_MOVE, eventObj);

                    eventType = chopsticks.rotation > 0 ? eventList.ROTATE_RIGHT: eventList.ROTATE_LEFT;

                    $( chopsticks.target ).trigger( eventType, eventObj);
                }
            },
            up: function( ev ) {
                if ( !config.rotate ) {
                    return;
                }

                chopsticks.beforeRotation = 0;

                $( chopsticks.target ).trigger( eventList.ROTATE_END, {
                    originalEvent: ev
                });
            },
        },
        pinch: {
            down: function( ev ) {
                if ( !config.pinch ) {
                    return;
                }

                chopsticks.beforeDistance = chopsticks.startDistance = chopsticks.getDistance();
                $( chopsticks.target ).trigger( eventList.PINCH_START, {
                    originalEvent: ev
                });
            },
            move: function( ev ) {
                var isOut, isIn;
                if ( !config.pinch ) {
                    return;
                }

                chopsticks.distance = chopsticks.getDistance();
                chopsticks.scale = chopsticks.distance / chopsticks.startDistance;

                isOut = chopsticks.distance - chopsticks.beforeDistance >= config.pinchMinDistance;
                isIn = chopsticks.beforeDistance - chopsticks.distance >= config.pinchMinDistance;

                if ( isOut || isIn ) {
                    $( chopsticks.target ).trigger( eventList.PINCH_MOVE, {
                        originalEvent: ev,
                        scale: chopsticks.scale
                    });
                    if ( isOut ) {
                        $( chopsticks.target ).trigger( eventList.PINCH_OUT, {
                            originalEvent: ev,
                            scale: chopsticks.scale
                        });
                    } else if ( isIn ) {
                        $( chopsticks.target ).trigger( eventList.PINCH_IN, {
                            originalEvent: ev,
                            scale: chopsticks.scale
                        });
                    }
                    chopsticks.beforeDistance = chopsticks.distance;
                }
            },
            up: function( ev ) {
                if ( !config.pinch ) {
                    return;
                }

                $( chopsticks.target ).trigger( eventList.PINCH_END, {
                    originalEvent: ev
                });
            }
        }
    };

    function unifiedHandler( ev ) {
        var type = ev.type,
            target = ev.target,
            i = 0, touch, finger, touches;

        if ( utils.supportTouch ) {
            touches = ev.changedTouches;
        } else {
            ev.identifier = 0;
            touches = [ ev ];
        }

        switch ( type ) {
            case 'touchstart':
            case 'mousedown':
                if ( !utils.supportTouch ) {
                    isMouseDown = true;
                }

                fingers.add(touches, function( finger ) {
                    gestures.pan.down( ev, finger );
                    gestures.press.down( ev, finger );
                });

                if ( config.rotate || config.pinch ) {
                    // 凑齐筷子
                    if ( chopsticks.update( touches ) ) {
                        gestures.pinch.down( ev );
                        gestures.rotate.down( ev );
                    }
                }

                break;
            case 'touchmove':
            case 'mousemove':
                if ( !utils.supportTouch && !isMouseDown ) {
                    return;
                }

                fingers.update(touches, function( finger ) {
                    gestures.pan.move( ev, finger );
                    gestures.press.move( ev, finger );
                });

                if ( (config.rotate || config.pinch) && chopsticks.isPaired() && 
                        chopsticks.isMove( touches ) ) {
                    gestures.pinch.move( ev );
                    gestures.rotate.move( ev );
                }

                break;
            case 'touchend':
            case 'touchcancel':
            case 'mouseup':
            // case 'mouseout':
                if ( !utils.supportTouch ) {
                    isMouseDown = false;
                }

                fingers.update(touches, function( finger ) {
                    gestures.tap( ev, finger );
                    gestures.swipe( ev, finger );
                    gestures.pan.up( ev, finger );
                    gestures.press.up( ev, finger );
                });

                if ( config.rotate || config.pinch ) {
                    // 缺少筷子
                    if ( chopsticks.remove( touches, ev ) ) {
                        gestures.pinch.up( ev );
                        gestures.rotate.up( ev );
                    }
                }

                fingers.remove( touches );
                break;
        }
    }

    // 初始化
    (function() {
        var i, type,
            touchEvents = 'touchstart touchmove touchend touchcancel',
            mouseEvents = 'mousedown mousemove mouseup',
            supportedEvents = utils.supportTouch ? touchEvents : mouseEvents;

        supportedEvents = supportedEvents.match(/\S+/g);

        // 需要主动启动touch才能使用touch事件，如：
        // $.touch.start();
        // 配置要在开启之前
        // 也可以停止监听touch事件，如：
        // $.touch.stop();
        $.touch = {
            start: function () {
                this.stop();
                
                for ( i = 0; (type = supportedEvents[i++]); ) {
                    $(document).on( type, unifiedHandler );
                }
            },
            stop: function() {
                for ( i = 0; (type = supportedEvents[i++]); ) {
                    $(document).off( type, unifiedHandler );
                }
            },
            setOptions: function( options ) {
                $.extend( config, options || {} );
            }
        };
    })();
})( bat );