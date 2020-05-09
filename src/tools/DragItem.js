import { getXYFromMouse, _toolLogic, getTopLeftmostCoordinatesAndOffsets } from '../Tools';
import { update_entity_location, moveSelectedEntityToPixel } from '../js/ui/EntityPalette';
import { getSelectedLayer, isSpecialLayerEntity } from '../js/ui/LayersPalette';

// window.isShiftKeyPressed

export default () => {
  return {
    'mousedown': function (map, e) {
      if (!getSelectedLayer()) {
        console.log('You havent selected a layer yet.');
        window.alert('You havent selected a layer yet.');
        return;
      }

      const result = getXYFromMouse(map, e);
      const tX = result[0];
      const tY = result[1];
      const pX = result[2];
      const pY = result[3];

      if (!_toolLogic['DRAG-ITEM'].isDragging) {
        _toolLogic['DRAG-ITEM'].isDragging = true;
        
        _toolLogic['DRAG-ITEM'].lastTX = tX;
        _toolLogic['DRAG-ITEM'].lastTY = tY;
        _toolLogic['DRAG-ITEM'].startTX = tX;
        _toolLogic['DRAG-ITEM'].startTY = tY;

        _toolLogic['DRAG-ITEM'].lastPX = pX;
        _toolLogic['DRAG-ITEM'].lastPY = pY;
        _toolLogic['DRAG-ITEM'].startPX = pX;
        _toolLogic['DRAG-ITEM'].startPY = pY;

        map.selection.add(tX, tY, 1, 1);
        _toolLogic['DRAG-ITEM'].isButtonDown = true;
      } else {
        _toolLogic['DRAG-ITEM'].isDragging = false;
        _toolLogic['DRAG-ITEM'].isButtonDown = false;
        
        _toolLogic['DRAG-ITEM'].lastTX = -1;
        _toolLogic['DRAG-ITEM'].lastTY = -1;
        _toolLogic['DRAG-ITEM'].startTX = -1;
        _toolLogic['DRAG-ITEM'].startTY = -1;

        _toolLogic['DRAG-ITEM'].lastPX = -1;
        _toolLogic['DRAG-ITEM'].lastPY = -1;
        _toolLogic['DRAG-ITEM'].startPX = -1;
        _toolLogic['DRAG-ITEM'].startPY = -1;
      }
    },
    'mousemove': function (map, e) {
      if (!_toolLogic['DRAG-ITEM'].isDragging || !_toolLogic['DRAG-ITEM'].isButtonDown) {
        return;
      }

      const res = getXYFromMouse(map, e);
      const tX = res[0];
      const tY = res[1];
      const pX = res[2];
      const pY = res[3];

      if (_toolLogic['DRAG-ITEM'].lastPX === pX && _toolLogic['DRAG-ITEM'].lastPY === pY) {
        return;
      }
      _toolLogic['DRAG-ITEM'].lastPX = pX;
      _toolLogic['DRAG-ITEM'].lastPY = pY;

      if (_toolLogic['DRAG-ITEM'].lastTX === tX && _toolLogic['DRAG-ITEM'].lastTY === tY) {
        return;
      }

      _toolLogic['DRAG-ITEM'].lastTX = tX;
      _toolLogic['DRAG-ITEM'].lastTY = tY;

      if(isSpecialLayerEntity(getSelectedLayer())) {
        moveSelectedEntityToPixel(pX, pY);
      }
    },
    'mouseup': function (map, e) {
      _toolLogic['DRAG-ITEM'].isButtonDown = false;
    },
    'button_element': '#btn-tool-drag-item',
    'human_name': 'Drag Item',
    'isDragging': false,
    'isButtonDown': false,
    'startTX': -1,
    'startTY': -1,
    'lastTX': -1,
    'lastTY': -1,
    'startPX': -1,
    'startPY': -1,
    'lastPX': -1,
    'lastPY': -1,
  };
};