/// <reference path="../../../_d.ts/node.d.ts"/>
"use strict";
import Teller = require("./Teller");
import WebStory = require("./WebStory");


/**
 * Chooser class
 * 
 * @date 30-01-2017
 */

class Chooser extends Teller {

  constructor(story:WebStory, element:HTMLElement) {
    super(story, element);
    /* element.style.display = "none";
    this.pause(); */
    for (var i=0;i<element.children.length;i++) {
      var child = element.children.item(i);
      if (child instanceof Element) {
        if (!child.getAttribute("title")) child.setAttribute("title", child.firstElementChild.textContent);
        var title = child.getAttribute("title");
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
  private _lastDodge=0;
  private _elementToDodge:HTMLElement;
  private _dodgeTO:any;

  private _createChooseFn(id:string) {
    var _t = this;
    return function() {
      _t.story.trackEvent(_t.element.querySelector("#"+id).getAttribute("title"));
      _t._showChoice(id);
      _t.story.newSection();
      _t.story.goTo("#"+id, _t);
    }
  }

  private _showChoice(id:string) {
    var _t = this;
    var p = this.element, i:number;
    var option:Element, options = p.children;
    p.classList.add("hidden");
    for (i=0;i<options.length;i++) {
      option = options.item(i);
      if (option.id === id) {
        option.classList.add("shown");
      } else {
        option.classList.add("hidden");
      }
    }
    setTimeout(function(){
      _t.removeElement();
    }, 4096);
  }

}
export = Chooser;
