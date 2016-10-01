import bytewise from 'bytewise'
import LevelDefaults from 'levelup-defaults'

import { Map, List, Set, fromJS } from 'immutable'


import Store from './components/Store'

export default class ImmuLevel extends Store {

  constructor(db, opt) {

    if(!db)
      throw 'LevelDB instance required...';

    if(!(this instanceof Pathwise))
      return new ImmuLevel(db);

    super(db, opt);

    return this;

  }

  set(key, val) {

    let keyPath = key ? List(key) : List();

    return this.setIn(keyPath, val);

  }

  setIn(keyPath = List(), value = Map()) {

    // TODO: remove current value at keyPath if argument 'val' is an object

    return new Promise((resolve,reject) => {

      let ret = Map();
      let type = 'put';

      this.__writeReducer({ keyPath, value }, (curr, value, key) => {

        ret = ret.setIn(keyPath, value);

        return curr.push({ type, key, value });

      }, []).then((data) => this.__db.batch(data, (err) => !err ? resolve(ret) : reject(err)));

    });

  }

  get(key) {

    let keyPath = key ? List(key) : List();

    return this.getIn(keyPath);

  }

  // TODO: refactor to use '__readReduce()' method on super
  getIn(keyPath = List()) {

    return new Promise((resolve,reject) => {

      let ret = Map(), ref = ret;
      let rootLength = this.__root.size;

      this.__stream({ keyPath })

        .on('data', (data) => {

          ret = ref;

          let key = data.key;
          let val = data.value;

          let keyPathLength =  key.length - rootLength;
          let keyPath = keyPathLength ? List(data.key).slice(-keyPathLength) : null;

          if(keyPath)
            ret.setIn(keyPath, val);
          else
            ret = val;

        })

        .on('end', () => resolve(ret))
        .on('error', (err) => reject(err));

    });

  }

}