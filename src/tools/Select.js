import { getXYFromMouse, _toolLogic, getTopLeftmostCoordinatesAndOffsets } from '../Tools';
import { getSelectedLayer } from '../js/ui/LayersPalette';

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

      map.selection.deselect();

      if (!_toolLogic.SELECT.isSelecting) {
        _toolLogic.SELECT.isSelecting = true;
        
        _toolLogic.SELECT.lastTX = tX;
        _toolLogic.SELECT.lastTY = tY;
        _toolLogic.SELECT.startTX = tX;
        _toolLogic.SELECT.startTY = tY;

        _toolLogic.SELECT.lastPX = pX;
        _toolLogic.SELECT.lastPY = pY;
        _toolLogic.SELECT.startPX = pX;
        _toolLogic.SELECT.startPY = pY;

        map.selection.add(tX, tY, 1, 1);
        _toolLogic.SELECT.isButtonDown = true;
      } else {
        _toolLogic.SELECT.isSelecting = false;
        _toolLogic.SELECT.isButtonDown = false;
        
        _toolLogic.SELECT.lastTX = -1;
        _toolLogic.SELECT.lastTY = -1;
        _toolLogic.SELECT.startTX = -1;
        _toolLogic.SELECT.startTY = -1;

        _toolLogic.SELECT.lastPX = -1;
        _toolLogic.SELECT.lastPY = -1;
        _toolLogic.SELECT.startPX = -1;
        _toolLogic.SELECT.startPY = -1;
      }
    },
    'mousemove': function (map, e) {
      if (!_toolLogic.SELECT.isSelecting || !_toolLogic.SELECT.isButtonDown) {
        return;
      }

      const result = getXYFromMouse(map, e);
      const tX = result[0];
      const tY = result[1];
      const pX = result[2];
      const pY = result[3];

      if (_toolLogic.SELECT.lastPX === pX && _toolLogic.SELECT.lastPY === pY) {
        return;
      }
      _toolLogic.SELECT.lastPX = pX;
      _toolLogic.SELECT.lastPY = pY;

      if (_toolLogic.SELECT.lastTX === tX && _toolLogic.SELECT.lastTY === tY) {
        return;
      }

      _toolLogic.SELECT.lastTX = tX;
      _toolLogic.SELECT.lastTY = tY;

      const res = getTopLeftmostCoordinatesAndOffsets(tX, tY, _toolLogic.SELECT.startTX, _toolLogic.SELECT.startTY);

      map.selection.deselect();
      map.selection.add(res[0], res[1], res[2], res[3]);
    },
    'mouseup': function (map, e) {
      _toolLogic.SELECT.isButtonDown = false;
    },
    'button_element': '#btn-tool-select',
    'human_name': 'Select',
    'isSelecting': false,
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
