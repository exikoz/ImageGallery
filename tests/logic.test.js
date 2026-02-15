import { sum } from '../src/logic.js';

test('adderar 1 + 2 till att bli 3', () => {
  expect(sum(1, 2)).toBe(3);
});