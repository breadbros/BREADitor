import { Map } from './map';

function initLayersWidget(map) {
	//map.layers[i].MAPED_HIDDEN

	var layers = map.mapData.layers;

	$(".layers-palette").append( "Rstring: " + map.renderString + "(this should be represented in the layer order above)" );

	var list = $(".layers-palette .layers-list");
	var newThing = null;
	var l = null;
	var line = null;

	function getEyeballText(layer) {
		return !layer.MAPED_HIDDEN ? "+" : "-";
	}

	function addEyeballHandler( $eyeball, i ) {
    	$eyeball.on( "click", function(evt) {
    		layers[i].MAPED_HIDDEN = !layers[i].MAPED_HIDDEN;

    		$eyeball.text( getEyeballText(layers[i]) );

    		event.stopPropagation()
    	} );
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

		newThing = $("<li class='layer'></li>");
		newThing.data("alpha", l.alpha);
		newThing.data("rstring_ref", ""+(i+1) );

		generateContent(i, l, newThing);

    	list.append( newThing );
	};
};

function initInfoWidget(map) {
	$("#info-mapname").text( map.mapPath );
	$("#info-dims").text( map.mapSize[0]+"x"+map.mapSize[1] );
}

function updateLocationFunction(map) {
	$("#info-location").text( map.camera[0] +","+map.camera[0] );
}

(function() {
    window.currentMap = null;

    var tick = function(timestamp) {
        if (!!currentMap) {
            currentMap.render();
        }
        window.requestAnimationFrame(tick);
    };
    window.requestAnimationFrame(tick);

    new Map(
        '../app/map_assets/farmsville.map.json',
        '../app/map_assets/farmsville.map.data.json',
        '../app/map_assets/farmsville.vsp.json',
        updateLocationFunction
    ).ready()
        .then(function(m) {
            m.setCanvas($('.map_canvas'));
            currentMap = m;

            initLayersWidget( currentMap );
            initInfoWidget( currentMap );
        });
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