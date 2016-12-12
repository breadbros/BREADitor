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
  expect(getFlatIdx(0, 0, 3)).toEqual(0);
  expect(getFlatIdx(1, 3, 3)).toEqual(10);
  expect(getFlatIdx(2, 6, 3)).toEqual(20);

  expect(getXfromFlat(0, 3)).toEqual(0);
  expect(getXfromFlat(10, 3)).toEqual(1);
  expect(getXfromFlat(20, 3)).toEqual(2);

  expect(getYfromFlat(0, 3)).toEqual(0);
  expect(getYfromFlat(10, 3)).toEqual(3);
  expect(getYfromFlat(20, 3)).toEqual(6);
});

test('flatmap 5x3', () => {
  expect(getFlatIdx(0, 0, 5)).toEqual(0);
  expect(getFlatIdx(2, 1, 5)).toEqual(7);
  expect(getFlatIdx(4, 2, 5)).toEqual(14);

  expect(getXfromFlat(0, 5)).toEqual(0);
  expect(getXfromFlat(7, 5)).toEqual(2);
  expect(getXfromFlat(14, 5)).toEqual(4);

  expect(getYfromFlat(0, 5)).toEqual(0);
  expect(getYfromFlat(7, 5)).toEqual(1);
  expect(getYfromFlat(14, 5)).toEqual(2);
});