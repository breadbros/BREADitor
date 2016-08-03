import { modal_error } from './Util.js';

var _entityVisibility = true;
var _entityLayersExpanded = false;

export var setNormalEntityVisibility = (val) => {
  _entityVisibility = !!val;
};

export var getNormalEntityVisibility = () => {
  
  return _entityVisibility;
};

export var setEntityLayersExpanded = (val) => {
  _entityLayersExpanded = !!val;
};

export var getEntityLayersExpanded = () => {
  
  return _entityLayersExpanded;
};

export var shouldShowEntitiesForLayer = (layername) => {

  if( !window.$$$currentMap.layerLookup[layername] ) {
    modal_error("cannot shouldShowEntitiesForLayer, '"+layername+"' is not a layer");
  }

  let shouldHide = window.$$$currentMap.layerLookup[layername].maped_HIDE_ENTS;

  return !shouldHide;
};

export var setShowEntitiesForLayer = (layername, isVisible) => {
  if( !window.$$$currentMap.layerLookup[layername] ) {
    modal_error("cannot setShowEntitiesForLayer, '"+layername+"' is not a layer");
  }

  window.$$$currentMap.layerLookup[layername].maped_HIDE_ENTS = !isVisible;

  console.log("ents("+layername+")" + window.$$$currentMap.layerLookup[layername].maped_HIDE_ENTS)
}


var currentEntities = null;
var selectedZoneIdx = null;

function initEntitiesWidget(map) {
  debugger;
  currentEntities = map.mapData.entities;

  redraw_palette();
}

function redraw_palette() {
  var $list = $(".entity-list");
  $list.html("");
  var $tmp;
  // $("#entity-number").text( currentZones.length );

  // var singleclick_handler = (evt) => {
  //   select_zone_from_pallete(evt);
  // };

  // var doubleclick_handler = (evt) => { 
  //   var $it_me = select_zone_from_pallete(evt);
  //   edit_zone_click(evt,  $it_me.data("index"));
  // };
   
  for (let i = 0; i < currentEntities.length; i++) {

    $tmp = $("<li class='entity-row' data-index='"+i+"'><span class='entity-index'></span><span class='entity-name'></span></li>");
    $tmp.find(".entity-index").text( i );
    $tmp.find(".entity-name").text( currentEntities[i].name );
    
    // $tmp.click( singleclick_handler );

    // $tmp.dblclick( doubleclick_handler );
    // $tmp.contextmenu( doubleclick_handler );

    $list.append($tmp);
  }

  fixContainerSize();
}

var fixContainerSize = function() {
  var palette = $(".entity-palette");
  var container = $(".entity-palette .window-container");

  container.height( palette.height() - 70 );  
};

export var EntitiesWidget = {
  initEntitiesWidget: initEntitiesWidget
};