const $ = require('jquery');
const sprintf = require('sprintf-js').sprintf;
import { getCurrentlySelectedTile } from './TileSelector';

import { getZoneVisibility, getActiveZone } from './js/ui/ZonesPalette';

import { getSelectedLayer } from './js/ui/LayersPalette';

import eyedropperGenerator from './tools/Eyedropper';

const updateLocationFunction = (map) => {
  const x = map.camera[0];
  const y = map.camera[1];
  const key = 'map-' + map.mapData.name;

  $('#info-location').text(x + ',' + y);

  window.localStorage[key + '-mapx'] = x;
  window.localStorage[key + '-mapy'] = y;
};

let _currentHoverTile = null;
let _lastHoverTile = null;
export const getCurrentHoverTile = () => {
  return _currentHoverTile;
};

const setCurrentHoverTile = (map, mouseEvt) => {
  if (mouseEvt) {
    _currentHoverTile = getTXTyFromMouse(map, mouseEvt);
  } else {
    _currentHoverTile = null;
  }

  if (_lastHoverTile !== _currentHoverTile) {
    map.visibleHoverTile.deselect();

    if (_currentHoverTile) {
      $('#info-current-hover-tile').text(_currentHoverTile[0] + ',' + _currentHoverTile[1]);
      map.visibleHoverTile.add(_currentHoverTile[0], _currentHoverTile[1], 1, 1);
    } else {
      $('#info-current-hover-tile').text('-');
    }

    _lastHoverTile = _currentHoverTile;
  }
};

export const zoomLevels = [0.125, 0.25, 0.5, 1, 2, 4, 8, 16];

const baseZoomIndex = 3;

export const zero_zoom = (map) => {
  map.camera[0] = 0;
  map.camera[1] = 0;

  map.zoom_level = baseZoomIndex;
  map.camera[2] = zoomLevels[map.zoom_level];

  console.log('map.zoom_level', map.zoom_level);
  console.log('map.zoom coords', map.camera[0], map.camera[1], map.camera[2]);
};

const zoomFn = function (map, e, zoomout) {
  const mouseX = map.camera[0] + (e.offsetX ? e.offsetX : e.clientX) * map.camera[2];
  const mouseY = map.camera[1] + (e.offsetY ? e.offsetY : e.clientY) * map.camera[2];

  if (typeof map.zoom_level === 'undefined') {
    if (zoomLevels.indexOf(map.camera[2]) === -1) {
      zero_zoom(map);
      return;
    } else {
      map.zoom_level = baseZoomIndex;
    }
  }

  if (!zoomout) {
    map.zoom_level--;
    if (map.zoom_level < 0) { map.zoom_level = 0; }
  } else {
    map.zoom_level++;
    if (map.zoom_level === zoomLevels.length) { map.zoom_level = zoomLevels.length - 1; }
  }

  console.log('map.zoom_level', map.zoom_level);

  map.camera[2] = zoomLevels[map.zoom_level];

  map.camera[0] = mouseX - ((e.offsetX ? e.offsetX : e.clientX) * map.camera[2]);
  map.camera[1] = mouseY - ((e.offsetY ? e.offsetY : e.clientY) * map.camera[2]);

  console.log('map.zoom coords', map.camera[0], map.camera[1], map.camera[2]);
};

// TODO function to be renamed (and probably changed) later.  This is dumb.
const grue_zoom = (zoomout, map, evt) => {
  // if no event, fake it and center on current view.
  // TODO Do we even ACCEPT events anymore?
  if (!evt) {
    evt = {};
    evt.clientX = map.renderContainer.width() / 2;
    evt.clientY = map.renderContainer.height() / 2;
  }

  zoomFn(map, evt, zoomout);
};

export const getTXTyFromMouse = (map, evt) => {
  const mapOffsetX = map.camera[0];
  const mapOffsetY = map.camera[1];
  const mouseOffsetX = evt.offsetX;
  const mouseOffsetY = evt.offsetY;

  const oX = mapOffsetX + mouseOffsetX * map.camera[2];
  const oY = mapOffsetY + mouseOffsetY * map.camera[2];

  const tX = parseInt(oX / 16);
  const tY = parseInt(oY / 16);

  return [tX, tY];
};

