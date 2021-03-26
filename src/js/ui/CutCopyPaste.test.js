/* eslint no-undef: 0 */
// import { MakeUndoRedoStack } from '../UndoRedo';
// import { FakeMap } from '../helpers/FakeMap';
// import { changeSelectedLayer } from '../js/ui/LayersPalette'; // TODO this shouldnt be public?
// // TODO this definitely is too much junk that shouldnt be exposed. MOCK
// import { setCurrentlySelectedTile, getCurrentlySelectedTile, setTileSelectorUI } from '../TileSelector';

// import floodFillGenerator from './FloodFill';
// const doFloodFill = floodFillGenerator().doFloodFill;

// import { getSelectedLayer } from './LayersPalette';
// import { getXfromFlat, getYfromFlat } from '../../Map';
// import { getCurrentHoverTile } from '../../Tools';

/* eslint no-undef: 0 */
import { MakeUndoRedoStack } from '../../UndoRedo';
import { FakeMap } from '../../helpers/FakeMap';
import { addToPasteboard, paste } from './CutCopyPaste'
import { setSuperCutPasteLayers, superCut, superPaste } from './SuperCutPaste'

import { setVerboseLogging } from '../../Logging'

import { getFlatIdx } from '../../Map';

import { 
  MAGICAL_ENT_LAYER_ID,
  MAGICAL_OBS_LAYER_ID,
  MAGICAL_ZONE_LAYER_ID
} from './LayersPalette';

let map; let oldTile; let ur; let UNDO_stack; let REDO_stack;

const tileX = 1;
const tileY = 2;
const layerIdx = 0;
const tileIdx = 42;

beforeEach(() => {
  setVerboseLogging(false);
  
  map = FakeMap();
  map.UndoRedo = MakeUndoRedoStack(map);
  ur = map.UndoRedo;
  UNDO_stack = ur._undoStack;
  REDO_stack = ur._redoStack;

  map.setTile(tileX, tileY, layerIdx, tileIdx); // coordinate 1,2 on layer 0 will be tile 99.
  oldTile = map.getTile(tileX, tileY, layerIdx);
  expect(oldTile).toEqual(42);
});

const copyMatrixToPasteboard = (matrix) => {

  if (matrix.length != 1) {
    throw "this helper expects an array of length one with n.";
  }

  if (!matrix[0].length) {
    throw "this helper expects there to be arrays inside of the container array.";
  }

  const ar1Len = matrix[0][0].length;

  if (!ar1Len) {
    throw "this helper expects interior arrays to have positive length.";
  }

  for (let i = 1; i < matrix[0].length-1; i++ ) {
    if (matrix[0][i].length != ar1Len ) {
      throw "this helper expects all interior arrays to be the same length.";
    }
  }

  for (let y = 0; y < matrix[0].length; y++ ) {
    // console.log("matrix[0][y].length-1: " + (matrix[0][y].length-1))
    for (let x = 0; x < matrix[0][y].length; x++) {
      addToPasteboard(x,y,-24601,matrix[0][x][y]);
    }
  }
}


test('paste works', () => {

  const pasty = [[
    [1,2,3],
    [4,5,6],
    [7,8,9]
  ]];

  expect(pasty.length).toEqual(1);

  copyMatrixToPasteboard(pasty);

  const startMap = [[
    [2,2,2],
    [2,2,2],
    [2,2,2]
  ], [
    [3,3,3],
    [3,3,3],
    [3,3,3]
  ]];

  map.setMatrix(startMap);

  const endMap = [[
    [2,2,2],
    [2,2,2],
    [2,2,2]
  ], [
    [1,2,3],
    [4,5,6],
    [7,8,9]
  ]];

  expect(map.getMatrix()).toEqual(startMap);

  paste(map, 0, 0, 1)

  expect(map.getMatrix()).toEqual(endMap);
});


test('paste with offset works', () => {

  const pasty = [[
    [1,2,3],
    [4,5,6],
    [7,8,9]
  ]];

  expect(pasty.length).toEqual(1);

  copyMatrixToPasteboard(pasty);

  const startMap = [[
    [2,2,2],
    [2,2,2],
    [2,2,2]
  ], [
    [3,3,3],
    [3,3,3],
    [3,3,3]
  ]];

  map.setMatrix(startMap);

  const endMap = [[
    [2,2,2],
    [2,2,2],
    [2,2,2]
  ], [
    [3,3,3],
    [3,1,2],
    [3,4,5]
  ]];

  expect(map.getMatrix()).toEqual(startMap);

  paste(map, 1, 1, 1)

  expect(map.getMatrix()).toEqual(endMap);
});




