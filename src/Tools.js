var $ = require('jquery');
var sprintf = require('sprintf-js').sprintf;
var app = require('electron').remote.app;
var jetpack = require('fs-jetpack').cwd(app.getAppPath());

import { getZoneVisibility, getZoneAlpha, getActiveZone, setActiveZone, scrollZonePalletteToZone } from './js/ui/ZonesPalette.js';


// / todo: definitely need to wipeout undo stack on map change.  Probably should make it a child object of Maps, really....
var undoStack = [];
var redoStack = [];
var undoredo_map = null;

var change_one_tile = (
    map,
    tileX, tileY,
    layerIdx, tileIdx
) => {

    // / TODO: terrible place for this.  find a better init location, nub
  if (!undoStack.length) {
      $('#btn-tool-undo').click(undo);
      $('#btn-tool-redo').click(redo);
    }

  var was = map.getTile(tileX, tileY, layerIdx);

  if (was == tileIdx) {
      console.log('skip draw of duplicate tile.');
      return;
    }

  undoStack.push([[tileX, tileY, layerIdx, was]]);
  undoredo_map = map;

  map.setTile(
        tileX, tileY,
        layerIdx, tileIdx
    );
  redoStack = [];

  undolog();
};

var undolog = () => {
  console.log('undoStack: ');
  console.log(undoStack);
  console.log('redoStack: ');
  console.log(redoStack);
};

var undo = () => {
  var changes;

  undolog();

  if (undoStack.length <= 0) {
      return;
    }

  changes = undoStack.pop();
    // redoStack.push(changes);

  var redoSet = [];

  var was;

  for (var i = changes.length - 1; i >= 0; i--) {
        // / undostacks should be a child of Map objects.  This is a poor temporary solution
      was = undoredo_map.getTile(changes[i][0], changes[i][1], changes[i][2]);

      if (was === changes[i][3]) {
          throw "undo/redo 'was' and 'is' are the same.  this should never happen.";
        }

      undoredo_map.setTile(
            changes[i][0], changes[i][1],
            changes[i][2], changes[i][3]
        );

      redoSet.push([changes[i][0], changes[i][1], changes[i][2], was]);
    }

  redoStack.push(redoSet);
};

var redo = () => {
  var changes;

  if (redoStack.length <= 0) {
      return;
    }

  undolog();

  changes = redoStack.pop();
  undoStack.push(changes);

  for (var i = changes.length - 1; i >= 0; i--) {
        // / undostacks should be a child of Map objects.  This is a poor temporary solution
      undoredo_map.setTile(
            changes[i][0], changes[i][1],
            changes[i][2], changes[i][3]
        );
    }
};

var UndoRedo = {
  undo: undo,
  redo: redo,
  _undoStack: undoStack,
  _redoStack: redoStack,
  change_one_tile: change_one_tile
};

var updateLocationFunction = (map) => {
  var x = map.camera[0];
  var y = map.camera[1];
  var key = 'map-' + map.mapData.name;

  $('#info-location').text(x + "," + y);

  localStorage[key + '-mapx'] = x;
  localStorage[key + '-mapy'] = y;
};

var zoomFn = function (map, e, zoomout) {
  var mouseX = map.camera[0] + e.clientX * map.camera[2];
  var mouseY = map.camera[1] + e.clientY * map.camera[2];
  if (!zoomout) {
      map.camera[2] = Math.max(map.camera[2] / 2, 0.125);
    } else {
      map.camera[2] = Math.min(map.camera[2] * 2, 16);
    }
  map.camera[0] = mouseX - (e.clientX * map.camera[2]);
  map.camera[1] = mouseY - (e.clientY * map.camera[2]);
};

// TODO function to be renamed (and probably changed) later.  This is dumb.
var grue_zoom = function (zoomout, map, evt) {
    // if no event, fake it and center on current view.
    // TODO Do we even ACCEPT events anymore?
  if (!evt) {
      evt = {};
      evt.clientX = map.renderContainer.width() / 2;
      evt.clientY = map.renderContainer.height() / 2;
    }

  zoomFn(map, evt, zoomout);
};

