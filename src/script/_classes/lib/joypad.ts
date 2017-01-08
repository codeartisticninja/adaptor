"use strict";

/*
  joypad module for unified game controls

  @date 25-07-2016
 */

interface JoyTouch {
    id:any,
    cx:number,
    cy:number,
    side:string,
    btn:boolean,
    x:number,
    y:number,
    aTO?:any,
    bTO?:any
}

module joypad {
  export var  x           = 0,
              y           = 0,
              a           = false,
              b           = false,
              ap          = 0,
              bp          = 0,
              device      = localStorage.getItem("joypad.device"),
              mode        = "",
              stickRadius = 32,
              up          = false,
              down        = false,
              left        = false,
              right       = false,
              fire        = false,
              deltaX      = 0,
              deltaY      = 0,
              deltaA      = 0,
              deltaB      = 0,
              deltaUp     = 0,
              deltaDown   = 0,
              deltaLeft   = 0,
              deltaRight  = 0,
              deltaFire   = 0;
  var         _goingBack  = true,
              _suspended:string[],
              _keyboardEnabled  = false,
              _keyMap           = _getKeyMap(),
              _touchEnabled     = false,
              _touches:JoyTouch[],
              _gamepadEnabled   = false,
              _updateTO:number,
              _lastX = joypad.x,
              _lastY = joypad.y,
              _lastA = joypad.a,
              _lastB = joypad.b,
              _lastUp = joypad.up,
              _lastDown = joypad.down,
              _lastLeft = joypad.left,
              _lastRight = joypad.right,
              _lastFire = joypad.fire,
              _activatingGamepad = false;

  export function start(devices:string[] = ["keyboard", "touch", "gamepad"], autoUpdate:boolean = false) {
    if (_suspended != null) {
      for (var device of devices) {
        if (_suspended.indexOf(device) === -1) {
          _suspended.push(device);
        }
      }
      return;
    }
    for (var device of devices) {
      switch (device) {
        case "keyboard":
          if (!_keyboardEnabled) {
            document.body.addEventListener("keydown", _onKeyDown);
            document.body.addEventListener("keyup", _onKeyUp);
          }
          _keyboardEnabled = true;
          break;
        case "touch":
          if (!_touchEnabled) {
            document.body.addEventListener("touchstart", _onTouchDown);
            document.body.addEventListener("touchmove", _onTouchMove);
            document.body.addEventListener("touchend", _onTouchUp);
            _touches = [];
          }
          _touchEnabled = true;
          break;
        case "gamepad":
          if (_goingBack) {
            setTimeout(function() {
              _goingBack = false;
            }, 1000);
          }
          _gamepadEnabled = true;
      }
    }
    if (autoUpdate) {
      return joypad.autoUpdate();
    }
  }

  export function stop(devices:string[] = ["keyboard", "touch", "gamepad"]) {
    if (_suspended != null) {
      for (var device of devices) {
        var i = _suspended.indexOf(device);
        if (i !== -1) {
          _suspended.splice(i, 1);
        }
      }
      return;
    }
    for (var device of devices) {
      switch (device) {
        case "keyboard":
          if (_keyboardEnabled) {
            document.body.removeEventListener("keydown", _onKeyDown);
            document.body.removeEventListener("keyup", _onKeyUp);
          }
          _keyboardEnabled = false;
          break;
        case "touch":
          if (_touchEnabled) {
            document.body.removeEventListener("touchstart", _onTouchDown);
            document.body.removeEventListener("touchmove", _onTouchMove);
            document.body.removeEventListener("touchend", _onTouchUp);
          }
          _touchEnabled = false;
          break;
        case "gamepad":
          _gamepadEnabled = false;
      }
    }
    cancelAnimationFrame(_updateTO);
    joypad.x = joypad.y = 0;
    return joypad.a = joypad.b = false;
  }

  export function suspend() {
    if (_suspended != null) {
      return;
    }
    var devices:string[] = [];
    if (_keyboardEnabled) {
      devices.push("keyboard");
    }
    if (_touchEnabled) {
      devices.push("touch");
    }
    if (_gamepadEnabled) {
      devices.push("gamepad");
    }
    joypad.stop(devices);
    return _suspended = devices;
  }

  export function resume() {
    if (_suspended == null) {
      return;
    }
    var devices:string[] = _suspended;
    _suspended = null;
    joypad.start(devices);
  }

