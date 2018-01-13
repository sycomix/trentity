// @ts-check

/** Import project dependencies */
import * as del from 'del';
import * as gulp from 'gulp';
import * as babel from 'gulp-babel';
import * as sq from 'gulp-sequence';
import lint from 'gulp-tslint';
import * as ts from 'gulp-typescript';
import * as tslint from 'tslint';

/** Import other modules */
// tslint:disable-next-line:no-var-requires
const packageJson = require('./package.json');

/** Setting up */
const isProd = process.env.NODE_ENV === 'production';
const SRC = 'src';
const TMP = '.tmp';
const DIST = 'dist';
const IGNORE_DIR = [
  `${SRC}/demo`,
];
const BABELRC = {
  presets: [
    [
      'env',
      {
        targets: {
          node: 'current',
        },
        spec: true,
        modules: false,
        useBuiltIns: true,
      },
    ],
    ...(isProd ? [
      [
        'minify',
        {
          replace: false,
          removeConsole: false,
          removeDebugger: true,
        },
      ],
    ] : []),
  ],
  plugins: [
    [
      'inline-replace-variables', {
        __APP_VERSION__: packageJson.version,
      },
    ],
    'transform-function-bind',
    ['transform-object-rest-spread', { useBuiltIns: true }],
  ],
  ignore: isProd
    ? [
      '**/__mocks*__/*.js',
      '**/__tests*__/*.dist.spec.js',
      '**/__tests*__/*.spec.js',
    ]
    : [],
};

gulp.task('lint', () =>
  gulp.src([
    `${SRC}/**/*.ts`,
    `${SRC}/**/*.tsx`,
  ])
    .pipe(lint({
      configuration: isProd ? './tslint.json' : './tslint.debug.json',
      formatter: 'stylish',
      program: tslint.Linter.createProgram('./tsconfig.json'),
    }))
    .pipe(lint.report()));

gulp.task('ts', () =>
  gulp.src([
    `${SRC}/**/*.ts*`,
    ...IGNORE_DIR.map(n => `${isProd ? '!' : ''}${n}/**/*.ts*`),
  ])
    .pipe(ts.createProject('./tsconfig.json')())
    .pipe(gulp.dest(TMP)));

gulp.task('babel', () =>
  gulp.src([
    `${SRC}/**/*.js`,
    `${TMP}/**/*.js`,
  ])
    .pipe(babel(BABELRC))
    .pipe(gulp.dest(DIST)));

gulp.task('clean', () => del([
  TMP,
  DIST,
  '*.js',
  '*.jsx',
  '*.d.ts*',
  'test/',
  'demo/',
]));

gulp.task('clear', () => del([
  TMP,
  './gulpfile.js',
]));

gulp.task('copy', () => gulp.src([
  `${SRC}/**/*.html`,
  `${TMP}/**/*`,
  `!${TMP}/**/*.js`,
])
.pipe(gulp.dest(DIST)));

gulp.task('monaco', () => gulp.src([
  'node_modules/monaco-editor/**/*',
])
  .pipe(gulp.dest(`${DIST}/node_modules/monaco-editor`)));

gulp.task('watch', () => {
  gulp.watch([
    `${SRC}/**/*.ts`,
    `${SRC}/**/*.tsx`,
  ], ['build']);
});

gulp.task('build', ['clean'], cb => sq(...[
  'lint',
  'ts',
  ['babel', 'copy', 'monaco'],
  'clear',
])(cb));

gulp.task('default', ['watch'], sq('build'));
