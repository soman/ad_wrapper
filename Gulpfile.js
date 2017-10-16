var gulp = require('gulp');
var webpack = require('gulp-webpack');
var concat = require('gulp-concat');
var clean = require('gulp-clean');

gulp.task('webpack', function() {
  return gulp.src('src/toh_header.js')
    .pipe(webpack({
      output: {
        filename: 'modules.js'
      }
    }))
    .pipe(gulp.dest(''));
});


gulp.task('scripts', ['clean', 'webpack'], function() {
  return gulp.src([ 'src/preload.js', 'modules.js'])
    .pipe(concat('toh_header.js'))
    .pipe(gulp.dest('./'));
});


gulp.task('clean', function () {
  return gulp
    .src(['dist'], {
      read: false
    })
    .pipe(clean());
});

gulp.task('watch', function(){

  gulp.watch([
    'src/**/*.js'
  ], ['clean', 'webpack', 'scripts']);
});


gulp.task('build', ['scripts']);
