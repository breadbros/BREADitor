import { Map } from './Map.js';
import { Tools } from './Tools.js';

function initLayersWidget(map) {
	//map.layers[i].MAPED_HIDDEN

	var layers = map.mapData.layers;

	$(".layers-palette").append( "Rstring: " + map.renderString + "(this should be represented in the layer order above)" );

	var list = $(".layers-palette .layers-list");
	var newLayerContainer = null;
	var l = null;
	var line = null;

	function getEyeballText(layer) {
		return !layer.MAPED_HIDDEN ? "+" : "-";
	}

	function addEyeballHandler( $eyeball, i ) {
    	$eyeball.on( "click", function(evt) {
    		layers[i].MAPED_HIDDEN = !layers[i].MAPED_HIDDEN;

    		$eyeball.text( getEyeballText(layers[i]) );

    		evt.stopPropagation()
    	} );
	}

	function addLayerSelectHandler( $layer_container, i ) {
    	$layer_container.on( "click", function(evt) {

    		var selClass = "selected";

    		if( window && window.selected_layer ) {
    			window.selected_layer.$container.removeClass(selClass);
    		}

    		window.selected_layer = {
          map_tileData_idx: i,
    			layer: layers[i],
    			$container: $layer_container
    		};
    		$layer_container.addClass(selClass);

    		evt.stopPropagation()
    	} );
	}

	function reorder_layers_by_rstring_priority($list, map) {

		var childs = $list.children("li");
		childs.detach();

		var rstring_ref = null;
		var rstring_cur_target = null;
		var cur_kid = null;

		for (var i = map.renderString.length - 1; i >= 0; i--) {
			rstring_cur_target = map.renderString[i];
	        rstring_ref = parseInt(rstring_cur_target, 10);
	        if (isNaN(rstring_ref)) {
	        	continue;
	        }

	        for (var j = childs.length - 1; j >= 0; j--) {
	        	cur_kid = $(childs[j]);
	        	if( cur_kid.data("rstring_ref") == rstring_cur_target ) {
	        		$list.append(cur_kid); // re-add to list
	        		childs.splice(j, 1); // remove from childs array
	        		break;
	        	}
	        };
		};
	}

	function generateContent(i, l, $parent) {
		var visible_div = $("<button class='eyeball_button'></button>");
		var name_div = $("<div class='layer_name'></div>");

		visible_div.text( getEyeballText(l) );
		name_div.text((i+1)+": "+l.name);

		addEyeballHandler(visible_div, i);

		$parent.append(visible_div);
		$parent.append(name_div);
	}

	for (var i = layers.length - 1; i >= 0; i--) {
		l = layers[i];

		newLayerContainer = $("<li class='layer'></li>");
		newLayerContainer.data("alpha", l.alpha);
		newLayerContainer.data("rstring_ref", ""+(i+1) );

		generateContent( i, l, newLayerContainer );

		addLayerSelectHandler( newLayerContainer, i );

    	list.append( newLayerContainer );
	};

	reorder_layers_by_rstring_priority(list, map);
};

function initInfoWidget(map) {
	$("#info-mapname").text( map.mapPath );
	$("#info-dims").text( map.mapSizeInTiles[0]+"x"+map.mapSizeInTiles[1] );
}

function initZonesWidget(map) {
	$("#zones-number").text( map.mapData.zones.length );
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

            initLayersWidget( currentMap );
            initInfoWidget( currentMap );
            initZonesWidget( currentMap );

            window.$$$currentMap = currentMap;
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
