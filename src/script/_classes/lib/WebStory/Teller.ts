/// <reference path="../../../_d.ts/node.d.ts"/>
"use strict";
import WebStory = require("./WebStory");


/**
 * Teller class
 * 
 * @date 06-01-2017
 */

class Teller {

  constructor(public story:WebStory, public element:HTMLElement) {
    this.hurry = this.hurry.bind(this);
    var interval = this.story.impatience ? 128 : (this.story.get("_interval") || Math.max(element.textContent.length*50, 1024));
    if (interval > -1) {
      this._hurryTO = setTimeout(this.hurry, interval);
    }
  }

  pause() {
    clearTimeout(this._hurryTO);
  }

  goOn() {
    if (this.story.get("_interval") === -1) {
      this.hurry();
    }
  }

  hurry() {
    setTimeout(()=>{
      this.story.continue(this);
    });
  }

  removeElement() {
    this.element.parentElement.removeChild(this.element);
  }

  /*
    _privates
  */
  private _hurryTO:any;

}
export = Teller;
