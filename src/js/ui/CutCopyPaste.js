import { getSelectedLayer } from './LayersPalette';
import { getXfromFlat, getYfromFlat } from '../../Map';
import { getCurrentHoverTile } from '../../Tools';

let pasteboard = [];

const clearPasteboard = () => {
  pasteboard = [];
};

const addToPasteboard = (dx, dy, originalLayer, tile) => {
  pasteboard.push([dx, dy, originalLayer, tile]);
};

export const copy = (map) => {
debugger;
  _cut_or_copy(map, false);
};

export const cut = (map) => {
  _cut_or_copy(map, true);
};

const _cut_or_copy = (map, isCut) => {
  if (map.selection.tiles) {
    clearPasteboard();
    const curLayer = getSelectedLayer().map_tileData_idx;
    const hull_x = map.selection.hull.x;
    const hull_y = map.selection.hull.y;
    const mapWidth = map.mapData.layers[0].dimensions.X;

    const cutSet = [];

    for (const flatidx in map.selection.tiles) {
      const x = getXfromFlat(flatidx, mapWidth);
      const y = getYfromFlat(flatidx, mapWidth);

      addToPasteboard(
        x - hull_x,
        y - hull_y,
        curLayer,
        map.getTile(x, y, curLayer)
      );

      if (isCut) {
        cutSet.push(
          map.UndoRedo.prepare_one_tile(x, y, curLayer, 0)
        ); // TODO should cuts not default to zeros always?
      }
    }

    if (isCut) {
      map.UndoRedo.change_many_tiles(cutSet);
    }
  } else {
    console.log('Nothing copied, there was no selection.');
  }
};

export const paste = (map, tX, tY, newLayer) => {
  if (typeof tX === 'undefined' || typeof tY === 'undefined') {
    const hoverTile = getCurrentHoverTile();
    if (hoverTile === null) {
      console.error('attempted to paste when hovertile was null.  wtf.');
      return;
    }
    tX = hoverTile[0];
    tY = hoverTile[1];
    newLayer = getSelectedLayer().map_tileData_idx;
  }

  const pasteSet = [];

  for (let i = pasteboard.length - 1; i >= 0; i--) {
    // out of bounds detection
    // TODO do we need to detect negatives?  MAAAAYBE?
    if (pasteboard[i][0] + tX >= map.layers[0].dimensions.X || pasteboard[i][1] + tY >= map.layers[0].dimensions.Y) {
      continue;
    }

    pasteSet.push([
      pasteboard[i][0] + tX,
      pasteboard[i][1] + tY,
      newLayer,
      pasteboard[i][3]
    ]);
  }

  map.UndoRedo.change_many_tiles(pasteSet);
};
