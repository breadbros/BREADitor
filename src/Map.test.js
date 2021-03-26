/* eslint no-undef: 1 */
import { setObsColor, getObsColor } from './Map';
import { getFlatIdx, getXfromFlat, getYfromFlat } from './Map';
import { resize_layer } from './js/ui/Util'


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

test('resize_layer shrink happy path', () => {

  const old_layer_data = [1,2,3,4,5,6,7,8,9]
  const old_dim_x = 3;
  const old_dim_y = 3;
  const new_dim_x = 2; 
  const new_dim_y = 2;

  const expected_layer_data = [1,2,4,5];

  const result_layer_data = resize_layer( old_layer_data, old_dim_x, old_dim_y, new_dim_x, new_dim_y );

  expect(result_layer_data).toEqual(expected_layer_data)
});


test('resize_layer shrink happy path 2', () => {

  const old_layer_data = [1,2,3,4,5,6,7,8,9]
  const old_dim_x = 3;
  const old_dim_y = 3;
  const new_dim_x = 3; 
  const new_dim_y = 1;

  const expected_layer_data = [1,2,3];

  const result_layer_data = resize_layer( old_layer_data, old_dim_x, old_dim_y, new_dim_x, new_dim_y );

  expect(result_layer_data).toEqual(expected_layer_data)
});


test('resize_layer shrink happy path 2', () => {

  const old_layer_data = [1,2,3,4,5,6,7,8,9]
  const old_dim_x = 3;
  const old_dim_y = 3;
  const new_dim_x = 1; 
  const new_dim_y = 3;

  const expected_layer_data = [1,4,7];

  const result_layer_data = resize_layer( old_layer_data, old_dim_x, old_dim_y, new_dim_x, new_dim_y );

  expect(result_layer_data).toEqual(expected_layer_data)
});


test('resize_layer grow happy path', () => {

  const old_layer_data = [1,2,3,4,5,6,7,8,9]
  const old_dim_x = 3;
  const old_dim_y = 3;
  const new_dim_x = 4; 
  const new_dim_y = 4;

  const expected_layer_data = [1,2,3,0,4,5,6,0,7,8,9,0,0,0,0,0];

  const result_layer_data = resize_layer( old_layer_data, old_dim_x, old_dim_y, new_dim_x, new_dim_y );

  expect(result_layer_data).toEqual(expected_layer_data)
});

test('resize_layer grow happy path 2', () => {

  const old_layer_data = [1,2,3,4,5,6,7,8,9]
  const old_dim_x = 3;
  const old_dim_y = 3;
  const new_dim_x = 5; 
  const new_dim_y = 5;

  const expected_layer_data = [1,2,3,0,0, 4,5,6,0,0, 7,8,9,0,0, 0,0,0,0,0, 0,0,0,0,0];  

  const result_layer_data = resize_layer( old_layer_data, old_dim_x, old_dim_y, new_dim_x, new_dim_y );

  expect(result_layer_data).toEqual(expected_layer_data)
});


test('resize_layer grow and shrink', () => {

  const old_layer_data = [1,2,3,4,5,6,7,8,9]
  const old_dim_x = 3;
  const old_dim_y = 3;
  const new_dim_x = 5; 
  const new_dim_y = 1;

  const expected_layer_data = [1,2,3,0,0];  

  const result_layer_data = resize_layer( old_layer_data, old_dim_x, old_dim_y, new_dim_x, new_dim_y );

  expect(result_layer_data).toEqual(expected_layer_data)
});

test('resize_layer grow and shrink 2', () => {

  const old_layer_data = [1,2,3,4,5,6,7,8,9]
  const old_dim_x = 3;
  const old_dim_y = 3;
  const new_dim_x = 1; 
  const new_dim_y = 5;

  const expected_layer_data = [1,4,7,0,0];  

  const result_layer_data = resize_layer( old_layer_data, old_dim_x, old_dim_y, new_dim_x, new_dim_y );

  expect(result_layer_data).toEqual(expected_layer_data)
});