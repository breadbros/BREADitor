import { getCurrentlySelectedTile } from '../TileSelector';
import { getSelectedLayer } from '../js/ui/LayersPalette';
import { getTXTyFromMouse, isTileSelectorMap, _toolLogic } from '../Tools';

// TODO can I test this without exporting it?  ES6 'friend' maybe?
const doFloodFill = (map, e) => {
  if (!getSelectedLayer()) {
    console.log('You havent selected a layer yet.');
    window.alert('You havent selected a layer yet.');
    return;
  }

  const result = getTXTyFromMouse(map, e);
  const tX = result[0];
  const tY = result[1];
  const layer = getSelectedLayer().map_tileData_idx;

  const replaceMeIdx = map.getTile(tX, tY, layer);
  const newTileIdx = getCurrentlySelectedTile();

  if (replaceMeIdx === newTileIdx) {
    console.warn('Tried to flood-fill the self-same tile. NOOP.  Bailing.', replaceMeIdx, '==', newTileIdx);
    return;
  }

  const floodThese = new Set();
  const workQueue = [];

  const keyify = (x, y) => {
    return x + '-' + y;
  };

  workQueue.push(keyify(tX, tY));

  const check_validity = (x, y) => {
    const map = window.$$$currentMap;

    if (x < 0 || y < 0 || x >= map.mapSizeInTiles[0] || y >= map.mapSizeInTiles[1]) {
      return false;
    }

    if (floodThese.has(keyify(x, y))) {
      return false;
    }

    // console.log( "map.getTile("+x+", "+y+", "+layer+")" );

    return map.getTile(x, y, layer) === replaceMeIdx;
  };

  while (workQueue.length > 0) {
    const cur = workQueue.pop();
    floodThese.add(cur);

    const x1 = parseInt(cur.split('-')[0]);
    const y1 = parseInt(cur.split('-')[1]);

    if (check_validity(x1 + 1, y1)) {
      workQueue.push(keyify(x1 + 1, y1));
    }
    if (check_validity(x1 - 1, y1)) {
      workQueue.push(keyify(x1 - 1, y1));
    }
    if (check_validity(x1, y1 + 1)) {
      workQueue.push(keyify(x1, y1 + 1));
    }
    if (check_validity(x1, y1 - 1)) {
      workQueue.push(keyify(x1, y1 - 1));
    }
  }

  const manyTiles = [];
  floodThese.forEach((key) => {
    const loc = key.split('-');
    // TODO meh, just push?
    manyTiles[manyTiles.length] = map.UndoRedo.prepare_one_tile(loc[0], loc[1], layer, newTileIdx);
  });

  map.UndoRedo.change_many_tiles(manyTiles);
};

export default () => {
  return {
    doFloodFill: doFloodFill,
    'mousemove': () => {},
    'mousedown': function (map, e) {
      if (isTileSelectorMap(map)) {
        _toolLogic['EYEDROPPER']['mousedown'](map, e);
        return;
      }

      doFloodFill(map, e);
    },
    'button_element': '#btn-tool-flood-fill',
    'human_name': 'Flood Fill'
  };
};
