import { modal_error } from './Util.js';
import { LayersWidget } from './LayersPalette.js';

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

$(".entity-palette").resize( function() {
  fixContainerSize();
} );

$(".entity-palette #entity-new").click( (evt) => {
  new_entity_click(evt);
});

$(".entity-palette #entity-spreadsheet").click( () => {
  alert("SPREAD THAT SHEET entity SHEIT");
});

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
    
    var entData = window.$$$currentMap.entityData[ent.filename] || window.$$$currentMap.entityData['__default__'];
    var animationKeyset = Object.keys(entData.animations);

    var $entAnim = $template.find("#entity_animation");

    /// repopulate animation select
    $entAnim.empty()
    $.each(animationKeyset, (key, value) => {   
        $entAnim.append(
          $("<option></option>")
          .attr("value",value)
          .text(value)
        ); 
    });

    /// set value.
    $entAnim.val(ent.animation);

    var $entFace = $template.find("#entity_facing");
    var faceKeyset = ['Up', 'Down', 'Left', 'Right'];

    /// repopulate animation select
    $entFace.empty()
    $.each(faceKeyset, (key, value) => {   
        $entFace.append(
          $("<option></option>")
          .attr("value",value)
          .text(value)
        ); 
    });

    /// set value.
    $entFace.val(ent.facing);


    var $entLocLay = $template.find("#entity_location_layer");
    var locLayKeyset = LayersWidget.get_layernames_by_rstring_order();
    $entLocLay.empty()
    $.each(locLayKeyset, (key, value) => {   
        $entLocLay.append(
          $("<option></option>")
          .attr("value",value)
          .text(value)
        ); 
    });

    $entLocLay.val(ent.location.layer);
  }

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
      title: $( "#modal-dialog" ).attr("title"),
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

function update_entity(dialog, ent_id) {

  var entity_name = $("#entity_name").val(); // TODO: validate uniqueness
  var entity_filename = $("#entity_filename").val(); // TODO: validate existance  
  var entity_activation_script = $("#entity_activation_script").val();
  var entity_speed = $("#entity_speed").val();

  var entity_pays_attention_to_obstructions = $("#entity_pays_attention_to_obstructions").is(':checked');
  var entity_is_an_obstruction = $("#entity_is_an_obstruction").is(':checked');
  var entity_autofaces = $("#entity_autofaces").is(':checked');


  var entity_wander;

  if(ent_id < currentEntities.length) { // edit
   entity_wander = currentEntities[ent_id].wander; // TODO: allow actual editing of wander.
   console.log("YOU REALLY NEED TO IMPLEMENT WANDER-EDITING");
  } else { // add
    entity_wander = {mode: "Scripted", delay: 0, initial_movestring: ""}
    alert("Creating new entity with bullshit wander because you haven't actually added it. Dick.");
  }


  var entity_animation = $("#entity_animation").val();
  var entity_facing = $("#entity_facing").val();

  var loc_tx = $("#entity_location_x").val();
  var loc_ty = $("#entity_location_y").val();
  var loc_l = $("#entity_location_layer").val();

  // TODO : PX/PY?
  var loc = {
    tx: loc_tx,
    ty: loc_ty,
    layer: loc_l
  };

  var ent = null;

  if(!$.isNumeric(ent_id) || ent_id < 0) {
    modal_error("Invalid input: ent_id ("+ent_id+") is invalid.");
    return;
  }

  if( !$.isNumeric(entity_speed) ) {
    modal_error("Invalid input: speed not numeric ("+entity_speed+").");
    return;
  }

  ent = {
    "name": entity_name, 
    "filename": entity_filename,
    
    "facing": entity_facing,
    "pays_attention_to_obstructions": entity_pays_attention_to_obstructions,
    "is_an_obstruction": entity_is_an_obstruction, 
    "autofaces": entity_autofaces,
    "speed": entity_speed, 
    "wander": entity_wander,
    "activation_script": entity_activation_script, 
    "animation": entity_animation,

    "location": loc
  };

  currentEntities[ent_id] = ent;
  redraw_palette();

  dialog.dialog( "close" );
}


export var EntitiesWidget = {
  initEntitiesWidget: initEntitiesWidget
};