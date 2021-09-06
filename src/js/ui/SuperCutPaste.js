import { getSelectedLayer, MAGICAL_OBS_LAYER_ID, MAGICAL_ZONE_LAYER_ID, MAGICAL_ENT_LAYER_ID } from './LayersPalette';
import { getXfromFlat, getYfromFlat } from '../../Map';
import { getCurrentHoverTile } from '../../Tools';

const _ = require('lodash');

let pasteboard = [];

const addTileToPasteboard = (dx, dy, originalLayer, tile) => {
  pasteboard.push([dx, dy, originalLayer, tile]);
};

const getPasteBoard = () => {
  return pasteboard;
}

export const superCut = (map) => {
  if(layers === null) {
    throw `No supercut layers selected.`;
  }
  pasteboard = [];
  _cut(map, map.selection.hull.x, map.selection.hull.y);
};

let layers = null;
let doEntities = false;

export const setSuperCutPasteLayers = (arLayers) => {
  doEntities = false;  

  if(!_.isArray(arLayers)) {
    throw `Illegal arguments (arLayers) expected to be an array of layer indices.`;
  }

  if( _.indexOf(arLayers, MAGICAL_ENT_LAYER_ID) >= 0 ) {
    doEntities = true;  
    layers = _.xor(arLayers, [MAGICAL_ENT_LAYER_ID]);
  } else {
    layers = arLayers;  
  }
};

const clearSuperCutPasteLayers = (arLayers) => {
  layers = null;
  doEntities = false;
};

const _cut = (map, x1,y1) => { 
  const hull_x = x1;
  const hull_y = y1;
  const cutSet = [];

  for (let i = layers.length - 1; i >= 0; i--) {

    const curLayer = layers[i];
    const mapWidth = map.mapSizeInTiles.width;

    for (const flatidx in map.selection.tiles) {
      const x = getXfromFlat(flatidx, mapWidth);
      const y = getYfromFlat(flatidx, mapWidth);

      addTileToPasteboard(
        x - hull_x,
        y - hull_y,
        curLayer,
        map.getTile(x, y, curLayer)
      );

      cutSet.push(
        map.UndoRedo.prepare_one_tile(x, y, curLayer, 0)
      );
    }
  }

  map.UndoRedo.change_many_tiles(cutSet); // put all those zeros there!

  if( doEntities ) {
    throw `entity supercute not yet implemented`;
  }
};

export const superPaste = (map, newX, newY) => {
  let tX = null;
  let tY = null;
  if (typeof newX === 'undefined' || typeof newY === 'undefined') {
    const hoverTile = getCurrentHoverTile();
    if (hoverTile === null) {
      console.error('attempted to paste when hovertile was null.  wtf.');
      return;
    }
    tX = hoverTile[0];
    tY = hoverTile[1];
  } else {
    tX = newX;
    tY = newY;
  }

  if( 
    !_.isNumber(tX) ||
    !_.isNumber(tY)
  ) {
    throw `Could not determine tx/ty`;
  }

  if(layers === null) {
    throw `No superpaste layers selected.`;
  }

  if(pasteboard === null) {
    throw `Pasteboard is empty.`;
  }

  _paste(map, tX, tY);
};

export const _paste = (map, tX, tY) => {
  let layerX; let layerY;

  const pasteSet = [];

  for (let i = pasteboard.length - 1; i >= 0; i--) {
    const layerIdx = pasteboard[i][2];

    const targetX = pasteboard[i][0] + tX;
    const targetY = pasteboard[i][1] + tY;

    if(layerIdx >= map.layers.length) {
      switch(layerIdx) {
        case MAGICAL_OBS_LAYER_ID: // obstuctions
        case MAGICAL_ZONE_LAYER_ID: // TODO: these are both bad
          layerX = map.mapSizeInTiles.width;
          layerY = map.mapSizeInTiles.height;
          break;
        default:
          alert(`unknown layer id: ${  layerIdx}`);
          return;
      }
    } else {
      layerX = map.layers[layerIdx].dimensions.X;
      layerY = map.layers[layerIdx].dimensions.Y;
    }
    
    // out of bounds detection
    // TODO do we need to detect negatives?  MAAAAYBE?
    if (targetX >= layerX || targetY >= layerY) {
      continue;
    }

    pasteSet.push([
      targetX,
      targetY,
      layerIdx,
      pasteboard[i][3]
    ]);
  }

  map.UndoRedo.change_many_tiles(pasteSet);
};