// TODO this is probably not the most efficient way to calculate the topleftmost of two points and the offset between...
const getTopLeftmostCoordinatesAndOffsets = (x1, y1, x2, y2) => {
  let ret = null;
  if (x1 <= x2 && y1 <= y2) {
    ret = [x1, y1, x2 - x1, y2 - y1];
  } else {
    ret = [x2, y2, x1 - x2, y1 - y2];
  }

  if (ret[2] === 0) {
    ret[2] = 1;
  } else if (ret[2] < 0) {
    ret[2] = Math.abs(ret[2]);
    ret[0] -= ret[2];
  }

  if (ret[3] === 0) {
    ret[3] = 1;
  } else if (ret[3] < 0) {
    ret[3] = Math.abs(ret[3]);
    ret[1] -= ret[3];
  }

  return ret;
};

export const doFloodFill = (map, e) => {
  if (!getSelectedLayer()) {
    console.log('You havent selected a layer yet.');
    window.alert('You havent selected a layer yet.');
    return;
  }

  const result = getTXTyFromMouse(map, e);
  const tX = result[0];
  const tY = result[1];
  const layer = getSelectedLayer().map_tileData_idx;

  const replaceMeIdx = map.getTile(tX, tY, layer);
  const newTileIdx = getCurrentlySelectedTile();

  if (replaceMeIdx === newTileIdx) {
    console.warn('Tried to flood-fill the self-same tile. NOOP.  Bailing.', replaceMeIdx, '==', newTileIdx);
    return;
  }

  const floodThese = new Set();
  const workQueue = [];

  const keyify = (x, y) => {
    return x + '-' + y;
  };

  workQueue.push(keyify(tX, tY));

  const check_validity = (x, y) => {
    // TODO again, "map.layers[0]" is almost certainly wrong.
    if (x < 0 || y < 0 || x >= map.layers[0].dimensions.X || y >= map.layers[0].dimensions.Y) {
      return false;
    }

    if (floodThese.has(keyify(x, y))) {
      return false;
    }

    // console.log( "map.getTile("+x+", "+y+", "+layer+")" );

    return map.getTile(x, y, layer) === replaceMeIdx;
  };

  while (workQueue.length > 0) {
    const cur = workQueue.pop();
    floodThese.add(cur);

    const x1 = parseInt(cur.split('-')[0]);
    const y1 = parseInt(cur.split('-')[1]);

    if (check_validity(x1 + 1, y1)) {
      workQueue.push(keyify(x1 + 1, y1));
    }
    if (check_validity(x1 - 1, y1)) {
      workQueue.push(keyify(x1 - 1, y1));
    }
    if (check_validity(x1, y1 + 1)) {
      workQueue.push(keyify(x1, y1 + 1));
    }
    if (check_validity(x1, y1 - 1)) {
      workQueue.push(keyify(x1, y1 - 1));
    }
  }

  const manyTiles = [];
  floodThese.forEach((key) => {
    const loc = key.split('-');
    // TODO meh, just push?
    manyTiles[manyTiles.length] = map.UndoRedo.prepare_one_tile(loc[0], loc[1], layer, newTileIdx);
  });

  map.UndoRedo.change_many_tiles(manyTiles);
};

export const selectAll = (map) => {
  toolLogic.SELECT.isSelecting = true;
  toolLogic.SELECT.isButtonDown = false;

  // TODO "map.layers[0]" is almost certainly wrong.
  // TODO make this select all of the CURRENT layer.
  toolLogic.SELECT.lastTX = map.layers[0].dimensions.X;
  toolLogic.SELECT.lastTY = map.layers[0].dimensions.Y;
  toolLogic.SELECT.startTX = 0;
  toolLogic.SELECT.startTY = 0;

  map.selection.add(0, 0, map.layers[0].dimensions.X, map.layers[0].dimensions.Y);
};

