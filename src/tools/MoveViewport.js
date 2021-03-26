import { _toolLogic, isTileSelectorMap, grue_zoom, updateZoomText } from '../Tools';
import { LOG } from '../Logging';

const throttle = (func, limit) => {
  let inThrottle;

  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }
}

const SCROLL_THROTTLE = 100;

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

    'wheel': throttle( 
      function (map, e) {
        if( e.originalEvent.deltaY < 0 || e.originalEvent.deltaX < 0 ) {
          grue_zoom(false, map);
          updateZoomText(map);
        } else if( e.originalEvent.deltaY > 0 || e.originalEvent.deltaX > 0 ) {
          grue_zoom(true, map);
          updateZoomText(map);
        } else {
          LOG('Lol, no wheel deltas?');
        }
      }, SCROLL_THROTTLE),

    'mousemove': function (map, e) {
      if (isTileSelectorMap(map)) {
        return;
      }

      if (_toolLogic['MOVE-VIEWPORT'].dragging) {
        const xdiff = (_toolLogic['MOVE-VIEWPORT'].last_mouse[0] - e.clientX) / map.camera[2];
        const ydiff = (_toolLogic['MOVE-VIEWPORT'].last_mouse[1] - e.clientY) / map.camera[2];
        
        _toolLogic['MOVE-VIEWPORT'].last_mouse = [ e.clientX, e.clientY ];
      
        if( map.windowOverlay.on && e.ctrlKey ) {
          LOG('windowOVERLAY DRAG');
          map.windowOverlay.viewport.x -= xdiff;
          map.windowOverlay.viewport.y -= ydiff;
        } else {
          LOG('normal DRAG');
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
    /* ,
    "mousewheel": function(map, e) {
        zoomFn(map, e, e.originalEvent.deltaY < 0);
    } */
  };
};
