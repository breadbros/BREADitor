import { ipcRenderer } from 'electron';
import { Palettes } from '../Palettes.js';
import { bootstrapMap } from '../app';
import { baseHTMLTemplate } from './BaseTemplate';


/// FOR MapBootstrap
import { Map, verifyTileData, verifyMap, cleanEntities } from '../Map.js';

/// FOR IPC
import { TilesetSelectorWidget } from '../js/ui/TilesetSelectorPalette.js';
import {
  clickSmartdropper, clickEyedropper, clickDrawBrush, clickMoveViewport, clickSelect, selectAll, clickFloodFill,
  initTools, updateRstringInfo, updateLocationFunction, clickDragItem
} from '../Tools.js';
import {
  LayersWidget, selectZoneLayer, selectObstructionLayer, selectNumberedLayer, visibilityFix, newLayerOnNewMap
} from '../js/ui/LayersPalette.js';
import { cut, copy, paste } from '../js/ui/CutCopyPaste.js';
import { ZonesWidget } from '../js/ui/ZonesPalette.js';
import { EntitiesWidget } from '../js/ui/EntityPalette.js';

import { handleUndo, handleRedo } from '../UndoRedo';
import { toggleSelectedTiles, moveSelectedTile } from '../TileSelector';

const path = require('path');

const updateScreenview = (map) => {
  $('#screenview-indicator-switch').prop('checked', map.windowOverlay.on);
  $('#screenview-indicator-x').val(map.windowOverlay.viewport.x);
  $('#screenview-indicator-y').val(map.windowOverlay.viewport.y);
  $('#screenview-indicator-width').val(map.windowOverlay.viewport.width);
  $('#screenview-indicator-height').val(map.windowOverlay.viewport.height);  
}

/// TODO: why have both $$$_BREDITOR_MOST_RECENT.json and $$$_MAPED.json... 🤔
/// I guess one should be in the appdir to at least point to the project directory...
const loadMostRecentFileOption = () => {
  /// TODO: is there a reason for requiring these in-block like this, or is it just cargo cult copypasta? 
  const app = require('electron').remote.app;
  const jetpack = require('fs-jetpack').cwd(app.getAppPath());
  const dataPath = app.getAppPath();

  const options = {};

  const appConfigData = jetpack.read(path.join(dataPath, '$$$_BREDITOR_MOST_RECENT.json'), 'json');
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
  $('#info-mapname').attr('src', map.mapPath);

  const pathParts = map.mapPath.split(path.sep);
  $('#info-mapname').text(pathParts[pathParts.length - 1]);

  $('#info-dims').text(map.mapSizeInTiles[0] + 'x' + map.mapSizeInTiles[1]);
};

function killAllElementListeners($elem) {
  // first argument of function: "$._data ()" is: "Element" - not jQuery object
  $.each( $._data( $elem, "events" ), function(name) {
    console.log("body had listener: " + name);
    $elem.off( name ); // function off() removes an event handler
  } );
}

