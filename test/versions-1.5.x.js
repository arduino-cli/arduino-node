import path from 'path';
import pify from 'pify';
import test from 'ava';
import arduino from '../index';

const fixture = path.join.bind(path, __dirname, '../fixtures');

testVersion('1.5.8');
testVersion('1.5.7');
testVersion('1.5.6');
testVersion('1.5.5');
testVersion('1.5.4');
testVersion('1.5.3');
testVersion('1.5.2');

function testVersion(ver) {
  return test.serial('arduino verify should compile on arduino ' + ver, async t => {
    const arduinoObj = arduino({tag: 'verify', version: ver});
    await pify(arduinoObj.load)();
    let err = await t.throws(pify(arduinoObj.run)(['--verify', fixture('invalid/invalid.ino')]));
    t.is(err.failed, true);
    const out = await pify(arduinoObj.run)(['--verify', fixture('empty/empty.ino')]);
    t.is(out.failed, false);
    err = await pify(arduinoObj.unload)();
    t.is(err, undefined);
  });
}
