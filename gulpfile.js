// RESOURCES USED TO MAKE THIS GULP FILE:
// http://www.revsys.com/blog/2014/oct/21/ultimate-front-end-development-setup/
// http://ericlbarnes.com/setting-gulp-bower-bootstrap-sass-fontawesome/
// https://markgoodyear.com/2014/01/getting-started-with-gulp/
// https://github.com/mikaelbr/gulp-notify/issues/81
// ------------------------------------------------------------------------------------

var gulp = require("gulp");
var sass = require("gulp-sass")(require("sass"));
var watch = require("gulp-watch");
var colors = require('ansi-colors');
var plumber = require("gulp-plumber");
var cleanCSS = require("gulp-clean-css");
var rename = require("gulp-rename");
var gzip = require("gulp-gzip");
var livereload = require("gulp-livereload");
var notify = require("gulp-notify");
var concat = require("gulp-concat");
var imagemin = require("gulp-imagemin");
var rezzy = require("gulp-rezzy");
var responsive = require("gulp-responsive");
var cache = require("gulp-cached");
var minify = require("gulp-minify");

var gzip_options = {
  threshold: "1kb",
  gzipOptions: {
    level: 9,
  },
};

var reportError = function (error) {
  var lineNumber = error.lineNumber ? "LINE " + error.lineNumber + " -- " : "";

  console.log(lineNumber);

  notify({
    title: "Task Failed [" + error.plugin + "]",
    message: lineNumber + "See console."
  }).write(error);

  // Inspect the error object
  // console.log(error);

  // Easy error reporting
  // console.log(error.toString());

  // Pretty error reporting
  var report = "";
  var chalk = colors.black.bgRed;

  report += chalk("TASK:") + " [" + error.plugin + "]\n";
  report += chalk("PROB:") + " " + error.message + "\n";
  if (error.lineNumber) {
    report += chalk("LINE:") + " " + error.lineNumber + "\n";
  }
  if (error.fileName) {
    report += chalk("FILE:") + " " + error.fileName + "\n";
  }
  console.error(report);

  // Prevent the 'watch' task from stopping
  this.emit("end");
};

// SCSS
gulp.task("styles", function () {
  return gulp
		.src("app/stylesheets/*.scss")
		.pipe(
			plumber({
				errorHandler: notify.onError("Error: <%= error.message %>"),
			})
		)
		.pipe(sass())
		.pipe(gulp.dest("public/stylesheets"))
		.pipe(rename({ suffix: ".min" }))
		.pipe(cleanCSS())
		.pipe(gulp.dest("public/stylesheets"))
		.pipe(gzip(gzip_options))
		.pipe(gulp.dest("public/stylesheets"))
		.pipe(notify("SCSS Compiled!"))
		.on("error", reportError)
		.pipe(livereload());
});

// JS
gulp.task("scripts", function () {
  return gulp
    .src([
      "node_modules/@bower_components/jquery/dist/jquery.js",
      "node_modules/@bower_components/bootstrap-sass/assets/javascripts/bootstrap.js",
      "node_modules/@bower_components/bootstrap-colorpicker/dist/js/bootstrap-colorpicker.js",
      "node_modules/@bower_components/select2/dist/js/select2.js",
      "node_modules/dragselect/dist/DragSelect.js",
      "node_modules/hotkeys-js/dist/hotkeys.js",
      "node_modules/html-to-image/dist/html-to-image.js",
      "node_modules/common-tags/dist/common-tags.min.js",
      "node_modules/throttle-debounce/umd/index.js",
      "app/scripts/vendor/snapback.js",
      "app/scripts/scripts.js",
    ])
    .pipe(
      plumber({
        errorHandler: notify.onError("Error: <%= error.message %>"),
      })
    )
    .pipe(concat("scripts.js"))
    .pipe(minify())
    .pipe(gulp.dest("public/scripts/"))
    .pipe(gzip(gzip_options))
    .pipe(gulp.dest("public/scripts/"))
    .pipe(notify("JS Compiled!"))
    .on("error", reportError)
    .pipe(livereload());
});

gulp.task("process-images", function () {
  return gulp
    .src("app/images/pedals/[mnopqrstuvwxyz]*")
    .pipe(cache("images"))
    .pipe(
      rezzy([{
        width: 700,
        height: 700,
        fit: 'inside',
        suffix: ''
      }])
    )
    .pipe(imagemin())
    .pipe(gulp.dest("public/images/pedals/"));
});

/* Watch Files For Changes */
gulp.task("watch", function () {
  livereload.listen();
  gulp.watch("app/stylesheets/**", gulp.series("styles"));
  gulp.watch("app/scripts/**", gulp.series("scripts"));
  gulp.watch("*.php").on("change", livereload.changed);
  gulp.watch("includes/**").on("change", livereload.changed);
  gulp.watch("*.html").on("change", livereload.changed);
});

gulp.task("watch-all", function () {
  livereload.listen();
  gulp.watch(
    gulp.series("app/images/pedals-new/**/*.png", "!app/images/pedals-new/**/*_tmp*.*", "process-images")
  );
  gulp.watch("app/stylesheets/**", gulp.series("styles"));
  gulp.watch("app/scripts/**", gulp.series("scripts"));
  gulp.watch("*.php").on("change", livereload.changed);
  gulp.watch("includes/**").on("change", livereload.changed);
  gulp.watch("*.html").on("change", livereload.changed);
});

gulp.task("default", gulp.series("styles", "scripts", "watch"));

gulp.task("all", gulp.series("styles", "scripts", "process-images", "watch-all"));
