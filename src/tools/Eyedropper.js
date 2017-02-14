import { setTileSelectorUI } from '../TileSelector';
import { checkEntities, doEntitySelection } from './SmartEyedropper';
import { getTXTyFromMouse } from '../Tools';
import { setActiveZone, scrollZonePalletteToZone } from '../js/ui/ZonesPalette';

import { getSelectedLayer } from '../js/ui/LayersPalette';

export default () => {
  return {
    'mousedown': function (map, e) {
      console.log('EYEDROPPER->mousedown...');

      if (!getSelectedLayer()) {
        console.log('You havent selected a layer yet.');
        window.alert('You havent selected a layer yet.');
        return;
      }

      if (!(e.button === 0)) {
        console.log("Unknown eyedropper button: we know left/right (0/2), got: '" + e.button + "'.");
        return;
      }

      let tIdx = null;
      let zIdx = -1;

      const clickSet = getTXTyFromMouse(map, e);
      const tX = clickSet[0];
      const tY = clickSet[1];

      const doVSPselector = (tX, tY, map) => {
        map.selection.deselect();
        map.selection.add(tX, tY, 1, 1);
      };

      // TODO: using a valid integer as a sentinel is stupid. using sentinels is stupid. you're stupid, grue.
      if (getSelectedLayer().map_tileData_idx > 900) {
        switch (getSelectedLayer().map_tileData_idx) {
          case 999:
            zIdx = map.getZone(tX, tY);
            console.log('ZONES!: ' + zIdx);
            setActiveZone(zIdx);

            scrollZonePalletteToZone(zIdx);

            return;
          case 998:
            console.log('OBS!');
            doVSPselector(tX, tY, map);
            tIdx = map.getTile(tX, tY, getSelectedLayer().map_tileData_idx);
            break;

          case 997:

            const ent = checkEntities(map.entities['Entity Layer (E)'], null, map, clickSet);
            if (ent) {
              doEntitySelection(ent);
              return;
            }
            break;
          default:
            throw new Error('SOMETHING IS TERRIBLYH WRONG WITH A TERLKNDSHBLE SENTINEL AND GRUE IS A BAD MAN');
        }
      } else {
        // TODO seriously branching code here is not a good idea for complexity reasons.  rework later?
        if (map.mapData.isTileSelectorMap) {
          tIdx = map.getTile(tX, tY, 0);
          doVSPselector(tX, tY, map);
        } else {
          tIdx = map.getTile(tX, tY, getSelectedLayer().map_tileData_idx);
          doVSPselector(tX, tY, map);
        }
      }

      setTileSelectorUI('#left-palette', tIdx, map, 0, getSelectedLayer().layer.vsp);
    },
    'button_element': '#btn-tool-eyedropper',
    'human_name': 'Eyedropper'
  };
};
