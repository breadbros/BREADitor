import { Map } from './Map.js';
import { Tools } from './Tools.js';
import { LayersWidget } from './js/ui/LayersPalette.js';
import { ZonesWidget } from './js/ui/ZonesPalette.js';
import { EntitiesWidget } from './js/ui/EntityPalette.js';

function initInfoWidget(map) {
	$("#info-mapname").text( map.mapPath );
	$("#info-dims").text( map.mapSizeInTiles[0]+"x"+map.mapSizeInTiles[1] );
}

function updateLocationFunction(map) {
  var x = map.camera[0];
  var y = map.camera[1];
  var key = 'map-'+ map.mapData.name;

	$("#info-location").text( x +","+y );

  localStorage[key+'-mapx'] = x;
  localStorage[key+'-mapy'] = y;
}

function bootstrapMap( mapFile, tiledataFile, vspFile ) {
    new Map(
        mapFile, tiledataFile, vspFile,
        updateLocationFunction
    ).ready()
        .then(function(m) {
            var currentMap = m;
            m.setCanvas($('.map_canvas'));

            window.$$$currentMap = currentMap;

            LayersWidget.initLayersWidget( currentMap );
            initInfoWidget( currentMap );
            ZonesWidget.initZonesWidget( currentMap );
            EntitiesWidget.initEntitiesWidget( currentMap );

            Tools.updateRstringInfo();
        });
}

(function() {
    window.$$$currentMap = null;

    var tick = function(timestamp) {
        if (!!window.$$$currentMap) {
            window.$$$currentMap.render();
        }
        window.requestAnimationFrame(tick);
    };
    window.requestAnimationFrame(tick);

    console.log("$$$save should be initialized...");
    window.$$$save = function() {
      var app = require('remote').require('app');
      var jetpack = require('fs-jetpack').cwd(app.getAppPath());

      var map = window.$$$currentMap;
      map.compactifyZones(); /// TODO this should probably happen not-here?

      jetpack.write(map.filenames.mapfile, map.mapData);
      jetpack.write(map.filenames.mapdatafile, map.mapRawTileData);

      console.log('HELLO I AM $$$SAVE');
    };

    window.$$$load = function() {
     var remote = require('remote');
     var dialog = remote.require('dialog');

     dialog.showOpenDialog({ filters: [
       { name: 'text', extensions: ['map.json'] }
      ]}, function (fileNames) {
      if (fileNames === undefined) return;
      var fileName = fileNames[0];
      var dataName, vspName;

      dataName = fileName.replace('.map.json', '.map.data.json');
      vspName = fileName.replace('.map.json', '.vsp.json');

      /// todo: verify that all three of these files, you know... exist?
      bootstrapMap(fileName, dataName, vspName);
     });
    }

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
})();

/*
// ---------------------------------------------------------------------------------------------------------------------
// everything below here might still be useful to someone but it's not in active use!
// ---------------------------------------------------------------------------------------------------------------------

// Here is the starting point for code of your own application.
// All stuff below is just to show you how it works. You can delete all of it.

// Modules which you authored in this project are intended to be
// imported through new ES6 syntax.
import { greet } from './hello_world/hello_world';

// Node.js modules and those from npm
// are required the same way as always.
var os = require('os');
var app = require('remote').require('app');
var jetpack = require('fs-jetpack').cwd(app.getAppPath());

// Holy crap! This is browser window with HTML and stuff, but I can read
// here files like it is node.js! Welcome to Electron world :)
console.log(jetpack.read('package.json', 'json'));

// window.env contains data from config/env_XXX.json file.
var envName = window.env.name;

(
  function( $ )
  {
    $.styler={
	  insertRule:function(selector,rules,contxt)
	  {
	    var context=contxt||document,stylesheet;

	    if(typeof context.styleSheets=='object')
	    {
	      if(context.styleSheets.length)
	      {
	        stylesheet=context.styleSheets[context.styleSheets.length-1];
	      }
	      if(context.styleSheets.length)
	      {
	        if(context.createStyleSheet)
	        {
	          stylesheet=context.createStyleSheet();
	        }
	        else
	        {
	          context.getElementsByTagName('head')[0].appendChild(context.createElement('style'));
	          stylesheet=context.styleSheets[context.styleSheets.length-1];
	        }
	      }
	      if(stylesheet.addRule)
	      {
	        for(var i=0;i<selector.length;++i)
	        {
	          stylesheet.addRule(selector[i],rules);
	        }
	      }
	      else{
	        stylesheet.insertRule(selector.join(',') + '{' + rules + '}', stylesheet.cssRules.length);
	      }
	    }
	  }
	};
  }
)( $ );
*/
