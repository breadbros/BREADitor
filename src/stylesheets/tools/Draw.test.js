/*eslint no-undef: 0*/
import { MakeUndoRedoStack } from '../UndoRedo';
import { FakeMap } from '../helpers/FakeMap';

import { _test_SetXYFromMouse, _test_clearXYFromMouse, getXYFromMouse } from '../Tools';
jest.mock('../Tools');

import { _test_clearSelector, setCurrentlySelectedTile, getCurrentlySelectedTile } from '../TileSelector';
jest.mock('../TileSelector');


import { 
  changeSelectedLayer,
  MAGICAL_ENT_LAYER_ID,
  MAGICAL_OBS_LAYER_ID,
  MAGICAL_ZONE_LAYER_ID,
} from '../js/ui/LayersPalette'; // TODO this shouldnt be public?
import { getActiveZone, _test_setActiveZone } from '../js/ui/ZonesPalette'; // TODO this shouldnt be public?


import drawGenerator from './Draw';

let map;
let drawTool = null;

const INITIAL_TILE_TX = 1;
const INITIAL_TILE_TY = 2;
const INITIAL_TILE_LAYER = 0;
const INITIAL_TILE_INDEX = 42;
const INITIAL_ZONE_INDEX = 69;

const getTestTile = () => {
  return map.getTile(INITIAL_TILE_TX, INITIAL_TILE_TY, INITIAL_TILE_LAYER);
}

const getTestObs = () => {
  return map.getTile(INITIAL_TILE_TX, INITIAL_TILE_TY, MAGICAL_OBS_LAYER_ID);
}

const getTestZone = () => {
  return map.getZone(INITIAL_TILE_TX, INITIAL_TILE_TY);
}

beforeEach(() => {
  _test_clearXYFromMouse();
  _test_clearSelector();
  map = FakeMap();

  map.setTile(INITIAL_TILE_TX, INITIAL_TILE_TY, INITIAL_TILE_LAYER, INITIAL_TILE_INDEX); // coordinate 1,2 on layer 0 will be tile 42.
  map.setZone(INITIAL_TILE_TX, INITIAL_TILE_TY, INITIAL_ZONE_INDEX); // coordinate 1,2 on layer 0 will be tile 42.

  drawTool = drawGenerator();
});

test('setup assumptions', () => {

  expect(getTestTile()).not.toEqual(0);
  expect(getTestZone()).not.toEqual(0);
  expect(getTestTile()).toEqual(INITIAL_TILE_INDEX);
  expect(getTestZone()).toEqual(INITIAL_ZONE_INDEX);

  expect(getCurrentlySelectedTile()).toEqual("UNSET");
  expect(drawGenerator).not.toBeNull();
});

test('test draw tile', () => {
  
  const new_tile_index = 666;

  setCurrentlySelectedTile(new_tile_index);
  changeSelectedLayer({layer: map.layers[0], map_tileData_idx: 0}); // what's going on here this is weird
  _test_SetXYFromMouse(INITIAL_TILE_TX,INITIAL_TILE_TY);

  drawTool['mousedown'](map, {button: 0}); // click left button, draw the tile!

  expect(getTestTile()).toEqual(new_tile_index);
});


test('test draw zone', () => {
  //precond
  const expectedZone = 4;
  expect(getTestZone()).not.toEqual(expectedZone);
  
  //setup
  _test_setActiveZone(expectedZone);
  _test_SetXYFromMouse(INITIAL_TILE_TX,INITIAL_TILE_TY);
  changeSelectedLayer({layer: map.layers[0], map_tileData_idx: MAGICAL_ZONE_LAYER_ID}); // GROSS GROSS GROSS
  
  //execute
  drawTool['mousedown'](map, {button: 0}); // click left button, draw the tile!

  //test
  expect(getTestZone()).toEqual(expectedZone);
});


test('test draw obs', () => {
  //precond
  const expectedObsIdx = 99;
  expect(getTestObs()).not.toEqual(expectedObsIdx);
  
  //setup
  setCurrentlySelectedTile(expectedObsIdx);
  _test_SetXYFromMouse(INITIAL_TILE_TX,INITIAL_TILE_TY);
  changeSelectedLayer({layer: map.layers[0], map_tileData_idx: MAGICAL_OBS_LAYER_ID}); // GROSS GROSS GROSS
  
  //execute
  drawTool['mousedown'](map, {button: 0}); // click left button, draw the tile!

  //test
  expect(getTestObs()).toEqual(expectedObsIdx);
});
