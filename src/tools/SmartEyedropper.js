import { getTXTyFromMouse } from '../Tools';

const $ = require('jquery');

export default () => {
  return {
    'mousedown': function (map, e) {
      console.log('EYEDROPPER->mousedown...');

      if (!(e.button === 0)) {
        console.log("Unknown eyedropper button: we know left/right (0/2), got: '" + e.button + "'.");
        return;
      }

      let tIdx = null;
      let eIdx = null;
      let zIdx = -1;

      const result = getTXTyFromMouse(map, e);
      const tX = result[0];
      const tY = result[1];

      const doVSPselector = (tX, tY, map) => {
        map.selection.deselect();
        map.selection.add(tX, tY, 1, 1);
      };

      const stack = JSON.parse(JSON.stringify(map.layerRenderOrder));
debugger;
      while (stack.length) {
        const layerCode = stack.pop();

        if (layerCode === 'R') {
          continue;
        }
        if (layerCode === 'E') {
          debugger;
        }
        if ($.isNumeric(layerCode)) {

          debugger;
        }

        throw new Error('Unknown rstring layercode: ' + layerCode);
      }

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
