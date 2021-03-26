import { baseHTMLTemplate } from './BaseTemplate';
import { LOG, INFO } from '../Logging'
import { TilesetSelectorWidget } from '../js/ui/TilesetSelectorPalette.js';
import { Map, verifyTileData, verifyMap, cleanEntities } from '../Map.js';
import { Palettes } from '../Palettes.js';
import { LayersWidget, visibilityFix, getSelectedLayer,  MAGICAL_ENT_LAYER_ID, MAGICAL_OBS_LAYER_ID, MAGICAL_ZONE_LAYER_ID } from '../js/ui/LayersPalette.js'; // , selectZoneLayer, selectObstructionLayer, selectNumberedLayer, newLayerOnNewMap
import { ZonesWidget } from '../js/ui/ZonesPalette.js';
import { EntitiesWidget } from '../js/ui/EntityPalette.js';
import { updateMapAndVSPFileInfo } from '../js/ui/InfoPalette.js';
import { getCurrentHoverTile, initTools, updateRstringInfo, updateLocationFunction, selectAll, updateInfoDims } from '../Tools.js';
import { cut, copy, paste } from '../js/ui/CutCopyPaste';
import { handleUndo, handleRedo } from '../UndoRedo';
import { setupNotifications, notify } from '../Notification-Pane';
import { setSuperCutPasteLayers, superCut, superPaste } from '../js/ui/SuperCutPaste';
import { BREADPATH } from './FileSystemSetup';

const path = require('path');

const updateScreenview = (map) => {
  $('#screenview-indicator-switch').prop('checked', map.windowOverlay.on);
  $('#screenview-indicator-x').val(map.windowOverlay.viewport.x);
  $('#screenview-indicator-y').val(map.windowOverlay.viewport.y);
  $('#screenview-indicator-width').val(map.windowOverlay.viewport.width);
  $('#screenview-indicator-height').val(map.windowOverlay.viewport.height);  
}

// / TODO: why have both $$$_BREDITOR_MOST_RECENT.json and $$$_MAPED.json... 🤔
// / I guess one should be in the appdir to at least point to the project directory...
const loadMostRecentFileOption = () => {
  // / TODO: is there a reason for requiring these in-block like this, or is it just cargo cult copypasta? 
  const jetpack = BREADPATH.getJetpack();

  const appConfigData = jetpack.read(BREADPATH.getMostRecentFilesJSONPath(), 'json');
  window.$$$_most_recent_options = appConfigData;

  return appConfigData;
}

const initScreen = (map) => {

  updateScreenview(map);

  $('#screenview-indicator-switch').click( () => {
    map.windowOverlay.on = $('#screenview-indicator-switch').prop('checked');
  } );

  $('#screenview-indicator-x').on('change', (ev) => map.windowOverlay.viewport.x = parseInt($(ev.target).val(), 10));
  $('#screenview-indicator-y').on('change', (ev) => map.windowOverlay.viewport.y = parseInt($(ev.target).val(), 10));
  $('#screenview-indicator-width').on('change', (ev) => map.windowOverlay.viewport.width = parseInt($(ev.target).val(), 10));
  $('#screenview-indicator-height').on('change', (ev) => map.windowOverlay.viewport.height = parseInt($(ev.target).val(), 10));
}

const initInfoWidget = (map) => {
  updateMapAndVSPFileInfo(map);
};

function killAllElementListeners($elem) {
  // first argument of function: "$._data ()" is: "Element" - not jQuery object
  $.each( $._data( $elem, "events" ), function(name) {
    LOG(`body had listener: ${  name}`);
    $elem.off( name ); // function off() removes an event handler
  } );
}

function killAllDocumentListeners(doc) {
  debugger;
  // first argument of function: "$._data ()" is: "Element" - not jQuery object
  $.each( $._data( $elem, "events" ), function(name) {
    LOG(`body had listener: ${  name}`);
    $elem.off( name ); // function off() removes an event handler
  } );
}


