import fs from 'fs';
import pify from 'pify';
import test from 'ava';
import arduino from './';

test('arduino loads arduino latest', async t => {
  const arduinoObj = arduino();
  const err = await pify(arduinoObj.load)();
  t.is(err, undefined);
  const accessErr = await pify(fs.access)(arduinoObj.binary(), fs.constants.X_OK);
  t.is(accessErr, undefined);
});

test('arduino fails to download a version', async t => {
  const arduinoObj = arduino('🦄');
  const err = await t.throws(pify(arduinoObj.load)());
  t.is(err.statusCode, 404);
});

