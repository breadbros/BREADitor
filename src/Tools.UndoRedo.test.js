/* eslint no-undef: 0 */
import { MakeUndoRedoStack } from './UndoRedo';
import { FakeMap } from './helpers/FakeMap';

let map; let oldTile; let ur; let UNDO_stack; let REDO_stack;

const tileX = 1;
const tileY = 2;
const layerIdx = 0;
const tileIdx = 42;
const zoneIdx = 69;

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


// //
// // Tiles
// //

test('change_one_tile adds an item to the undo stack', () => {
  expect(UNDO_stack.length).toEqual(0);

  ur.change_one_tile(tileX, tileY, layerIdx, 99);

  expect(UNDO_stack.length).toEqual(1);
});

test('change_one_tile... changes the tile (no, really guys)', () => {
  ur.change_one_tile(tileX, tileY, layerIdx, 90210);

  expect(90210).toEqual(map.getTile(tileX, tileY, layerIdx))
;});

test('undostack tileedit frames are arrays of arrays of [tileX, tileY, layerIdx, oldTile]', () => {
  ur.change_one_tile(tileX, tileY, layerIdx, 1942);

  const {oper, data} = UNDO_stack[0];

  expect(data).toEqual([[tileX, tileY, layerIdx, oldTile]]);
  expect(data[0][0][3]).not.toEqual(1942);
});


test('change_one_tile does not add an item to the undo stack if nothing would have changed', () => {
  expect(UNDO_stack.length).toEqual(0);

  ur.change_one_tile(tileX, tileY, layerIdx, oldTile);

  expect(UNDO_stack.length).toEqual(0);
});

test('undo does nothing (specifically, doesnt crash) if there is no redostack', () => {
  expect(UNDO_stack.length).toEqual(0);
  ur.undo();
});

test('redo does nothing (specifically, doesnt crash) if there is no redostack', () => {
  expect(REDO_stack.length).toEqual(0);
  ur.redo();
});

test('draw. undo.', () => {
  ur.change_one_tile(tileX, tileY, layerIdx, 666);
  expect(666).toEqual(map.getTile(tileX, tileY, layerIdx));
  ur.undo();
  expect(42).toEqual(map.getTile(tileX, tileY, layerIdx));
});

test('draw. undo. redo.', () => {
  ur.change_one_tile(tileX, tileY, layerIdx, 777);
  expect(777).toEqual(map.getTile(tileX, tileY, layerIdx));
  ur.undo();
  expect(42).toEqual(map.getTile(tileX, tileY, layerIdx));
  ur.redo();
  expect(777).toEqual(map.getTile(tileX, tileY, layerIdx));
});

test('draw. undo. redo. undo. redo.', () => {
  ur.change_one_tile(tileX, tileY, layerIdx, 888);
  expect(888).toEqual(map.getTile(tileX, tileY, layerIdx));
  expect(UNDO_stack.length).toEqual(1);
  expect(REDO_stack.length).toEqual(0);
  ur.undo();
  expect(UNDO_stack.length).toEqual(0);
  expect(REDO_stack.length).toEqual(1);
  expect(42).toEqual(map.getTile(tileX, tileY, layerIdx));
  ur.redo();
  expect(UNDO_stack.length).toEqual(1);
  expect(REDO_stack.length).toEqual(0);
  expect(888).toEqual(map.getTile(tileX, tileY, layerIdx));
  ur.undo();
  expect(UNDO_stack.length).toEqual(0);
  expect(REDO_stack.length).toEqual(1);
  expect(42).toEqual(map.getTile(tileX, tileY, layerIdx));
  ur.redo();
  expect(UNDO_stack.length).toEqual(1);
  expect(REDO_stack.length).toEqual(0);
  expect(888).toEqual(map.getTile(tileX, tileY, layerIdx));
});

test('change_many_tiles', () => {
  const changeset = [];

  changeset[0] = ur.prepare_one_tile(0, 0, layerIdx, 101);
  changeset[1] = ur.prepare_one_tile(0, 1, layerIdx, 202);
  changeset[2] = ur.prepare_one_tile(0, 2, layerIdx, 303);

  ur.change_many_tiles(changeset);

  expect(map.getTile(0, 0, layerIdx)).toEqual(101);
  expect(map.getTile(0, 1, layerIdx)).toEqual(202);
  expect(map.getTile(0, 2, layerIdx)).toEqual(303);
  expect(UNDO_stack.length).toEqual(1);
  expect(REDO_stack.length).toEqual(0);

  ur.undo();

  expect(map.getTile(0, 0, layerIdx)).toEqual(0);
  expect(map.getTile(0, 1, layerIdx)).toEqual(0);
  expect(map.getTile(0, 2, layerIdx)).toEqual(0);
  expect(UNDO_stack.length).toEqual(0);
  expect(REDO_stack.length).toEqual(1);

  ur.redo();

  expect(map.getTile(0, 0, layerIdx)).toEqual(101);
  expect(map.getTile(0, 1, layerIdx)).toEqual(202);
  expect(map.getTile(0, 2, layerIdx)).toEqual(303);
  expect(UNDO_stack.length).toEqual(1);
  expect(REDO_stack.length).toEqual(0);
});

