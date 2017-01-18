import { Map, List } from 'immutable';

import Store from './Store.js';


export default class ImmuLevel extends Store {

  constructor(db, opt) {

    if(!(this instanceof ImmuLevel))
      return new ImmuLevel(db, opt);

    super(db, opt);

    return this;

  }

  set(key, val) {

    let keyPath = arguments.length === 2 ? List([key]) : List();
    let value = arguments.length === 1 ? key : val;

    return this.setIn(keyPath, value);

  }

  setIn(keyPath = List(), value = Map()) {

    keyPath = this.__concat_root(keyPath);

    return this.__writeReducer({ keyPath, value });

  }

  get(key) {


    let keyPath = arguments.length === 1 ? List([key]) : List();

    return this.getIn(keyPath);

  }

  getIn(keyPath = List()) {

    keyPath = this.__concat_root(keyPath);

    return this.__readReducer({ keyPath });

  }

  delete(key) {

    let keyPath = key ? List([key]) : List();

    return this.deleteIn(keyPath);

  }

  deleteIn(keyPath) {

    let remove = true;

    keyPath = this.__concat_root(keyPath);

    return this.__readReducer({ keyPath, remove });

  }

}