import bytewise from 'bytewise'
import LevelDefaults from 'levelup-defaults'

import { Record, Map, List, Set, fromJS } from 'immutable'


import { coerceToMap } from './utils/mapHelpers'
import { coerceToList } from './utils/listHelpers'

const StoreBase = Record({
  __db: null,
  __root: null,
  __cache: null
});


export default class Store extends StoreBase {

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

  __cat_root(keyPath) {

    return this.__root.concat(coerceToList(keyPath));

  }

  __batch(keyPath, obj, cb, ret) {

    if(typeof obj === 'function')
      cb = obj, obj = keyPath, keyPath = List();

    if(!ret)
      ret = List();

    if(!List.isList(keyPath))
      keyPath = coerceToList(keyPath);

    if(!Map.isMap(obj))
      obj = coerceToMap(obj);

    return obj.reduce((curr, val, key) => {

      if(typeof val === 'object')
        return this.__batch(keyPath.push(key), val, cb, curr);

      if(typeof cb === 'function')
        return cb(curr, val, keyPath.push(key).toArray());

      return curr.push(key, { key: keyPath.push(key).toArray(), value: val })

    }, ret);

  }

  __stream(opt) {

    // keyPath defaults to the value of 'this.__root'.
    let keyPath = this.__cat_root(opt.keyPath || []);

    // If set, prefers 'gte'(>=) and 'lte'(<=) paths.
    let gte = opt.gte ? this.__cat_root(opt.gte).toArray() : keyPath.toArray();
    let lte = opt.lte ? this.__cat_root(opt.lte).toArray() : keyPath.push(undefined).toArray();

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

  __readReducer(keyPath, cb, ret) {

    return new Promise((resolve,reject) => {

      if(typeof root === 'function')
        ret = cb, cb = root, root = List();

      if(!ret)
        ret = Map();

      this.__stream({ keyPath })
        .on('data', (data) => ret = cb(ret, data.value, data.key))

        .on('end', () => resolve(ret))
        .on('error', (err) => reject(err))

    });

  }

  __writeReducer(keyPath, obj, cb, ret) {

    let root = this.__cat_root(keyPath);

    return new Promise((resolve,reject) => {

      resolve(this.__batch(root, obj, cb, ret));

    });

  }




}