'use strict';
const path = require('path');

const lazyReq = require('lazy-req')(require);

const request = lazyReq('request');
const semver = lazyReq('semver');
const del = lazyReq('del');

const manager = lazyReq('bin-manager');

const osFilterObj = lazyReq('os-filter-obj');

const BIN_PATH = 'bin';

const VERSION_LIST_ENDPOINT = 'https://arduino-cli.github.io/arduino-version/list';

const MIRRORS = [{
  os: 'win32',
  uri: 'https://github.com/arduino-cli/arduino-version/releases/download/{{version}}/arduino-{{version}}-windows.zip',
  bin: 'arduino_debug.exe'
}, {
  os: 'darwin',
  uri: 'https://github.com/arduino-cli/arduino-version/releases/download/{{version}}/arduino-{{version}}-macosx.zip',
  bin: 'Contents/MacOS/Arduino'
}, {
  os: 'linux',
  arch: 'x32',
  uri: 'https://github.com/arduino-cli/arduino-version/releases/download/{{version}}/arduino-{{version}}-linux32.zip',
  bin: 'arduino'
}, {
  os: 'linux',
  arch: 'x64',
  uri: 'https://github.com/arduino-cli/arduino-version/releases/download/{{version}}/arduino-{{version}}-linux64.zip',
  bin: 'arduino'
}, {
  os: 'linux',
  arch: 'arm',
  uri: 'https://github.com/arduino-cli/arduino-version/releases/download/{{version}}/arduino-{{version}}-linuxarm.zip',
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

    getFullVersion((err, version) => {
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
      strip: 1
    };

    if (inited) {
      bin.load(opts, err => callback(err));
      return;
    }

    getFullVersion((err, version) => {
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

    getFullVersion((err, version) => {
      if (err) {
        callback(err);
        return;
      }
      init(version);
      bin.unload(err => callback(err));
    });
  }

  /**
   * Checks if a version is available.
   *
   * @param  {Function} callback
   * @api private
   */
  function getFullVersion(callback) {
    getVersionsList((err, vers) => {
      if (err) {
        callback(err);
        return;
      }
      if (version === 'latest') {
        callback(null, vers[vers.length - 1]);
        return;
      }
      const valid = vers.some(v => v === version);
      if (!valid) {
        callback(new Error('The version provided is not available.'));
        return;
      }
      callback(null, version);
    });
  }

  /**
   * Retrieves the list of arduino ide versions available
   *
   * @param  {Function} callback
   * @api private
  */
  function getVersionsList(callback) {
    request()(VERSION_LIST_ENDPOINT, (err, res, body) => {
      if (err) {
        callback('Cannot resolve the latest version: ' + err);
        return;
      }
      if (res.statusCode !== 200) {
        callback('Cannot resolve the latest version: ' + res.statusCode);
        return;
      }
      const vers = body.split('j').map(v => semver().clean(v));
      callback(null, vers);
    });
  }

  /**
   * Initializes the binary mirrors
   *
   * @param {String} version
   * @api private
   */
  function init(version) {
    const slug = 'arduino-' + version + binSlug;
    bin = manager()(binPath, slug);
    MIRRORS.forEach(mirror => {
      bin.src(mirror.uri.replace(/{{version}}/g, version), mirror.os, mirror.arch);

      if (mirror.os === process.platform) {
        bin.use(mirror.bin.replace(/{{version}}/g, version));
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
    getFullVersion((err, version) => {
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
