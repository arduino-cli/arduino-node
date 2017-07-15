import del from 'del';
import pify from 'pify';
import executable from 'executable';
import exists from 'exists-file';
import test from 'ava';
import arduino from '../index';

test('arduino should fail to download versions not available', async t => {
  const arduinoObj = arduino({version: '1.5.0'});
  const err = await t.throws(pify(arduinoObj.load)());
  t.is(err.message, 'The version provided is not available');
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

test.after('cleanup', async t => {
  await t.notThrows(del('tmp'));
});
