'use strict';
const request = require('request');
const semver = require('semver');

const manager = require('bin-manager');

const BIN_PATH = 'bin';
const LATEST_ENDPOINT = 'https://arduino-cli.github.io/arduino-latest/VERSION';
const MIRRORS = [{
  os: 'win32',
  arch: 'x64',
  uri: 'https://downloads.arduino.cc/arduino-{{version}}-windows.zip',
  bin: 'arduino-{{version}}\\arduino_debug.exe'
}, {
  os: 'darwin',
  arch: 'x64',
  uri: 'https://downloads.arduino.cc/arduino-{{version}}-macosx.zip',
  bin: 'Contents/MacOS/Arduino'
}, {
  os: 'linux',
  arch: 'x32',
  uri: 'https://downloads.arduino.cc/arduino-{{version}}-linux32.tar.xz',
  bin: 'arduino'
}, {
  os: 'linux',
  arch: 'x64',
  uri: 'https://downloads.arduino.cc/arduino-{{version}}-linux64.tar.xz',
  bin: 'arduino'
}, {
  os: 'linux',
  arch: 'arm',
  uri: 'https://downloads.arduino.cc/arduino-{{version}}-linuxarm.tar.xz',
  bin: 'arduino'
}];

/**
 * Initialize a new `Arduino`
 *
 * @param {Object} [opts]
 * @api public
 */

function arduino(opts) {
  const version = opts.version || 'latest';
  const binPath = opts.path || BIN_PATH;
  const binSlug = opts.tag ? ('-' + opts.tag) : '';
  let inited = false;
  let bin;

  /**
   * Runs the arduino binary
   *
   * @param {Array}    [argv]
   * @param {Function} callback
   * @api public
   */
  function run(argv, callback) {
    if (callback === undefined) {
      callback = argv;
      argv = [];
    }
    if (inited) {
      bin.run(argv, callback);
      return;
    }

    getSanitizedVersion((err, version) => {
      if (err) {
        callback(err);
        return;
      }
      init(version);
      bin.run(argv, callback);
    });
  }

  /**
   * Load/download the current version of the binary
   *
   * @param {Function} callback
   * @api public
   */
  function load(callback) {
    if (inited) {
      bin.load(err => callback(err));
      return;
    }

    getSanitizedVersion((err, version) => {
      if (err) {
        callback(err);
        return;
      }
      init(version);
      bin.load(err => callback(err));
    });
  }

  /**
   * Removes the current version of the binary
   *
   * @param  {Object} [opts]
   * @param  {Function} callback
   * @api public
   */
  function unload(opts, callback) {
    if (callback === undefined) {
      callback = opts;
      opts = {};
    }
    if (inited) {
      bin.unload(opts, err => callback(err));
      return;
    }

    getSanitizedVersion((err, version) => {
      if (err) {
        callback(err);
        return;
      }
      init(version);
      bin.unload(opts, err => callback(err));
    });
  }

  /**
   * Gets the version and the it sanitizes it
   *
   * @param  {Function} callback
   * @api private
   */
  function getSanitizedVersion(callback) {
    getFullVersion((err, version) => {
      if (err) {
        callback(err);
        return;
      }
      version = semver.clean(version);
      callback(null, version);
    });
  }

  /**
   * Gets the right version number when special values are passed as version
   *
   * @param  {Function} callback
   * @api private
   */
  function getFullVersion(callback) {
    if (version !== 'latest') {
      callback(null, version);
      return;
    }
    getLatestVersion(callback);
  }

  /**
   * Retrieves latest arduino ide version available
   *
   * @param  {Function} callback
   * @api private
  */
  function getLatestVersion(callback) {
    request(LATEST_ENDPOINT, (err, res, body) => {
      if (err || res.statusCode !== 200) {
        callback(err || 'error: ' + err.statusCode);
        return;
      }
      callback(null, body);
    });
  }

  /**
   * Initializes the binary mirrors
   *
   * @param {String} version
   * @api private
   */
  function init(version) {
    bin = manager(binPath, 'arduino-' + version + binSlug);
    MIRRORS.forEach(mirror => {
      bin.src(mirror.uri.replace('{{version}}', version), mirror.os, mirror.arch);

      if (mirror.os === process.platform) {
        bin.use(mirror.bin.replace('{{version}}', version));
      }
    });

    inited = true;
  }

  /**
   *
   * @api public
   * @returns /path/to/bin
   */
  function binary() {
    return bin.bin();
  }

  return {
    run,
    load,
    unload,
    binary
  };
}

module.exports = arduino;
