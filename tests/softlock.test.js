// Soft locks: anything that can leave world.busy > 0 forever takes the player's control away.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createWorld } from '../src/world/world-scene.js';

async function frames(w, n) { for (let i = 0; i < n; i++) { w.update(1 / 60); for (let k = 0; k < 8; k++) await null; } }

test('two door triggers in one frame start one transition, and control comes back', async () => {
  const w = createWorld();
  w.enter('dorm', 'door');
  await frames(w, 30);
  const door = w.room.doorAt(16, 1);
  w.tryDoor(door); // pushed into it
  w.tryDoor(door); // and pressed the action key on the same frame
  await frames(w, 90);
  assert.equal(w.room.id, 'corridor');
  assert.equal(w.busy, 0, 'busy must return to 0');
  assert.equal(w.canAct(), true);
});

test('a second fadeTo does not strand the first waiter', async () => {
  const w = createWorld();
  w.enter('dorm', 'door');
  await frames(w, 30);
  let a = false, b = false;
  w.fadeTo(1, 5).then(() => { a = true; });
  w.fadeTo(1, 5).then(() => { b = true; });
  await frames(w, 40);
  assert.ok(a, 'first waiter resolved');
  assert.ok(b, 'second waiter resolved');
});

test('a superseded scripted walk still resolves', async () => {
  const w = createWorld();
  w.enter('dorm', 'door');
  w.addActor({ id: 'v', sprite: 'vesna', x: 5, y: 5 });
  let first = false;
  w.walkTo('v', 9, 5, 1).then(() => { first = true; });
  w.walkTo('v', 5, 7, 1);
  await frames(w, 200);
  assert.ok(first);
});

test('resetRuns releases the lock held by an abandoned event', async () => {
  const w = createWorld();
  w.enter('dorm', 'door');
  await frames(w, 30);
  w.run(() => new Promise(() => {})); // an event that will never finish
  assert.equal(w.busy, 1);
  w.resetRuns();
  assert.equal(w.busy, 0);
  assert.equal(w.canAct(), true);
});

test('removing an actor mid-walk still releases whoever awaited the walk', async () => {
  const w = createWorld();
  w.enter('dorm', 'door');
  w.addActor({ id: 'v', sprite: 'vesna', x: 5, y: 5 });
  let done = false;
  w.walkTo('v', 12, 5, 0.2).then(() => { done = true; });
  w.removeActor('v');
  await frames(w, 2);
  assert.ok(done, 'removeActor resolves the pending walk');
  w.addActor({ id: 'u', sprite: 'vesna', x: 5, y: 5 });
  let done2 = false;
  w.walkTo('u', 12, 5, 0.2).then(() => { done2 = true; });
  w.enter('corridor', 'dorm'); // leaving the room drops non-persistent actors
  await frames(w, 2);
  assert.ok(done2, 'entering another room resolves walks of actors left behind');
});
