import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EASE, lerpAngle, samplePose, POSES, JOINTS, createSpring, createChain, solveRig } from '../src/cutscene/puppet.js';

test('easings start at 0 and end at 1', () => {
  for (const [name, f] of Object.entries(EASE)) {
    assert.ok(Math.abs(f(0)) < 1e-9, `${name}(0)`);
    assert.ok(Math.abs(f(1) - 1) < 1e-9, `${name}(1)`);
  }
});

test('lerpAngle turns the short way round', () => {
  assert.ok(Math.abs(lerpAngle(170, -170, 0.5) - 180) < 1e-9 || Math.abs(lerpAngle(170, -170, 0.5) + 180) < 1e-9);
  assert.equal(lerpAngle(0, 90, 0.5), 45);
});

test('every named pose defines every joint', () => {
  for (const [name, p] of Object.entries(POSES)) for (const j of JOINTS) assert.equal(typeof p[j], 'number', `${name}.${j}`);
});

test('samplePose blends between keyframes with easing and holds the ends', () => {
  const keys = [{ t: 0, pose: 'stand', x: 0, y: 100 }, { t: 2, pose: 'arms_up', x: 40, y: 100, ease: 'linear' }];
  const a = samplePose(keys, -1);
  assert.equal(a.x, 0);
  assert.equal(a.lArm, POSES.stand.lArm);
  const m = samplePose(keys, 1);
  assert.equal(m.x, 20);
  assert.ok(Math.abs(m.lArm - (POSES.stand.lArm + POSES.arms_up.lArm) / 2) < 1e-9);
  const z = samplePose(keys, 9);
  assert.equal(z.x, 40);
  assert.equal(z.rArm, POSES.arms_up.rArm);
});

test('keyframe overrides win over the named pose', () => {
  const p = samplePose([{ t: 0, pose: 'stand', head: 25 }], 0);
  assert.equal(p.head, 25);
});

test('a spring settles on its target', () => {
  const s = createSpring(60, 8);
  for (let i = 0; i < 600; i++) s.step(10, 1 / 60);
  assert.ok(Math.abs(s.value - 10) < 0.01);
});

test('a verlet chain keeps its segment lengths', () => {
  const c = createChain(8, 3, { x: 0, y: 0 });
  for (let i = 0; i < 240; i++) c.step({ x: Math.sin(i / 10) * 20, y: 0 }, 1 / 60, { gravity: 300, wind: 40 });
  for (let i = 1; i < c.points.length; i++) {
    const d = Math.hypot(c.points[i].x - c.points[i - 1].x, c.points[i].y - c.points[i - 1].y);
    assert.ok(Math.abs(d - 3) < 0.35, `segment ${i} is ${d}`);
  }
  assert.deepEqual([c.points[0].x, c.points[0].y].map((v) => Math.round(v * 100) / 100), [Math.round(Math.sin(239 / 10) * 2000) / 100, 0]);
});

test('the rig puts the feet below the hips and the head above when standing', () => {
  const r = solveRig({ ...POSES.stand, x: 100, y: 100, rot: 0, scale: 1, spin: 0, lift: 0 });
  assert.ok(r.head.y < r.hip.y);
  assert.ok(r.lFoot.y > r.hip.y && r.rFoot.y > r.hip.y);
  assert.ok(Math.abs(r.lFoot.y - 100) < 3, 'standing feet sit on the floor line');
});
