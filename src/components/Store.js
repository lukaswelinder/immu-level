import bytewise from 'bytewise';
import LevelDefaults from 'levelup-defaults';
import { Record, Map, List } from 'immutable';


import { coerceToMap, mapKeyPaths } from '../utils/mapHelpers.js';
import { coerceToList } from '../utils/listHelpers.js';

// const StoreBase = Record({
//   __db: null,
//   __root: null,
//   __cache: null
// });

// TODO: extensively document/annotate internal methods

export default class Store {

  constructor(db, opt = {}) {

    if(!db)
      throw 'LevelDB instance required...';

    if(!(this instanceof Store))
      return new Store(db, opt);

    this.__db = LevelDefaults(db, { keyEncoding: bytewise, valueEncoding: 'json' });
    this.__root = coerceToList(opt.root || new List());
    this.__cache = coerceToMap(opt.cache);

    return this;

  }

  __concat_root(keyPath) {

    return this.__root.concat(coerceToList(keyPath));

  }

  // TODO: consider handling immutable structures as arguments

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

  // TODO: clarify and/or clean up the logic for optional args

  __readReducer(opt, cb, ret) {

    return new Promise((resolve,reject) => {

      if(!opt || typeof opt === 'function')
        ret = cb, cb = opt, opt = {};

      let batch = opt.remove ? this.__db.batch() : null;

      if(!cb) {

        let rootLength = opt.keyPath ?
          opt.keyPath.length || opt.keyPath.size : this.__root.size;

        cb = (curr, value, key) => {
          if(opt.remove)
            batch.del(key);
          let keyPathLength =  key.length - rootLength;
          let keyPath = keyPathLength ? key.slice(-keyPathLength) : null;
          if(!keyPath)
            return value;

          return curr.setIn(keyPath, value);
        };

        ret = Map();

      }

      if(!ret) {

        ret = Map();

      }

      this.__stream(opt)
        .on('data', (data) => ret = cb(ret, data.value, data.key))
        .on('end', () => {
          if(Map.isMap(ret) && !ret.size)
            ret = undefined;
          if(opt.remove)
            batch.write((err) => !err ? resolve(ret) : reject(err));
          else
            resolve(ret);
        }).on('error', (err) => reject(err));

    });

  }

  __writeReducer(opt, cb, ret) {

    return new Promise((resolve,reject) => {

      if(!opt.hasOwnProperty('value'))
        reject(new Error('Missing property \'value\'...'));

      let keyPath = coerceToList(opt.keyPath);
      let obj = opt.value;

      if(!cb) {

        let batch = this.__db.batch();
        let rootLength = keyPath.size;

        if(typeof obj === 'object') {

          batch.del(keyPath.toArray());

          // BENCHMARKING:
          let start = Date.now();
          // ============

          ret = mapKeyPaths(keyPath, obj, (curr, value, key) => {
            batch.put(key, value);
            let keyPathLength =  key.length - rootLength;
            let keyPath = key.slice(-keyPathLength);
            return curr.setIn(keyPath, value);
          }, Map(), 'reduce');

          // BENCHMARKING:
          let end = Date.now();
          console.log('mapped write keypaths in ' + (end - start) + 'ms');
          // ============

          batch.write((err) => !err ? resolve(ret) : reject(err));

        } else {

          let remove = true;

          ret = obj;

          // TODO: improve performance and reduce errors by combining delete/write ops

          this.__readReducer({ keyPath, remove }).then(() => {
            batch.put(keyPath.toArray(), obj);
            batch.write((err) => !err ? resolve(ret) : reject(err));
          });

        }

      } else {

        let method = opt.reverse ? 'reduce' : 'reduceRight';

        ret = ret || Map();

        resolve(mapKeyPaths(keyPath, obj, cb, ret, method));

      }

    });

  }

}