function setupShiftKeyPressed() {
  // TODO this are evil.
  window.isShiftKeyPressed = false;
  $(document).on('keyup keydown', function(e){
    window.isShiftKeyPressed = e.shiftKey; 
  });
}

let __setupChording_once = false;

// TODO: verify all this cannot be done with accelerators
function setupChording() {
  if(__setupChording_once) {
    return;
  }

  // this is dumb.
  __setupChording_once = true;

  $('body').on('keydown', (e) => {
    if (!(e.ctrlKey || e.cmdKey)) { // TODO verify this on mac, cmdKey is a guess.
      return;
    }

    if (document.activeElement.type && document.activeElement.type === 'text') {
      INFO('in a textfield, ignoring the accelerator');
      return;
    }

    // if(e.key === 'c' && ) {
    //   INFO('on the tools palette, ignoring the spacebar');
    //   return;
    // }

    // TODO all of these commands should probably be passed in the map on the currently active map palette
    // (if there is one) so as to include the tileset map or any future ones
    if (e.key === 'c' || e.key === 'C') {
      LOG('edit-copy, but the one on the document.  SIGH WINDOWS.');

      if (window.$$$currentMap.selection.tiles && window.$$$currentMap.selection.tiles.length) {
        copy(window.$$$currentMap);
      } else if (
        window.$$$currentTilsesetSelectorMap && 
        window.$$$currentTilsesetSelectorMap.selection.tiles &&
        window.$$$currentTilsesetSelectorMap.selection.tiles.length
      ) {
        copy(window.$$$currentTilsesetSelectorMap);
      } else {
        LOG('FALL THROUGH');
      }

      return;
    }

    if ((e.key === 'v' || e.key === 'V')) {
      if( e.shiftKey ) {
        LOG('super-paste, but the one on the document.  SIGH WINDOWS.');
        window.$$$superpaste();
        return;
      } 
        LOG('edit-paste, but the one on the document.  SIGH WINDOWS.');
        paste(window.$$$currentMap);
        return;
      
    }

    if ((e.key === 'x' || e.key === 'X')) {
      if(e.shiftKey) {
        LOG('super-cut, but the one on the document.  SIGH WINDOWS.');
        window.$$$supercut();
        return;
      } 
        LOG('edit-cut, but the one on the document.  SIGH WINDOWS.');
        cut(window.$$$currentMap);
        return;
      
    }

    if (e.key === 'a' || e.key === 'A') {
      LOG('edit-select-all but the one on the document.  SIGH WINDOWS.');
      selectAll(window.$$$currentMap);
      
    }
  });
}

// TODO: jesus pull this apart and clean it up.

const tick = function (timestamp) {
  if (window.$$$currentMap) {
    window.$$$currentMap.render();
    TilesetSelectorWidget.renderTilesetSelectorWidget();
  }

  if (window.$$$SCREENSHOT) {
    window.$$$SCREENSHOT();
    window.$$$SCREENSHOT = null;
  }

  window.requestAnimationFrame(tick);
};



/**
 * Setup the rest of the app ;D
 */
function setupTheRestOfTheApp() {
  Palettes.setupPaletteRegistry();

  if(window.$$$currentMap) {
    window.$$$currentMap.selfDestruct();
  }
  window.$$$currentMap = null;

  if(!window.$$$RAF_INIT) {
    window.$$$RAF_INIT = true;
    window.requestAnimationFrame(tick);
  }

  $('#btn-tool-undo').click(() => {
    handleUndo();
  });
  $('#btn-tool-redo').click(() => {
    handleRedo();
  });
}

export function autoloadMostRecentMapIfAvailable() {
  const fs = require('fs');

  const opts = loadMostRecentFileOption(); 

  if(opts && opts.abs_path_to_maps && opts.most_recent_map) {
    const filepath = path.join(opts.abs_path_to_maps, opts.most_recent_map);

    if( fs.existsSync(filepath) ) {
      INFO(`${filepath} specified to autoload...`);
      loadByFilename(filepath);
    } else {
      INFO(`${filepath} specified to autoload... but it wasn't there.`);
    }
    
  } else {
    INFO('No map specified to autoload.');
  }
}

