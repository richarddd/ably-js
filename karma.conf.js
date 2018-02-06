// Karma configuration
// Generated on Mon Feb 16 2015 09:26:57 GMT+0000 (GMT)

module.exports = function(config) {
  var customLaunchers = {
    PhantomJS_without_security: {
      base: 'PhantomJS',
      flags: ['--web-security=no']
    },
    // Check out https://saucelabs.com/platforms for all browser/platform combos
    sl_chrome_54: {
      base: 'SauceLabs',
      browserName: 'chrome',
      platform: 'Windows 10',
      version: '54'
    },
    sl_chrome_35: {
      base: 'SauceLabs',
      browserName: 'chrome',
      platform: 'Windows 7',
      version: '31'
    },
    sl_firefox_37: {
      base: 'SauceLabs',
      browserName: 'firefox',
      version: '37'
    },
    sl_firefox_31: {
      base: 'SauceLabs',
      browserName: 'firefox',
      version: '31'
    },
    sl_ie_11: {
      base: 'SauceLabs',
      browserName: 'internet explorer',
      platform: 'Windows 10',
      version: '11'
    },
    sl_ie_10: {
      base: 'SauceLabs',
      browserName: 'internet explorer',
      platform: 'Windows 7',
      version: '10'
    },
    sl_ie_9: {
      base: 'SauceLabs',
      browserName: 'internet explorer',
      platform: 'Windows 7',
      version: '9'
    },
    sl_ie_8: {
      base: 'SauceLabs',
      browserName: 'internet explorer',
      platform: 'Windows 7',
      version: '8'
    },
    sl_safari_9: {
      base: 'SauceLabs',
      browserName: 'safari',
      platform: 'OS X 10.11',
      version: '9'
    },
    sl_ios_safari_8_4: {
      base: 'SauceLabs',
      browserName: 'iphone',
      platform: 'OS X 10.10',
      version: '8.4'
    },
    sl_ios_safari_9_1: {
      base: 'SauceLabs',
      browserName: 'iphone',
      platform: 'OS X 10.10',
      version: '9.1'
    },
    sl_android_5_0: {
      base: 'SauceLabs',
      browserName: 'android',
      deviceName: 'Android Emulator',
      platform: 'Linux',
      version: '5.0'
    },
    // BrowserStack launchers. List here: https://www.browserstack.com/list-of-browsers-and-platforms?product=automate
    // To get actual values run `curl -u "BROWSERSTACK_USERNAME:BROWSERSTACK_ACCESSKEY" https://api.browserstack.com/automate/browsers.json | json_pp`
    bs_firefox_sierra: {
      base: 'BrowserStack',
      browser: 'firefox',
      browser_version: '58.0',
      os: 'OS X',
      os_version: 'Sierra'
    },
    bs_chrome_sierra: {
      base: 'BrowserStack',
      browser: 'chrome',
      browser_version: '63.0',
      os: 'OS X',
      os_version: 'Sierra'
    },
    bs_firefox_win8: {
      base: 'BrowserStack',
      browser: 'firefox',
      browser_version: '58.0',
      os: 'Windows',
      os_version: '8'
    },
    bs_chrome_win10: {
      base: 'BrowserStack',
      browser: 'chrome',
      browser_version: '63.0',
      os: 'Windows',
      os_version: '10'
    },
    bs_ie11_win81: {
      base: 'BrowserStack',
      browser: 'ie',
      browser_version: '11.0',
      os: 'Windows',
      os_version: '8.1'
    },
    bs_ie10_win81: {
      base: 'BrowserStack',
      browser: 'ie',
      browser_version: '10.0',
      os: 'Windows',
      os_version: '8'
    },
    bs_ie9_win7: {
      base: 'BrowserStack',
      browser: 'ie',
      browser_version: '9.0',
      os: 'Windows',
      os_version: '7'
    },
    bs_ie16_win10: {
      base: 'BrowserStack',
      browser: 'edge',
      browser_version: '16.0',
      os: 'Windows',
      os_version: '10'
    },
    bs_safari_10_3: {
      base: 'BrowserStack',
      browser: 'Mobile Safari',
      os: 'ios',
      os_version: '10.3',
      devices: ['iPhone SE']
    },
    bs_safari_11_2: {
      base: 'BrowserStack',
      browser: 'Mobile Safari',
      os: 'ios',
      os_version: '11.0',
      real_devices: ['iPhone SE']
    }
  };

  config.set({

    browserStack: {
      username: process.env.BROWSERSTACK_USERNAME,
      accessKey: process.env.BROWSERSTACK_ACCESSKEY,
      timeout: 1800
    },

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['requirejs', 'nodeunit'],

    // list of files / patterns to load in the browser
    files: [
      'spec/support/environment.vars.js',
      'spec/support/modules_helper.js',
      'spec/support/test_helper.js',
      'spec/support/browser_setup.js',

      // following files are loaded by RequireJS
      { pattern: 'browser/static/*.js', included: false },
      { pattern: 'browser/static/*.html', included: false },
      { pattern: 'browser/lib/util/base64.js', included: false },

      { pattern: 'node_modules/async/lib/async.js', included: false },

      // shared test set up files
      { pattern: 'spec/common/**/*.js', included: false },
      { pattern: 'spec/common/ably-common/test-resources/*.json', included: false },
      { pattern: 'spec/support/*.js', included: false },

      // List of Tests to run
      // To run an individual test, comment the patterns below and specify path to a single test file
      { pattern: 'spec/realtime/*.test.js', included: false },
      { pattern: 'spec/rest/*.test.js', included: false },
      { pattern: 'spec/browser/*.test.js', included: false }
    ],

    // list of files to exclude
    exclude: [
      'spec/support/browser_file_list.js',
      'spec/support/node_helper.js',
      'spec/support/nodeunit.js'
    ],

    customHeaders: [{
      match: '.*',
      name: 'Access-Control-Allow-Origin',
      value: '*'
    },
    {
      match: '.*',
      name: 'Access-Control-Allow-Methods',
      value: '*'
    }],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'spec/support/environment.vars.js': ['env']
    },

    envPreprocessor: [
      'ABLY_ENV',
      'ABLY_REALTIME_HOST',
      'ABLY_REST_HOST',
      'ABLY_PORT',
      'ABLY_TLS_PORT',
      'ABLY_USE_TLS'
    ],

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['dots', 'BrowserStack'],
    reportSlowerThan: 5000,

    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,

    sauceLabs: {
      testName: 'Ably-JS Javascript Tests',
      username: process.env.SAUCE_USERNAME || 'ably',
      accessKey: process.env.SAUCE_ACCESS_KEY,
      connectOptions: {
        vmVersion: 'dev-varnish'
      }
    },

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: Object.keys(customLaunchers),
    captureTimeout: 360000,
    browserDisconnectTimeout : 10000,
    browserNoActivityTimeout: 360000,
    customLaunchers: customLaunchers,

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false
  });
};