// TODO once we know the common verbs and nouns for palette tools, we really should extract each one into its own file
// TODO and test the bejeezus out of them.  There's some janky-ass jank in here!
const toolLogic = {
  'DRAG': {
    'dragging': false,
    'last_mouse': [0, 0],

    'mousedown': function (map, e) {
      toolLogic.DRAG.dragging = true;
      window.$MAP_WINDOW.draggable('disable');
      toolLogic.DRAG.last_mouse = [ e.clientX, e.clientY ];
    },
    'mousemove': function (map, e) {
      if (toolLogic.DRAG.dragging) {
        map.camera[0] += (toolLogic.DRAG.last_mouse[0] - e.clientX) * map.camera[2];
        map.camera[1] += (toolLogic.DRAG.last_mouse[1] - e.clientY) * map.camera[2];
        toolLogic.DRAG.last_mouse = [ e.clientX, e.clientY ];
      }
    },
    'mouseup': function (map, e) {
      toolLogic.DRAG.dragging = false;
      map.updateLocationFn(map);
      window.$MAP_WINDOW.draggable('enable');
    },

    'button_element': '#btn-tool-drag',
    'human_name': 'Drag'
    /*,
    "mousewheel": function(map, e) {
        zoomFn(map, e, e.originalEvent.deltaY < 0);
    }*/
  },

/*
flood_fill(x,y, check_validity)
   //here check_validity is a function that given coordinates of the point tells you whether
   //the point should be colored or not
   Queue q
   q.push((x,y))
   while (q is not empty)
       (x1,y1) = q.pop()
       color(x1,y1)

       if (check_validity(x1+1,y1))
            q.push(x1+1,y1)
       if (check_validity(x1-1,y1))
            q.push(x1-1,y1)
       if (check_validity(x1,y1+1))
            q.push(x1,y1+1)
       if (check_validity(x1,y1-1))
            q.push(x1,y1-1)
*/

  'FLOOD': {
    'mousedown': function (map, e) {
      doFloodFill(map, e);
    },
    'button_element': '#btn-tool-flood-fill',
    'human_name': 'Flood Fill'
  },

  // TODO add hold-shift to add selection and hold-alt to subtract
  // TODO clamp SELECT to the bounds of the layer and/or map
  'SELECT': {
    'mousedown': function (map, e) {
      if (!getSelectedLayer()) {
        console.log('You havent selected a layer yet.');
        window.alert('You havent selected a layer yet.');
        return;
      }

      const result = getTXTyFromMouse(map, e);
      const tX = result[0];
      const tY = result[1];

      map.selection.deselect();

      if (!toolLogic.SELECT.isSelecting) {
        toolLogic.SELECT.isSelecting = true;
        toolLogic.SELECT.lastTX = tX;
        toolLogic.SELECT.lastTY = tY;
        toolLogic.SELECT.startTX = tX;
        toolLogic.SELECT.startTY = tY;

        map.selection.add(tX, tY, 1, 1);
        toolLogic.SELECT.isButtonDown = true;
      } else {
        toolLogic.SELECT.isSelecting = false;
        toolLogic.SELECT.isButtonDown = false;
        toolLogic.SELECT.lastTX = -1;
        toolLogic.SELECT.lastTY = -1;
        toolLogic.SELECT.startTX = -1;
        toolLogic.SELECT.startTY = -1;
      }
    },
    'mousemove': function (map, e) {
      if (!toolLogic.SELECT.isSelecting || !toolLogic.SELECT.isButtonDown) {
        return;
      }

      const result = getTXTyFromMouse(map, e);
      const tX = result[0];
      const tY = result[1];

      if (toolLogic.SELECT.lastTX === tX && toolLogic.SELECT.lastTY === tY) {
        return;
      }

      toolLogic.SELECT.lastTX = tX;
      toolLogic.SELECT.lastTY = tY;

      const res = getTopLeftmostCoordinatesAndOffsets(tX, tY, toolLogic.SELECT.startTX, toolLogic.SELECT.startTY);

      map.selection.deselect();
      map.selection.add(res[0], res[1], res[2], res[3]);
    },
    'mouseup': function (map, e) {
      toolLogic.SELECT.isButtonDown = false;
    },
    'button_element': '#btn-tool-select',
    'human_name': 'Select',
    'isSelecting': false,
    'isButtonDown': false,
    'startTX': -1,
    'startTY': -1,
    'lastTX': -1,
    'lastTY': -1
  },
  'SMART-EYEDROPPER': {
    'mousedown': function (map, e) {
      console.log('SMART-EYEDROPPER->mousedown...');
    },
    'button_element': '#btn-tool-smart-eyedropper',
    'human_name': 'Smart Eyedropper'
  },
  'EYEDROPPER': eyedropperGenerator(),
  'DRAW': {
    'mousedown': function (map, e) {
      console.log('DRAW->mousedown...');

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

      // TODO: Again, this is dumb.  LALALA.
      if (getSelectedLayer().map_tileData_idx === 999) {
        map.setZone(tX, tY, getActiveZone());
        return;
      } else {
        // TODO obs do this too right now. 998
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
        toolLogic['DRAW']['mousedown'](map, e); // let's be lazy.
      }
    },

    'button_element': '#btn-tool-draw',
    'human_name': 'Draw',

    'extra_setup_fn': function (e, name, obj) {
      console.log(name, 'had an extra setup function', obj);
    }
  }
};

