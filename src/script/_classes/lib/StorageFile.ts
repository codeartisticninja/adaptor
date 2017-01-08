/// <reference path="../../_d.ts/node.d.ts"/>
"use strict";
import url = require("url");

/**
 * StorageFile class
 * 
 * @date 07-06-2016
 */

var cache = {};

class StorageFile {
  public url:string;
  public storage:Storage;
  private _onSetListeners = {};
  private _onSetValues = {};

  constructor(uri:string, public data={}) {
    this.url = url.resolve(location.pathname, uri);
    if (cache[this.url]) {
      return cache[this.url];
    } else {
      cache[this.url] = this;
    }
    if (this.url.indexOf("#") === -1) {
      this.storage = localStorage;
    } else {
      this.storage = sessionStorage;
    }
    this.load();
  }

  load() {
    if (this.storage.getItem(this.url)) {
      try {
        this.data = JSON.parse(this.storage.getItem(this.url));
      } catch (err) {
        this.data = this.storage.getItem(this.url);
      }
    }
    return this.data;
  }

  save(data?:any) {
    if (data !== undefined) {
      this.data = data;
    }
    this.storage.setItem(this.url, JSON.stringify(this.data));
    this._runListeners();
  }

  delete(data={}) {
    this.data = data;
    this.storage.removeItem(this.url);
  }

  get(key:string) {
    // this.load();
    var keys = key.split(".");
    var data = this.data;
    while (keys.length > 1) {
      if (!data[keys[0]]) return undefined;
      data = data[keys.shift()];
    }
    return data[keys[0]];
  }

  set(key:string, value:any, ifUndefined=false) {
    var keys = key.split(".");
    var data = this.data;
    while (keys.length > 1) {
      if (!data[keys[0]]) data[keys[0]] = {};
      data = data[keys.shift()];
    }
    if (data[keys[0]] === value) return;
    if (ifUndefined && (data[keys[0]] !== undefined)) return;
    data[keys[0]] = value;
    this.save();
  }

  onSet(key:string, callback:Function) {
    if (this._onSetListeners[key] == null) this._onSetListeners[key] = [];
    this._onSetListeners[key].push(callback);
    this._onSetValues[key] = JSON.stringify(this.get(key));
  }

  list() {
    var list:string[] = [], i:number, key:string;
    for (i = 0; i < this.storage.length; i++) {
      key = this.storage.key(i);
      if (key.substr(0, this.url.length) === this.url) {
        key = key.substr(this.url.length);
        if (key.indexOf("/") !== -1) {
          key = key.substr(0, key.indexOf("/")+1);
        }
        if (key.indexOf("#") !== -1) {
          key = key.substr(0, key.indexOf("#")+1);
        }
        if (list.indexOf(key) === -1) {
          list.push(key);
        }
      }
    }
    return list;
  }

  open(uri:string) {
    return new StorageFile(url.resolve(this.url, uri));
  }

  _runListeners() {
    var key:string, value:any, JSONvalue:string, listener:Function;
    for (key in this._onSetListeners) {
      value = this.get(key);
      JSONvalue = JSON.stringify(value);
      if (this._onSetValues[key] !== JSONvalue) {
        for (listener of this._onSetListeners[key]) {
          listener(key, value);
        }
        this._onSetValues[key] = JSONvalue;
      }
    }
  }
}
export = StorageFile;
