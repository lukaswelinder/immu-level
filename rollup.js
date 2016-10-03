'use strict';

const rollup = require('rollup'),
      buble = require('rollup-plugin-buble'),
      commonjs = require('rollup-plugin-commonjs'),
      node_resolve = require('rollup-plugin-node-resolve');

var cache = null;
function rollupBundle() {

  return rollup.rollup({

    entry: './src/index.js',

    external: ['immutable','level', 'levelup', 'bytewise'],

    globals: { immutable: 'immutable' },

    cache: cache,

    plugins: [

      buble(),

      node_resolve({
        preferBuiltins: false,
        module: true,
        jsnext: true,
        main: true,
        browser: true
      }),

      commonjs({
        include: 'node_modules/**',
        namedExports: { immutable: ['Record', 'fromJS', 'Map', 'List', 'Set'], level: 'level', levelup: 'levelup', bytewise: 'bytewise' }
      })

    ]

  }).then((bundle) => {

    cache = bundle;

    console.log('Bundling complete; writing to dist/');

    let es = bundle.write({
      dest: 'dist/bundle.es2015.js',
      format: 'es',
      // exports: 'named',
      moduleName: 'ImmuLevel',
      sourceMap: true
    });

    let umd = bundle.write({
      dest: 'dist/bundle.umd.js',
      format: 'umd',
      // exports: 'named',
      globals: { immutable: 'immutable' },
      moduleName: 'ImmuLevel',
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

module.exports = rollupBundle;