const updateRstringInfo = () => {
  if (!window.$$$currentMap) {
    console.log('lol, no window.$$$currentMap yet.');
    return;
  }

  $('#info-rstring').text(window.$$$currentMap.layerRenderOrder.join(','));
};

export const clickFloodFill = () => {
  $(toolLogic['FLOOD'].button_element).click();
};

export const clickEyedropper = () => {
  $(toolLogic['EYEDROPPER'].button_element).click();
};

export const clickMove = () => {
  $(toolLogic['DRAG'].button_element).click();
};

export const clickSelect = () => {
  $(toolLogic['SELECT'].button_element).click();
};

export const clickDrawBrush = () => {
  $(toolLogic['DRAW'].button_element).click();
};

const setupToolClick = (toolObj, toolName) => {
  $(toolObj.button_element).click(function (e) {
    $('#tool-title').text(toolObj.human_name);

    $('.tool-palette button').removeClass('selected');

    $(this).addClass('selected');

    window.TOOLMODE = toolName;

    if (toolObj.extra_setup_fn) {
      toolObj.extra_setup_fn(e, toolName, toolObj);
    }
  });
};

const setupTools = () => {
  for (const prop in toolLogic) {
    if (toolLogic.hasOwnProperty(prop)) {
      // or if (Object.prototype.hasOwnProperty.call(obj,prop)) for safety...
      // console.info('Initializing tool: ', prop, '...');

      setupToolClick(toolLogic[prop], prop);

        /*
        $(toolLogic[prop].button_element).click( function(e) {
            $("#tool-title").text(toolLogic[prop].human_name);
            window.TOOLMODE = prop;

            if(toolLogic[prop].extra_setup_fn) {
                toolLogic[prop].extra_setup_fn(e, prop, toolLogic[prop]);
            }
        } );
        */
    }
  }
};
setupTools();

const tools = (action, map, evt) => {
  const mode = window.TOOLMODE;

  if (toolLogic.hasOwnProperty(mode) && toolLogic[mode].hasOwnProperty(action)) {
    // TODO make a proper 'beforeAll: event' maybe?
    if (action === 'mousemove') {
      setCurrentHoverTile(map, evt);
    }
    toolLogic[mode][action](map, evt);
  } else {
    console.log(sprintf("No action '%s' for mode '%s'", action, mode));
  }
};

const initToolsToMapContainer = (renderContainer, map) => {
  renderContainer.on('mousedown', function (e) {
    tools('mousedown', map, e);
  });
  renderContainer.on('mousemove', function (e) {
    tools('mousemove', map, e);
  });
  renderContainer.on('mouseup', function (e) {
    tools('mouseup', map, e);
  });
  renderContainer.on('mousewheel', function (e) {
    tools('mousewheel', map, e);
  });
};

const updateZoomText = () => {
  const txt = (100 / window.$$$currentMap.camera[2]) + '%';

  $('#info-zoom').text(txt);
};

