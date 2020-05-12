/**
 *
 * Gulpfile v4 for wordpress themes
 */

'use strict'

// Engine
const { src, dest, series, parallel, watch } = require('gulp');
const browserify = require('browserify');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const babelify = require('babelify');
const sourcemaps = require('gulp-sourcemaps');
const browserSync = require('browser-sync').create();
const rsync = require('gulp-rsync');

// Styles preprocessors
const sass = require('gulp-sass');
const scss = require('gulp-sass');
const less = require('gulp-less');
const stylus = require('gulp-stylus');

// Assets plugins
const uglify = require('gulp-uglify-es').default;
const autoprefixer = require('gulp-autoprefixer');
const rename = require('gulp-rename');
const cleancss = require('gulp-clean-css');

// Config
const config = {
  projectName: 'Your Project',
  localhost: 'local.host',
  filesWatch: 'html, htm, php, yaml, twig, json',
  theme: {
    name: 'themename',
    assetsFolder: '/assets/',
  },
  scripts: {
    srcFile: 'index.js',
    buildName: 'theme',
    srcFolder: 'js',
    outputFolder: 'js'
  },
  styles: {
    preprocessor: 'scss',
    outputFolder: 'css'
  }
}

/**
 * Development
 */
function browsersync () {
  browserSync.init({
    proxy: config.localhost,
    // server: {
    //   baseDir: 'build',
    //   index: 'index.html'
    // },
    port: 3000,
    online: false,
    open: false,
    cors: false,
    notify: false,
    logLevel: 'info',
    logPrefix: config.projectName,
    logConnections: false,
    logFileChanges: true
  })
}

function scripts () {
  return browserify({
    entries: [
      './themes/' + config.theme.name + config.theme.assetsFolder + config.scripts.srcFile
    ],
    debug: true
  })
    .transform(babelify)
    .bundle()
    .pipe(source(config.scripts.srcFile))
    .pipe(buffer())
    .pipe(rename({
      dirname: config.theme.name + '/',
      basename: config.scripts.buildName,
      suffix: '.dev'
    }))
    .pipe(sourcemaps.init({
      loadMaps: true
    }))
    .pipe(uglify())
    .pipe(sourcemaps.write())
    .pipe(dest('./themes'))
    .pipe(browserSync.stream())
}

function styles () {
  return src('./themes/' + config.theme.name + config.theme.assetsFolder + config.styles.preprocessor + '/*.' + config.styles.preprocessor)
    .pipe(sourcemaps.init())
    .pipe(eval(config.styles.preprocessor)())
    .pipe(rename({
      dirname: config.theme.name + '/',
      suffix: '.dev'
    }))
    .pipe(autoprefixer({
      overrideBrowserslist: ['last 10 versions'],
      grid: true
    }))
    .pipe(cleancss({
      level: { 1: { specialComments: 1 } }
    }))
    .pipe(sourcemaps.write())
    .pipe(dest('./themes'))
    .pipe(browserSync.stream())
}

/**
 * Production
 */
function buildscripts() {
  return browserify({
    entries: [
      './themes/' + config.theme.name + config.theme.assetsFolder + config.scripts.srcFile
    ],
    debug: false
  })
    .transform(babelify)
    .bundle()
    .pipe(source(config.scripts.srcFile))
    .pipe(buffer())
    .pipe(rename({
      dirname: config.theme.name + '/',
      basename: config.scripts.buildName,
      suffix: '.min'      
    }))
    .pipe(uglify())
    .pipe(dest('./themes'))
}

function buildstyles() {
  return src('./themes/' + config.theme.name + config.theme.assetsFolder + config.styles.preprocessor + '/*.' + config.styles.preprocessor)
    .pipe(eval(config.styles.preprocessor)())
    .pipe(rename({
      dirname: config.theme.name + '/',
      suffix: '.min'      
    }))
    .pipe(autoprefixer({
      overrideBrowserslist: ['last 10 versions'],
      grid: true      
    }))
    .pipe(cleancss({
      level: { 1: { specialComments: 1 } }      
    }))
    .pipe(dest('./themes'))
}

// function deploy() {
// 	return src('/')
// 	.pipe(rsync({
// 		root: '/',
// 		hostname: 'username@yousite.com',
// 		destination: 'yousite/public_html/',
// 		// include: ['*.htaccess'], // Included files
// 		exclude: ['**/Thumbs.db', '**/*.DS_Store', '**/*.sqlite'], // Excluded files
// 		recursive: true,
// 		archive: true,
// 		silent: false,
// 		compress: true
// 	}))
// }

function startwatch () {
  watch([
    './themes/' + config.theme.name  + config.theme.assetsFolder + '*.js',
    './themes/' + config.theme.name  + config.theme.assetsFolder + config.scripts.srcFolder + '/**/*.js'
  ], parallel(scripts));
  watch('./themes/' + config.theme.name + config.theme.assetsFolder + config.styles.preprocessor + '/**/*.' + config.styles.preprocessor, parallel(styles));
  watch('./themes/' + config.theme.name + '/**/*.{' + config.filesWatch + '}').on('change', browserSync.reload);
}

exports.scripts = scripts;
exports.styles = styles;
exports.browsersync = browsersync;
exports.buildstyles = buildstyles;
exports.buildscripts = buildscripts;
// exports.deploy = deploy;

exports.production = parallel(buildscripts, buildstyles);
exports.default = parallel(scripts, styles, browsersync, startwatch);