test('change_many_tiles but there is only one change', () => {
  const changeset = [];

  changeset[0] = ur.prepare_one_tile(0, 0, layerIdx, 101);

  ur.change_many_tiles(changeset);

  expect(map.getTile(0, 0, layerIdx)).toEqual(101);
  expect(UNDO_stack.length).toEqual(1);
  expect(REDO_stack.length).toEqual(0);

  ur.undo();

  expect(map.getTile(0, 0, layerIdx)).toEqual(0);
  expect(UNDO_stack.length).toEqual(0);
  expect(REDO_stack.length).toEqual(1);

  ur.redo();

  expect(map.getTile(0, 0, layerIdx)).toEqual(101);
  expect(UNDO_stack.length).toEqual(1);
  expect(REDO_stack.length).toEqual(0);
});

// //
// // Tiles
// //
test('change_one_zone adds an item to the undo stack', () => {
  expect(UNDO_stack.length).toEqual(0);

  ur.change_one_zone(tileX, tileY, zoneIdx);

  expect(UNDO_stack.length).toEqual(1);

  ur.undo();

  expect(UNDO_stack.length).toEqual(0);
});

test('change zone. undo.', () => {
  expect(0).not.toEqual(zoneIdx);
  expect(0).toEqual(map.getZone(tileX, tileY));
  ur.change_one_zone(tileX, tileY, zoneIdx);
  expect(zoneIdx).toEqual(map.getZone(tileX, tileY));
  ur.undo();
  expect(0).toEqual(map.getZone(tileX, tileY));
});

test('change zone. undo. redo.', () => {
  expect(0).not.toEqual(zoneIdx);
  expect(0).toEqual(map.getZone(tileX, tileY));
  ur.change_one_zone(tileX, tileY, zoneIdx);
  expect(zoneIdx).toEqual(map.getZone(tileX, tileY));
  ur.undo();
  expect(0).toEqual(map.getZone(tileX, tileY));
  ur.redo();
  expect(zoneIdx).toEqual(map.getZone(tileX, tileY));
});

const oldEnt0_loc_tiles = {tx:1, ty:2, px: null, py: null };
const newEnt0_loc_tiles = {tx:3, ty:4, px: null, py: null };

const oldEnt1_loc_pixels = {tx:null, ty:null, px: 5, py: 6 };
const newEnt1_loc_pixels = {tx:null, ty:null, px: 7, py: 8 };

// / 
// / Entities
// / 
test('change_one_entity_location adds an item to the undo stack', () => {
  expect(UNDO_stack.length).toEqual(0);

  ur.change_one_entity_location(0, newEnt0_loc_tiles);

  expect(UNDO_stack.length).toEqual(1);

  ur.undo();

  expect(UNDO_stack.length).toEqual(0);
});

test('change_one_entity_location. undo. redo.', () => {
  expect(map.mapData.entities[0].location).toEqual(oldEnt0_loc_tiles);
  expect(map.mapData.entities[1].location).toEqual(oldEnt1_loc_pixels);

  ur.change_one_entity_location(0, newEnt0_loc_tiles);
  ur.change_one_entity_location(1, newEnt1_loc_pixels);

  expect(UNDO_stack.length).toEqual(2);

  expect(map.mapData.entities[0].location).toEqual(newEnt0_loc_tiles);
  expect(map.mapData.entities[1].location).toEqual(newEnt1_loc_pixels);

  ur.undo();

  expect(map.mapData.entities[1].location).toEqual(oldEnt1_loc_pixels);

  ur.undo();

  expect(map.mapData.entities[0].location).toEqual(oldEnt0_loc_tiles);

  expect(UNDO_stack.length).toEqual(0);
  expect(REDO_stack.length).toEqual(2);

  ur.redo();

  expect(map.mapData.entities[0].location).toEqual(newEnt0_loc_tiles);

  ur.redo();
  
  expect(map.mapData.entities[1].location).toEqual(newEnt1_loc_pixels);
});