import { Map } from './Map.js';
import { Tools } from './Tools.js';

function initLayersWidget(map) {
	//map.layers[i].MAPED_HIDDEN

	var layers = map.mapData.layers;

	var list = $(".layers-palette .layers-list");
	var newLayerContainer = null;
	var l = null;
	var line = null;

  function handleEyeball(layerDiv, layer) {
    layerDiv.removeClass('eye-open');
    layerDiv.removeClass('eye-closed');
    if( !layer.MAPED_HIDDEN ) {
      layerDiv.addClass('eye-open');
    } else {
      layerDiv.addClass('eye-closed');
    }
  }

	function addEyeballHandler( $eyeball, i ) {
    	$eyeball.on( "click", function(evt) {
    		layers[i].MAPED_HIDDEN = !layers[i].MAPED_HIDDEN;

        handleEyeball($eyeball, layers[i]);

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
    var node = null;

		for (var i = map.renderString.length - 1; i >= 0; i--) {
			rstring_cur_target = map.renderString[i];
	        rstring_ref = parseInt(rstring_cur_target, 10);
	        if (isNaN(rstring_ref)) {

            /// TODO this is certainly the wrong place to populate "R" and "E" visually.
            if( rstring_cur_target == "E" ) {
              node = $("<li class='layer ui-state-default'><button class='eyeball_button question_mark'>?</button>Entities (default)</li>");
              node.data("rstring_ref", "E");
              $list.append(node); 
            } else if( rstring_cur_target == "R" ) {
              node = $("<li class='layer ui-state-default'><button class='eyeball_button question_mark'>?</button>'Render'</li>");
              node.data("rstring_ref", "R");
              $list.append(node); 
            } else {
              console.log( "UNKNOWN RSTRING PARTICLE '"+rstring_cur_target+"'" );
            }

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

          $(".eyeball_button.question_mark").click( function() {
            console.log("unimplemented, weirdo.");
          } )
		};
	}

  function resizeWindow() {
    var h = 0;
    var w = 0;

    /// hackery of the worst calibur; probably a flaming trashbin.  do not trust.
    $(".layers-palette").children().each( function(idx, kid) {
      if( idx >= $(".layers-palette").children().length-3 ) {
        return; /// the last three are chrome for resizable windows.
      }

      h +=  $(kid).outerHeight(true);
    })

    w += $(".layers-palette .window-container").outerWidth(true);

    $(".layers-palette").width(w);
    $(".layers-palette").height(h);  
  }

  function modal_error(errormsg) {
    alert(errormsg); // for now...
  }

  function update_lucency(layer, dialog) {
    var val = $("#new_layer_lucent").val().trim();

    if( !$.isNumeric(val) ) {
      modal_error("Invalid input: not numeric.");
      return;
    }

    if( val.indexOf(".") === -1 ) {
      val = parseInt(val);

      if(val <0 || val > 100) {
        modal_error("INVALID PERCENTAGE VALUE, range: [0...100]");
        return;
      } else {
        val = val/100;
      }
    } else { // parse fraction
      val = parseFloat(val);
      if( val < 0 || val > 1 ) {
        modal_error("INVALID FLOAT VALUE, range:  [0...1]");
        return;
      } 
    }

    layer.alpha = val;

    redrawAllLucent();

    dialog.dialog( "close" );
  }

  function lucent_click(evt) {
    var idx = parseInt($(this).parent().data("rstring_ref"))-1;
    var layer = window.$$$currentMap.mapData.layers[idx];

    //var newLucent = dialog
    var dialog;

    $(function() {

      var template = "<div>Layer: " + layer.name + "</div>";
      template += "<div>Current: " + formatAlphaAsPercentage(layer.alpha) + "</div>"; 
      template += "<div>New: <input id='new_layer_lucent'>%</div>"; 

      $( "#modal-dialog" ).attr("title", "Set layer Opacity");
      $( "#modal-dialog" ).html(template)

      $( "#modal-dialog" ).show();
      dialog = $( "#modal-dialog" ).dialog({
        modal: true,
        buttons: {
          Save: () => { update_lucency(layer, dialog) },
          "Cancel": function() {
            dialog.dialog( "close" );
          }
        },
        close: function() {
          $( "#modal-dialog" ).html("");
        }
      });
    });
  }

  function formatAlphaAsPercentage(alpha) {
    return (alpha.toFixed(2) * 100);
  }

  function redrawAllLucent() {
    $(".layer ").each( function(idx,layer) {
      var nodeLayer = $(layer);
      var rstring = nodeLayer.data("rstring_ref");
      var lucentDomNode = null;

      var mapLayer = null 

      if( !$.isNumeric(rstring) ) {
        return;
      } else {
        mapLayer = window.$$$currentMap.mapData.layers[parseInt(rstring)-1]; //todo: seperate human-indx from 0-based.
        lucentDomNode = nodeLayer.find(".layer_lucency");
        lucentDomNode.text(formatAlphaAsPercentage(mapLayer.alpha)+"%")

        if(!mapLayer.alpha) {
          debugger;
        }

        nodeLayer.data("alpha", mapLayer.alpha) // TODO: remove this, only one source of truth: the data.
      }

    }); 
  }

	function generateContent(i, l, $parent) {
		var visible_div = $("<button class='eyeball_button'></button>");
    var name_div = $("<div class='layer_name'></div>");
    var lucent_div = $("<div class='layer_lucency'></div>");

    handleEyeball(visible_div, l);

		name_div.text((i+1)+": "+l.name);
    lucent_div.text(formatAlphaAsPercentage(l.alpha)+"%")

		addEyeballHandler(visible_div, i);

    lucent_div.click(lucent_click);

		$parent.append(visible_div);
		$parent.append(name_div);
    $parent.append(lucent_div);
	}

	for (var i = layers.length - 1; i >= 0; i--) {
		l = layers[i];

		newLayerContainer = $("<li class='layer ui-state-default'></li>");
		newLayerContainer.data("alpha", l.alpha);
		newLayerContainer.data("rstring_ref", ""+(i+1) );

		generateContent( i, l, newLayerContainer );

		addLayerSelectHandler( newLayerContainer, i );

    list.append( newLayerContainer );
	};

  /// RSTRING is weird and needs to die.
	reorder_layers_by_rstring_priority(list, map);
  resizeWindow();

  /// make the layers sortable
  $( ".layers-list" ).sortable({
    revert: true
  });
  $( "ul, li" ).disableSelection();
  $( ".layers-list" ).on( "sortupdate", function( event, ui ) {
    var kids = $( ".layers-list" ).children();
    var i, val;

    var rstring = [];

    try {
      for( i in kids ) {
        if( kids.hasOwnProperty(i) ) {
          val = $(kids[i]).data("rstring_ref");
          if(val) {
            rstring.unshift($(kids[i]).data("rstring_ref"));  
          }
        }
      }
    } catch(e) {
      console.log("error")
      console.log(e)
      throw e;
    }

  } );
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
