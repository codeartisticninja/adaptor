/// <reference path="../../../_d.ts/node.d.ts"/>
"use strict";
import Teller = require("./Teller");
import WebStory = require("./WebStory");


/**
 * Chapter class
 * 
 * @date 06-01-2017
 */

class Chapter extends Teller {

  constructor(story:WebStory, element:HTMLElement) {
    super(story, element);
    this.removeElement();
    var chapter = <HTMLElement>this.story.newSection("article");
    chapter.setAttribute("class", element.getAttribute("class"));
  }
}
export = Chapter;
