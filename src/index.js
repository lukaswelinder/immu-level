import bytewise from 'bytewise'
import LevelDefaults from 'levelup-defaults'

import { Record, Map, List, Set, fromJS } from 'immutable'

import { coerceToMap } from './utils/mapHelpers'
import { coerceToList } from './utils/listHelpers'

const ImmuLevelProps = Record({
  __db: null,
  __root: null,
  __cache: null
});

// TODO: move internal methods/props to their own class class to extend

export default class ImmuLevel extends ImmuLevelProps {

  constructor(db, opt) {

    if(!db)
      throw 'LevelDB instance required...';

    if(!(this instanceof Pathwise))
      return new ImmuLevel(db);

    // TODO: allow for cacheing of 'views' upon initialization based on opt
    let __db = LevelDefaults(db, { keyEncoding: bytewise, valueEncoding: 'json' });
    let __root = coerceToList(opt.root);
    let __cache = coerceToMap(opt.cache);

    super({ __db, __root, __cache });

    return this;

  }

  set(key, val) {

    let keyPath = key ? List(key) : List();

    return this.setIn(keyPath, val);

  }

  setIn(keyPath = List(), val = Map()) {

    // TODO: throw error if keyPath length/size is 0

    // TODO: remove value at keyPath (if exists) if val is an object

    return new Promise(function(resolve,reject) {

      let root = this.__root.concat(coerceToList(keyPath));
      let data = this.__writeReducer(root, val, (curr, val, keyPath) => curr.push({
        type: 'put',
        key: keyPath,
        value: val
      }), List());

      this.__db.batch(data, (err) => !err ? resolve(coerceToMap(val)) : reject(err));

    });

  }

  get(key) {

    let keyPath = key ? List(key) : List();

    return this.getIn(keyPath);

  }

  getIn(keyPath = List()) {

    return new Promise(function(resolve,reject) {

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

  __readReducer(root, cb, ret) {
    
    return new Promise(function(resolve,reject) {

      if(typeof root === 'function')
        ret = cb, cb = root, root = List();

      if(!ret)
        ret = Map();

      this.__stream({ root })
        .on('data', (data) => ret = cb(ret, data.value, data.key))

        .on('end', () => resolve(ret))
        .on('error', (err) => reject(err))

    });


  }

  __stream(opt) {

    // Type safe prefixing of 'ImmuLevel' instance '.__root' property.
    let cat = (arr) => this.__root.concat(coerceToList(arr));

    // keyPath defaults to the value of 'this.__root'.
    let keyPath = cat(opt.keyPath || []);

    // If set, prefers 'gte'(>=) and 'lte'(<=) paths.
    let gte = opt.gte ? cat(opt.gte).toArray() : keyPath.toArray();
    let lte = opt.lte ? cat(opt.lte).toArray() : keyPath.push(undefined).toArray();

    // XOR logic for streaming keys/values.
    let keys = opt.keys || opt.values ? false : true;
    let values = opt.values || opt.keys ? false : true;

    // Other LevelDB related options; both default to false.
    let reverse = opt.reverse || false;
    let fillCache = opt.fillCache || false;
    let keyEncoding = opt.keyEncoding || bytewise;
    let valueEncoding = opt.valueEncoding || 'json';

    // Fetches metadata for given key range.
    if(opt.meta) {
      gte = gte.unshift(undefined);
      lte = lte.unshift(undefined);
      valueEncoding = bytewise;
    }

    return this.__db.createReadStream({
      gte,
      lte,
      keys,
      values,
      reverse,
      fillCache,
      keyEncoding,
      valueEncoding
    });

  }

  __writeReducer(root, obj, cb, ret) {

    if(typeof obj === 'function')
      cb = obj, obj = root, root = List();

    if(!ret)
      ret = List();

    if(!List.isList(root))
      root = coerceToList(root);

    if(!Map.isMap(obj))
      obj = coerceToMap(obj);

    return obj.reduce((curr, val, key) => {

      if(typeof val === 'object')
        return this.__writeReducer(root.push(key), val, cb, curr);

      if(typeof cb === 'function')
        return cb(curr, val, root.push(key).toArray());

      return curr.push(key, { key: root.push(key).toArray(), value: val })

    }, ret);

  }

}