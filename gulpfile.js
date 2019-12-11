/* eslint-env node */
/* eslint-env es6 */
const { series, parallel, src, dest, watch } = require('gulp'),
      now = new Date().getTime(),
      jsMain = now + '.js',
      cssMain = now + '.css',
      concat = require('gulp-concat'),
      connect = require('gulp-connect'),
      del = require('del'),
      eslint = require('gulp-eslint'), // syntax and style
      rename = require('gulp-rename'),
      replace = require('gulp-replace'),
      sass = require('gulp-sass'),
      sourcemaps = require('gulp-sourcemaps'),
      { version } = require('./package.json');

var config = require('./gulp-config.json'),
    source = config.source,
    build, //eventually a group of tasks
    buildAndServe, //eventually a group of tasks
    jsLibs = config.libs.js || [],
    sassLibs = config.libs.sass || [],
    fonts = config.libs.fonts || [],
    htmlReplacements = {
      'JS-MAIN': jsMain,
      'CSS-MAIN': cssMain
    }, //tokens to replace in HTML during compilation (e.g. intercom id, build timestamp, etc)
    jsReplacements = {
      'VERSION': version
    };//tokens to replace in JS during compilation (e.g. intercom id, build timestamp, etc)

// returns a string. base path of the build
function getBuildPath() {
  return config.build.path;
}
// returns a string. base path of the assets folder in the build
function getAssetsPath() {
  return getBuildPath() + config.build.assetsPath;
}
// returns a string. base path of the js folder in the build
function getJSPath() {
  return getAssetsPath() + config.build.jsPath;
}
// returns a string. base path of the css folder in the build
function getCSSPath() {
  return getAssetsPath() + config.build.cssPath;
}
// returns a string. base path of the fonts folder in the build
function getFontPath() {
  return getAssetsPath() + config.build.fontPath;
}

// delete any existing builds.
function clean() {
  return del([
    config.build.path
  ]);
}

// lint javascript
function lintJS() {
  return src(source.js)
    // eslint() attaches the lint output to the "eslint" property
    // of the file object so it can be used by other modules.
    .pipe(eslint())
    // eslint.format() outputs the lint results to the console.
    // Alternatively use eslint.formatEach() (see Docs).
    .pipe(eslint.format());
}

// combine all js into build
function compileJS() {
  var files = [], //eventually an array of all the js to combine
      stream,
      replacements = jsReplacements || {},
      tokens = Object.keys(replacements);

  //add 3rd party javascript to the list of files to be concatenated
  if (jsLibs.length > 0) {
    files = files.concat(jsLibs);
  }
  // add our own javascript to the list of files to be concatenated
  if (source.js) {
    if (source.js.length > 0) {
      files = files.concat(source.js);
    }
  }
  // add env properties file to the list
  if (source.properties) {
    files.push(source.properties);
  }

  stream = src(files);

  stream = stream.pipe(sourcemaps.init())
    .pipe(concat(jsMain))
    .pipe(sourcemaps.write());

  for (let i = 0; i < tokens.length; i++) {
    stream = stream.pipe(replace('<%' + tokens[i] + '%>', replacements[tokens[i]]));
  }

  return stream.pipe(dest(getJSPath()));
}

// compile sass files and move to build
function compileCSS() {
  var paths = [source.sass.path].concat(sassLibs);

  return src(source.sass.main)
    .pipe(sourcemaps.init())
    .pipe(sass({includePaths: paths}))
    .pipe(rename(cssMain))
    .pipe(sourcemaps.write())
    .pipe(dest(getCSSPath()));

}

// compile html
function compileHTML() {
  var stream = src(source.html),
      replacements = htmlReplacements || {},
      tokens = Object.keys(replacements);

  for (let i = 0; i < tokens.length; i++) {
    stream = stream.pipe(replace('<%' + tokens[i] + '%>', replacements[tokens[i]]));
  }

  return stream.pipe(dest(getBuildPath()));
}

// moves all the stuff in the etc folder to the dev build
function moveAssets() {
  return src([source.etc.files], { base: source.etc.path })
    .pipe(dest(getAssetsPath()));
}

// moves fonts into the dev build
function moveFonts() {
  return src(fonts)
    .pipe(dest(getFontPath()));
}

// reload the app in the browser on change of a file in the served directory
function reload(cb) {
  src([getBuildPath()]) //have to pipe a stream to connect.reload for it to work.
    .pipe(connect.reload());
  cb();
}

// serve the app
function serve() {
  connect.server({
    root: getBuildPath(),
    livereload: {
      enable: true,
      port: config.serve.livereloadPort
    },
    https: config.serve.https || false,
    port: config.serve.port,
    middleware: function () {
      return [function (req, res, next) {
        // disable response caching so the browser content is always **fresh**
        res.setHeader('Surrogate-Control', 'no-store');
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        next();
      }];
    }
  });
  watch([getBuildPath() + '/**'], reload);
}

// watch for changes in key files.
function watchFiles(cb) {
  var js = source.js || [];

  // only watch the properties file too if one is in play
  if (source.properties) {
    js.push(source.properties);
  }

  watch(js, series(lintJS, compileJS));
  watch([source.sass.files], compileCSS);
  watch([source.html], compileHTML);
  watch([source.etc.files], moveAssets);
  watch(fonts, moveFonts);
  cb();
}

// series() -> compile but do not serve.
build = series (
  clean,
  parallel(
    series(lintJS, compileJS),
    compileCSS,
    compileHTML,
    moveAssets,
    moveFonts
  )
);

// series() -> served compiled version while watching files
// and reloading.
buildAndServe = series (
  build,
  watchFiles,
  serve
);

// initializer method
exports.init = function (options) {
  if (options.jsLibs) {
    jsLibs = options.jsLibs;
  }
  if (options.saasLibs) {
    sassLibs = options.saasLibs;
  }
  if (options.fonts) {
    fonts = options.fonts;
  }
};

// task collections for reuse
exports.build = build;
exports.buildAndServe = buildAndServe;

// default task
exports.default = buildAndServe;