/**
* Necesary to setup a freshly loaded map.
*/
export function setupFreshApp() {

  killAllElementListeners($( "#body" ));
  // killAllDocumentListeners(document);

  setupShiftKeyPressed();

  setupChording();

  setupTheRestOfTheApp();

  setupNotifications();
}

export function setupWindowFunctions() {
  const newMapDialog = () => {
    const path = require('path');
    
    const maps = window.$$$_most_recent_options.recent_maps;

    const $template = `
      Width  <input id="newmap-width" type="number"><br/>
      Height  <input id="newmap-height" type="number"><br/>
    `;

    const title = 'Create new map';

    $('#modal-dialog').html('');
    $('#modal-dialog').append($template);
    $('#modal-dialog').show();

    window.$$$hide_all_windows();

    const dialog = $('#modal-dialog').dialog({
      width: 500,
      modal: true,
      title,
      buttons: {
        'Cancel': function () {
          $('#modal-dialog').dialog( "close" );
        }, 'Save new map': function () {
          const wid = parseInt($('#newmap-width').val());
          const hig = parseInt($('#newmap-height').val());

          window.$$$currentMap.layers.length = 1;
          window.$$$currentMap.layers[0] = {
            "name":"New Layer",
            "parallax":{"X":1,"Y":1},
            "dimensions":{"X":wid,"Y":hig},
            "alpha":1,
            "vsp":"default"
          };

          const oneLayerSize = wid*hig;

          window.$$$currentMap.zoneData = Array(oneLayerSize);
          window.$$$currentMap.legacyObsData = Array.apply(null, Array(oneLayerSize)).map(Number.prototype.valueOf,0);
          const blankLayerData = Array.apply(null, Array(oneLayerSize)).map(Number.prototype.valueOf,0);
          window.$$$currentMap.mapRawTileData = {
            tile_data: [blankLayerData],
            legacy_obstruction_data: window.$$$currentMap.legacyObsData,
            zone_data: []
          };

          window.$$$currentMap.entities = {}
          window.$$$currentMap.entityData = {};
          window.$$$currentMap.entityTextures = {};
          window.$$$currentMap.mapData = {
            "notes": [],
            "name": "",
            "vsp": {
              "default": path.basename(window.newMapData.default_vspfile),
              "obstructions": path.basename(window.newMapData.obs_vspfile)
            },
            "music": "",
            "renderstring": "1,E,R",
            "initscript": "start",
            "starting_coordinates": [0, 0],
            "layers": [{
              "name": "New Layer",
              "parallax": {
                "X": 1,
                "Y": 1
              },
              "dimensions": {
                "X": wid,
                "Y": hig
              },
              "alpha": 1,
              "vsp": "default"
            }],
            "zones": [{
              "name": "NULL_ZONE",
              "activation_script": "",
              "activation_chance": 0,
              "can_by_adjacent_activated": false
            }],
            "entities": [],
            "tallentitylayer": "New Layer",
            "MAPED_ENTLAYER_VISIBLE": true,
            "MAPED_ZONELAYER_VISIBLE": true,
            "MAPED_OBSLAYER_VISIBLE": true
          };
          
          window.$$$saveAs();
          window.$$$show_all_windows();
        }
      },
      close () {
        $('#modal-dialog').html('');
      }
    });
  };

  window._newStep2_chooseObsVSP = function (res) {
    window.newMapData.obs_vspfile = res[0];

    newMapDialog();
  };

  window._newStep1_chooseDefaultVSP = function (res) {
    window.newMapData.default_vspfile = res[0];

    const { dialog } = require('electron').remote;
    dialog.showOpenDialog(
      {
        title: 'Choose Obstruction VSP',
        filters: [{ name: 'text', extensions: ['obsvsp.json'] }]
      },
      window._newStep2_chooseObsVSP
    );
  };

  window.$$$new = function () {
    window.newMapData = {};

    const { dialog } = require('electron').remote;
    dialog.showOpenDialog(
      {
        title: 'Choose default VSP',
        filters: [{ name: 'text', extensions: ['vsp.json'] }]
      },
      window._newStep1_chooseDefaultVSP
    );
  };

  window.$$$save = function (newName, isSaveAs) {
    window.$$$currentMap.compactifyZones();
    window._save(newName, window.$$$currentMap, isSaveAs);
  };

  window._save = function (newName, map, reloadAfterSave) {
    const jetpack = BREADPATH.getJetpack();

    let mapfile = null;
    let datafile = null;
    if (typeof newName !== 'undefined') {
      mapfile = newName;
      datafile = mapfile.replace('.map.json', '.map.data.json'); // todo this is shit.
    } else {
      mapfile = map.filenames.mapfile;
      datafile = map.filenames.mapdatafile;
    }

    const mapData = JSON.parse(JSON.stringify(map.mapData));
    const tileData = JSON.parse(JSON.stringify(map.mapRawTileData));

    cleanEntities(mapData); // TODO this should probably happen not-here?

    INFO('saving', mapfile);
    INFO('saving', datafile);

    jetpack.write(mapfile, mapData);
    jetpack.write(datafile, tileData);

    saveMostRecentMapLocation(mapfile);

    notify("Saved map.");

    if(reloadAfterSave) {
      INFO("Reloading map after saveas...");
      loadByFilename(mapfile);
    }
  };

  window.$$$about_breaditor = function () {
    window.alert(
      'Breaditor is a pile of junk made mostly by @bengrue and a little by Shamus Peveril.' +
      'TODO: make this better.' + 
      'TODO: add the licenses jeez.'
    );
  };

  window.$$$collect_all_windows = function () {
    let x = 0;
    let y = 0;
    let z = 0;

    window.$$$palette_registry.map((pal) => {
      const node_selector = `.${  pal}`;
      const $node = $(node_selector);
      $node.css('top', `${y  }px`);
      $node.css('left', `${x  }px`);
      $node.css('z-index', z);

      Palettes.correctResizeWidget($node);

      x += 30;
      y += 30;
      z += 2;
    });

    Palettes.savePalettePositions();
  };

  window.$$$show_all_windows = () => {
    window.$$$palette_registry.map((pal) => {
      const node_selector = `.${  pal}`;
      const $node = $(node_selector);
      $node.show();
    });

    Palettes.savePalettePositions();
  };

  window.$$$hide_all_windows = () => {
    window.$$$palette_registry.map((pal) => {
      const node_selector = `.${  pal}`;
      const $node = $(node_selector);
      $node.hide();
    });
  };

  window.$$$load = () => {
    const { dialog } = require('electron').remote;

    const options = {
      filters: [{ name: 'text', extensions: ['map.json'] }]
    };

    if( window.$$$_most_recent_options && window.$$$_most_recent_options.abs_path_to_maps ) {
      options.defaultPath = window.$$$_most_recent_options.abs_path_to_maps;
    }

    dialog.showOpenDialog( options, loadByFilename );
  };

  window.$$$superpaste = () => {
    const hoverTile = getCurrentHoverTile();
    if (hoverTile === null) {
      console.error('attempted to paste when hovertile was null.  wtf.');
      return;
    }
    const map = window.$$$currentMap;
    const tX = hoverTile[0];
    const tY = hoverTile[1];

    superPaste(map, tX, tY);
  }

  window.$$$supercut = function() {
    const map = window.$$$currentMap;

    if( getSelectedLayer() === null ) {
      alert("Supercut: Please select a layer first.");
      return;
    }

    if (!map.selection.tiles || !map.selection.tiles.length) {
      alert("Supercut: Please mark a selection on a layer first (hotkey 'm').");
      return;
    }

    const title = 'Supercut Setup';

    let $template = `
      <h2>Selection: (${map.selection.hull.x},${map.selection.hull.y}) through (${map.selection.hull.w-1},${map.selection.hull.h-1})</h2>
      <h3>${map.selection.hull.w-1-map.selection.hull.x}x${map.selection.hull.h-1-map.selection.hull.y}, ${(map.selection.hull.w-1-map.selection.hull.x)*(map.selection.hull.h-1-map.selection.hull.y)} tiles </h2>
      <h3>Select layers to supercut from:</h3>

      <input type=checkbox checked="true" class="supercut-layers" data-layer-id="${MAGICAL_ZONE_LAYER_ID}">Zones<br> 
      <input type=checkbox checked="true" class="supercut-layers" data-layer-id="${MAGICAL_OBS_LAYER_ID}">Obstructions<br> 
      <input type=checkbox checked="true" class="supercut-layers" data-layer-id="${MAGICAL_ENT_LAYER_ID}">Entities<br> 
      <hr>
    `;

    let layer = null;
    for (let i = 0; i < map.layers.length; i++) { 
      layer = map.layers[i];
      $template += `
        <input type=checkbox checked="true" class="supercut-layers" data-layer-id="${i}">${layer.name}<br> 
      `;
    }

    // debugger;
    // window.$$$currentMap;

    $('#modal-dialog').html('');
    $('#modal-dialog').append($template);

    $('#modal-dialog').show();

    const dialog = $('#modal-dialog').dialog({
      width: 500,
      modal: true,
      title,
      buttons: {
        'Cut': () => {
          const layers = [];
          $(".supercut-layers:checked").each(function() {
            const me = $(this);
            layers.push($(me[0]).data("layer-id"));
          });
          setSuperCutPasteLayers(layers);
          superCut(window.$$$currentMap);
          $('#modal-dialog').dialog( "close" );
        },
        'Cancel': function () {
          $('#modal-dialog').dialog( "close" );
        }
      },
      close () {
        $('#modal-dialog').html('');
      }
    });
  }

  window.$$$openRecent = function() {
    const path = require('path');
    
    const maps = window.$$$_most_recent_options.recent_maps;

    let $template = '';
    for (var i = 0; i < maps.length; i++) {
      $template += `
        <button id="recent-${i}">Open ${maps[i].map}</button><br /> 
      `;
    }

    const title = 'Open recent map';

    $('#modal-dialog').html('');
    $('#modal-dialog').append($template);

    for (var i = 0; i < maps.length; i++) {
      const {basePath} = maps[i];
      const file = maps[i].map;

      $(`#recent-${i}`).on('click', (evt) => {
        $('#modal-dialog').dialog( "close" );
        loadByFilename(path.join(basePath, file));
      });
    }

    $('#modal-dialog').show();

    const dialog = $('#modal-dialog').dialog({
      width: 500,
      modal: true,
      title,
      buttons: {
        'Cancel': function () {
          $('#modal-dialog').dialog( "close" );
        }
      },
      close () {
        $('#modal-dialog').html('');
      }
    });
  }

  window.$$$saveAs = function () {
    const { dialog } = require('electron').remote;

    dialog.showSaveDialog(
      {filters: [{ name: 'text', extensions: ['map.json'] }]},
      (filename) => {
        if (filename) {
          window.$$$save(filename, true);
        }
      }
    );
  };

  window.$$$toggle_pallete = function (pal, forceShow) {
    if (pal.msg) {
      pal = pal.msg;
    }

    let node_selector = '';
    let node = `${pal  }-palette`;

    if (window.$$$palette_registry.indexOf(node) >= 0) {
      node_selector = `.${  node}`;
      node = $(node_selector);

      if (!node.length) {
        throw new Error(`Invalid palette node selector: '${  node_selector  }'`);
      }
    } else {
      throw new Error(`Invalid palette name: '${  pal  }'`);
    }

    if (node.is(':visible') && forceShow !== true) {
      node.hide();
    } else {
      node.show();

      if (node_selector === '.layers-palette') {
        visibilityFix();
      }
    }

    Palettes.savePalettePositions();
  };

  window.appPath = path.dirname(require('electron').remote.app.getAppPath());
}


