import { modal_error } from './Util.js';
const $ = require('jquery');

let currentZones = null;

const initZonesWidget = (map) => {
  currentZones = map.mapData.zones;

  redraw_palette();

  $('.zones-palette').resize(function () {
    fixContainerSize();
  });

  $('.zones-palette #zones-new').click((evt) => {
    new_zone_click(evt);
  });

  $('.zones-palette #zones-spreadsheet').click(() => {
    window.alert('SPREAD THAT SHEET ZONE SHEIT');
  });
};

function _select_zone_ui_inner($node) {
  $('.zone-row').removeClass('highlighted');
  $node.addClass('highlighted');
}

function select_zone_by_index(idx) {
  if (!idx) {
    idx = 0;
  }

  const $it_me = $('.zone-row[data-index=' + idx + ']');
  _select_zone_ui_inner($it_me);
  return $it_me;
}

function select_zone_from_pallete(evt) {
  const $it_me = $(evt.target).closest('.zone-row');
  _select_zone_ui_inner($it_me);
  return $it_me;
}

function redraw_palette() {
  const $list = $('.zones-list');
  $list.html('');
  let $tmp = null;
  $('#zones-number').text(currentZones.length);

  const singleclick_handler = (evt) => {
    const $it_me = select_zone_from_pallete(evt);
    setActiveZone($it_me.data('index'));
  };

  const doubleclick_handler = (evt) => {
    const $it_me = select_zone_from_pallete(evt);
    edit_zone_click(evt, $it_me.data('index'));
  };

  for (let i = 0; i < currentZones.length; i++) {
    $tmp = $("<li class='zone-row' data-index='" + i + "'>" +
             "<span class='zone-index'></span><span class='zone-name'></span></li>");
    $tmp.find('.zone-index').text(i);
    $tmp.find('.zone-name').text(currentZones[i].name);

    $tmp.click(singleclick_handler);

    $tmp.dblclick(doubleclick_handler);
    $tmp.contextmenu(doubleclick_handler);

    $list.append($tmp);
  }

  fixContainerSize();
}

const fixContainerSize = () => {
  const palette = $('.zones-palette');
  const container = $('.zones-palette .window-container');

  container.height(palette.height() - 70);
};

const template = "<div>Name: <input id='zone_name'></div>" +
  "<div>Activation Script: <input id='zone_activation_script'></div>" +
  "<div>Step Activation Chance: <select id='zone_activation_chance'></select></div>" +
  "<div>Activate on Interact (Adjacent)?: <input type='checkbox' id='zone_can_by_adjacent_activated'></div>" +
  "<div>Activate on Interact (Same Tile)?: <input type='checkbox' id='zone_can_by_same_tile_activated'></div>";

// {name: "NULL_ZONE", activation_script: "", activation_chance: 0, can_by_adjacent_activated: false}"

function setup_template() {
  const $template = $(template);

  const vals = new Array(256);// create an empty array with length 256
  const select = $template.find('#zone_activation_chance');

  $.each(vals, function (idx) {
    select.append($('<option />').val(idx).text(idx));
  });

  return $template;
}

function new_zone_click(evt) {
  _zone_click(evt);
}

function edit_zone_click(evt, id) {
  _zone_click(evt, id);
}

export const show_edit_zone_dialog = (id) => {
  const evt = { stopPropagation: () => {} };
  _zone_click(evt, id);
}

function _zone_click(evt, id) {
  evt.stopPropagation();

  let dialog = null;

  const zone = currentZones[id];

  $(() => {
    const $template = setup_template();

    $('#modal-dialog').html('');

    if (zone) {
      $('#modal-dialog').attr('title', 'Edit Zone (' + id + ')');
    } else {
      $('#modal-dialog').attr('title', 'Add New Zone (id: ' + (currentZones.length) + ')');
    }

    $('#modal-dialog').append($template);

    if (zone) {
      console.log('Editing: ' + zone.name);

      $template.find('#zone_name').val(zone.name);
      $template.find('#zone_activation_script').val(zone.activation_script);
      $template.find('#zone_activation_chance').val(zone.activation_chance);
      $template.find('#zone_can_by_adjacent_activated').prop('checked', zone.can_by_adjacent_activated);
      $template.find('#zone_can_by_same_tile_activated').prop('checked', zone.zone_can_by_same_tile_activated);
    }

    $('#modal-dialog').show();
    dialog = $('#modal-dialog').dialog({
      width: 500,
      modal: true,
      title: $('#modal-dialog').attr('title'),
      buttons: {
        Save: () => {
          const _id = ($.isNumeric(id) && zone) ? id : currentZones.length;

          update_zone(dialog, _id);
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
}

const update_zone = (dialog, zone_id) => {
  const name = dialog.find('#zone_name').val();
  const script = dialog.find('#zone_activation_script').val();
  const chance = dialog.find('#zone_activation_chance').val();
  const adjAct = dialog.find('#zone_can_by_adjacent_activated').is(':checked');
  const sameAct = dialog.find('#zone_can_by_same_tile_activated').is(':checked');

  if (!$.isNumeric(zone_id) || zone_id < 0) {
    modal_error('Invalid input: zone_id (' + zone_id + ') is invalid.');
    return;
  }

  if (!$.isNumeric(chance)) {
    modal_error('Invalid input: chance not numeric.');
    return;
  }

  // if( zone_id < currentZones.length ) {
  //   zone = currentZones[zone_id];
  // }

  console.log('TODO: scriptname legality check.');
  console.log('TODO: optional scriptname uniqueness check.');
  console.log('TODO: optional scriptname existance-in-source check.');

  const zone = {
    name: name,
    activation_script: script,
    activation_chance: chance,
    can_by_adjacent_activated: adjAct,
    zone_can_by_same_tile_activated: sameAct
  };

  currentZones[zone_id] = zone;
  redraw_palette();

  dialog.dialog('close');
};

let _zoneAlpha = 1;

export const setZoneVisibility = (val) => {
  window.$$$currentMap.mapData.MAPED_ZONELAYER_VISIBLE = val;
};

export const getZoneVisibility = () => {
  return window.$$$currentMap.mapData.MAPED_ZONELAYER_VISIBLE;
};

export const setZoneAlpha = (val) => {
  _zoneAlpha = val;
};

export const getZoneAlpha = () => {
  return _zoneAlpha;
};

let _activeZone = 0;

export const getActiveZone = () => {
  return _activeZone;
};

export const setActiveZone = (newZone) => {
  select_zone_by_index(newZone);
  _activeZone = newZone;
};

export const scrollZonePalletteToZone = (zoneToFocus) => {
  const $container = $('.zones-palette .window-container');
  const $rowToScrollTo = $('.zone-row.highlighted');
  const zoneIdx = $rowToScrollTo.data('index');
  let msg = '';

  if (!zoneToFocus) {
    zoneToFocus = 0;
  }

  if (zoneIdx !== zoneToFocus) {
    msg = 'unexpected zone index, expected ' + zoneToFocus + ', got ' + zoneIdx;
    console.log(msg);
    throw msg;
  }

  // const $zone_0 = $('.zone-row[data-index=0]');
  const loc = parseInt($rowToScrollTo.offset().top - $container.offset().top);
  // + Math.abs($zone_0.offset().top) ); //+ $container.height()) ;

  $('.zones-palette .window-container').scrollTop(loc);
};

export const ZonesWidget = {
  initZonesWidget: initZonesWidget
};
