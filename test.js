import fs from 'fs';
import pify from 'pify';
import test from 'ava';
import arduino from './';

test('arduino loads arduino latest', async t => {
  const arduinoObj = arduino({tag: 'load'});
  const err = await pify(arduinoObj.load)();
  t.is(err, undefined);
  const accessErr = await pify(fs.access)(arduinoObj.binary(), fs.constants.X_OK);
  t.is(accessErr, undefined);
});

test('arduino fails to download a version', async t => {
  const arduinoObj = arduino({version: '🦄', tag: 'fail'});
  const err = await t.throws(pify(arduinoObj.load)());
  t.is(err.statusCode, 404);
});

test('arduino run fail on test test.ino', async t => {
  const arduinoObj = arduino({tag: 'run'});
  pify(arduinoObj.load)();
  const err = await pify(arduinoObj.run)(['--verify', 'fixtures\\test.ino']);
  t.is(err.failed, false);
});

test('arduino unload on test latest version', async t => {
  const arduinoObj = arduino({tag: 'unload'});
  pify(arduinoObj.load)();
  const err = await pify(arduinoObj.unload)();
  t.is(err, undefined);
  const accessErr = await t.throws(pify(fs.access)(arduinoObj.binary(), fs.constants.F_OK));
  t.is(accessErr.code, 'ENOENT');
});
