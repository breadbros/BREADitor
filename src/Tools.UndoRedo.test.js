/*eslint no-undef: 1*/
import { MakeUndoRedoStack } from './UndoRedo';
import { FakeMap } from './helpers/FakeMap';

let map, oldTile;

const tileX = 1, tileY = 2, layerIdx = 0, tileIdx = 42;

beforeEach(() => {
  map = FakeMap();
  map.UndoRedo = MakeUndoRedoStack(map);

  map.setTile(tileX, tileY, layerIdx, tileIdx); // coordinate 1,2 on layer 0 will be tile 99.
  oldTile = map.getTile(tileX, tileY, layerIdx);
  expect(oldTile).toEqual(42);
});

test( 'change_one_tile adds an item to the undo stack', () => {

  expect(map.UndoRedo._undoStack.length).toEqual(0);

  map.UndoRedo.change_one_tile(tileX, tileY, layerIdx, 99);

  expect(map.UndoRedo._undoStack.length).toEqual(1);
});

test( 'undostack frames are arrays of arrays of [tileX, tileY, layerIdx, oldTile]', () => {

  map.UndoRedo.change_one_tile(tileX, tileY, layerIdx, 1942);

  expect(map.UndoRedo._undoStack[0]).toEqual([[tileX, tileY, layerIdx, oldTile]]);
});

test( 'change_one_tile does not add an item to the undo stack if nothing would have changed', () => {

  expect(map.UndoRedo._undoStack.length).toEqual(0);

  map.UndoRedo.change_one_tile(tileX, tileY, layerIdx, oldTile);

  expect(map.UndoRedo._undoStack.length).toEqual(0);
});
