'use strict';
const tape = require('tape');

const immutable = require('immutable');

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

  t.end();

});

db.close();

