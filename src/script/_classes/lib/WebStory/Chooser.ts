/// <reference path="../../../_d.ts/node.d.ts"/>
"use strict";
import Teller = require("./Teller");
import WebStory = require("./WebStory");


/**
 * Chooser class
 * 
 * @date 09-01-2017
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
    }
  }

  /*
    _privates
  */
  private _createChooseFn(id:string) {
    var _t = this;
    return function() {
      _t._showChoice(id);
      setTimeout(function(){
        setTimeout(function(){
          _t.removeElement();
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


}
export = Chooser;
