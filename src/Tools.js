const $ = require('jquery');
const sprintf = require('sprintf-js').sprintf;
import { setTileSelectorUI, getCurrentlySelectedTile } from './TileSelector';

import { getZoneVisibility, getZoneAlpha, getActiveZone,
         setActiveZone, scrollZonePalletteToZone } from './js/ui/ZonesPalette';

import { getSelectedLayer } from './js/ui/LayersPalette';

const updateLocationFunction = (map) => {
  const x = map.camera[0];
  const y = map.camera[1];
  const key = 'map-' + map.mapData.name;

  $('#info-location').text(x + ',' + y);

  window.localStorage[key + '-mapx'] = x;
  window.localStorage[key + '-mapy'] = y;
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
  'SELECT': {
    'mousedown': function (map, e) {
      debugger;
    },
    'mousemove': function (map, e) {},
    'mouseup': function (map, e) {},
    'button_element': '#btn-tool-select',
    'human_name': 'Select'
  },
  'EYEDROPPER': {
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
      let selector = null;
      const mapOffsetX = map.camera[0];
      const mapOffsetY = map.camera[1];
      const mouseOffsetX = e.offsetX;
      const mouseOffsetY = e.offsetY;

      const oX = mapOffsetX + mouseOffsetX * map.camera[2];
      const oY = mapOffsetY + mouseOffsetY * map.camera[2];

      const tX = parseInt(oX / 16);
      const tY = parseInt(oY / 16);

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
          default:
            throw new Error('SOMETHING IS TERRIBLYH WRONG WITH A TERLKNDSHBLE SENTINEL AND GRUE IS A BAD MAN');
        }
      } else {
        // TODO seriously branching code here is not a good idea for complexity reasons.  rework later?
        if (map.mapData.isTileSelectorMap) {
          doVSPselector(tX, tY, map);
        } else {
          tIdx = map.getTile(tX, tY, getSelectedLayer().map_tileData_idx);
          doVSPselector(tX, tY, map);
        }
      }

      selector = '#left-palette';
      setTileSelectorUI(selector, tIdx, map, 0, getSelectedLayer().layer.vsp);

      // map.dragging = true;
      // window.$MAP_WINDOW.draggable('disable');
      // map.lastMouse = [ e.clientX, e.clientY ];
    },
    'mouseup': function (map, e) {
      console.log('EYEDROPPER->mouseup: NOTHING');
    },
    'mousemove': function (map, e) {
      console.log('EYEDROPPER->mousemove: NOTHING');
    },

    'button_element': '#btn-tool-eyedropper',
    'human_name': 'Eyedropper'
  },
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

      const mapOffsetX = map.camera[0];
      const mapOffsetY = map.camera[1];
      const mouseOffsetX = e.offsetX * map.camera[2];
      const mouseOffsetY = e.offsetY * map.camera[2];

      const oX = mapOffsetX + mouseOffsetX;
      const oY = mapOffsetY + mouseOffsetY;

      const tX = parseInt(oX / 16);
      const tY = parseInt(oY / 16);

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

export const clickEyedropper = () => {
  $(toolLogic['EYEDROPPER'].button_element).click();
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

let obstructionsVisible = true;
const setObstructionsVisible = (visible) => {
  obstructionsVisible = visible;
};

const shouldShowObstructions = () => {
  return obstructionsVisible;
};

const shouldShowZones = () => {
  return getZoneVisibility();
};

const getZonesAlpha = () => {
  return getZoneAlpha();
};

export const Tools = {
  setObstructionsVisible: setObstructionsVisible,
  shouldShowObstructions: shouldShowObstructions,
  shouldShowZones: shouldShowZones,
  getZonesAlpha: getZonesAlpha,
  updateRstringInfo: updateRstringInfo,
  savePalettePositions: savePalettePositions,
  updateLocationFunction: updateLocationFunction,
  initToolsToMapContainer: initToolsToMapContainer,
  grue_zoom: grue_zoom
};
