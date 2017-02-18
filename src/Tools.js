const $ = require('jquery');
const sprintf = require('sprintf-js').sprintf;
import { getSelectedLayer } from './js/ui/LayersPalette';

import eyedropperGenerator from './tools/Eyedropper';
import smartEyedropperGenerator from './tools/SmartEyedropper';
import drawGenerator from './tools/Draw';
import selectGenerator from './tools/Select';
import floodFillGenerator from './tools/FloodFill';
import dragGenerator from './tools/Drag';

import jetpack from 'fs-jetpack';

const canvasBuffer = require('electron-canvas-to-buffer');
const fs = require('fs');

export const updateLocationFunction = (map) => {
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

export const deriveMapZoomForCamera = (map) => {
  return zoomLevels[map.zoom_level];
};

export const deriveMapZoomForPixels = (map) => {
  return 1 / zoomLevels[map.zoom_level];
};

const baseZoomIndex = 3;

export const zero_zoom = (map) => {
  map.camera[0] = 0;
  map.camera[1] = 0;

  map.zoom_level = baseZoomIndex;
  map.camera[2] = zoomLevels[map.zoom_level];

  console.log('map.zoom_level', map.zoom_level);
  console.log('map.zoom coords', map.camera[0], map.camera[1], map.camera[2]);
};

export const two_zoom_seriously_all_zoom_functions_suck_kill_them_all = (map) => {
  map.zoom_level = zoomLevels.indexOf(0.5);
  map.camera[2] = zoomLevels[map.zoom_level];

  map.camera[0] = 0;
  map.camera[1] = 0;
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

export const centerMapOnXY = (map, x, y, w, h) => {
  if ($.isNumeric(w)) {
    x += w / 2;
  }

  if ($.isNumeric(h)) {
    y += h / 2;
  }

  zero_zoom(map); // TODO fix the last two lines of this function so they work with zoom levels.

  const windowWidth = map.renderContainerDimensions.w;
  const windowHeight = map.renderContainerDimensions.h;

  map.camera[0] = x - windowWidth / 2;
  map.camera[1] = y - windowHeight / 2;
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

  // tile coords then pixel coords
  return [tX, tY, oX, oY];
};

export const selectAll = (map) => {
  _toolLogic.SELECT.isSelecting = true;
  _toolLogic.SELECT.isButtonDown = false;

  // TODO "map.layers[0]" is almost certainly wrong.
  // TODO make this select all of the CURRENT layer.
  _toolLogic.SELECT.lastTX = map.layers[0].dimensions.X;
  _toolLogic.SELECT.lastTY = map.layers[0].dimensions.Y;
  _toolLogic.SELECT.startTX = 0;
  _toolLogic.SELECT.startTY = 0;

  map.selection.add(0, 0, map.layers[0].dimensions.X, map.layers[0].dimensions.Y);
};

// TODO once we know the common verbs and nouns for palette tools, we really should extract each one into its own file
// TODO and test the bejeezus out of them.  There's some janky-ass jank in here!
export const _toolLogic = {
  'DRAG': dragGenerator(),
  'FLOOD': floodFillGenerator(),
  'SMART-EYEDROPPER': smartEyedropperGenerator(),

  // TODO add hold-shift to add selection and hold-alt to subtract
  // TODO clamp SELECT to the bounds of the layer and/or map
  'SELECT': selectGenerator(),

  'EYEDROPPER': eyedropperGenerator(),
  'DRAW': drawGenerator()
};

export const updateRstringInfo = () => {
  if (!window.$$$currentMap) {
    console.log('lol, no window.$$$currentMap yet.');
    return;
  }

  $('#info-rstring').text(window.$$$currentMap.layerRenderOrder.join(','));
};

export const clickFloodFill = () => {
  $(_toolLogic['FLOOD'].button_element).click();
};

export const clickEyedropper = () => {
  $(_toolLogic['EYEDROPPER'].button_element).click();
};

export const clickSmartdropper = () => {
  $(_toolLogic['SMART-EYEDROPPER'].button_element).click();
};

export const clickMove = () => {
  $(_toolLogic['DRAG'].button_element).click();
};

export const clickSelect = () => {
  $(_toolLogic['SELECT'].button_element).click();
};

export const clickDrawBrush = () => {
  $(_toolLogic['DRAW'].button_element).click();
};

const setupToolClick = (toolObj, toolName) => {
  $(toolObj.button_element).click(function (e) {
    $('#tool-title').text(toolObj.human_name);

    $('.tool-palette button').removeClass('selected');

    $(this).addClass('selected');

    window.TOOLMODE = toolName;

    if (toolObj.init_fn) {
      toolObj.init_fn(e, toolName, toolObj);
    }
  });
};

const setupTools = () => {
  for (const prop in _toolLogic) {
    if (_toolLogic.hasOwnProperty(prop)) {
      setupToolClick(_toolLogic[prop], prop);
    }
  }
};
setupTools();

const tools = (action, map, evt) => {
  const mode = window.TOOLMODE;

  if (_toolLogic.hasOwnProperty(mode) && _toolLogic[mode].hasOwnProperty(action)) {
    // TODO make a proper 'beforeAll: event' maybe?
    if (action === 'mousemove') {
      setCurrentHoverTile(map, evt);
    }
    _toolLogic[mode][action](map, evt);
  } else {
    console.log(sprintf("No action '%s' for mode '%s'", action, mode));
  }
};

export const initTools = (renderContainer, map) => {
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

const currentLayerCanHaveEntityOnIt = () => {
  return getSelectedLayer().map_tileData_idx < 900 || getSelectedLayer().map_tileData_idx === 997;
};

$('#btn-add-tree').on('click', (e) => {
  window.TOOLMODE = 'TREE';
  window.$$$currentMap.entityPreview = {
    location: { tx: 0, ty: 0 },
    animation: 'Idle Down',
    filename: 'chrs_json/object_tree2.json'
  };

  _toolLogic.TREE = {
    mousemove: (map, evt) => {
      if (!getSelectedLayer()) {
        window.alert('select a layer first.');
        window.TOOLMODE = 'DRAG';
        return;
      }

      if (!currentLayerCanHaveEntityOnIt()) {
        window.alert('invalid layer for entity placement.');
        window.TOOLMODE = 'DRAG';
        return;
      }

      const vsp = getSelectedLayer().layer.vsp || 'default';

      const mapOffsetX = map.camera[0];
      const mapOffsetY = map.camera[1];
      const mouseOffsetX = evt.offsetX;
      const mouseOffsetY = evt.offsetY;
      const tilesize = map.vspData[vsp].tilesize;

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

/*
const canvasBuffer = require('electron-canvas-to-buffer');
const fs = require('fs');
*/

export const isTileSelectorMap = (map) => {
  if (map.isTileSelectorMap) {
    return map.isTileSelectorMap;
  }

  return (map.layers.length === 1 && map.layers[0].name === 'Dynamic Tileselector VspMap Layer xTreem 7');
};

$('#btn-dump-screen').on('click', () => {
  const map = window.$$$currentMap;
  const canvas = document.getElementsByClassName('map_canvas')[0];
  const $canvas = $(canvas);

  const savedCamera = [map.camera[0], map.camera[1], map.camera[2]];
  map.camera[0] = 0;
  map.camera[1] = 0;
  map.camera[2] = 1;

  const w = map.layers[0].dimensions.X * map.vspData[map.layers[0].vsp].tilesize.width;
  const h = map.layers[0].dimensions.Y * map.vspData[map.layers[0].vsp].tilesize.height;

  const savedW = $canvas.width();
  const savedH = $canvas.height();

  $canvas.width(w);
  $canvas.height(h);
  map.resize();

  window.$$$SCREENSHOT = () => {
    const buffer = canvasBuffer(canvas, 'image/png');
    fs.writeFile('C:\\tmp\\dump-image.png', buffer, function (err) {
      // reset the map even if there was an error
      map.camera = [savedCamera[0], savedCamera[1], savedCamera[2]];
      $canvas.width(savedW);
      $canvas.height(savedH);
      map.resize();

      if (err) {
        throw err;
      }
    });
  };
});

export const auditSullyMaps = () => {

  var path = require('path')
  const mapFiles = [];

  function fromDir(startPath,filter){
      if (!fs.existsSync(startPath)){
          console.log("no dir ",startPath);
          return;
      }

      var files=fs.readdirSync(startPath);
      for(var i=0;i<files.length;i++){
          var filename=path.join(startPath,files[i]);
          var stat = fs.lstatSync(filename);
          if (stat.isDirectory()){
              fromDir(filename,filter); //recurse
          }
          else if (filename.indexOf(filter)>=0) {
              // console.log('-- found: ',filename);
              mapFiles.push(filename);
          };
      };
  };

  fromDir('c:\\tmp', '.map.json');

  for (let i = mapFiles.length - 1; i >= 0; i--) {
    const m = jetpack.read(mapFiles[i], 'json');

    for (let j = m.entities.length - 1; j >= 0; j--) {
      let name = m.entities[j].filename;

      if (name.startsWith('chrs_json')) {
        if (name.endsWith('.json')) {
          continue;
        } else {
          debugger; // SHOULDNT HAPPEN AFAIK
        }
      } else if (name.startsWith('chrs')) {
        if (name.endsWith('.json')) {
          continue;
        } else if (name.endsWith('.chr')) {
          name = name + '.json';
        } else if (name.indexOf('.') === -1) {
          name = name + '.chr.json';
        } else {
          debugger; // SHOUNT HAPPEN AFAIK
        }
      } else { // no folder
        if (name.endsWith('.json')) {
          debugger; // idk wtf
        } else if (name.endsWith('.chr')) {
          name = 'chrs/' + name + '.json';
        } else if (name.indexOf('.') === -1) {
          name = 'chrs/' + name + '.chr.json';
        } else {
          debugger; // SHOUNT HAPPEN AFAIK
        }
      }

      console.log( 'changing', m.entities[j].filename, 'to', name );
      m.entities[j].filename = name;
    }

    jetpack.write(mapFiles[i], m);
  }
  debugger;
};

// auditSullyMaps();

export const Tools = {
  grue_zoom: grue_zoom
};