  export function update() {
    cancelAnimationFrame(_updateTO);
    if (_touchEnabled) {
      _scanTouches();
    }
    if (_gamepadEnabled) {
      _scanGamepad();
    }
    _roundAxis(this);
    if (joypad.ap > 0) {
      if (joypad.a) {
        joypad.ap--;
      }
      joypad.a = !joypad.a;
    }
    if (joypad.bp > 0) {
      if (joypad.b) {
        joypad.bp--;
      }
      joypad.b = !joypad.b;
    }
    joypad.up = Math.round(joypad.y) === -1;
    joypad.down = Math.round(joypad.y) === 1;
    joypad.left = Math.round(joypad.x) === -1;
    joypad.right = Math.round(joypad.x) === 1;
    joypad.fire = joypad.a || joypad.b;
    joypad.deltaX = joypad.x - _lastX;
    joypad.deltaY = joypad.y - _lastY;
    joypad.deltaA = (joypad.a?1:0) - (_lastA?1:0);
    joypad.deltaB = (joypad.b?1:0) - (_lastB?1:0);
    joypad.deltaUp = (joypad.up?1:0) - (_lastUp?1:0);
    joypad.deltaDown = (joypad.down?1:0) - (_lastDown?1:0);
    joypad.deltaLeft = (joypad.left?1:0) - (_lastLeft?1:0);
    joypad.deltaRight = (joypad.right?1:0) - (_lastRight?1:0);
    joypad.deltaFire = (joypad.fire?1:0) - (_lastFire?1:0);
    _lastX = joypad.x;
    _lastY = joypad.y;
    _lastA = joypad.a;
    _lastB = joypad.b;
    _lastUp = joypad.up;
    _lastDown = joypad.down;
    _lastLeft = joypad.left;
    _lastRight = joypad.right;
    _lastFire = joypad.fire;
  }

  export function autoUpdate() {
    joypad.update();
    return _updateTO = requestAnimationFrame(joypad.autoUpdate);
  }

  function _roundAxis(v:{x:number,y:number}) {
    var len:number, r:number;
    if (v === joypad) {
      r = 1;
    } else {
      r = joypad.stickRadius;
    }
    len = Math.sqrt(Math.pow(Math.abs(v.x), 2) + Math.pow(Math.abs(v.y), 2));
    v.x = v.x / Math.max(len, r);
    v.y = v.y / Math.max(len, r);
    return len;
  }

  /*
    Keyboard
   */
  function _onKeyDown(e:KeyboardEvent) {
    if (e.altKey || e.ctrlKey || e.metaKey) {
      return;
    }
    var speed = e.shiftKey ? 0.45 : 1;
    localStorage.setItem("joypad.device", joypad.device = "keyboard");
    switch (_keyMap[e.keyCode]) {
      case "left":
        joypad.x = -1;
        e.preventDefault();
        break;
      case "right":
        joypad.x = 1;
        e.preventDefault();
        break;
      case "up":
        joypad.y = -1;
        e.preventDefault();
        break;
      case "down":
        joypad.y = 1;
        e.preventDefault();
        break;
      case "a":
        joypad.a = true;
        e.preventDefault();
        break;
      case "b":
        joypad.b = true;
        e.preventDefault();
        break;
      default:
        console.log("keyCode:", e.keyCode, e);
    }
    joypad.x = Math.round(joypad.x) * speed;
    joypad.y = Math.round(joypad.y) * speed;
  }

  function _onKeyUp(e:KeyboardEvent) {
    switch (_keyMap[e.keyCode]) {
      case "left":
        joypad.x = Math.max(joypad.x, 0);
        break;
      case "right":
        joypad.x = Math.min(joypad.x, 0);
        break;
      case "up":
        joypad.y = Math.max(joypad.y, 0);
        break;
      case "down":
        joypad.y = Math.min(joypad.y, 0);
        break;
      case "a":
        joypad.a = false;
        break;
      case "b":
        joypad.b = false;
    }
    switch (e.keyCode) {
      case 68:
        _keyMap[83] = "down";
        break;
      case 76:
        _keyMap[83] = "right";
    }
    joypad.x = Math.round(joypad.x);
    joypad.y = Math.round(joypad.y);
  }

  function _getKeyMap() {
    var map:string[] = [],
        ctrls = {
          "left": [37, 65],
          "right": [39, 68],
          "up": [38, 87, 80],
          "down": [40, 83, 76],
          "a": [88, 69, 79, 32],
          "b": [90, 81, 75, 13]
        };
    for (var ctrl in ctrls) {
      var keys = ctrls[ctrl];
      for (var key of keys) {
        map[key] = ctrl;
      }
    }
    return map;
  }

  /*
    Touch
   */
  function _onTouchDown(e:TouchEvent) {
    localStorage.setItem("joypad.device", joypad.device = "touch");
    for (var j = 0; j < e.changedTouches.length; j++) {
      var touchEvent = e.changedTouches[j];
      var touch = _getTouch(touchEvent);
      if ((joypad.mode && touch.side === "right") || !joypad.mode) {
        touch.bTO = setTimeout(function() {
          joypad.b = true;
        }, 500);
      }
    }
    e.preventDefault();
  }

  function _onTouchMove(e:TouchEvent) {
    for (var j = 0; j < e.changedTouches.length; j++) {
      var touchEvent = e.changedTouches[j];
      var touch = _getTouch(touchEvent);
      touch.x = touchEvent.pageX - touch.cx;
      touch.y = touchEvent.pageY - touch.cy;
      var len = _roundAxis(touch);
      if (Math.abs(touch.x) + Math.abs(touch.y) > .2) {
        touch.btn = false;
        clearTimeout(touch.bTO);
      }
      if (touch.btn) {
        touch.x = touch.y = 0;
      }
      if (len > joypad.stickRadius) {
        touch.cx = touchEvent.pageX - touch.x * joypad.stickRadius;
        touch.cy = touchEvent.pageY - touch.y * joypad.stickRadius;
      }
    }
    e.preventDefault();
  }

