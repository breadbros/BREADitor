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

export const cut = (map) => {
  console.log("cut");
  if (map.selection.tiles) {
    clearPasteboard();
    console.log('put cut here');
  } else {
    console.log('Nothing cut, there was no selection.');
  }
};

export const copy = (map) => {
  if (map.selection.tiles) {
    clearPasteboard();
    const curLayer = getSelectedLayer().map_tileData_idx;
    const hull_x = map.selection.hull.x;
    const hull_y = map.selection.hull.y;
    const mapWidth = map.mapData.layers[0].dimensions.X;

    for (const flatidx in map.selection.tiles) {
      const x = getXfromFlat(flatidx, mapWidth);
      const y = getYfromFlat(flatidx, mapWidth);

      addToPasteboard(
        x - hull_x,
        y - hull_y,
        curLayer,
        map.getTile(x, y, curLayer)
      );

      // addToPasteboard
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
