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
var selectedEntityIdx = null;

function initEntitiesWidget(map) {
  currentEntities = map.mapData.entities;

  redraw_palette();
}

function _select_entity_ui_inner($node) {
  $(".entity-row").removeClass("highlighted");
  $node.addClass("highlighted");
}

function select_entity_from_pallete(evt) {
  var $it_me = $(evt.target).closest(".entity-row");
  _select_entity_ui_inner($it_me);
  return $it_me; 
}

function redraw_palette() {
  var $list = $(".entity-list");
  $list.html("");
  var $tmp;
  $("#entity-number").text( currentEntities.length );

  var singleclick_handler = (evt) => {
    select_entity_from_pallete(evt);
  };

  var doubleclick_handler = (evt) => { 
    var $it_me = select_entity_from_pallete(evt);
    edit_entity_click(evt,  $it_me.data("index"));
  };
   
  for (let i = 0; i < currentEntities.length; i++) {
    $tmp = $("<li class='entity-row' data-index='"+i+"'><span class='entity-index'></span><span class='entity-name'></span></li>");
    $tmp.find(".entity-index").text( i );
    $tmp.find(".entity-name").text( currentEntities[i].name );
    
    $tmp.click( singleclick_handler );
    $tmp.dblclick( doubleclick_handler );
    $tmp.contextmenu( doubleclick_handler );

    $list.append($tmp);
  }

  fixContainerSize();
}

var fixContainerSize = function() {
  var palette = $(".entity-palette");
  var container = $(".entity-palette .window-container");

  container.height( palette.height() - 70 );  
};


var template = "<div>Name: <input id='entity_name'></div>";
template += "<div>Filename: <input id='entity_filename'></div>";
template += "<div>Animation: <select id='entity_animation'></select>";
template += "<div>Facing: <select id='entity_facing'></select></div>";
template += "<div>Activation Script: <input id='entity_activation_script'></div>";
template += "<div>Pays attention to obstructions?: <input type='checkbox' id='entity_pays_attention_to_obstructions'></div>";
template += "<div>Is an obstructions?: <input type='checkbox' id='entity_is_an_obstruction'></div>";
template += "<div>Autofaces when activated?: <input type='checkbox' id='entity_autofaces'></div>";
template += "<div>Speed: <input id='entity_speed'></div>";
template += "<div>Location.tx: <input id='entity_location_x'></div>";
template += "<div>Location.ty: <input id='entity_location_y'></div>";
template += "<div>Location.layer: <select id='entity_location_layer'></select></div>";
template += "<div>wander: <textarea rows=5 cols=40 id='entity_wander' readonly></textarea></div>";


function setup_template(ent, id) {
  var $template = $(template);

    debugger;


    if(ent) {
      $( "#modal-dialog" ).attr("title", "Edit Entity (id: "+id+")");
    } else {
      $( "#modal-dialog" ).attr("title", "Add New Entity (id: "+(currentEntities.length-1)+")");
    }

    if(ent) {
      console.log("Editing: " + ent.name);

      $template.find("#entity_name").val(ent.name);
      $template.find("#entity_filename").val(ent.filename);

      $template.find("#entity_activation_script").val(ent.activation_script);
      $template.find("#entity_speed").val(ent.speed);
      $template.find("#entity_location_x").val(ent.location.tx);
      $template.find("#entity_location_y").val(ent.location.ty);

      // http://regex.info/blog/2006-09-15/247
      $template.find("#entity_wander").val(JSON.stringify(ent.wander).replace(/{/g, "{\n").replace(/}/g, "\n}").replace(/,/g, ",\n").replace(/":/g, '": ').replace(/^"/mg, '\t"'));

      $template.find("#entity_pays_attention_to_obstructions").prop( "checked", ent.pays_attention_to_obstructions );
      $template.find("#entity_is_an_obstruction").prop( "checked", ent.is_an_obstruction );
      $template.find("#entity_autofaces").prop( "checked", ent.autofaces );

      $template.find("#entity_filename").click( () => {
        alert("Pop up file dialog here.");
      } );
      
    }

  console.log("Populate fields here.");

  return $template;
}


function new_entity_click(evt) {
  _entity_click(evt);
}

function edit_entity_click(evt, id) {
  _entity_click(evt, id);
}

function _entity_click(evt, id) {
  evt.stopPropagation();

  var dialog;

  debugger;

  var ent = currentEntities[id];

  $(() => {

    var $template = setup_template(ent, id);

//debugger;

    $( "#modal-dialog" ).html("");
    $( "#modal-dialog" ).append($template);

    $( "#modal-dialog" ).show();
    dialog = $( "#modal-dialog" ).dialog({
      width: 500,
      modal: true,
      buttons: {
        Save: () => { 
          var _id = ($.isNumeric(id) && ent) ? id : currentEntities.length;

          update_entity(dialog, _id);
        },
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


export var EntitiesWidget = {
  initEntitiesWidget: initEntitiesWidget
};