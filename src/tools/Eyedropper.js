import { setTileSelectorUI } from '../TileSelector';
import { checkEntities, doEntitySelection } from './SmartEyedropper';
import { getXYFromMouse } from '../Tools';
import { setActiveZone, scrollZonePalletteToZone , show_edit_zone_dialog } from '../js/ui/ZonesPalette';

import { 
  getSelectedLayer,
  isSpecialLayer,
  isSpecialLayerEntity,
  isSpecialLayerObs,
  isSpecialLayerZone 
} from '../js/ui/LayersPalette';


import { show_edit_entity_dialog } from '../js/ui/EntityPalette';

export default () => {
  return {
    'mousemove': () => {},
    'mousedown': function (map, e) {
      if (!getSelectedLayer()) {
        console.error('You havent selected a layer yet.');
        window.alert('You havent selected a layer yet.');
        return;
      }

      if (!(e.button === 0)) {
        console.warn(`Unknown eyedropper button: we know left/right (0/2), got: '${  e.button  }'.`);
        return;
      }

      let tIdx = null;
      let zIdx = -1;

      const clickSet = getXYFromMouse(map, e);
      const tX = clickSet[0];
      const tY = clickSet[1];

      const layer = getSelectedLayer();

      // TODO: using a valid integer as a sentinel is stupid. using sentinels is stupid. you're stupid, grue.
      if (isSpecialLayer(layer)) {
        if(isSpecialLayerZone(layer)) {

          zIdx = map.getZone(tX, tY);
          
          if(zIdx === undefined) {
            zIdx = 0;
          }

          setActiveZone(zIdx);

          scrollZonePalletteToZone(zIdx);

          setTileSelectorUI('#left-palette', tIdx, map, 0, 'zones'); // OMFFJSKLD 'zones'?!
          return;

        } if( isSpecialLayerObs(layer) ) {
          tIdx = map.getTile(tX, tY, getSelectedLayer().map_tileData_idx);
        } else if( isSpecialLayerEntity(layer) ) {
          const ent = checkEntities(map.entities['Entity Layer (E)'], null, map, clickSet);
          if (ent) {
            doEntitySelection(ent);
            return;
          }
        } else {
          throw new Error('SOMETHING IS TERRIBLYH WRONG WITH A TERLKNDSHBLE SENTINEL AND GRUE IS A BAD MAN');
        }            
      } else { // if a normal tile layer

        // TODO seriously branching code here is not a good idea for complexity reasons.  rework later?
        if (map.mapData.isTileSelectorMap) {
          tIdx = map.getTile(tX, tY, 0);
        } else {
          tIdx = map.getTile(tX, tY, getSelectedLayer().map_tileData_idx);
        }
      }

      setTileSelectorUI('#left-palette', tIdx, map, 0, getSelectedLayer().layer.vsp);
    },
    'dblclick': (map, e) => {

      const clickSet = getXYFromMouse(map, e);
      const tX = clickSet[0];
      const tY = clickSet[1];

      const tIdx = null;
      let zIdx = -1;

      const layer = getSelectedLayer();

      if (isSpecialLayer(layer)) {
        if(isSpecialLayerZone(layer)) {
          zIdx = map.getZone(tX, tY);
          if(zIdx === undefined) {
            zIdx = 0;
          }
          setActiveZone(zIdx);
          scrollZonePalletteToZone(zIdx);
          show_edit_zone_dialog(zIdx);
        } else if(isSpecialLayerEntity(layer)) {
          const ent = checkEntities(map.entities['Entity Layer (E)'], null, map, clickSet);
          if (ent) {
            doEntitySelection(ent);
            show_edit_entity_dialog(ent.eIdx);
            
          }
        } else {
          throw new Error('SOMETHING IS TERRIBLYH WRONG WITH A TERLKNDSHBLE SENTINEL AND GRUE IS A BAD MAN');
        }
      }
    },
    'button_element': '#btn-tool-eyedropper',
    'human_name': 'Eyedropper'
  };
};
