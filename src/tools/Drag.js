import { _toolLogic, isTileSelectorMap } from '../Tools';

export default () => {
  return {
    'dragging': false,
    'last_mouse': [0, 0],

    'mousedown': function (map, e) {
      if (isTileSelectorMap(map)) {
        return;
      }

      _toolLogic.DRAG.dragging = true;
      window.$MAP_WINDOW.draggable('disable');
      _toolLogic.DRAG.last_mouse = [ e.clientX, e.clientY ];
    },
    'mousemove': function (map, e) {
      if (isTileSelectorMap(map)) {
        return;
      }

      if (_toolLogic.DRAG.dragging) {
        map.camera[0] += (_toolLogic.DRAG.last_mouse[0] - e.clientX) / map.camera[2];
        map.camera[1] += (_toolLogic.DRAG.last_mouse[1] - e.clientY) / map.camera[2];
        _toolLogic.DRAG.last_mouse = [ e.clientX, e.clientY ];
      }
    },
    'mouseup': function (map, e) {
      if (isTileSelectorMap(map)) {
        return;
      }

      _toolLogic.DRAG.dragging = false;
      map.updateLocationFn(map);
      window.$MAP_WINDOW.draggable('enable');
    },

    'button_element': '#btn-tool-drag',
    'human_name': 'Drag'
    /*,
    "mousewheel": function(map, e) {
        zoomFn(map, e, e.originalEvent.deltaY < 0);
    }*/
  };
};
