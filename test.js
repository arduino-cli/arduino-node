import path from 'path';
import del from 'del';
import pify from 'pify';
import executable from 'executable';
import exists from 'file-exists';
import test from 'ava';
import arduino from './';

const fixture = path.join.bind(path, __dirname, 'fixtures');

test('arduino should fail to download an invalid version', async t => {
  const arduinoObj = arduino({version: '🦄', tag: 'fail'});
  const err = await t.throws(pify(arduinoObj.load)());
  t.is(err.statusCode, 404);
});

test('arduino should load and unload arduino latest', async t => {
  const arduinoObj = arduino({tag: 'load'});
  let err = await pify(arduinoObj.load)();
  t.is(err, undefined);
  const exec = await executable(arduinoObj.binary());
  t.is(exec, true);
  err = await pify(arduinoObj.unload)();
  t.is(err, undefined);
  const result = await pify(exists)(arduinoObj.binary());
  t.is(result, false);
});

test('arduino verify should compile', async t => {
  const arduinoObj = arduino({tag: 'verify'});
  await pify(arduinoObj.load)();
  const err = await t.throws(pify(arduinoObj.run)(['--verify', fixture('invalid/invalid.ino')]));
  t.is(err.failed, true);
  const out = await pify(arduinoObj.run)(['--verify', fixture('empty/empty.ino')]);
  t.is(out.failed, false);
  await t.notThrows(pify(arduinoObj.unload)());
});

test.after('cleanup', async t => {
  await t.notThrows(del('bin'));
});
