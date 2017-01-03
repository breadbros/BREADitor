import { Map, verifyTileData, verifyMap, cleanEntities } from './Map.js';
import {
  clickSmartdropper, clickEyedropper, clickDrawBrush, clickMove, clickSelect, selectAll, clickFloodFill,
  initTools, updateRstringInfo, updateLocationFunction
} from './Tools.js';
import { Palettes } from './Palettes.js';
import {
  LayersWidget, selectZoneLayer, selectObstructionLayer, selectNumberedLayer, visibilityFix, newLayerOnNewMap
} from './js/ui/LayersPalette.js';
import { cut, copy, paste } from './js/ui/CutCopyPaste.js';
import { ZonesWidget } from './js/ui/ZonesPalette.js';
import { EntitiesWidget } from './js/ui/EntityPalette.js';
import { TilesetSelectorWidget } from './js/ui/TilesetSelectorPalette.js';
import { handleUndo, handleRedo } from './UndoRedo';
import { ipcRenderer } from 'electron';
import { toggleSelectedTiles } from './TileSelector';

const path = require('path');
const $ = require('jquery');

const initInfoWidget = (map) => {
  $('#info-mapname').attr('src', map.mapPath);

  const pathParts = map.mapPath.split(path.sep);
  $('#info-mapname').text(pathParts[pathParts.length - 1]);

  $('#info-dims').text(map.mapSizeInTiles[0] + 'x' + map.mapSizeInTiles[1]);
};

const bootstrapMap = (mapFile, tiledataFile) => {
  verifyTileData(tiledataFile)
    .then(() => {
      console.log('verify map?');
      verifyMap(mapFile)
        .then(() => {
          console.log('create map?');
          new Map(
              mapFile, tiledataFile, updateLocationFunction
          ).ready()
              .then(function (m) {
                const currentMap = m;
                m.setCanvas($('.map_canvas'));

                window.$$$currentMap = currentMap;

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
                ZonesWidget.initZonesWidget(currentMap);
                EntitiesWidget.initEntitiesWidget(currentMap);

                initTools($('.map_canvas'), window.$$$currentMap);

                updateRstringInfo();
              });
        });
    });
};

// Setup IPC
ipcRenderer.on('main-menu', (event, arg) => {
  if (typeof arg.accelerator === 'string') {
    const el = document.activeElement;
    if (el.type && el.type === 'text') {
      // NOTE - enabling this console log slows all data entry RIGHT the fuck down
      // console.info('in a textfield, ignoring the accelerator');
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
    case 'tool-eyedropper':
      clickEyedropper();
      break;
    case 'tool-smartdropper':
      clickSmartdropper();
      break;
    case 'tool-move':
      clickMove();
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
    default:
      console.error('Unknown action from main-menu:', arg);
  }
});

// TODO this is evil.
// This registers
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
    copy(window.$$$currentMap);
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

// Setup the rest of the app
(() => {
  window.$$$currentMap = null;

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
  window.requestAnimationFrame(tick);

  $('#btn-tool-undo').click(() => {
    handleUndo();
  });
  $('#btn-tool-redo').click(() => {
    handleRedo();
  });

/*

*/

  window._newStep3_resolution = function (map, layers) {
    debugger;
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

  const loadByFilename = (fileNames) => {
    if (fileNames === undefined) {
      return;
    }

    const fileName = fileNames[0];

    const dataName = fileName.replace('.map.json', '.map.data.json');
    // const vspName = fileName.replace('.map.json', '.vsp.json');

    // TODO: verify that all three of these files, you know... exist?
    bootstrapMap(fileName, dataName);
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
    const { dialog } = require('electron').remote;

    dialog.showOpenDialog(
      {filters: [{ name: 'text', extensions: ['map.json'] }]},
      loadByFilename
    );
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

  window.$$$palette_registry = [
    'map-palette',
    'tool-palette',
    'layers-palette',
    'zones-palette',
    'entity-palette',
    'info-palette',
    'tileset-selector-palette'
  ];

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

  Palettes.setupPaletteListeners();

  window.appPath = path.dirname(require.main.filename);
  window.$$$hide_all_windows();
  // window.$$$load();

    // loadByFilename(['../app/map_assets/farmsville.map.json']);

    /*
    /// INITIAL LOAD
    /// TODO: special case this with a null map for new-saving?
    bootstrapMap(
    	'../app/map_assets/farmsville.map.json',
        '../app/map_assets/farmsville.map.data.json',
        {
			'default':      '../app/map_assets/farmsville.vsp.json',
			'obstructions': '../app/map_assets/farmsville.obsvsp.json'
	    }
    );
    */
})();
