'use strict';

let { Map, List, Set, Seq, fromJS } = require('immutable');

const JSONsize = require('json-size');

let reddit_data = require('../spec/data/reddit_json');

let data_set = fromJS(reddit_data.concat(reddit_data)).toArray();
let data_size = JSONsize(data_set);

// Should value be used for intersect comparison:
const USE_VALUE = false;

// keyPaths(val: any, root: List, coerce: boolean)
// - Deeply maps iterable keypaths.
const keyPaths = (val, root = new Seq()) => {

  if(typeof val !== 'object')
    return [USE_VALUE ? root.concat(val) : root];

  return new Seq(val).reduce((curr, value, key) => {
    return curr.concat(keyPaths(value, root.concat(key)));
  }, new Seq());

}

// intersect(target: Iterable, ...args: Iterable)
// - Returns target intersected on arg keypaths.
const intersect = (target, ...args) => {

  let commonKeyPaths = keyPaths(target).toSet();

  for(let i = 0; i < args.length; i++)
    commonKeyPaths = commonKeyPaths.subtract(keyPaths(args[i]));

  return commonKeyPaths.reduce((curr, keyPath) => {
    return curr.deleteIn(keyPath);
  }, target);

}

// let expected = new fromJS({ test: { again: 'yes' }, hmm: { another: 'same' } });
//
// let m1 = new fromJS({ test: { again: 'yes' }, hmm: { another: 'same' }, notMatching: 'heh' });
// let m2 = new fromJS({ test: { again: 'yes' }, hmm: { another: 'same' }, noMatch: 'nope' });
//
// let result = intersect(m1,m2);
//
// result.equals(expected);


let start = Date.now();
let result = intersect(...data_set);
let end = Date.now();

console.log(
  'Parsed ' +
  data_size/1000 +
  'kb of data across ' +
  data_set.length +
  ' objects  in ' +
  (end - start) +
  'ms.'
);

// console.log(paths.size + ' keyPaths parsed from data.');

// console.log(JSON.stringify(result.toJS(), null, 2));







