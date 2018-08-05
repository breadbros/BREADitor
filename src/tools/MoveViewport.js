import { _toolLogic, isTileSelectorMap } from '../Tools';

export default () => {
  return {
    'dragging': false,
    'last_mouse': [0, 0],

    'mousedown': function (map, e) {
      if (isTileSelectorMap(map)) {
        return;
      }

      _toolLogic['MOVE-VIEWPORT'].dragging = true;
      window.$MAP_WINDOW.draggable('disable');
      _toolLogic['MOVE-VIEWPORT'].last_mouse = [ e.clientX, e.clientY ];
    },

    'mousemove': function (map, e) {
      if (isTileSelectorMap(map)) {
        return;
      }

      if (_toolLogic['MOVE-VIEWPORT'].dragging) {
        const xdiff = (_toolLogic['MOVE-VIEWPORT'].last_mouse[0] - e.clientX) / map.camera[2];
        const ydiff = (_toolLogic['MOVE-VIEWPORT'].last_mouse[1] - e.clientY) / map.camera[2];
        
        _toolLogic['MOVE-VIEWPORT'].last_mouse = [ e.clientX, e.clientY ];
      
        if( map.windowOverlay.on ) {
          console.log('windowOVERLAY DRAG');
          map.windowOverlay.viewport.x -= xdiff;
          map.windowOverlay.viewport.y -= ydiff;
        } else {
          console.log('normal DRAG');
          map.camera[0] += xdiff;
          map.camera[1] += ydiff;
        }
      }
    },
    'mouseup': function (map, e) {
      if (isTileSelectorMap(map)) {
        return;
      }

      _toolLogic['MOVE-VIEWPORT'].dragging = false;
      map.updateLocationFn(map);
      window.$MAP_WINDOW.draggable('enable');
    },

    'button_element': '#btn-tool-move-viewport',
    'human_name': 'Move Viewport'
    /*,
    "mousewheel": function(map, e) {
        zoomFn(map, e, e.originalEvent.deltaY < 0);
    }*/
  };
};
