/*eslint no-undef: 1*/
import { setObsColor, getObsColor } from './Map.js';

test('Get and Set obs color works', () => {
  const expectedVal = [1, 2, 3, 4];

  expect(getObsColor()).not.toEqual(expectedVal);
  setObsColor(1, 2, 3, 4);
  expect(getObsColor()).toEqual(expectedVal);
});
