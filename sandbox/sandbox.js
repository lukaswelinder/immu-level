'use strict';

const immutable = require('immutable');

const ImmuLevel = require('../dist/bundle.umd.js');

const levelup = require('level');
const db = levelup('./sandbox/db');

const immu = ImmuLevel(db);

// let b = immu.__batchR([], { test: { case: 'hello', another: 'prop' } }, (curr, value, key) => {
//   curr.push({ key, value });
//   return curr;
// }, []); //.then(val => console.log(val));
//
//
// console.log(b);

// immu.__writeReducer({
//   keyPath: [],
//   value: { test: { case: 'hello', another: 'prop' } }
// }).then(val => console.log(val)).catch(err => console.log(err));

// immu.setIn([], { next: null, test: { eyy: 'hello', buddy: 'friend' } })
//   .then(val => console.log(val))
//   .catch(err => console.log(err));




// let m = immutable.Map();

// let n = m.setIn(['eyy', null], 10);

// console.log(n);

// immu.setIn([], n)
//   .then(val => console.log(val))
//   .catch(err => console.log(err));

immu.getIn(['test','eyy']).then(val => console.log(val)).catch(err => console.log(err));
