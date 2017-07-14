import path from 'path';
import del from 'del';
import pify from 'pify';
import executable from 'executable';
import exists from 'exists-file';
import test from 'ava';
import arduino from './';

const fixture = path.join.bind(path, __dirname, 'fixtures');

test('arduino should fail to download an unreleased version', async t => {
  const arduinoObj = arduino({version: '1000.0.0', tag: 'fail'});
  const err = await t.throws(pify(arduinoObj.load)());
  t.is(err.statusCode, 404);
});

test('arduino should fail if non semver version is provided', async t => {
  const arduinoObj = arduino({version: '🦄'});
  const err = await t.throws(pify(arduinoObj.load)());
  t.is(err.message, 'Non semver version provided');
});

test('arduino should fail to download versions < 1.5.2', async t => {
  const arduinoObj = arduino({version: '1.5.0'});
  const err = await t.throws(pify(arduinoObj.load)());
  t.is(err.message, 'Arduino command line options are avaiable from the version 1.5.2');
});

test('arduino should load and unload arduino latest', async t => {
  const arduinoObj = arduino({path: 'tmp', tag: 'load'});
  let err = await pify(arduinoObj.load)();
  t.is(err, undefined);
  const bin = await pify(arduinoObj.binary)();
  const exec = await executable(bin);
  t.is(exec, true);
  err = await pify(arduinoObj.unload)();
  t.is(err, undefined);
  const result = await exists(bin);
  t.is(result, false);
});

testVersion('1.8.3');
testVersion('1.8.2');
testVersion('1.8.1');
testVersion('1.8.0');

testVersion('1.7.11');
testVersion('1.7.10');
testVersion('1.7.9');
testVersion('1.7.8');
testVersion('1.7.7');
testVersion('1.7.6');
testVersion('1.7.5');
testVersion('1.7.4');
testVersion('1.7.3');
testVersion('1.7.2');
testVersion('1.7.1');
testVersion('1.7.0');

test.after('cleanup', async t => {
  await t.notThrows(del('tmp'));
});

function testVersion(ver) {
  return test('arduino verify should compile on arduino ' + ver, async t => {
    const arduinoObj = arduino({tag: 'verify', version: ver});
    await pify(arduinoObj.load)();
    const err = await t.throws(pify(arduinoObj.run)(['--verify', fixture('invalid/invalid.ino')]));
    t.is(err.failed, true);
    const out = await pify(arduinoObj.run)(['--verify', fixture('empty/empty.ino')]);
    t.is(out.failed, false);
  });
}
