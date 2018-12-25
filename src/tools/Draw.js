import { getTXTyFromMouse, isTileSelectorMap, _toolLogic } from '../Tools';
import { getActiveZone } from '../js/ui/ZonesPalette';
import { getCurrentlySelectedTile } from '../TileSelector';
import { getSelectedLayer } from '../js/ui/LayersPalette';

export default () => {
  return {
    'mousedown': function (map, e) {
    //   console.log('DRAW->mousedown...');

      if (isTileSelectorMap(map)) {
        _toolLogic['EYEDROPPER']['mousedown'](map, e);
        return;
      }

      if (!getSelectedLayer()) {
        console.log('You havent selected a layer yet.');
        window.alert('You havent selected a layer yet.');
        return;
      }

      if (!(e.button === 0)) {
        console.log("Unknown draw button: we know left (0), got: '" + e.button + "'.");
        return;
      }

      const result = getTXTyFromMouse(map, e);

      const tX = result[0];
      const tY = result[1];

      const dims = getSelectedLayer().layer.dimensions;

      if (tX < 0 || tX >= dims.X) {
        console.log('Invalid tx to draw on for this layer, tried: ' + tX);
        return;
      }

      if (tY < 0 || tY >= dims.Y) {
        console.log('Invalid ty to draw on for this layer, tried: ' + tY);
        return;
      }

      // TODO: Again, this is dumb.  LALALA.
      if (getSelectedLayer().map_tileData_idx === 999) {
        map.setZone(tX, tY, getActiveZone());
        return;

      // TODO obs do this too right now. 998
      } else {
        map.UndoRedo.change_one_tile(
            tX, tY,
            getSelectedLayer().map_tileData_idx,
            getCurrentlySelectedTile()
        );
      }
    },
    'mouseup': function (map, e) {
      console.log('DRAW->mouseup: NOTHING');
    },

    // TODO this doesn't seem to drag correctly for rightmouse...
    // TODO this doesn't perform correctly if you move the mouse too quickly.  Should keep track of
    //      position-1, draw a line between points, and change all those on this layer?
    'mousemove': function (map, e) {
      // / if there's one button pressed and it's the left button...
      if (e.buttons === 1 && (e.button === 0)) {
        // TODO this duplicates work. if it's costly, check before everything.  I doubt it'll matter.
        _toolLogic['DRAW']['mousedown'](map, e); // let's be lazy.
      }
    },

    'button_element': '#btn-tool-draw',
    'human_name': 'Draw',

    'init_fn': function (e, name, obj) {
      console.log(name, 'had an extra setup function', obj);
    }
  };
};
