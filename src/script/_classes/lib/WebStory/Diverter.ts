/// <reference path="../../../_d.ts/node.d.ts"/>
"use strict";
import Teller = require("./Teller");
import WebStory = require("./WebStory");


/**
 * Diverter class
 * 
 * @date 10-01-2017
 */

class Diverter extends Teller {

  constructor(story:WebStory, element:HTMLElement) {
    super(story, element);
    this.removeElement();
    setTimeout(()=>{
      var dest = this.element.textContent.trim();
      if (dest === "^") {
        this.story.return(this);
      } else
      if (dest.substr(-2) === " ^") {
        dest = dest.substr(0, dest.length-1).trim();
        this.story.goSub(dest, this);
      } else {
        this.story.goTo(dest, this);
      }
    });
  }
}
export = Diverter;
