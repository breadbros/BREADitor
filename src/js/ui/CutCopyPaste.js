import { getSelectedLayer } from './LayersPalette';
import { getXfromFlat, getYfromFlat } from '../../Map'

let pasteboard = [];

const clearPasteboard = () => {
  pasteboard = [];
};

const addToPasteboard = (dx, dy, originalLayer, tile) => {
  pasteboard.push([dx, dy, originalLayer, tile]);
};

const getPasteboard = () => {
  var l = pasteboard.length;
  debugger;
  l++;
};

export const copy = (map) => {
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

    getPasteboard();
  } else {
    console.log('Nothing copied, there was no selection.');
  }
};

export const paste = (map, tX, tY) => {
  if (typeof tX === 'undefined' || typeof tY === 'undefined') {
    window.alert('wtf');
  }



  console.log("paste");
};
