import { getTXTyFromMouse } from '../Tools';
import { selectLayer } from '../js/ui/LayersPalette';
import { setTileSelectorUI } from '../TileSelector';

const $ = require('jquery');

const checkEntities = (ents, click) => {
  debugger;
  return false;
};

const checkTiles = (map, layer, click) => {
  const tX = click[0];
  const tY = click[1];
  const lIdx = map.layers.indexOf(layer);

  const tIdx = map.getTile(tX, tY, lIdx);

  if (tIdx) {
    return {
      type: 'TILE',
      tIdx: tIdx,
      layer: layer
    };
  }

  return false;
};

const seekResultFromLayers = (map, clickSet) => {
  const stack = JSON.parse(JSON.stringify(map.layerRenderOrder));
  let ret = null;

  while (stack.length) {
    const layerCode = stack.pop();

    if (layerCode === 'R') {
      continue;
    }
    if (layerCode === 'E') {
      if (map.entities['Entity Layer (E)']) {
        ret = checkEntities(map.entities['Entity Layer (E)'], clickSet);

        if (ret) {
          return ret;
        }
      }

      continue;
    }
    if ($.isNumeric(layerCode)) {
      const layer = map.getLayerByRStringCode(layerCode);

      if (map.entities[layer.name]) {
        ret = checkEntities(map.entities[layer.name], clickSet);

        if (ret) {
          return ret;
        }
      }

      ret = checkTiles(map, layer, clickSet);

      if (ret) {
        return ret;
      }

      continue;
    }

    throw new Error('Unknown rstring layercode: ' + layerCode);
  }
};

export default () => {
  return {
    'mousedown': function (map, e) {
      console.log('EYEDROPPER->mousedown...');

      if (!(e.button === 0)) {
        console.log("Unknown eyedropper button: we know left/right (0/2), got: '" + e.button + "'.");
        return;
      }

      // let tIdx = null;
      // let eIdx = null;
      // let zIdx = -1;

      const clickSet = getTXTyFromMouse(map, e);
      // const tX = clickSet[0];
      // const tY = clickSet[1];

      // TODO if Zones are visible, check zone first.
      // TODO if Obs are visible, check obs next.

      const ret = seekResultFromLayers(map, clickSet);

      if (ret) {
        if (ret.type === 'TILE') {
          selectLayer(ret.layer.name);
          setTileSelectorUI('#left-palette', ret.tIdx, map, 0, ret.layer.vsp);
          return;
        }
      }

      debugger;


      debugger;

      // // TODO: using a valid integer as a sentinel is stupid. using sentinels is stupid. you're stupid, grue.
      // if (getSelectedLayer().map_tileData_idx > 900) {
      //   switch (getSelectedLayer().map_tileData_idx) {
      //     case 999:
      //       zIdx = map.getZone(tX, tY);
      //       console.log('ZONES!: ' + zIdx);
      //       setActiveZone(zIdx);

      //       scrollZonePalletteToZone(zIdx);

      //       return;
      //     case 998:
      //       console.log('OBS!');
      //       doVSPselector(tX, tY, map);
      //       tIdx = map.getTile(tX, tY, getSelectedLayer().map_tileData_idx);
      //       break;
      //     default:
      //       throw new Error('SOMETHING IS TERRIBLYH WRONG WITH A TERLKNDSHBLE SENTINEL AND GRUE IS A BAD MAN');
      //   }
      // } else {
      //   // TODO seriously branching code here is not a good idea for complexity reasons.  rework later?
      //   if (map.mapData.isTileSelectorMap) {
      //     tIdx = map.getTile(tX, tY, 0);
      //     doVSPselector(tX, tY, map);
      //   } else {
      //     tIdx = map.getTile(tX, tY, getSelectedLayer().map_tileData_idx);
      //     doVSPselector(tX, tY, map);
      //   }
      // }

      // setTileSelectorUI('#left-palette', tIdx, map, 0, getSelectedLayer().layer.vsp);
    },
    'button_element': '#btn-tool-smart-eyedropper',
    'human_name': 'iDrop +'
  };
};
