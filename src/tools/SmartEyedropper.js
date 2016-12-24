import { getTXTyFromMouse } from '../Tools';
import { selectLayer, getObsVisibility } from '../js/ui/LayersPalette';
import { setTileSelectorUI } from '../TileSelector';
import { setActiveZone, scrollZonePalletteToZone, getZoneVisibility } from '../js/ui/ZonesPalette';
import { getNormalEntityVisibility, selectEntityByIndex, scrollEntityPalletteToEntity, addEntityToHighlight,
         clearAllEntitysFromHighlight } from '../js/ui/EntityPalette';

const $ = require('jquery');

const checkEntities = (ents, layer, map, click) => {
  const tileSize = layer ? map.vspData[layer.vsp].tilesize : map.vspData['default'].tilesize;

  for (let i = ents.length - 1; i >= 0; i--) {
    if (determineEntityCollision(ents[i], click, map, tileSize)) {
      return {
        type: 'ENTITY',
        layerName: layer ? layer.name : 'E',
        layer: layer,
        ent: ents[i],
        eIdx: map.mapData.entities.indexOf(ents[i]) // todo man, map.mapData.entities vs map.entities is rough...
      };
    }
  }

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

const isInRectangle = (px, py, rx, ry, rw, rh) => {
  return rx <= px && px <= rx + rw && ry <= py && py <= ry + rh;
};

const determineEntityCollision = (ent, clickSet, map, tileSize) => {
  let px = null;
  let py = null;

  if ($.isNumeric(ent.location.px) && $.isNumeric(ent.location.py)) {
    px = ent.location.px;
    py = ent.location.py;
  } else if ($.isNumeric(ent.location.tx) && $.isNumeric(ent.location.ty)) {
    px = ent.location.tx * tileSize.width;
    py = ent.location.ty * tileSize.height;
  } else {
    throw new Error('Entity has invalid location information', ent);
  }

  // TODO this is super hax.  Remove when everything is JSON
  if (ent.MAPED_USEDEFAULT || ent.filename.endsWith('.chr')) {
    const w = 16;
    const h = 32;
    py -= 16;

    return isInRectangle(clickSet[2], clickSet[3], px, py, w, h);
  } else {
    const data = map.entityData[ent.filename];
    const dims = data.dims;
    const hitbox = data.hitbox;

    // todo THIS is the lazy rect way, without calculating for empty pixels and things underneath.  FIX.
    return isInRectangle(clickSet[2], clickSet[3], px - hitbox[0], py - hitbox[1], dims[0], dims[1]);
  }
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
      if (map.entities['Entity Layer (E)'] && getNormalEntityVisibility()) {
        ret = checkEntities(map.entities['Entity Layer (E)'], null, map, clickSet);

        if (ret) {
          return ret;
        }
      }

      continue;
    }
    if ($.isNumeric(layerCode)) {
      const layer = map.getLayerByRStringCode(layerCode);
      if (layer.MAPED_HIDDEN) {
        continue;
      }

      if (map.entities[layer.name]) {
        ret = checkEntities(map.entities[layer.name], layer, map, clickSet);

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

      const clickSet = getTXTyFromMouse(map, e);

      // TODO if Zones are visible, check zone first.
      // TODO if Obs are visible, check obs next.

      if (getZoneVisibility()) {
        const zIdx = map.getZone(clickSet[0], clickSet[1]);
        if (zIdx) {
          selectLayer('Z');
          window.$$$toggle_pallete('zones', true);
          setActiveZone(zIdx);
          scrollZonePalletteToZone(zIdx);
          return;
        }
      }

      if (getObsVisibility()) {
        const oIdx = map.getTile(clickSet[0], clickSet[1], 998);
        if (oIdx) {
          selectLayer('O');
          window.$$$toggle_pallete('tileset-selector', true);
          setTileSelectorUI('#left-palette', oIdx, map, 0, 'obstructions');
          return;
        }
      }

      const ret = seekResultFromLayers(map, clickSet);

      if (ret) {
        if (ret.type === 'TILE') {
          selectLayer(ret.layer.name);
          setTileSelectorUI('#left-palette', ret.tIdx, map, 0, ret.layer.vsp);
          clearAllEntitysFromHighlight();
          return;
        }

        if (ret.type === 'ENTITY') {
          selectLayer(ret.layerName);
          window.$$$toggle_pallete('entity', true);
          selectEntityByIndex(ret.eIdx);
          scrollEntityPalletteToEntity(ret.eIdx);
          addEntityToHighlight(ret.ent);

          debugger;
          //selectLayer(ret.layer.name);
          //setTileSelectorUI('#left-palette', ret.tIdx, map, 0, ret.layer.vsp);
          return;
        }
        debugger;
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
