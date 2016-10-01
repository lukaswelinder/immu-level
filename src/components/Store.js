import bytewise from 'bytewise'
import LevelDefaults from 'levelup-defaults'

import { Record, Map, List } from 'immutable'


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

    if(!(this instanceof Store))
      return new Store(db, opt);

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

  // TODO: dry out the batch method(s)

  __batchF(keyPath, obj, cb, ret) {

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
        return this.__batchF(keyPath.push(key), val, cb, curr);

      if(typeof cb === 'function')
        return cb(curr, val, keyPath.push(key).toArray());

      return curr.push(key, { key: keyPath.push(key).toArray(), value: val })

    }, ret);

  }

  __batchR(keyPath, obj, cb, ret) {

    if(typeof obj === 'function')
      cb = obj, obj = keyPath, keyPath = List();

    if(!ret)
      ret = List();

    if(!List.isList(keyPath))
      keyPath = coerceToList(keyPath);

    if(!Map.isMap(obj))
      obj = coerceToMap(obj);

    return obj.reduceRight((curr, val, key) => {

      if(typeof val === 'object')
        return this.__batchR(keyPath.push(key), val, cb, curr);

      if(typeof cb === 'function')
        return cb(curr, val, keyPath.push(key).toArray());

      return curr.push(key, { key: keyPath.push(key).toArray(), value: val })

    }, ret);

  }

  __stream(opt) {

    // keyPath defaults to the value of 'this.__root'.
    let keyPath = coerceToList(opt.keyPath) || List();

    // Start and end keys to make logic syntactically cleaner.
    let start = keyPath.toArray();
    let end = keyPath.push(undefined).toArray();

    // If set, prefers 'gte'(>=) and 'lte'(<=) paths.
    let gte = opt.gte ? coerceToList(opt.gte).toArray() : start;
    let lte = opt.lte ? coerceToList(opt.lte).toArray() : end;

    // XOR logic for streaming keys/values.
    let keys = opt.keys || opt.values ? false : true;
    let values = opt.values || opt.keys ? false : true;

    // Other LevelDB related options; both default to false.
    let reverse = opt.reverse || false;
    let fillCache = opt.fillCache || false;

    // Key/value encoding.
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

  __readReducer(opt, cb, ret) {

    return new Promise((resolve,reject) => {

      if(typeof opt === 'function')
        ret = cb, cb = root, opt = {};

      if(!ret)
        ret = Map();

      this.__stream(opt)
        .on('data', (data) => ret = cb(ret, data.value, data.key))

        .on('end', () => resolve(ret))
        .on('error', (err) => reject(err));

    });

  }

  __writeReducer(opt, cb, ret) {

    return new Promise((resolve,reject) => {

      let method = opt.reverse ? '__batchR' : '__batchF';

      let keyPath = coerceToList(opt.keyPath) || List();
      let obj = coerceToMap(opt.value);

      resolve(this[method](keyPath, obj, cb, ret));

    });

  }

}