const gulp = require('gulp'),
      tape = require('gulp-tape'),
      tap_colorize = require('tap-colorize'),
      nodemon = require('gulp-nodemon'),
      sequence = require('gulp-sequence');

const rollupBundle = require('./rollup');

let cache = null;

gulp.task('bundle', rollupBundle);

gulp.task('test', () =>
  gulp.src('spec/*.js').pipe(tape({ reporter: tap_colorize() })));

gulp.task('build', sequence('bundle', 'test'));

gulp.task('dev', ['build'], () =>
  nodemon({
    script: 'sandbox.js',
    watch: ['sandbox.js', 'spec/*.js', 'src/**/*.js'],
    tasks: ['build']
  }));

function dev() { return sequence('bundle', 'test'); }
