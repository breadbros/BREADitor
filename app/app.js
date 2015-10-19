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

var mapfile = jetpack.read('../app/map_assets/map.json', 'json');
var vspfile = jetpack.read('../app/map_assets/vsp.json', 'json');

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

debugger;

function setupMap(mapfile, vspfile) {
	var x, y, d;
	var canvas =  $("#map_canvas");


	var tile_w = vspfile.tilesize.width;
	var tile_h = vspfile.tilesize.height;
	var tile_src = vspfile.source_image;
	var xMaxMap = mapfile.dimensions.x;
	var xMaxVsp = vspfile.tiles_per_row;

	$.styler.insertRule(['#map_canvas .tile'], 
		"position: absolute; "+
		"width: " +tile_w+"px; " +
		"height: "+tile_h+"px; " +
		"background-image: url("+tile_src+");" );


	

	var set_correct_tile = function ($div, idx, per_row) {

		var x = parseInt(idx%per_row);
		var y = parseInt(idx/per_row);

		x = x*tile_w;
		y = y*tile_h;

		$div.css('background-position', '-'+x+'px -'+y+'px');
	};

	var flat_from_xy = function ( x, y, xMax ) {
    	return y*xMax + x;
	};

	var layer = 0;
	var t = null;

	for( x=0; x<mapfile.dimensions.x; x++ ) {
		for( y=0; y<mapfile.dimensions.y; y++ ) {
			d = $( "<div>" );


			d.addClass('tile');

			d.css('top', (y*tile_h)+'px');
			d.css('left', (x*tile_w)+'px');

			d.data('x', x);
			d.data('y', x);
			t = mapfile.layer_data[layer][flat_from_xy(x, y, xMaxMap)];
			d.data('tile', t);
			set_correct_tile( d, t, xMaxVsp );

			canvas.append(d);
		}
	}
}

document.addEventListener('DOMContentLoaded', function() {
	/*
    document.getElementById('greet').innerHTML = "BUTTS, elizibutts!";
    document.getElementById('platform-info').innerHTML = os.platform();
    document.getElementById('env-name').innerHTML = envName;
    */

    setupMap(mapfile, vspfile);
});
