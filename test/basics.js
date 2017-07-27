import path from 'path';
import del from 'del';
import pify from 'pify';
import executable from 'executable';
import exists from 'exists-file';
import test from 'ava';
import arduino from '../index';

const fixture = path.join.bind(path, 'fixtures');

test.serial('arduino should fail to download versions not available', async t => {
  const arduinoObj = arduino({version: '1.5.0'});
  const err = await t.throws(pify(arduinoObj.load)());
  t.is(err.message, 'The version provided is not available');
});

test.serial('arduino should load and unload arduino latest.serial', async t => {
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

test.serial('arduino should not download the IDE twice', async t => {
  const arduinoObj = arduino({path: 'tmp', tag: 'load'});
  const err = await pify(arduinoObj.load)();
  t.is(err, undefined);
  const err2 = await pify(arduinoObj.load)();
  t.is(err2, undefined);
});

test.serial('arduino should run succesfully if not loaded', async t => {
  const arduinoObj = arduino({tag: 'run'});
  const out = await pify(arduinoObj.run)(['--verify', fixture('empty/empty.ino')]);
  t.is(out.failed, false);
  arduinoObj.unload();
});

test.serial.after('cleanup', async t => {
  await t.notThrows(del('tmp'));
});
