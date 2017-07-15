import path from 'path';
import pify from 'pify';
import test from 'ava';
import arduino from '../index';

const fixture = path.join.bind(path, __dirname, '../fixtures');

testVersion('1.6.13');
testVersion('1.6.12');
testVersion('1.6.11');
testVersion('1.6.10');
testVersion('1.6.9');
testVersion('1.6.8');
testVersion('1.6.7');
testVersion('1.6.6');
testVersion('1.6.5');
testVersion('1.6.4');
testVersion('1.6.3');
testVersion('1.6.2');
testVersion('1.6.1');
testVersion('1.6.0');

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