$('#btn-tool-zoomin').click(function (e) {
  grue_zoom(false, window.$$$currentMap);
  updateZoomText();
});

$('#btn-tool-zoomout').click(function (e) {
  grue_zoom(true, window.$$$currentMap);
  updateZoomText();
});

$('#btn-tool-drag').click();

const capturePaletteMovementForRestore = ($node) => {
  const $pal = $($node);
  const classes = $pal.attr('class').split(' ');

  let key = null;

  classes.map(function (currentValue, index, arr) {
    if (currentValue.endsWith('-palette')) {
      if (key === null) {
        key = currentValue;
      } else {
        console.log('Why the hell does this element have two palette classes?');
        console.log("What's going on?  Let's explode!");
        throw new Error('Fuk, two paletes zomg'); // remember, friends dont let friends code error message drunk
      }
    }
  });

  if (!key) {
    console.log('NO ACTUAL PALETTE CLASS.  SEEMS WRONG BUT NOT FATAL.  EXITING FUNCTION.');
    return;
  }

  // TODO: add us into the custom palette registry
  let pals = window.localStorage['palettes'] || '{}';
  if (pals) {
    pals = JSON.parse(pals);
    pals[key] = true; // todo make this a cache-key so we can invalidate the settings?
    window.localStorage['palettes'] = JSON.stringify(pals);
  }

    // / save our specific settings
  const obj = {};
  obj['w'] = $pal.width();
  obj['h'] = $pal.height();
  obj['x'] = $pal.css('left');
  obj['y'] = $pal.css('top');
  obj['hide'] = !$pal.is(':visible');

  window.localStorage[key + ' settings'] = JSON.stringify(obj);
};

const paletteCloseListener = ($pal_close_button) => {
  $pal_close_button.closest('.ui-widget-content').hide();
  savePalettePositions();
};

// / setup palette listeners
$(document).ready(() => {
  window.$$$palette_registry.map((pal) => {
    const node_selector = '.' + pal;
    const $node = $(node_selector);
    // / palette motion save listener
    $node.mouseup(() => { capturePaletteMovementForRestore($node); });

    // / palette "X" button listener
    const $node2 = $(node_selector + ' button.close-palette');
    $node2.click(() => { paletteCloseListener($node2); });
  });
});

const savePalettePositions = () => {
  window.$$$palette_registry.map((pal) => {
    const node_selector = '.' + pal;
    const $node = $(node_selector);

    capturePaletteMovementForRestore($node);
  });
};

$('#btn-add-tree').on('click', (e) => {
  window.TOOLMODE = 'TREE';
  window.$$$currentMap.entityPreview = {
    location: { tx: 0, ty: 0 },
    animation: 'Idle Down',
    filename: 'chrs_json/object_tree2.json'
  };

  toolLogic.TREE = {
    mousemove: (map, evt) => {
      const mapOffsetX = map.camera[0];
      const mapOffsetY = map.camera[1];
      const mouseOffsetX = evt.offsetX;
      const mouseOffsetY = evt.offsetY;
      const tilesize = map.vspData[getSelectedLayer().layer.vsp].tilesize;

      map.entityPreview.location.tx = Math.floor((mapOffsetX + (mouseOffsetX * map.camera[2])) / tilesize.width);
      map.entityPreview.location.ty = Math.floor((mapOffsetY + (mouseOffsetY * map.camera[2])) / tilesize.height);
    },
    mouseup: (map, evt) => {
      map.entityPreview.location.layer = getSelectedLayer().layer.name;
      map.addEntity(map.entityPreview, map.entityPreview.location);
      map.entityPreview = null;
      window.TOOLMODE = 'DRAG';
    },
    mousedown: () => {},
    moousewheel: () => {}
  };
});

const shouldShowZones = () => {
  return getZoneVisibility();
};

export const Tools = {
  shouldShowZones: shouldShowZones,
  updateRstringInfo: updateRstringInfo,
  savePalettePositions: savePalettePositions,
  updateLocationFunction: updateLocationFunction,
  initToolsToMapContainer: initToolsToMapContainer,
  grue_zoom: grue_zoom
};
