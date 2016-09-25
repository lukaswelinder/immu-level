'use strict';

const rollup = require('rollup'),
      buble = require('rollup-plugin-buble'),
      commonjs = require('rollup-plugin-commonjs'),
      node_resolve = require('rollup-plugin-node-resolve');

let cache = null;

function rollupBundle() {

  return rollup.rollup({

    entry: 'src/index.js',

    external: ['immutable'],

    globals: { immutable: 'immutable' },

    cache: cache,

    plugins: [
      buble(),
      node_resolve({
        module: true,
        jsnext: true,
        main: true,
        browser: true
      }),
      commonjs({
        include: 'node_modules/**',
        namedExports: { immutable: ['Record', 'fromJS', 'Map', 'List'] }
      })
    ]

  }).then((bundle) => {

    cache = bundle;

  console.log('Bundling complete; writing to dist/');

  let es = bundle.write({
    dest: 'dist/bundle.es2015.js',
    format: 'es',
    // exports: 'named',
    moduleName: 'immuTree',
    sourceMap: true
  });

  let umd = bundle.write({
    dest: 'dist/bundle.umd.js',
    format: 'umd',
    // exports: 'named',
    globals: { immutable: 'immutable' },
    moduleName: 'immuTree',
    sourceMap: true
  });

  return Promise.all([es, umd]);

}).then((bundles) => {

    console.log('Writing complete!');

  return bundles;

}).catch((err) => {

    console.log(err.message, err.stack);
  return null;

});

}

module.exports = rollupBundle();