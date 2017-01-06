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
import { MakeUndoRedoStack } from './UndoRedo';
import { FakeMap } from './helpers/FakeMap';

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


test('paste works on edge cases', () => {
  expect(1).toEqual(2);
});



// let pasteboard = [];

// const clearPasteboard = () => {
//   pasteboard = [];
// };

// const addToPasteboard = (dx, dy, originalLayer, tile) => {
//   pasteboard.push([dx, dy, originalLayer, tile]);
// };

// export const copy = (map) => {
//   _cut_or_copy(map, false);
// };

// export const cut = (map) => {
//   _cut_or_copy(map, true);
// };

// const _cut_or_copy = (map, isCut) => {
//   if (map.selection.tiles) {
//     clearPasteboard();
//     const curLayer = getSelectedLayer().map_tileData_idx;
//     const hull_x = map.selection.hull.x;
//     const hull_y = map.selection.hull.y;
//     const mapWidth = map.mapData.layers[0].dimensions.X;

//     const cutSet = [];

//     for (const flatidx in map.selection.tiles) {
//       const x = getXfromFlat(flatidx, mapWidth);
//       const y = getYfromFlat(flatidx, mapWidth);

//       addToPasteboard(
//         x - hull_x,
//         y - hull_y,
//         curLayer,
//         map.getTile(x, y, curLayer)
//       );

//       if (isCut) {
//         cutSet.push(
//           map.UndoRedo.prepare_one_tile(x, y, curLayer, 0)
//         ); // TODO should cuts not default to zeros always?
//       }
//     }

//     if (isCut) {
//       map.UndoRedo.change_many_tiles(cutSet);
//     }
//   } else {
//     console.log('Nothing copied, there was no selection.');
//   }
// };

// export const paste = (map, tX, tY, newLayer) => {
//   if (typeof tX === 'undefined' || typeof tY === 'undefined') {
//     const hoverTile = getCurrentHoverTile();
//     if (hoverTile === null) {
//       console.error('attempted to paste when hovertile was null.  wtf.');
//       return;
//     }
//     tX = hoverTile[0];
//     tY = hoverTile[1];
//     newLayer = getSelectedLayer().map_tileData_idx;
//   }

//   const pasteSet = [];

//   for (let i = pasteboard.length - 1; i >= 0; i--) {
//     pasteSet.push([
//       pasteboard[i][0] + tX,
//       pasteboard[i][1] + tY,
//       newLayer,
//       pasteboard[i][3]
//     ]);
//   }

//   map.UndoRedo.change_many_tiles(pasteSet);
// };