  function _onTouchUp(e:TouchEvent) {
    for (var j = 0; j < e.changedTouches.length; j++) {
      var touchEvent = e.changedTouches[j];
      var touch = _getTouch(touchEvent);
      var i = _touches.indexOf(touch);
      _touches.splice(i, 1);
    }
    clearTimeout(touch.bTO);
    if (touch.btn) {
      if ((joypad.mode && touch.side === "right") || !joypad.mode) {
        if (joypad.b) {
          joypad.b = false;
        } else {
          joypad.ap++;
        }
      }
    } else {
      joypad.a = joypad.b = false;
    }
  }

  function _getTouch(touchEvent:Touch) {
    var touch:JoyTouch;
    for (var t of _touches) {
      if (t.id === touchEvent.identifier) {
        touch = t;
      }
    }
    if (!touch) {
      touch = {
        id: touchEvent.identifier,
        cx: touchEvent.pageX,
        cy: touchEvent.pageY,
        side: null,
        btn: true,
        x: 0,
        y: 0
      };
      touch.side = touch.cx<document.body.clientWidth/2?"left":"right";
      _touches.push(touch);
    }
    return touch;
  }

  function _scanTouches() {
    if (joypad.device === "touch") {
      joypad.x = joypad.y = 0;
      for (var touch of _touches) {
        switch (joypad.mode) {
          case "rc":
            if (touch.side === "left") {
              joypad.x = touch.x;
            } else {
              joypad.y = touch.y;
            }
            break;
          
          case "rpg":
            if (touch.side === "left") {
              joypad.x = touch.x;
              joypad.y = touch.y;
            } else if (Math.round(touch.y-touch.x) < 0) {
              joypad.a = true;
            } else if (Math.round(touch.y - touch.x) > 0) {
              joypad.b = true;
            } else if (!touch.btn) {
              joypad.a = joypad.b = false;
            }
            break;
          
          default:
            if (Math.abs(touch.x) > Math.abs(joypad.x)) {
              joypad.x = touch.x;
            }
            if (Math.abs(touch.y) > Math.abs(joypad.y)) {
              joypad.y = touch.y;
            }
            break;
        }
      }
    }
  }

  /*
    Gamepad
   */
  function _scanGamepad() {
    var gamepad = navigator.getGamepads != null ? navigator.getGamepads()[0] : null,
        btn:GamepadButton;
    if (gamepad != null ? gamepad.buttons[0].pressed : void 0) {
      _activatingGamepad = true;
    }
    if (_activatingGamepad && !(gamepad != null ? gamepad.buttons[0].pressed : void 0)) {
      localStorage.setItem("joypad.device", joypad.device = "gamepad");
      _activatingGamepad = false;
    }
    if (joypad.device === "gamepad") {
      if (gamepad == null) {
        return joypad.device = null;
      }
      joypad.x = gamepad.axes[0] || 0;
      if (joypad.mode === "rc") {
        joypad.y = gamepad.axes[3] || 0;
      } else {
        joypad.y = gamepad.axes[1] || 0;
      }
      if (Math.abs(joypad.x) + Math.abs(joypad.y) < .2) {
        joypad.x = joypad.y = 0;
      }
      joypad.a = false;
      joypad.b = false;
      if (joypad.mode === "rpg") {
        joypad.a = joypad.a || ((btn = gamepad.buttons[0]) ? btn.pressed : false);
        joypad.b = joypad.b || ((btn = gamepad.buttons[1]) ? btn.pressed : false);
        joypad.b = joypad.b || ((btn = gamepad.buttons[2]) ? btn.pressed : false);
        joypad.a = joypad.a || ((btn = gamepad.buttons[3]) ? btn.pressed : false);
      } else {
        joypad.a = joypad.a || ((btn = gamepad.buttons[0]) ? btn.pressed : false);
        joypad.b = joypad.b || ((btn = gamepad.buttons[2]) ? btn.pressed : false);
        if ((btn = gamepad.buttons[1]) && btn.pressed) {
          joypad.y = -1;
        }
        if ((btn = gamepad.buttons[3]) && btn.pressed) {
          joypad.y = 1;
        }
      }
      if ((btn = gamepad.buttons[8]) && btn.pressed) {
        if (!_goingBack) {
          history.back();
          _goingBack = true;
          setTimeout(function() {
            return _goingBack = false;
          }, 1000);
        }
      }
      if ((btn = gamepad.buttons[9]) && btn.pressed) {
        var el:any = document.querySelector(":focus");
        if (el) {
          el.click();
        }
      }
      if ((btn = gamepad.buttons[12]) && btn.pressed) {
        joypad.y = -1;
      }
      if ((btn = gamepad.buttons[13]) && btn.pressed) {
        joypad.y = 1;
      }
      if ((btn = gamepad.buttons[14]) && btn.pressed) {
        joypad.x = -1;
      }
      if ((btn = gamepad.buttons[15]) && btn.pressed) {
        joypad.x = 1;
      }
    }
    return gamepad;
  }
};

export = joypad;