function loadByFilename(fileNames) {
  if (fileNames === undefined) {
    return;
  }

  const fileName = Array.isArray(fileNames) ? fileNames[0] : fileNames;
  
  const dataName = fileName.replace('.map.json', '.map.data.json');
  // const vspName = fileName.replace('.map.json', '.vsp.json');

  saveMostRecentMapLocation(fileName);

  // TODO: verify that all three of these files, you know... exist?
  bootstrapMap(fileName, dataName);
};

function saveMostRecentMapLocation(filename) {
  
  const jetpack = BREADPATH.getJetpack();
  const appConfigPath = BREADPATH.getMostRecentFilesJSONPath();

  let appConfigData = jetpack.read(appConfigPath, 'json');
  if( !appConfigData ) { 
    appConfigData = {};
  }

  appConfigData.abs_path_to_maps = path.dirname(filename);
  appConfigData.most_recent_map = path.basename(filename);

  if(!appConfigData.recent_maps) {
    appConfigData.recent_maps = [];
  }

  appConfigData.recent_maps.unshift({
    basePath: appConfigData.abs_path_to_maps,
    map: appConfigData.most_recent_map    
  });

  appConfigData.recent_maps = dedupeRecentMaps(appConfigData.recent_maps);

  window.$$$_most_recent_options = appConfigData;

  jetpack.write(appConfigPath, appConfigData);
};

