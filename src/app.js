import { Map, verifyTileData, verifyMap } from './Map.js';
import { Tools } from './Tools.js';
import { Palettes } from './Palettes.js';
import { LayersWidget } from './js/ui/LayersPalette.js';
import { ZonesWidget } from './js/ui/ZonesPalette.js';
import { EntitiesWidget } from './js/ui/EntityPalette.js';
import { TilesetSelectorWidget } from './js/ui/TilesetSelectorPalette.js';

var path = require('path');

function initInfoWidget(map) {
	$("#info-mapname").text( map.mapPath );
	$("#info-dims").text( map.mapSizeInTiles[0]+"x"+map.mapSizeInTiles[1] );
}

function bootstrapMap( mapFile, tiledataFile ) {

  verifyTileData(tiledataFile)
    .then(() => {
      console.log("verify map?");
      verifyMap(mapFile)
    .then(() => {
      console.log("create map?");
      new Map(
          mapFile, tiledataFile,
          Tools.updateLocationFunction
      ).ready()
          .then(function(m) {
              var currentMap = m;
              m.setCanvas($('.map_canvas'));

              window.$$$currentMap = currentMap;

              LayersWidget.initLayersWidget( currentMap );
              initInfoWidget( currentMap );
              ZonesWidget.initZonesWidget( currentMap );
              EntitiesWidget.initEntitiesWidget( currentMap );

              Tools.initToolsToMapContainer( $('.map_canvas'), window.$$$currentMap );

              Tools.updateRstringInfo();
          });
        }
      )
    }
  )
}

(function() {
    window.$$$currentMap = null;

    var tick = function(timestamp) {
        if (!!window.$$$currentMap) {
          window.$$$currentMap.render();
          TilesetSelectorWidget.renderTilesetSelectorWidget();
        }

        window.requestAnimationFrame(tick);
    };
    window.requestAnimationFrame(tick);

    console.log("$$$save should be initialized...");
    window.$$$save = function() {
      var app = require('electron').remote.app;
      var jetpack = require('fs-jetpack').cwd(app.getAppPath());

      var map = window.$$$currentMap;
      map.compactifyZones(); /// TODO this should probably happen not-here?

      jetpack.write(map.filenames.mapfile, map.mapData);
      jetpack.write(map.filenames.mapdatafile, map.mapRawTileData);

      console.log('HELLO I AM $$$SAVE');
    };

    var loadByFilename = (fileNames) => {
      if (fileNames === undefined) return;
      var fileName = fileNames[0];
      var dataName, vspName;

      dataName = fileName.replace('.map.json', '.map.data.json');
      vspName = fileName.replace('.map.json', '.vsp.json');

      /// todo: verify that all three of these files, you know... exist?
      bootstrapMap(fileName, dataName);
    };

    window.$$$about_maped4 = function() {
      alert("Maped4 is a pile of junk made mostly by @bengrue and a little by Shamus Peveril.  TODO: make this better.");
    };

    window.$$$collect_all_windows = function() {

      var x = 0;
      var y = 0;
      var z = 0;

      window.$$$palette_registry.map( (pal) => {
        var node_selector = "."+pal;
        var $node = $(node_selector);
        $node.css("top", y+"px");
        $node.css("left", x+"px");
        $node.css("z-index", z);

        Palettes.correctResizeWidget($node);

        x += 30;
        y += 30;
        z += 2;

      } );

      Tools.savePalettePositions();
    };

    window.$$$show_all_windows = function() {

      window.$$$palette_registry.map( (pal) => {
        var node_selector = "."+pal;
        var $node = $(node_selector);
        $node.show();
      } );

      Tools.savePalettePositions();
    };

    window.$$$load = function() {
      const { dialog } = require('electron').remote;

      dialog.showOpenDialog(
        {filters: [{ name: 'text', extensions: ['map.json'] }]},
        loadByFilename
      );
    }

    window.$$$palette_registry = [
      "map-palette",
      "tool-palette",
      "layers-palette",
      "zones-palette",
      "entity-palette",
      "info-palette",
      "tileset-selector-palette"
    ];

    window.$$$toggle_pallete = function(pal) {

      var node_selector = "";
      var node = pal + "-palette";

      if( window.$$$palette_registry.indexOf(node) >= 0 ) {
        node_selector = "."+node;
        node = $(node_selector);

        if(!node.length) {
          throw "Invalid palette node selector: '"+node_selector+"'";
        }
      } else {
        throw "Invalid palette name: '"+pal+"'";
      }

      if( node.is(":visible") ) {
        node.hide();
      } else {
        node.show();
      }

      Tools.savePalettePositions();
    };

    Palettes.setupPaletteListeners();

    window.appPath = path.dirname(require.main.filename);
    window.$$$load();

    //loadByFilename(['../app/map_assets/farmsville.map.json']);

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

