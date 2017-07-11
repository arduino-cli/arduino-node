'use strict';
const path = require('path');

const lazyReq = require('lazy-req')(require);

const request = lazyReq('request');
const semver = lazyReq('semver');
const del = lazyReq('del');

const manager = lazyReq('bin-manager');

const osFilterObj = lazyReq('os-filter-obj');

const decompressTarxz = lazyReq('decompress-tarxz');
const decompressUnzip = lazyReq('decompress-unzip');

const BIN_PATH = 'bin';

const LATEST_ENDPOINT = 'https://arduino-cli.github.io/arduino-latest/VERSION';

const MIRRORS = [{
  os: 'win32',
  uri: 'https://downloads.arduino.cc/arduino-{{version}}-windows.zip',
  bin: 'arduino_debug.exe'
}, {
  os: 'darwin',
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

const SPLASH_SCREEN = [{
  os: 'win32',
  img: 'lib/splash.png'
}, {
  os: 'darwin',
  img: 'Contents/Java/lib/splash.png'
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
    const opts = {
      extract: true,
      strip: 1,
      plugins: [decompressUnzip()(), decompressTarxz()()]
    };

    if (inited) {
      bin.load(opts, err => callback(err));
      return;
    }

    getSanitizedVersion((err, version) => {
      if (err) {
        callback(err);
        return;
      }
      init(version);
      bin.load(opts, err => {
        if (err) {
          callback(err);
          return;
        }

        // HACK: remove the splash.png file because the arduino IDE does not
        // hide it in command line mode.
        // See https://github.com/arduino/Arduino/blob/master/build/shared/manpage.adoc
        const splash = osFilterObj()(SPLASH_SCREEN);
        if (splash.length === 0) {
          callback();
          return;
        }
        const dirs = splash.map(s => {
          return path.join(bin.path(), s.img);
        });
        del()(dirs)
          .then(() => callback())
          .catch(err => callback(err));
      });
    });
  }

  /**
   * Removes the current version of the binary
   *
   * @param  {Function} callback
   * @api public
   */
  function unload(callback) {
    if (inited) {
      bin.unload(err => callback(err));
      return;
    }

    getSanitizedVersion((err, version) => {
      if (err) {
        callback(err);
        return;
      }
      init(version);
      bin.unload(err => callback(err));
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
      version = semver().clean(version);
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
    request()(LATEST_ENDPOINT, (err, res, body) => {
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
    if (!version) {
      throw new Error('Non semver version provided');
    }
    if (semver().lt(version, '1.5.2')) {
      throw new Error('Arduino command line options are avaiable from the version 1.5.2');
    }
    const slug = 'arduino-' + version + binSlug;
    bin = manager()(binPath, slug);
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
  function binary(callback) {
    if (inited) {
      callback(null, bin.bin());
      return;
    }
    getSanitizedVersion((err, version) => {
      if (err) {
        callback(err);
        return;
      }
      init(version);
      callback(null, bin.bin());
    });
  }

  return {
    run,
    load,
    unload,
    binary
  };
}

module.exports = arduino;
