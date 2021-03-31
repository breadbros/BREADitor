import { MakeUndoRedoStack } from '../UndoRedo';
import { FakeMap } from '../helpers/FakeMap';
import { changeSelectedLayer } from '../js/ui/LayersPalette'; // TODO this shouldnt be public?

// TODO this definitely is too much junk that shouldnt be exposed. MOCK
import { setCurrentlySelectedTile, getCurrentlySelectedTile, setTileSelectorUI } from '../TileSelector';

import { setVerboseLogging } from '../Logging'

import floodFillGenerator from './FloodFill';

const {doFloodFill} = floodFillGenerator();

import * as jetpack from "fs-jetpack";

jest.mock(jetpack);

let map = null;
let mouseEvt = null;

beforeEach(() => {
  setVerboseLogging(false);

  map = FakeMap();
  map.camera = [0, 0, 1]; // loc: 0,0 zoom: 1
  map.UndoRedo = MakeUndoRedoStack(map);
  mouseEvt = { // should be tile 1,1
    offsetX: 16,
    offsetY: 16
  };
  // map.dataPath = 'fake-datapath';

  window.$$$currentMap = map;

  const fakeVSPName = 'a-fake-vsp';
  map.vspData = {};
  map.vspData[fakeVSPName] = {
    source_image: 'this-totally-doesnt-exist.png'
  };
  setTileSelectorUI('#ignore-me', 13083, map, 0, 'a-fake-vsp'); // this is garbage
});

test('getCurrentlyExpectedTile and setCurrentlySelectedTile', () => {
  expect(getCurrentlySelectedTile()).toEqual(13083);

  setCurrentlySelectedTile(90210);

  expect(getCurrentlySelectedTile()).toEqual(90210);
});

test('test a flood fill', () => {
  changeSelectedLayer({layer: map.layers[0], map_tileData_idx: 0}); // what's going on here this is weird

  map.windowOverlay = {on: false};

  expect(map.getTile(0, 0, 0)).toEqual(0);
  expect(map.getTile(0, 1, 0)).toEqual(0);
  expect(map.getTile(0, 2, 0)).toEqual(0);
  expect(map.getTile(1, 0, 0)).toEqual(0);
  expect(map.getTile(1, 1, 0)).toEqual(0);
  expect(map.getTile(1, 2, 0)).toEqual(0);
  expect(map.getTile(2, 0, 0)).toEqual(0);
  expect(map.getTile(2, 1, 0)).toEqual(0);
  expect(map.getTile(2, 2, 0)).toEqual(0);

  setCurrentlySelectedTile(42);

  expect(getCurrentlySelectedTile()).toEqual(42);

  doFloodFill(map, mouseEvt);

  expect(map.getTile(0, 0, 0)).toEqual(42);
  expect(map.getTile(0, 1, 0)).toEqual(42);
  expect(map.getTile(0, 2, 0)).toEqual(42);
  expect(map.getTile(1, 0, 0)).toEqual(42);
  expect(map.getTile(1, 1, 0)).toEqual(42);
  expect(map.getTile(1, 2, 0)).toEqual(42);
  expect(map.getTile(2, 0, 0)).toEqual(42);
  expect(map.getTile(2, 1, 0)).toEqual(42);
  expect(map.getTile(2, 2, 0)).toEqual(42);
});
