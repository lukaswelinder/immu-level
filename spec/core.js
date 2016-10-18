'use strict';
const tape = require('tape');

const immutable = require('immutable');
const Map = immutable.Map;
const List = immutable.List;
const Set = immutable.Set;
const fromJS = immutable.fromJS;

const ImmuLevel = require('../dist/bundle.umd.js');

const levelup = require('level');
// Why is this relative to project root? hmm
const db = levelup('./spec/db');

tape('Constructor:', function(t) {

  // t.error(ImmuLevel(), 'throws if missing \'db\' argument');

  t.ok(ImmuLevel(db), 'can be called without \'new\' keyword');

  t.ok(ImmuLevel(db) instanceof ImmuLevel, 'returns instance of \'ImmuLevel\'');

  t.end();

});

tape('Private Methods:', function(t) {

  let immu = ImmuLevel(db);

  t.ok(typeof immu.__stream === 'function', 'has \'.__stream()\' method');

  t.ok(typeof immu.__readReducer === 'function', 'has \'.__readReducer()\' method');

  t.ok(typeof immu.__writeReducer === 'function', 'has \'.__writeReducer()\' method');

  t.end();

});

tape('Public Methods:', function(t) {

  let immu = ImmuLevel(db);

  t.ok(typeof immu.set === 'function', 'has \'.set()\' method');

  t.ok(typeof immu.setIn === 'function', 'has \'.setIn()\' method');

  t.ok(typeof immu.get === 'function', 'has \'.get()\' method');

  t.ok(typeof immu.getIn === 'function', 'has \'.getIn()\' method');

  t.ok(typeof immu.delete === 'function', 'has \'.delete()\' method');

  t.ok(typeof immu.deleteIn === 'function', 'has \'.deleteIn()\' method');

  t.end();

});

tape('\'.set()\' Method:', function(t) {

  t.plan(9);

  let immu = ImmuLevel(db);

  let testObject1 = { key: 'value' };

  immu.set('testObject1', testObject1).then((val) => {

    t.ok(val, 'accepts a JavaScript Object as input value');

    t.ok(Map.isMap(val), 'returns an Immutable.js \'Map()\'');

    t.deepEqual(val.toObject(), testObject1, 'return value is deeply equal to input');

  });

  let testMap1 = Map({ key: 'value' });

  immu.set('testMap1', testMap1).then((val) => {

    t.ok(val, 'accepts an Immutable.js \'Map()\' as input value');

    t.ok(Map.isMap(val), 'returns an Immutable.js \'Map()\'');

    t.ok(testMap1.equals(val), 'return value is deeply equal to input')

  });

  let testPrimitive1 = 'value';

  immu.set('testPrimitive1', testPrimitive1).then((val) => {

    t.ok(val, 'accepts primitive as input value');

    t.ok(typeof val === 'string' || typeof val === 'number', 'returns primitive value');

    t.equal(val, testPrimitive1, 'return value is equal to input');

  });

});

tape('\'.setIn()\' Method:', function(t) {

  t.plan(9);

  let immu = ImmuLevel(db);

  let testObject2 = { key: 'value' };

  immu.setIn(['testObject2'], testObject2).then((val) => {

    t.ok(val, 'accepts a JavaScript Object as input value');

    t.ok(Map.isMap(val), 'returns an Immutable.js \'Map()\'');

    t.deepEqual(val.toObject(), testObject2, 'return value is deeply equal to input');

  });

  let testMap2 = Map({ key: 'value' });

  immu.setIn(['testMap2'], testMap2).then((val) => {

    t.ok(val, 'accepts an Immutable.js \'Map()\' as input value');

    t.ok(Map.isMap(val), 'returns an Immutable.js \'Map()\'');

    t.ok(testMap2.equals(val), 'return value is deeply equal to input')

  });

  let testPrimitive2 = 'value';

  immu.setIn(['testPrimitive2'], testPrimitive2).then((val) => {

    t.ok(val, 'accepts primitive as input value');

    t.ok(typeof val === 'string' || typeof val === 'number', 'returns primitive value');

    t.equal(val, testPrimitive2, 'return value is equal to input');

  });

});

tape('\'.get()\' Method:', function(t) {

  t.plan(7);

  let immu = ImmuLevel(db);

  let expectedMap = Map({ key: 'value' });
  let expectedPrimitive = 'value';

  immu.get('testObject1').then((val) => {

    t.ok(val, 'returns value for existing key when input is an object');

    t.ok(Map.isMap(val), 'returns an Immutable.js \'Map()\' when input is an object');

    t.ok(val.equals(expectedMap), 'returns \'Map()\' deeply equal to input (as \'Map()\')');

  });

  immu.get('testPrimitive1').then((val) => {

    t.ok(val, 'returns value for existing key when input is a primitive');

    t.ok(typeof val === 'string', 'returns primitive when input is primitive');

    t.equal(val, expectedPrimitive, 'returns value equivalent to input');

  });

  immu.get('invalidKey').then((val) => {

    t.ok(typeof val === 'undefined', 'returns undefined if key does not exist');

  });

});

