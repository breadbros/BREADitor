import { modal_error } from './Util.js';
import { LayersWidget } from './LayersPalette.js';
const $ = require('jquery');

let _entityVisibility = true;
let _entityLayersExpanded = false;

export const setNormalEntityVisibility = (val) => {
  _entityVisibility = !!val;
};

export const getNormalEntityVisibility = () => {
  return _entityVisibility;
};

export const setEntityLayersExpanded = (val) => {
  _entityLayersExpanded = !!val;
};

export const getEntityLayersExpanded = () => {
  return _entityLayersExpanded;
};

export const shouldShowEntitiesForLayer = (layername) => {
  if (!window.$$$currentMap.layerLookup[layername]) {
    modal_error("cannot shouldShowEntitiesForLayer, '" + layername + "' is not a layer");
  }

  const shouldHide = window.$$$currentMap.layerLookup[layername].maped_HIDE_ENTS;

  return !shouldHide;
};

export const setShowEntitiesForLayer = (layername, isVisible) => {
  if (!window.$$$currentMap.layerLookup[layername]) {
    modal_error("cannot setShowEntitiesForLayer, '" + layername + "' is not a layer");
  }

  window.$$$currentMap.layerLookup[layername].maped_HIDE_ENTS = !isVisible;

  console.log('ents(' + layername + ')' + window.$$$currentMap.layerLookup[layername].maped_HIDE_ENTS);
};

export let currentEntities = null;

// TODO test-only atm.  bad.
export const setCurrentEntities = (ce) => {
  return currentEntities = ce;
};

const initEntitiesWidget = (map) => {
  currentEntities = map.mapData.entities;

  redraw_palette();
};

const _select_entity_ui_inner = ($node) => {
  $('.entity-row').removeClass('highlighted');
  $node.addClass('highlighted');
};

const select_entity_from_pallete = (evt) => {
  const $it_me = $(evt.target).closest('.entity-row');
  _select_entity_ui_inner($it_me);
  return $it_me;
};

const redraw_palette = () => {
  const $list = $('.entity-list');
  $list.html('');

  $('#entity-number').text(currentEntities.length);

  const singleclick_handler = (evt) => {
    select_entity_from_pallete(evt);
  };

  const doubleclick_handler = (evt) => {
    const $it_me = select_entity_from_pallete(evt);
    edit_entity_click(evt, $it_me.data('index'));
  };

  for (let i = 0; i < currentEntities.length; i++) {
    const $tmp = $("<li class='entity-row' data-index='" + i +
             "'><span class='entity-index'></span><span class='entity-name'></span></li>");
    $tmp.find('.entity-index').text(i);
    $tmp.find('.entity-name').text(currentEntities[i].name);

    $tmp.click(singleclick_handler);
    $tmp.dblclick(doubleclick_handler);
    $tmp.contextmenu(doubleclick_handler);

    $list.append($tmp);
  }

  fixContainerSize();
};

const fixContainerSize = () => {
  const palette = $('.entity-palette');
  const container = $('.entity-palette .window-container');

  container.height(palette.height() - 70);
};

$('.entity-palette').resize(function () {
  fixContainerSize();
});

$('.entity-palette #entity-new').click((evt) => {
  new_entity_click(evt);
});

$('.entity-palette #entity-spreadsheet').click(() => {
  window.alert('SPREAD THAT SHEET entity SHEIT');
});

let template = "<div>Name: <input id='entity_name'></div>";
template += "<div>Filename: <input id='entity_filename'></div>";
template += "<div>Animation: <select id='entity_animation'></select>";
template += "<div>Facing: <select id='entity_facing'></select></div>";
template += "<div>Activation Script: <input id='entity_activation_script'></div>";
template += "<div>Pays attention to obstructions?: <input type='checkbox' " +
            "id='entity_pays_attention_to_obstructions'></div>";
template += "<div>Is an obstructions?: <input type='checkbox' id='entity_is_an_obstruction'></div>";
template += "<div>Autofaces when activated?: <input type='checkbox' id='entity_autofaces'></div>";
template += "<div>Speed: <input id='entity_speed'></div>";
template += "<div class='tile_coordinates'>Location.tx: <input id='entity_location_tx'></div>";
template += "<div class='tile_coordinates'>Location.ty: <input id='entity_location_ty'></div>";
template += "<div class='pixel_coordinates'>Location.px: <input id='entity_location_px'></div>";
template += "<div class='pixel_coordinates'>Location.py: <input id='entity_location_py'></div>";

template += "<div>Location.layer: <select id='entity_location_layer'></select></div>";
template += "<div>wander: <textarea rows=5 cols=40 id='entity_wander' readonly></textarea></div>";

