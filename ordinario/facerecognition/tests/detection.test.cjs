const test = require('node:test');
const assert = require('node:assert/strict');
const { projectFaceBounds, createDetectionSession } = require('../detection');
const viewport = { width: 300, height: 500 };
const bounds = { x: 10, y: 20, width: 30, height: 40 };

test('projects all four corners including scale and preview crop', () => {
  assert.deepEqual(projectFaceBounds(bounds, ({ x, y }) => ({ x: x * 2 - 30, y: y * 2 - 10 }), viewport),
    { left: 0, top: 30, width: 50, height: 80 });
});
test('mirroring reverses horizontal coordinates without negative width', () => {
  assert.deepEqual(projectFaceBounds(bounds, ({ x, y }) => ({ x: 300 - x, y }), viewport),
    { left: 260, top: 20, width: 30, height: 40 });
});
test('sensor rotation swaps axes and reverses one axis', () => {
  assert.deepEqual(projectFaceBounds(bounds, ({ x, y }) => ({ x: y, y: 500 - x }), viewport),
    { left: 20, top: 460, width: 40, height: 30 });
});
test('clips faces to the preview and rejects invisible or invalid bounds', () => {
  const identity = (point) => point;
  assert.deepEqual(projectFaceBounds({ x: 290, y: 490, width: 40, height: 30 }, identity, viewport),
    { left: 290, top: 490, width: 10, height: 10 });
  assert.equal(projectFaceBounds({ ...bounds, x: 400 }, identity, viewport), null);
  assert.equal(projectFaceBounds({ ...bounds, x: NaN }, identity, viewport), null);
  assert.equal(projectFaceBounds({ ...bounds, width: -1 }, identity, viewport), null);
  assert.equal(projectFaceBounds(bounds, identity, { width: 0, height: 0 }), null);
});
test('limits updates to ten per second but clears disappeared faces immediately', () => {
  let time = 0;
  const updates = [];
  const session = createDetectionSession((faces) => updates.push(faces), () => {}, () => time);
  assert.equal(session.accept([bounds]), true);
  time = 50;
  assert.equal(session.accept([bounds]), false);
  assert.equal(session.accept([]), true);
  time = 150;
  assert.equal(session.accept([bounds, bounds]), true);
  assert.deepEqual(updates.map((faces) => faces.length), [1, 0, 2]);
});
test('ignores queued results and errors from a previous closed camera session', () => {
  const results = [];
  const errors = [];
  const oldSession = createDetectionSession((faces) => results.push(faces), (error) => errors.push(error));
  oldSession.close();
  const newSession = createDetectionSession((faces) => results.push(faces), (error) => errors.push(error));
  assert.equal(oldSession.accept([bounds]), false);
  assert.equal(oldSession.fail(new Error('old frame')), false);
  assert.equal(newSession.accept([]), true);
  assert.deepEqual(results, [[]]);
  assert.equal(errors.length, 0);
});
test('reports a failure once and accepts the recovery result immediately', () => {
  const errors = [];
  const results = [];
  const session = createDetectionSession((faces) => results.push(faces), (error) => errors.push(error), () => 0);
  session.accept([bounds]);
  assert.equal(session.fail('detector failure'), true);
  assert.equal(session.fail('same failure'), false);
  assert.equal(session.accept([]), true);
  assert.deepEqual(errors, ['detector failure']);
  assert.equal(results.length, 2);
});
