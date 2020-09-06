import { getSelectedLayer, MAGICAL_OBS_LAYER_ID, MAGICAL_ZONE_LAYER_ID } from './LayersPalette';
import { getXfromFlat, getYfromFlat } from '../../Map';
import { getCurrentHoverTile } from '../../Tools';

let pasteboard = [];

const clearPasteboard = () => {
  pasteboard = [];
};

export const addToPasteboard = (dx, dy, originalLayer, tile) => {
  pasteboard.push([dx, dy, originalLayer, tile]);
};

export const copy = (map) => {
  _cut_or_copy(map, false);
};

export const cut = (map) => {
  _cut_or_copy(map, true);
};

export const prepare_supercut_layer = (map, layerId) => {
    const curLayer = layerId;
    const hull_x = map.selection.hull.x;
    const hull_y = map.selection.hull.y;
    const mapWidth = map.mapSizeInTiles.width;

    const cutSet = [];

    for (const flatidx in map.selection.tiles) {
      const x = getXfromFlat(flatidx, mapWidth);
      const y = getYfromFlat(flatidx, mapWidth);

      cutSet.push(
        map.UndoRedo.prepare_one_tile(x, y, curLayer, 0)
      );
    }

    map.UndoRedo.prepare_supercut_layer(layerId, cutSet);
}

const _cut_or_copy = (map, isCut) => {
  if( getSelectedLayer() === null ) {
    alert("Please select a layer first.");
    return;
  }

  if (map.selection.tiles) {
    clearPasteboard();
    const curLayer = getSelectedLayer().map_tileData_idx;
    const hull_x = map.selection.hull.x;
    const hull_y = map.selection.hull.y;
    const mapWidth = map.mapSizeInTiles.width;

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

export const paste = (map, tX, tY, newLayerIdx) => {
  if (typeof tX === 'undefined' || typeof tY === 'undefined') {
    const hoverTile = getCurrentHoverTile();
    if (hoverTile === null) {
      console.error('attempted to paste when hovertile was null.  wtf.');
      return;
    }
    tX = hoverTile[0];
    tY = hoverTile[1];
    newLayerIdx = getSelectedLayer().map_tileData_idx;
  }

  let layerX, layerY;

  if(newLayerIdx >= map.layers.length) {
    switch(newLayerIdx) {
      case MAGICAL_OBS_LAYER_ID: // obstuctions
        layerX = map.obsLayerData.dimensions.X; 
        layerY = map.obsLayerData.dimensions.Y;
        break;
      case MAGICAL_ZONE_LAYER_ID: // yes, currently reusing obs dimentions for zones
        layerX = window.$$$currentMap.mapSizeInTiles.width;
        layerY = window.$$$currentMap.mapSizeInTiles.height;
        break;
      default:
        alert("unknown layer id: " + newLayerIdx);
        return;
    }
  } else {
    layerX = map.layers[newLayerIdx].dimensions.X;
    layerY = map.layers[newLayerIdx].dimensions.Y;
  }

  const pasteSet = [];

  for (let i = pasteboard.length - 1; i >= 0; i--) {
    const targetX = pasteboard[i][0] + tX;
    const targetY = pasteboard[i][1] + tY;

    // console.log(`pasting to new layer's (${targetX},${targetY})`)

    // out of bounds detection
    // TODO do we need to detect negatives?  MAAAAYBE?
    if (targetX >= layerX || targetY >= layerY) {
      continue;
    }

    pasteSet.push([
      targetX,
      targetY,
      newLayerIdx,
      pasteboard[i][3]
    ]);
  }

  map.UndoRedo.change_many_tiles(pasteSet);
};
