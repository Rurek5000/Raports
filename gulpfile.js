const gulp = require("gulp");
const sass = require("gulp-sass")(require("sass"));
const sourcemaps = require("gulp-sourcemaps");
const autoprefixer = require("gulp-autoprefixer");

const css = function () {
  return gulp
    .src("src/scss/style.scss")
    .pipe(sourcemaps.init())
    .pipe(
      sass({
        outputStyle: "compressed",
      }).on("error", sass.logError)
    )
    .pipe(autoprefixer())
    .pipe(sourcemaps.write("."))
    .pipe(gulp.dest("dist/css"));
};

const watch = function (cb) {
  gulp.watch("src/scss/**/*.scss", gulp.series(css));
  cb();
};

exports.default = gulp.series(css, watch);
exports.css = css;
exports.watch = watch;
