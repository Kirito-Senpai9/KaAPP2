import test from 'node:test';
import assert from 'node:assert/strict';
import { createTransformFromOffsets, getResolvedProfileMediaTransform, clampProfileMediaTransform } from '../src/features/profile/presentation/utils/profileMedia.ts';

const photo = { uri: 'file://photo.jpg', width: 1600, height: 900, kind: 'image' };

test('rotation preserves normalized framing while recomputing viewport offsets', () => {
  const media = { ...photo, transform: { zoom: 2, offsetXRatio: 0.75, offsetYRatio: -0.5 } };
  const portrait = getResolvedProfileMediaTransform(media, 360, 214);
  const transform = createTransformFromOffsets(media, 360, 214, portrait.zoom, portrait.translateX, portrait.translateY);
  const landscape = getResolvedProfileMediaTransform({ ...media, transform }, 760, 214);
  assert.equal(transform.zoom, 2);
  assert.equal(transform.offsetXRatio, 0.75);
  assert.equal(transform.offsetYRatio, -0.5);
  assert.equal(landscape.translateX, landscape.maxOffsetX * 0.75);
  assert.equal(landscape.translateY, landscape.maxOffsetY * -0.5);
});

test('framing clamps zoom and offsets without exposing space beyond the image', () => {
  assert.deepEqual(clampProfileMediaTransform(photo, 360, 214, { zoom: 99, offsetXRatio: 4, offsetYRatio: -4 }), {
    zoom: 4, offsetXRatio: 1, offsetYRatio: -1,
  });
  assert.deepEqual(createTransformFromOffsets({ width: 500, height: 500 }, 100, 100, 1, 70, -50), {
    zoom: 1, offsetXRatio: 0, offsetYRatio: 0,
  });
});
