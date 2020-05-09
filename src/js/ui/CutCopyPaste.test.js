/*eslint no-undef: 0*/
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

/*eslint no-undef: 0*/
import { MakeUndoRedoStack } from '../../UndoRedo';
import { FakeMap } from '../../helpers/FakeMap';
import { addToPasteboard, paste } from './CutCopyPaste'

let map, oldTile, ur, UNDO_stack, REDO_stack;

const tileX = 1;
const tileY = 2;
const layerIdx = 0;
const tileIdx = 42;

beforeEach(() => {
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
    console.log("matrix[0][y].length-1: " + (matrix[0][y].length-1))
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