const setup_template = (ent, id) => {
  const $template = $(template);

  if (ent) {
    $('#modal-dialog').attr('title', 'Edit Entity (id: ' + id + ')');
  } else {
    $('#modal-dialog').attr('title', 'Add New Entity (id: ' + (currentEntities.length - 1) + ')');
  }

  if (ent) {
    console.log('Editing: ' + ent.name);

    $template.find('#entity_name').val(ent.name);
    $template.find('#entity_filename').val(ent.filename);

    $template.find('#entity_activation_script').val(ent.activation_script);
    $template.find('#entity_speed').val(ent.speed);

    $template.find('#entity_location_tx').val(ent.location.tx);
    $template.find('#entity_location_ty').val(ent.location.ty);

    if (typeof ent.location.px === 'undefined') {
      ent.location.px = ent.location.tx * 16; // TODO: should be based on tilesize
      ent.location.py = ent.location.ty * 16; // TODO: should be based on tilesize
    }

    $template.find('#entity_location_px').val(ent.location.px);
    $template.find('#entity_location_py').val(ent.location.py);

    // http://regex.info/blog/2006-09-15/247
    $template.find('#entity_wander').val(JSON.stringify(ent.wander).replace(/{/g, '{\n').replace(/}/g, '\n}')
      .replace(/,/g, ',\n').replace(/":/g, '": ').replace(/^"/mg, '\t"'));

    $template.find('#entity_pays_attention_to_obstructions').prop('checked', ent.pays_attention_to_obstructions);
    $template.find('#entity_is_an_obstruction').prop('checked', ent.is_an_obstruction);
    $template.find('#entity_autofaces').prop('checked', ent.autofaces);

    $template.find('#entity_filename').click(() => {
      window.alert('Pop up file dialog here.');
    });

    let entData;
    if (window.$$$currentMap.entityData[ent.filename]) {
      entData = window.$$$currentMap.entityData[ent.filename];
    } else {
      console.warn('I DO NOT KNOW HOW TO RENDER [' + ent.filename + ']');
      entData = window.$$$currentMap.entityData['__default__'];
    }

    // = window.$$$currentMap.entityData[ent.filename] || window.$$$currentMap.entityData['__default__'];
    const animationKeyset = Object.keys(entData.animations);
    const $entAnim = $template.find('#entity_animation');

    // / repopulate animation select
    $entAnim.empty();
    $.each(animationKeyset, (key, value) => {
      $entAnim.append(
          $('<option></option>')
          .attr('value', value)
          .text(value)
        );
    });

    // / set value.
    $entAnim.val(ent.animation);

    const $entFace = $template.find('#entity_facing');
    const faceKeyset = ['Up', 'Down', 'Left', 'Right'];

    // / repopulate animation select
    $entFace.empty();
    $.each(faceKeyset, (key, value) => {
      $entFace.append(
          $('<option></option>')
          .attr('value', value)
          .text(value)
        );
    });

    // / set value.
    $entFace.val(ent.facing);

    const $entLocLay = $template.find('#entity_location_layer');
    const locLayKeyset = LayersWidget.get_layernames_by_rstring_order();
    $entLocLay.empty();
    $.each(locLayKeyset, (key, value) => {
      $entLocLay.append(
          $('<option></option>')
          .attr('value', value)
          .text(value)
        );
    });

    $entLocLay.val(ent.location.layer);
  }

  return $template;
};

function assert_tileness() {
  const loc_tx = parseInt($('#entity_location_tx').val());
  const loc_ty = parseInt($('#entity_location_ty').val());

  $('#entity_location_px').val(loc_tx * 16);  // TODO should be tilesize not 16
  $('#entity_location_py').val(loc_ty * 16);  // TODO should be tilesize not 16
}

function assert_pixel_versus_tile_in_editing() {
  const loc_tx = parseInt($('#entity_location_tx').val());
  const loc_ty = parseInt($('#entity_location_ty').val());

  const loc_px = parseInt($('#entity_location_px').val());
  const loc_py = parseInt($('#entity_location_py').val());

  let pixels_on = false;
  let tiles_on = false;

  const tiles = $('div.tile_coordinates input');
  const pixels = $('div.pixel_coordinates input');

  tiles.css('background-color', '#AAA');
  pixels.css('background-color', '#AAA');

  if (!loc_px && !loc_py) {
    tiles_on = true;
  } else {
    if (loc_tx * 16 === loc_px && loc_ty * 16 === loc_py) { // TODO: pi
      tiles_on = true;
    } else {
      pixels_on = true;
    }
  }

  if (tiles_on) {
    tiles.css('background-color', 'white');
  }

  if (pixels_on) {
    pixels.css('background-color', 'white');
  }
}

function new_entity_click(evt) {
  _entity_click(evt);
}

function edit_entity_click(evt, id) {
  _entity_click(evt, id);
}

function _entity_click(evt, id) {
  evt.stopPropagation();

  let dialog;

  const ent = currentEntities[id];

  $(() => {
    const $template = setup_template(ent, id);

    $('#modal-dialog').html('');
    $('#modal-dialog').append($template);

    $('#modal-dialog').show();

    assert_pixel_versus_tile_in_editing();

    dialog = $('#modal-dialog').dialog({
      width: 500,
      modal: true,
      title: $('#modal-dialog').attr('title'),
      buttons: {
        Save: () => {
          const _id = ($.isNumeric(id) && ent) ? id : currentEntities.length;

          update_entity(dialog, _id);
        },
        'Cancel': function () {
          dialog.dialog('close');
        }
      },
      close: function () {
        $('#modal-dialog').html('');
      }
    });
  });

  $('div.tile_coordinates input').on('change', () => {
    assert_tileness();
    assert_pixel_versus_tile_in_editing();
  });

  $('div.pixel_coordinates input').on('change', () => {
    assert_pixel_versus_tile_in_editing();
  });
}

export const update_entity = (dialog, ent_id) => {
  const entity_name = $('#entity_name').val(); // TODO: validate uniqueness
  const entity_filename = $('#entity_filename').val(); // TODO: validate existance
  const entity_activation_script = $('#entity_activation_script').val();
  const entity_speed = parseInt($('#entity_speed').val());

  const entity_pays_attention_to_obstructions = $('#entity_pays_attention_to_obstructions').is(':checked');
  const entity_is_an_obstruction = $('#entity_is_an_obstruction').is(':checked');
  const entity_autofaces = $('#entity_autofaces').is(':checked');

  let entity_wander;

  if (ent_id < currentEntities.length) { // edit
    entity_wander = currentEntities[ent_id].wander; // TODO: allow actual editing of wander.
    console.log('YOU REALLY NEED TO IMPLEMENT WANDER-EDITING');
  } else { // add
    entity_wander = {mode: 'Scripted', delay: 0, initial_movestring: ''};
    window.alert("Creating new entity with bullshit wander because you haven't actually added it. Dick.");
  }

  const entity_animation = $('#entity_animation').val();
  const entity_facing = $('#entity_facing').val();

  const loc_tx = parseInt($('#entity_location_tx').val());
  const loc_ty = parseInt($('#entity_location_ty').val());

  const loc_px = parseInt($('#entity_location_px').val());
  const loc_py = parseInt($('#entity_location_py').val());

  const loc_l = $('#entity_location_layer').val();

  // TODO : PX/PY?
  const loc = {
    tx: loc_tx,
    ty: loc_ty,
    px: loc_px,
    py: loc_py,
    layer: loc_l
  };

  let ent = null;

  if (!$.isNumeric(ent_id) || ent_id < 0) {
    modal_error('Invalid input: ent_id (' + ent_id + ') is invalid.');
    return;
  }

  if (!$.isNumeric(entity_speed)) {
    modal_error('Invalid input: speed not numeric (' + entity_speed + ').');
    return;
  }

  ent = {
    'name': entity_name,
    'filename': entity_filename,

    'facing': entity_facing,
    'pays_attention_to_obstructions': entity_pays_attention_to_obstructions,
    'is_an_obstruction': entity_is_an_obstruction,
    'autofaces': entity_autofaces,
    'speed': entity_speed,
    'wander': entity_wander,
    'activation_script': entity_activation_script,
    'animation': entity_animation,

    'location': loc
  };

  let old_layer;
  let new_layer;

  let k;
  for (k in ent) {
    if (ent.hasOwnProperty(k)) {
      currentEntities[ent_id][k] = ent[k];
    }
  }

  // maaaybe?
  // currentEntities[ent_id] = ent;

  if (currentEntities[ent_id] && currentEntities[ent_id].location) {
    old_layer = currentEntities[ent_id].location.layer;
  } else {
    old_layer = new_layer;
  }

  if (old_layer && new_layer && old_layer !== new_layer) {
    relocate_entity_for_map_rendering(currentEntities[ent_id].name, old_layer, new_layer);
  }

  redraw_palette();

  window.$$$currentMap.createEntityRenderData(); // TODO: NO NO NO NO NONONONNONONNONO

  dialog.dialog('close');
};

// TODO: ent_name should be a uuid
// TODO: until then, make sure ent_name is verified unique
const relocate_entity_for_map_rendering = (ent_name, old_layer, new_layer) => {
  var myboy;
  var ents = window.$$$currentMap.entities;

  for (var i = ents[old_layer].length - 1; i >= 0; i--) {
    if (ents[old_layer][i].name == ent_name) {

      if (!ents[new_layer]) {
        ents[new_layer] = [];
      }

      myboy = ents[old_layer].splice(i, 1);
      ents[new_layer].push(myboy[0]); // remember to unbox. :(

      return;
    }
  }

  alert("FAILED TO MOVE entity '" + ent_name + "' from layer '" + old_layer + "' to layer '" + new_layer + "'.  FOR REASONS.");
};

export var EntitiesWidget = {
  initEntitiesWidget: initEntitiesWidget
};
