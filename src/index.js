import { Map, List } from 'immutable'


import Store from './components/Store'

export default class ImmuLevel extends Store {

  constructor(db, opt) {

    if(!(this instanceof ImmuLevel))
      return new ImmuLevel(db, opt);

    super(db, opt);

    return this;

  }

  set(key, val) {

    let keyPath = key ? List(key) : List();

    return this.setIn(keyPath, val);

  }

  setIn(keyPath = List(), value = Map()) {

    // TODO: remove current value at keyPath if argument 'val' is an object

    keyPath = this.__cat_root(keyPath);

    return this.__writeReducer({ keyPath, value });

  }

  get(key) {

    let keyPath = key ? List(key) : List();

    return this.getIn(keyPath);

  }

  // TODO: refactor to use '__readReduce()' method on super
  getIn(keyPath = List()) {

    keyPath = this.__cat_root(keyPath);

    return this.__readReducer({ keyPath });

  }

}