test('supercut superpaste', () => {

  const startTiles = [[
    [ 1, 2, 3, 4],
    [ 5, 6, 7, 8],
    [ 9,10,11,12],
    [13,14,15,16],
  ], [
    [17,18,19,20],
    [21,22,23,24],
    [25,26,27,28],
    [29,30,31,32],
  ]];

  const midTiles = [[
    [ 1, 2, 3, 4],
    [ 5, 0, 0, 0],
    [ 9, 0, 0, 0],
    [13, 0, 0, 0],
  ], [
    [17,18,19,20],
    [21, 0, 0, 0],
    [25, 0, 0, 0],
    [29, 0, 0, 0],
  ]];

  const endTiles = [[
    [ 1, 2, 3, 4],
    [ 5, 0, 0, 0],
    [ 9, 0, 6, 7],
    [13, 0,10,11],
  ], [
    [17,18,19,20],
    [21, 0, 0, 0],
    [25, 0,22,23],
    [29, 0,26,27],
  ]];

  const startObs = [
    [33,34,35,36],
    [37,38,39,40],
    [41,42,43,44],
    [45,46,47,48],
  ];

  const midObs = [
    [33,34,35,36],
    [37, 0, 0, 0],
    [41, 0, 0, 0],
    [45, 0, 0, 0],
  ];

  const endObs = [
    [33,34,35,36],
    [37, 0, 0, 0],
    [41, 0,38,39],
    [45, 0,42,43],
  ];

  const startZones = [
    [49,50,51,52],
    [53,54,55,56],
    [57,58,59,60],
    [61,62,63,64],
  ];

  const midZones = [
    [49,50,51,52],
    [53, 0, 0, 0],
    [57, 0, 0, 0],
    [61, 0, 0, 0],
  ];

  const endZones = [
    [49,50,51,52],
    [53, 0, 0, 0],
    [57, 0,54,55],
    [61, 0,58,59],
  ];

  const startEnts = [
    { location : {tx:0, ty:0, px: null, py: null} },   // ent 0
    { location : {tx:null, ty:null, px: 16, py: 16} }, // ent 1
    { location : {tx:2, ty:2, px: null, py: null } },  // ent 2
    { location : {tx:null, ty:null, px: 48, py: 48} }, // ent 3
  ]

  const midEnts = [
    { location : {tx:0, ty:0, px: null, py: null} },       // ent 0
    { location : {tx:null, ty:null, px: null, py: null} }, // ent 1
    { location : {tx:null, ty:null, px: null, py: null } },// ent 2
    { location : {tx:null, ty:null, px: null, py: null} }, // ent 3
  ]

  const endEnts = [
    { location : {tx:0, ty:0, px: null, py: null} },       // ent 0
    { location : {tx:null, ty:null, px: 32, py: 32} },     // ent 1
    { location : {tx:3, ty:3, px: null, py: null } },      // ent 2
    { location : {tx:null, ty:null, px: null, py: null} }, // ent 3
  ]

  map.mapSizeInTiles = {
    width: 4,
    height: 4
  };
  map.selection = {
    tiles: {},
    hull: {
      x: 1,
      y: 1
    }
  };

  map.selection.tiles[getFlatIdx(1,1,4)] = true; // map.selection.tiles is a Set of Flat Indexes.
  map.selection.tiles[getFlatIdx(1,2,4)] = true; // map.selection.tiles is a Set of Flat Indexes.
  map.selection.tiles[getFlatIdx(1,3,4)] = true; // map.selection.tiles is a Set of Flat Indexes.
  map.selection.tiles[getFlatIdx(2,1,4)] = true; // map.selection.tiles is a Set of Flat Indexes.
  map.selection.tiles[getFlatIdx(2,2,4)] = true; // map.selection.tiles is a Set of Flat Indexes.
  map.selection.tiles[getFlatIdx(2,3,4)] = true; // map.selection.tiles is a Set of Flat Indexes.
  map.selection.tiles[getFlatIdx(3,1,4)] = true; // map.selection.tiles is a Set of Flat Indexes.
  map.selection.tiles[getFlatIdx(3,2,4)] = true; // map.selection.tiles is a Set of Flat Indexes.
  map.selection.tiles[getFlatIdx(3,3,4)] = true; // map.selection.tiles is a Set of Flat Indexes.

  map.setMatrix(startTiles);
  map.layers = [ 
    { dimensions: { X: 4, Y: 4 }, parallax: { X: 1, Y: 1 } },
    { dimensions: { X: 4, Y: 4 }, parallax: { X: 1, Y: 1 } } 
  ];

  map._setZoneMatrix(startZones);
  map._setObsMatrix(startObs);
  map._setAllEntities(startEnts);

  expect(map.getMatrix()).toEqual(startTiles);
  expect(map._getZoneMatrix()).toEqual(startZones);
  expect(map._getObsMatrix()).toEqual(startObs);
  expect(map._getAllEntities()).toEqual(startEnts);

  setSuperCutPasteLayers([0,1, /* MAGICAL_ENT_LAYER_ID, */ MAGICAL_OBS_LAYER_ID, MAGICAL_ZONE_LAYER_ID]);
  superCut( map ); // x,y, w,h

  expect(map.getMatrix()).toEqual(midTiles);
  expect(map._getZoneMatrix()).toEqual(midZones);
  expect(map._getObsMatrix()).toEqual(midObs);
  // expect(map._getAllEntities()).toEqual(midEnts);

  superPaste(map, 2,2 ); // x, y
  
  expect(map.getMatrix()).toEqual(endTiles);
  expect(map._getZoneMatrix()).toEqual(endZones);
  expect(map._getObsMatrix()).toEqual(endObs);
  // expect(map._getAllEntities()).toEqual(endEnts);
});
