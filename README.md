# Arduino Node
[![Travis CI](https://travis-ci.org/arduino-cli/arduino-node.svg?branch=master)](https://travis-ci.org/arduino-cli/arduino-node) [![Codecov](https://img.shields.io/codecov/c/github/arduino-cli/arduino-node/master.svg)](https://codecov.io/gh/arduino-cli/arduino-node) [![npm](https://img.shields.io/npm/dm/arduino-node.svg)](https://www.npmjs.com/package/arduino-node) [![npm version](https://img.shields.io/npm/v/arduino-node.svg)](https://www.npmjs.com/package/arduino-node) [![npm dependencies](https://david-dm.org/arduino-cli/arduino-node.svg)](https://david-dm.org/arduino-cli/arduino-node) [![npm dev dependencies](https://david-dm.org/arduino-cli/arduino-node/dev-status.svg)](https://david-dm.org/arduino-cli/arduino-node#info=devDependencies)
> 🎁 Cross-Platform Arduino IDE in nodeJS

## Install

```
$ npm install --save arduino-node
```

## Usage

```js
const arduino = require('arduino-node');

const arduLatest = arduino({path: 'bin'});

arduLatest.run(['--verify', './your-project/your-project.ino'], (err, out) => {
  if (err) {
    console.log(err);
    return;
  }
  console.log(out.stdout);
});

const ardu180 = arduino({path: 'bin', version: '1.8.0'});

ardu180.run(['--verify', './your-project/your-project.ino'], (err, out) => {
  if (err) {
    console.log(err);
    return;
  }
  console.log(out.stdout);
});
```

## API

### arduino(options)

Creates a new `arduino` instance.

#### options

Type: `object`

##### version

Type: `string`<br>
Default: `'latest'`

The Arduino IDE version to use.

##### path

Type: `string`<br>
Default: `'bin'`

The path where Arduino IDE will resides.

### .run([arguments], callback)

Runs the Arduino IDE binary. If the binary is not loaded it will also load it.

#### arguments

Type: `array`<br>
Default: `[]`

An array of arguments to pass to the Arduino IDE.

#### callback(err, out)

Type: `function`

Returns a possible error and the output object.

### .load(callback)

Runs the search for the Arduino IDE binary. If no binary is found it will download it from [`arduino-version`](https://github.com/arduino-cli/arduino-version/releases).

#### callback(err)

Type: `function`

### .unload(callback)

Removes downloaded Arduino IDE binary, if present.

#### callback(err)

Type: `function`

### .bin()

Returns the full path to the Arduino IDE binary.

### .path()

Returns the full path where the Arduino IDE will downloaded to.

## Authors
* **Simone Primarosa** - [simonepri](https://github.com/simonepri)

See also the list of [contributors](https://github.com/simonepri/env-dot-prop/contributors) who participated in this project.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
