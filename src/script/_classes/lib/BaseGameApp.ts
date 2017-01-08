"use strict";
import StorageFile = require("./StorageFile");
import WebStory = require("./WebStory/WebStory");
import Teller = require("./WebStory/Teller");
import Chooser = require("./WebStory/Chooser");
import Diverter = require("./WebStory/Diverter");
import Chapter = require("./WebStory/Chapter");


/**
 * BaseGameApp class
 * 
 * @date 06-01-2017
 */

class BaseGameApp {
  public story:WebStory;
  public saveFile = new StorageFile("save.json");
  public prefs = new StorageFile("/prefs.json");

  constructor(storyElement: string, displayElement=storyElement) {
    this.prefs.set("music.enabled", true, true);
    this.prefs.set("music.volume", 0.5, true);
    this.prefs.set("sfx.enabled", true, true);
    this.prefs.set("sfx.volume", 1, true);
    
    this.story = new WebStory(storyElement, displayElement);
    this.story.addTeller("p", Teller);
    this.story.addTeller("ul, ol", Chooser);
    this.story.addTeller("pre", Diverter);
    this.story.addTeller("article", Chapter);
    this.story.passageSelector = ".passage";
    this.story.choiceSelector = "li";
  }

  /**
    _privates
  */
}
export = BaseGameApp;
