/*eslint no-undef: 1*/
import { setObsColor, getObsColor } from './Map';
import { getFlatIdx, getXfromFlat, getYfromFlat } from './Map';

test('Get and Set obs color works', () => {
  const expectedVal = [1, 2, 3, 4];

  expect(getObsColor()).not.toEqual(expectedVal);
  setObsColor(1, 2, 3, 4);
  expect(getObsColor()).toEqual(expectedVal);
});

test('flatmap 3x7', () => {
  expect(getFlatIdx(0,0,3)).toEqual(0);
  expect(getFlatIdx(1,3,3)).toEqual(10);
  expect(getFlatIdx(2,6,3)).toEqual(20);
});