var toolLogic = {

    'DRAG' : {
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
        'human_name': 'Drag',

        /*,
        "mousewheel": function(map, e) {
            zoomFn(map, e, e.originalEvent.deltaY < 0);
        }*/
    },

    'SELECT' : {
        'mousedown': function (map, e) {},
        'mousemove': function (map, e) {},
        'mouseup': function (map, e) {},
        'button_element': '#btn-tool-select',
        'human_name': 'Select'
    },

    'EYEDROPPER' : {
        'mousedown': function (map, e) {
          console.log('EYEDROPPER->mousedown...');

          if (!window.selected_layer) {
              console.log('You havent selected a layer yet.');
              alert('You havent selected a layer yet.');
              return;
            }

          if (!(e.button === 0 || e.button === 2)) {
              console.log("Unknown eyedropper button: we know left/right (0/2), got: '" + e.button + "'.");
              return;
            }

          var oX, oY, tX, tY, tIdx, zIdx, selector;
          var mapOffsetX = map.camera[0];
          var mapOffsetY = map.camera[1];
          var mouseOffsetX = e.offsetX;
          var mouseOffsetY = e.offsetY;

          oX = mapOffsetX + mouseOffsetX * map.camera[2];
          oY = mapOffsetY + mouseOffsetY * map.camera[2];

          tX = parseInt(oX / 16);
          tY = parseInt(oY / 16);

          var doVSPselector = (tX, tY, map) => {
              tIdx = map.getTile(tX, tY, 0);
              map.selection.deselect();
              map.selection.add(tX, tY, 1, 1);
            };

            // / todo: using a valid integer as a sentinel is stupid. using sentinels is stupid. you're stupid, grue.
          if (window.selected_layer.map_tileData_idx > 900) {

              switch (window.selected_layer.map_tileData_idx) {
                  case 999:
                    console.log('ZONES!');
                    zIdx = map.getZone(tX, tY);
                    console.log('ZONES: ' + zIdx);
                    setActiveZone(zIdx);

                    scrollZonePalletteToZone(zIdx);

                    return;
                  case 998:
                    console.log('OBS!');
                    doVSPselector(tX, tY, map);
                    break;
                  default:
                    throw 'SOMETHING IS TERRIBLYH WRONG WITH A TERLKNDSHBLE SENTINEL AND GRUE IS A BAD MAN';
                }

            } else {

              if (map.mapData.isTileSelectorMap) { // / todo seriously branching code here is not a good idea for complexity reasons.  rework later?
                  doVSPselector(tX, tY, map);
                } else {
                  tIdx = map.getTile(tX, tY, window.selected_layer.map_tileData_idx);
                  map.selection.deselect();
                  map.selection.add(tX, tY, 1, 1);
                }
            }

          window.$CURRENT_SELECTED_TILES[e.button] = tIdx;
          $('#info-selected-tiles').text(
                window.$CURRENT_SELECTED_TILES[0] +
                "," +
                window.$CURRENT_SELECTED_TILES[2]
            );

          if (e.button === 2) {
              selector = '#right-palette';
            } else {
              selector = '#left-palette';
            }

          setTileSelectorUI(selector, tIdx, map);

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
        'human_name': 'Eyedropper',
    },

    'DRAW' : {
        'mousedown': function (map, e) {
          console.log('DRAW->mousedown...');

          if (!window.selected_layer) {
              console.log('You havent selected a layer yet.');
              alert('You havent selected a layer yet.');
              return;
            }

          if (!(e.button === 0 || e.button === 2)) {
              console.log("Unknown draw button: we know left/right (0/2), got: '" + e.button + "'.");
              return;
            }

          var oX, oY, tX, tY, tIdx, selector;
          var mapOffsetX = map.camera[0];
          var mapOffsetY = map.camera[1];
          var mouseOffsetX = e.offsetX * map.camera[2];
          var mouseOffsetY = e.offsetY * map.camera[2];

          oX = mapOffsetX + mouseOffsetX;
          oY = mapOffsetY + mouseOffsetY;

          tX = parseInt(oX / 16);
          tY = parseInt(oY / 16);

            // / TODO: Again, this is dumb.  LALALA.
          if (window.selected_layer.map_tileData_idx > 900) {

              switch (window.selected_layer.map_tileData_idx) {
                  case 999:
                    map.setZone(
                            tX, tY, getActiveZone()
                        );
                    return;
                  default:
                    throw 'WHAT ARE YOU EVEN DOING, MAN? ' + window.selected_layer;
                    return;
                }

            } else {

              change_one_tile(
                    map,
                    tX, tY,
                    window.selected_layer.map_tileData_idx,
                    window.$CURRENT_SELECTED_TILES[e.button]
                );
            }
        },
        'mouseup': function (map, e) {
          console.log('DRAW->mouseup: NOTHING');
        },

        // / todo this doesn't seem to drag correctly for rightmouse...
        // / todo this doesn't perform correctly if you move the mouse too quickly.  Should keep track of position-1, draw a line between points, and change all those on this layer?
        'mousemove': function (map, e) {

            // / if there's one button pressed and it's the left or right button...
          if (e.buttons === 1 && (e.button === 0 || e.button === 2)) {

                // TODO this duplicates work. if it's costly, check before everything.  I doubt it'll matter.
              toolLogic['DRAW']['mousedown'](map, e); // let's be lazy.
            }
        },

        'button_element': '#btn-tool-draw',
        'human_name': 'Draw',

        'extra_setup_fn': function (e, name, obj) {
          console.log(name,'had an extra setup function', obj);
        },
    }
};

function updateRstringInfo() {

  if (!window.$$$currentMap) {
      console.log('lol, no window.$$$currentMap yet.');
      return;
    }

  $('#info-rstring').text(window.$$$currentMap.layerRenderOrder.join(','));
}


function setupToolClick(toolObj, toolName) {
  $(toolObj.button_element).click(function (e) {
      $('#tool-title').text(toolObj.human_name);

      $('.tool-palette button').removeClass('selected');

      $(this).addClass('selected');

      window.TOOLMODE = toolName;

      if (toolObj.extra_setup_fn) {
          toolObj.extra_setup_fn(e, toolName, toolObj);
        }
    });
}

function setupTools() {
  for (var prop in toolLogic) {
      if (toolLogic.hasOwnProperty(prop)) {

      // or if (Object.prototype.hasOwnProperty.call(obj,prop)) for safety...
        console.log('Initializing tool: ', prop, '...');

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
}
setupTools();

var tools = function (action, map, evt) {
  var mode = window.TOOLMODE;

  if (toolLogic.hasOwnProperty(mode) && toolLogic[mode].hasOwnProperty(action)) {
      toolLogic[mode][action](map, evt);
    } else {
      console.log(sprintf("No action '%s' for mode '%s'", action, mode));
    }
};

function initToolsToMapContainer(renderContainer, map) {

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
}

var updateZoomText = function () {
  var txt = (100 / window.$$$currentMap.camera[2]) + '%';

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

function capturePaletteMovementForRestore($node) {
  var $pal = $($node);
  var classes = $pal.attr('class').split(' ');

  var key = null;

  classes.map(function (currentValue, index, arr) {
      if (currentValue.endsWith('-palette')) {
          if (key === null) {
              key = currentValue;
            } else {
              console.log('Why the hell does this element have two palette classes?');
              console.log("What's going on?  Let's explode!");
              throw 'Fuk, two paletes zomg'; // remember, friends dont let friends code error message drunk
            }
        }
    });

  if (!key) {
      console.log('NO ACTUAL PALETTE CLASS.  SEEMS WRONG BUT NOT FATAL.  EXITING FUNCTION.');
      return;
    }

    // / add us into the custom palette registry
  var pals = localStorage['palettes'] || '{}';
  if (pals) {
      pals = JSON.parse(pals);
      pals[key] = true; // todo make this a cache-key so we can invalidate the settings?
      localStorage['palettes'] = JSON.stringify(pals);
    }

    // / save our specific settings
  var obj = {};
  obj['w'] = $pal.width();
  obj['h'] = $pal.height();
  obj['x'] = $pal.css('left');
  obj['y'] = $pal.css('top');
  obj['hide'] = $pal.is(':visible') ? false : true;

  localStorage[key + ' settings'] = JSON.stringify(obj);
};

var paletteCloseListener = ($pal_close_button) => {
  $pal_close_button.closest('.ui-widget-content').hide();
};

// / setup palette listeners
$(document).ready(() => {
  window.$$$palette_registry.map((pal) => {
      var node_selector = "." + pal;
      var $node = $(node_selector);
      var $node2;
        // / palette motion save listener
      $node.mouseup(() => { capturePaletteMovementForRestore($node); });

        // / palette "X" button listener
      $node2 = $(node_selector + ' button.close-palette');
      $node2.click(() => { paletteCloseListener($node2); });
    });
});

var savePalettePositions = () => {
  window.$$$palette_registry.map((pal) => {
      var node_selector = "." + pal;
      var $node = $(node_selector);

      capturePaletteMovementForRestore($node);
    });
};

// / todo: currently this isn't allowing the multiple-vsp thing to really be "right".
// / we need to have virtual palletes per vsp, and switch between them when you switch to a layer with a different palette.
function initializeTileSelectorsForMap(imageFile) {
  imageFile = jetpack.path($$$currentMap.dataPath, imageFile);
  imageFile = 'file:///' + imageFile.replace(new RegExp('\\\\', 'g'), '/'); // TODO this is incredibly dirty, right?

  $('#left-palette').removeAttr('style');
  $('#right-palette').removeAttr('style');

  $('#left-palette').css('background-image', 'url(' + imageFile + ')');
  $('#right-palette').css('background-image', 'url(' + imageFile + ')');

  $('#left-palette').css('background-position', '0px 0px');
  $('#right-palette').css('background-position', '0px 0px');

  $('#left-palette').css('background-size', '2000%');
  $('#right-palette').css('background-size', '2000%');
}

var _last_map = null;
function setTileSelectorUI(whichOne, vspIDX, map) {
  if (_last_map != map) {
    initializeTileSelectorsForMap(map.vspData['default'].source_image);
    _last_map = map;
  }

  var loc = map.getVSPTileLocation(window.selected_layer.layer.vsp, vspIDX);
  $(whichOne).css('background-position', '-' + (loc.x * 2) + 'px -' + (loc.y * 2) + 'px'); // (offset *2)
}

$('#btn-add-tree').on('click', (e) => {
  window.TOOLMODE = 'TREE';
  window.$$$currentMap.entityPreview = {
      location: { tx: 0, ty: 0 },
      animation: 'Idle Down',
      filename: 'chrs_json/object_tree2.json'
    };

  toolLogic.TREE = {
      mousemove: (map, evt) => {
          var mapOffsetX = map.camera[0];
          var mapOffsetY = map.camera[1];
          var mouseOffsetX = evt.offsetX;
          var mouseOffsetY = evt.offsetY;
          var tilesize = map.vspData[window.selected_layer.layer.vsp].tilesize;

          map.entityPreview.location.tx = Math.floor((mapOffsetX + (mouseOffsetX * map.camera[2])) / tilesize.width);
          map.entityPreview.location.ty = Math.floor((mapOffsetY + (mouseOffsetY * map.camera[2])) / tilesize.height);
        },
      mouseup: (map, evt) => {
          map.entityPreview.location.layer = window.selected_layer.layer.name;
          map.addEntity(map.entityPreview, map.entityPreview.location);
          map.entityPreview = null;
          window.TOOLMODE = 'DRAG';
        },
      mousedown: () => {},
      moousewheel: () => {}
    };
});

var obstructionsVisible = true;
function setObstructionsVisible(visible) {
  obstructionsVisible = visible;
}

function shouldShowObstructions() {
  return obstructionsVisible;
}

var shouldShowZones = () => {
  return getZoneVisibility();
};
var getZonesAlpha = () => {
  return getZoneAlpha();
};


export var Tools = {
  setObstructionsVisible: setObstructionsVisible,
  shouldShowObstructions: shouldShowObstructions,
  shouldShowZones: shouldShowZones,
  getZonesAlpha: getZonesAlpha,
  updateRstringInfo: updateRstringInfo,
  savePalettePositions: savePalettePositions,
  updateLocationFunction: updateLocationFunction,
  initToolsToMapContainer: initToolsToMapContainer,
  grue_zoom: grue_zoom,
  undo: undo
};