function killAllDocumentListeners(doc) {
  debugger;
  // first argument of function: "$._data ()" is: "Element" - not jQuery object
  $.each( $._data( $elem, "events" ), function(name) {
    console.log("body had listener: " + name);
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

// TODO: verify all this cannot be done with accelerators
function setupChording() {

  $('body').on('keydown', (e) => {
    if (!(e.ctrlKey || e.cmdKey)) { // TODO verify this on mac, cmdKey is a guess.
      return;
    }

    if (document.activeElement.type && document.activeElement.type === 'text') {
      // console.info('in a textfield, ignoring the accelerator');
      return;
    }

    // TODO all of these commands should probably be passed in the map on the currently active map palette
    // (if there is one) so as to include the tileset map or any future ones

    if (e.key === 'c' || e.key === 'C') {
      console.log('edit-copy, but the one on the document.  SIGH WINDOWS.');

      if (window.$$$currentMap.selection.tiles && window.$$$currentMap.selection.tiles.length) {
        copy(window.$$$currentMap);
      } else if (
        window.$$$currentTilsesetSelectorMap.selection.tiles &&
        window.$$$currentTilsesetSelectorMap.selection.tiles.length
      ) {
        copy(window.$$$currentTilsesetSelectorMap);
      }

      return;
    }

    if (e.key === 'v' || e.key === 'V') {
      console.log('edit-paste, but the one on the document.  SIGH WINDOWS.');
      paste(window.$$$currentMap);
      return;
    }

    if (e.key === 'x' || e.key === 'X') {
      console.log('edit-cut, but the one on the document.  SIGH WINDOWS.');
      cut(window.$$$currentMap);
      return;
    }

    if (e.key === 'a' || e.key === 'A') {
      console.log('edit-select-all but the one on the document.  SIGH WINDOWS.');
      selectAll(window.$$$currentMap);
      return;
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

  if(opts.abs_path_to_maps && opts.most_recent_map) {
    const filepath = path.join(opts.abs_path_to_maps, opts.most_recent_map);

    if( fs.existsSync(filepath) ) {
      console.info(`${filepath} specified to autoload...`);
      loadByFilename(filepath);
    } else {
      console.info(`${filepath} specified to autoload... but it wasn't there.`);
    }
    
  } else {
    console.info('No map specified to autoload.');
  }
}

/**
* Necesary to setup a freshly loaded map.
*/
export function setupFreshApp() {

  killAllElementListeners($( "#body" ));
  //killAllDocumentListeners(document);

  setupShiftKeyPressed();

  setupChording();

  setupTheRestOfTheApp();
}

export function setupWindowFunctions() {

  window._newStep3_resolution = function (map, layers) {
    const { dialog } = require('electron').remote;

    dialog.showSaveDialog(
      {title: 'New Map Filename', filters: [{ name: 'text', extensions: ['map.json'] }]},
      (filename) => {
        if (filename) {
          let raw = {
            legacy_obstruction_data: map.mapRawTileData.tile_data[0], // Array[37500]
            tile_data: map.mapRawTileData.tile_data, // Array[6]
            zone_data: []
          };

          raw = JSON.parse(JSON.stringify(raw));

          const blankMap = {
            notes: [],
            name: 'NO NAME', // TODO allow name entry
            vsp: {
              default: path.basename(window.newMapData.default_vspfile),
              obstructions: path.basename(window.newMapData.obs_vspfile)
            },
            music: '', // TODO do something with music
            renderstring: '1,E,R',
            initscript: 'start', // TODO allow editing of initscript?
            starting_coordinates: [0, 0],
            layers: layers,
            zones: [{
              name: 'NULL_ZONE',
              activation_script: '',
              activation_chance: 0,
              can_by_adjacent_activated: false
            }],
            entities: []
          };

          window._save(filename, {
            mapData: blankMap,
            mapRawTileData: raw
          });
        }
      }
    );
  };

  window._newStep2_chooseObsVSP = function (res) {
    window.newMapData.obs_vspfile = res[0];

    newLayerOnNewMap(new window.Event(null), window._newStep3_resolution);
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

  window.$$$save = function (newName) {
    window.$$$currentMap.compactifyZones();
    window._save(newName, window.$$$currentMap);
  };

  window._save = function (newName, map) {
    const app = require('electron').remote.app;
    const jetpack = require('fs-jetpack').cwd(app.getAppPath());

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

    console.info('saving', mapfile);
    console.info('saving', datafile);

    jetpack.write(mapfile, mapData);
    jetpack.write(datafile, tileData);

    console.log('HELLO I AM $$$SAVE');
  };

  window.$$$about_breaditor = function () {
    window.alert(
      'Breaditor is a pile of junk made mostly by @bengrue and a little by Shamus Peveril.' +
      'TODO: make this better.'
    );
  };

  window.$$$collect_all_windows = function () {
    let x = 0;
    let y = 0;
    let z = 0;

    window.$$$palette_registry.map((pal) => {
      const node_selector = '.' + pal;
      const $node = $(node_selector);
      $node.css('top', y + 'px');
      $node.css('left', x + 'px');
      $node.css('z-index', z);

      Palettes.correctResizeWidget($node);

      x += 30;
      y += 30;
      z += 2;
    });

    Palettes.savePalettePositions();
  };

  window.$$$show_all_windows = function () {
    window.$$$palette_registry.map((pal) => {
      const node_selector = '.' + pal;
      const $node = $(node_selector);
      $node.show();
    });

    Palettes.savePalettePositions();
  };

  window.$$$hide_all_windows = function () {
    window.$$$palette_registry.map((pal) => {
      const node_selector = '.' + pal;
      const $node = $(node_selector);
      $node.hide();
    });
  };

  window.$$$load = function () {
    const app = require('electron').remote.app;
    const { dialog } = require('electron').remote;
    const dataPath = app.getAppPath();
    const jetpack = require('fs-jetpack').cwd(dataPath);
    const path = require('path');


    const options = {
      filters: [{ name: 'text', extensions: ['map.json'] }]
    };

    if( window.$$$_most_recent_options.abs_path_to_maps ) {
      options.defaultPath = window.$$$_most_recent_options.abs_path_to_maps;
    }

    dialog.showOpenDialog( options, loadByFilename );
  };

  window.$$$saveAs = function () {
    const { dialog } = require('electron').remote;

    dialog.showSaveDialog(
      {filters: [{ name: 'text', extensions: ['map.json'] }]},
      (filename) => {
        if (filename) {
          window.$$$save(filename);
        }
      }
    );
  };

  window.$$$toggle_pallete = function (pal, forceShow) {
    if (pal.msg) {
      pal = pal.msg;
    }

    let node_selector = '';
    let node = pal + '-palette';

    if (window.$$$palette_registry.indexOf(node) >= 0) {
      node_selector = '.' + node;
      node = $(node_selector);

      if (!node.length) {
        throw new Error("Invalid palette node selector: '" + node_selector + "'");
      }
    } else {
      throw new Error("Invalid palette name: '" + pal + "'");
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

  window.appPath = path.dirname(require.main.filename);
}

export function setupIPCRenderer() {
  // Setup IPC
  ipcRenderer.on('main-menu', (event, arg) => {
    if (typeof arg.accelerator === 'string') {
      const el = document.activeElement;
      if (el.type && el.type === 'text') {
        // NOTE - enabling this console log slows all data entry RIGHT the fuck down
        // console.info('in a textfield, ignoring the accelerator');
        return;
      }

      if( arg.msg == 'tool-move-viewport' && el.type) {
        return;
      }

      // console.log(document.activeElement);
      // var el = document.activeElement;
      // debugger;
    }

    switch (arg.msg) {
      case 'new':
        window.$$$new();
        break;
      case 'save':
        window.$$$save();
        break;
      case 'save-as':
        window.$$$saveAs();
        break;
      case 'load':
        window.$$$load();
        break;
      case 'undo':
        handleUndo();
        break;
      case 'redo':
        handleRedo();
        break;
      case 'tile-swap':
        // TODO don't do this if you're in a text-editing field
        toggleSelectedTiles(window.$$$currentMap);
        break;
      case 'tool-brush':
        clickDrawBrush();
        break;
      case 'move-selected-tile':
        moveSelectedTile(arg.accelerator, window.$$$currentTilsesetSelectorMap);
        break;
      case 'tool-eyedropper':
        clickEyedropper();
        break;
      case 'tool-smartdropper':
        clickSmartdropper();
        break;
      case 'tool-move-viewport':
        clickMoveViewport();
        break;
      case 'tool-drag-item':
        clickDragItem();
        break;
      case 'tool-flood-fill':
        clickFloodFill();
        break;
      case 'tool-select':
        clickSelect();
        break;
      case 'about':
        window.$$$about_breaditor();
        break;
      case 'focus-layer-O':
        selectObstructionLayer();
        break;
      case 'focus-layer-Z':
        selectZoneLayer();
        break;
      case 'focus-layer-E':
        // TODO implement the entities layer already.
        console.log('TODO implement the entities layer already.');
        break;
      case 'focus-layer-1':
      case 'focus-layer-2':
      case 'focus-layer-3':
      case 'focus-layer-4':
      case 'focus-layer-5':
      case 'focus-layer-6':
      case 'focus-layer-7':
      case 'focus-layer-8':
      case 'focus-layer-9':
        const argParsed = arg.msg.split('-');
        selectNumberedLayer(parseInt(argParsed[argParsed.length - 1]));
        break;
      case 'map':
      case 'tool':
      case 'info':
      case 'layers':
      case 'zones':
      case 'entity':
      case 'tileset-selector':
        window.$$$toggle_pallete(arg);
        break;
      case 'all-collect':
        window.$$$collect_all_windows();
        break;
      case 'all-show':
        window.$$$show_all_windows();
        break;
      case 'edit-cut':
        cut(window.$$$currentMap);
        break;
      case 'edit-copy':
        copy(window.$$$currentMap);
        break;
      case 'edit-paste':
        paste(window.$$$currentMap);
        break;
      case 'edit-select-all':
        selectAll(window.$$$currentMap);
        break;
      case 'reset-camera':
        // TODO: This inline implementation is clearly out of step with the rest of these, but I couldn't find a dedicated camera control section anywhere (and didn't want to build one just for this)
        const ResetCamera = (map) => {
          map.camera[0] = 0; // X
          map.camera[1] = 0; // Y
          map.camera[2] = 1; // Zoom (1x)
        };
        ResetCamera(window.$$$currentMap);
        break;
      case 'screenview-indicator':
        alert('screenview-indicator! Yay1112');
        break;
      default:
        console.error('Unknown action from main-menu:', arg);
    }
  });
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
  const app = require('electron').remote.app;
  const jetpack = require('fs-jetpack').cwd(app.getAppPath());
  const path = require('path');

  const appConfigPath = path.join(app.getAppPath(), '$$$_BREDITOR_MOST_RECENT.json');
  let appConfigData = jetpack.read(appConfigPath, 'json');
  if( !appConfigData ) { 
    appConfigData = {};
  }

  appConfigData.abs_path_to_maps = path.dirname(filename);
  appConfigData.most_recent_map = path.basename(filename);

  jetpack.write(appConfigPath, appConfigData);
};

function bootstrapMap(mapFile, tiledataFile) {

  // replace entire contents of the body with a fresh copy.
  const $body = $('body');
  $body.html(baseHTMLTemplate());
  Palettes.setupPaletteRegistry();
  Palettes.setupPaletteListeners();
  setupFreshApp();
  
  verifyTileData(tiledataFile)
    .then(() => {
      console.log('verify map?');
      verifyMap(mapFile)
        .then(() => {
          console.log('create map?');
          new Map(
              mapFile, tiledataFile, (map) => {  updateLocationFunction(map); updateScreenview(map); }
          ).ready()
              .then(function (m) {
                const currentMap = m;
                m.setCanvas($('.map_canvas'));

                window.$$$currentMap = currentMap;

                for (let i = m.mapData.entities.length - 1; i >= 0; i--) {
                  if (!m.mapData.entities[i].animation) {
                    // TODO this is very bad
                    window.alert('Theres an entity ' + i + ' with unset animation; ALERT GRUE wtf');
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
              });
        });
    });
};
