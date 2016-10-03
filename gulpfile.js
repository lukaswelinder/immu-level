'use strict';

const gulp = require('gulp'),
      tape = require('gulp-tape'),
      tap_colorize = require('tap-colorize'),
      nodemon = require('gulp-nodemon'),
      sequence = require('gulp-sequence'),
      rollupBundle = require('./rollup');


gulp.task('bundle', rollupBundle);

gulp.task('test', () =>
  gulp.src('spec/*.js').pipe(tape({ reporter: tap_colorize() })));

gulp.task('build', sequence('bundle', 'test'));

gulp.task('dev', ['build'], () =>
  nodemon({
    script: 'sandbox/sandbox.js',
    watch: ['sandbox/sandbox.js', 'spec/*.js', 'src/**/*.js'],
    tasks: ['build']
  }));