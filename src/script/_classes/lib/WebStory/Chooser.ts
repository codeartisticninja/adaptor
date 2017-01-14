/// <reference path="../../../_d.ts/node.d.ts"/>
"use strict";
import Teller = require("./Teller");
import WebStory = require("./WebStory");


/**
 * Chooser class
 * 
 * @date 16-01-2017
 */

class Chooser extends Teller {

  constructor(story:WebStory, element:HTMLElement) {
    super(story, element);
    element.style.display = "none";
    this.pause();
    var delay = -500;
    for (var i=0;i<element.children.length;i++) {
      var child = element.children.item(i);
      if (child instanceof Element) {
        var title = child.getAttribute("title") || child.firstElementChild.textContent;
        child.innerHTML = '<a href="javascript:void(0)"></a>';
        var a = child.querySelector("a");
        a.textContent = title;
        a.addEventListener("click", this._createChooseFn(child.id));
      }
    }
  }

  goOn() {
    this.hurry();
  }

  hurry() {
    if (this.element.getAttribute("style")) {
      this.element.classList.add("hidden");
      this.element.removeAttribute("style");
      setTimeout(()=>{ this.element.classList.remove("hidden"); }, 50);
      // this._startDodging();
    } else {
      clearTimeout(this._dodgeTO);
      setTimeout(()=>{ this.element.classList.add("hidden"); }, 512);
      this._dodgeTO = setTimeout(()=>{ this.element.classList.remove("hidden"); }, 2048);
    }
  }

  /*
    _privates
  */
  private _lastDodge=0;
  private _elementToDodge:HTMLElement;
  private _dodgeTO:any;

  private _createChooseFn(id:string) {
    var _t = this;
    return function() {
      _t._showChoice(id);
      setTimeout(function(){
        setTimeout(function(){
          _t.removeElement();
          _t._stopDodging();
        }, 1024);
        _t.story.newSection();
        _t.story.goTo("#"+id, _t);
      }, 512);
    }
  }

  private _showChoice(id:string) {
    var _t = this;
    var p = this.element, i:number;
    var option:Element, options = p.children;
    setTimeout(function() {
      p.classList.add("hidden");
    }, 256);
    for (i=0;i<options.length;i++) {
      option = options.item(i);
      if (option.id === id) {
        option.classList.add("shown");
      } else {
        option.classList.add("hidden");
      }
    }
  }

  private _startDodging() {
    var el = <HTMLElement>this.story.displayElement;
    this._elementToDodge = null;
    this._dodge = this._dodge.bind(this);
    while (el && !this._elementToDodge) {
      if (el.scrollTop > 8) {
        this._elementToDodge = el;
      }
      el = el.parentElement;
    }
    this._elementToDodge.addEventListener("scroll", this._dodge);
  }

  private _stopDodging() {
    this._elementToDodge.removeEventListener("scroll", this._dodge);
  }

  private _dodge() {
    var thisDodge = this._elementToDodge.scrollTop;
    if (thisDodge > this._lastDodge) {
      this.element.classList.remove("hidden");
    }
    if (thisDodge < this._lastDodge) {
      this.element.classList.add("hidden");
    }
    this._lastDodge = thisDodge;
  }


}
export = Chooser;