const MAX_RECENT_MAPS = 10;

function dedupeRecentMaps(mapQueue) {
  const hitList = {};
  const newQueue = [];

  for (let i = 0; i < mapQueue.length; i++) {
    const key = mapQueue[i].basePath +  mapQueue[i].map;
    if(!hitList[key]) {
      newQueue.push(mapQueue[i]);
      hitList[key] = true;
    }
    
    if(newQueue.length >= MAX_RECENT_MAPS) {
      return newQueue;
    }
  }

  return newQueue;
}

export function bootstrapMap(mapFile, tiledataFile) {

  // replace entire contents of the body with a fresh copy.
  const $body = $('#jquery-ui-base');
  $body.html(baseHTMLTemplate());
  Palettes.setupPaletteRegistry();
  Palettes.setupPaletteListeners();
  setupFreshApp();
  
  const errorHandler = (e) => {
    debugger;
    console.error(e);
  };

  verifyTileData(tiledataFile)
    .then(() => {
      LOG('verify map?');
      verifyMap(mapFile)
        .then(() => {
          LOG('create map?');

            new Map(
                mapFile, tiledataFile, (map) => {  updateLocationFunction(map); updateScreenview(map); }
            ).ready().then( (m) => {
              const currentMap = m;
              m.setCanvas($('.map_canvas'));
            
              window.$$$currentMap = currentMap;
            
              for (let i = m.mapData.entities.length - 1; i >= 0; i--) {
                if (!m.mapData.entities[i].animation) {
                  // TODO this is very bad
                  window.alert(`Theres an entity ${  i  } with unset animation; ALERT GRUE wtf`);
                  // mapData.entities[0].filename
                  m.mapData.entities[i].animation = 'Idle Down'; // TOD no no no
                }
              }
            
              if (typeof window.$$$currentMap.mapData.MAPED_ENTLAYER_VISIBLE === 'undefined') {
                window.$$$currentMap.mapData.MAPED_ENTLAYER_VISIBLE = true;
              }
            
              if (typeof window.$$$currentMap.mapData.MAPED_ZONELAYER_VISIBLE === 'undefined') {
                window.$$$currentMap.mapData.MAPED_ZONELAYER_VISIBLE = true;
              }
            
              if (typeof window.$$$currentMap.mapData.MAPED_OBSLAYER_VISIBLE === 'undefined') {
                window.$$$currentMap.mapData.MAPED_OBSLAYER_VISIBLE = true;
              }
            
              LayersWidget.initLayersWidget(currentMap);
              initInfoWidget(currentMap);
              initScreen(currentMap);
              ZonesWidget.initZonesWidget(currentMap);
              EntitiesWidget.initEntitiesWidget(currentMap);
            
              initTools($('.map_canvas'), window.$$$currentMap);
            
              updateRstringInfo();
            
              // TODO do we need to do this at all?
              // window.$$$hide_all_windows();
            }).catch( (e) => {LOG(e); throw e;} )
        })
    })
};

