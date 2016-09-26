import bytewise from 'bytewise'
import LevelDefaults from 'levelup-defaults'
import after from 'after'

import { Record, Map, List, Set, fromJS } from 'immutable'

import { coerceToMap, mapToBatch } from './utils/mapHelpers'
import { coerceToList } from './utils/listHelpers'

const ImmuLevelProps = Record({
  __db: null,
  __root: null,
  __cache: null
});

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

  }

  setIn(path = [], val = {}) {

    let root = this.__root.concat(coerceToList(path));

    return new Promise(function(resolve,reject) {

      let root = this.__root.concat(path);
      let data = mapToBatch(root, val);

      this.__db.batch(data, (err) => !err ? resolve(coerceToMap(val)) : reject(err));

    });

  }

  get() {

  }

  getIn(path) {

    let ret = {};
    let el = ret;

    return new Promise(function(resolve,reject) {

      streamToArray(this.__db.createReadStream({

        start: path,
        end: path.concat(undefined) // wtf?

        /* *
         *
         * My best guess at what this does:
         *
         * Due to the fact that levelDB stores keys lexographically,
         * by reading a stream between those points, it grabs all
         * keys with 'path' as a prefix.
         *
         * I'm still not sure why 'undefined' is concatenated onto
         * the path to achieve this. Looking deeper into the 'bytewise'
         * module might provide more insight.
         *
         * */

      }), (err, data) => {

        if (err)
          return reject(err);

        // The 'kv' value is an entry from the db with 'key' & 'value' props.
        data.forEach(function(kv){

          // Resulting array is a key-path array of properties within the original 'path'.
          let segs = kv.key.slice(path.length);

          if (segs.length) {

            // favor for loop ?
            segs.forEach(function(seg, idx){

              if (!el[seg]) {
                if (idx == segs.length - 1) {
                  el[seg] = kv.value;
                } else {
                  el[seg] = {};
                }
              }

              // 'Recursively' builds the object from returned keys & values.
              el = el[seg];

            });

            el = ret;

          } else {

            // Entry at 'path' is not an object, return its value.
            ret = kv.value;

          }

        });

        resolve(ret);

      });

    });

  }

  keys() {

  }

  keysIn(path, fn) {

    streamToArray(this.__db.createReadStream({

      start: path,
      end: path.concat(undefined)

    }), function(err, kv){

      if (err)
        return fn(err);

      fn(null, kv.map(function(_kv){

        return _kv.key[path.length] || _kv.value;

      }));

    });

  }

  delete() {

  }

  deleteIn(path, opts) {

    if (typeof opts == 'function') {

      fn = opts;
      opts = {};

    }

    var batch = opts.__batch || this.__db.__batch();

    streamToArray(this.__db.createKeyStream({

      start: path,
      end: path.concat(undefined)

    }), function(err, keys){

      if (err)
        return fn(err);

      keys.forEach(function(key){

        batch.delteIn(key)

      });

      if (opts.__batch)
        fn();

      else batch.write(fn);

    });

  }

  __read(opt) {

    let root = coerceToList(opt.root);

    let gte = root.toArray();
    let lte = root.push(undefined).toArray();

    let keys = opt.keys || opt.values ? false : true;
    let values = opt.values || opt.keys ? false : true;

    let reverse = opt.reverse || false;
    let fillCache = opt.fillCache || false;

    return this.__db.createReadStream({
      gte,
      lte,
      keys,
      values,
      reverse,
      fillCache
    });

  }

  __write(path, val) {

    return new Promise(function(resolve, reject) {

      let key_val_map = mapKeyPaths(path, val);

      let type = 'put';

      let data = key_val_map.reduce((curr, value, key) => {
        return curr.concat({ type, key, value });
      }, []);

      this.__batch(data);

      // switch(type(val)) {
      //
      //   case 'object':
      //
      //     let keys = Object.keys(val);
      //     let next = after(keys.length, resolve);
      //
      //     keys.forEach((k) => {
      //       // recurse ???
      //       this.__write(path.push(k), val[k], next);
      //     });
      //
      //     break;
      //
      //   case 'array':
      //
      //     this.__write(path, arrToObj(val), fn);
      //
      //     break;
      //
      //   default:
      //
      //     this.__db.put(path, val, fn);
      //
      //     break;
      //
      // }

    });



  }

  __batch(ops, fn) {

    var self = this;
    var batch = this.__db.__batch();
    var next = after(ops.length, function(err){
      if (err) return fn(err);
      batch.write(fn);
    });

    ops.forEach(function(op){

      if (op.type == 'setIn') self.setIn(op.path, op.data, { batch: batch }, next);
      else if (op.type == 'deleteIn') self.deleteIn(op.path, { batch: batch }, next);

    });

  }

}