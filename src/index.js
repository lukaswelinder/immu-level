import assert from 'assert'
import defaults from 'levelup-defaults'
import bytewise from 'bytewise'
import type from 'component-type'
import after from 'after'

// TODO: cut back on dependencies and complete refactor to ES6

export default class ImmuLevel {

  constructor(db) {

    if(!(this instanceof Pathwise))
      return new ImmuLevel(db);

    // does this really warrant a dependency ???
    assert(db, 'db required');

    this.__db = defaults(db, {

      keyEncoding: bytewise,
      valueEncoding: 'json'

    });

    return this;

  }

  set() {

  }

  setIn(path = [], obj = {}) {

    return new Promise(function(resolve,reject) {

      // TODO: consider optimization using a writeStream ??
      if(Array.isArray(obj))
        return this.__batch(key_path.map((data) => ({ type: 'setIn', path: key_path, data: data })));

      // TODO: search for 'fn' in __write method
      this.__write(null, path, obj, fn);

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

  deleteIn(path, opts, fn) {

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

        batch.deleteIn(key)

      });

      if (opts.__batch)
        fn();

      else batch.write(fn);

    });

  }

  __write(batch, key, obj, fn) {

    // use arrow functions to eliminate need for assignment of 'this'
    var self = this;

    switch(type(obj)) {

      case 'object':

        var keys = Object.keys(obj);
        // iterate over all keys then invoke callback
        var next = after(keys.length, fn);

        keys.forEach((k) => {
          // recurse ???
          this.__write(batch, key.concat(k), obj[k], next);
        });

        break;

      case 'array':

        this.__write(batch, key, arrToObj(obj), fn);

        break;

      default:

        batch.setIn(key, obj);

        break;

    }

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

function arrToObj(arr){
  var obj = {};
  arr.forEach(function(el, idx){
    obj[idx] = el;
  });
  return obj;
}
