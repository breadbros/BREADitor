import { modal_error } from './Util.js';
const $ = require('jquery');

var currentZones = null;
var selectedZoneIdx = null;

function initZonesWidget(map) {

  currentZones = map.mapData.zones;

  redraw_palette();
}

function _select_zone_ui_inner($node) {
  $('.zone-row').removeClass('highlighted');
  $node.addClass('highlighted');
}

function select_zone_by_index(idx) {
  var $it_me;
  if (!idx) {
    idx = 0;
  }

  $it_me = $('.zone-row[data-index=' + idx + ']');
  _select_zone_ui_inner($it_me);
  return $it_me;
}

function select_zone_from_pallete(evt) {
  var $it_me = $(evt.target).closest('.zone-row');
  _select_zone_ui_inner($it_me);
  return $it_me;
}

function select_and_edit_zone_from_pallete(evt) {
  var $it_me = select_zone_from_pallete(evt);
  edit_zone_click(evt, $it_me.data('index'));
}

function redraw_palette() {
  var $list = $('.zones-list');
  $list.html('');
  var $tmp;
  $('#zones-number').text(currentZones.length);

  var singleclick_handler = (evt) => {
    select_zone_from_pallete(evt);
  };

  var doubleclick_handler = (evt) => {
    var $it_me = select_zone_from_pallete(evt);
    edit_zone_click(evt, $it_me.data('index'));
  };

  for (let i = 0; i < currentZones.length; i++) {

    $tmp = $("<li class='zone-row' data-index='" + i + "'><span class='zone-index'></span><span class='zone-name'></span></li>");
    $tmp.find('.zone-index').text(i);
    $tmp.find('.zone-name').text(currentZones[i].name);

    $tmp.click(singleclick_handler);

    $tmp.dblclick(doubleclick_handler);
    $tmp.contextmenu(doubleclick_handler);

    $list.append($tmp);
  }

  fixContainerSize();
}

var fixContainerSize = function () {
  var palette = $('.zones-palette');
  var container = $('.zones-palette .window-container');

  container.height(palette.height() - 70);
};


$('.zones-palette').resize(function () {
  fixContainerSize();
});

$('.zones-palette #zones-new').click((evt) => {
  new_zone_click(evt);
});

$('.zones-palette #zones-spreadsheet').click(() => {
  alert('SPREAD THAT SHEET ZONE SHEIT');
});

var template = "<div>Name: <input id='zone_name'></div>";
template += "<div>Activation Script: <input id='zone_activation_script'></div>";
template += "<div>Activation Chance: <select id='zone_activation_chance'></select></div>";
template += "<div>Adjacent Activation?: <input type='checkbox' id='zone_can_by_adjacent_activated'></div>";

// {name: "NULL_ZONE", activation_script: "", activation_chance: 0, can_by_adjacent_activated: false}"

function setup_template() {
  var $template = $(template);

  var vals = new Array(256);// create an empty array with length 256
  var select = $template.find('#zone_activation_chance');

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

function _zone_click(evt, id) {
  evt.stopPropagation();

  var dialog;

  var zone = currentZones[id];

  $(() => {

    var $template = setup_template();

    if (zone) {
      $('#modal-dialog').attr('title', 'Edit Zone ' + id + ')');
    } else {
      $('#modal-dialog').attr('title', 'Add New Zone (id: ' + (currentZones.length - 1) + ')');
    }
    $('#modal-dialog').html('');
    $('#modal-dialog').append($template);

    if (zone) {
      console.log('Editing: ' + zone.name);

      $template.find('#zone_name').val(zone.name);
      $template.find('#zone_activation_script').val(zone.activation_script);
      $template.find('#zone_activation_chance').val(zone.activation_chance);
      $template.find('#zone_can_by_adjacent_activated').prop('checked', zone.can_by_adjacent_activated);
    }

    $('#modal-dialog').show();
    dialog = $('#modal-dialog').dialog({
      width: 500,
      modal: true,
      buttons: {
        Save: () => {
          var _id = ($.isNumeric(id) && zone) ? id : currentZones.length;

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

function update_zone(dialog, zone_id) {

  var name = dialog.find('#zone_name').val();
  var script = dialog.find('#zone_activation_script').val();
  var chance = dialog.find('#zone_activation_chance').val();
  var adjAct = dialog.find('#zone_can_by_adjacent_activated').is(':checked');
  var zone = null;

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

  zone = {
    name: name,
    activation_script: script,
    activation_chance: chance,
    can_by_adjacent_activated: adjAct
  };

  currentZones[zone_id] = zone;
  redraw_palette();

  dialog.dialog('close');
}

function write_zone(id, zone) {
  window.$$$currentMap.mapData.zones[id] = zone;
}

var _zoneVisibility = true;
var _zoneAlpha = 1;

export var setZoneVisibility = (val) => {
  _zoneVisibility = !!val;
};

export var getZoneVisibility = () => {
  return _zoneVisibility;
};

export var setZoneAlpha = (val) => {
  _zoneAlpha = val;
};

export var getZoneAlpha = () => {
  return _zoneAlpha;
};

var _activeZone = 0;

export var getActiveZone = () => {
  return _activeZone;
};

export var setActiveZone = (newZone) => {
  select_zone_by_index(newZone);
  _activeZone = newZone;
};

export var scrollZonePalletteToZone = (zoneToFocus) => {
  var $container = $('.zones-palette .window-container');
  var $rowToScrollTo = $('.zone-row.highlighted');
  var zoneIdx = $rowToScrollTo.data('index');
  var msg = '';
  var loc;
  var $zone_0 = null;

  if (!zoneToFocus) {
    zoneToFocus = 0;
  }

  if (zoneIdx != zoneToFocus) {
    msg = 'unexpected zone index, expected ' + zoneToFocus + ', got ' + zoneIdx;
    console.log(msg);
    throw msg;
  }

  $zone_0 = $('.zone-row[data-index=0]');

  loc = parseInt($rowToScrollTo.offset().top - $container.offset().top); // + Math.abs($zone_0.offset().top) ); //+ $container.height()) ;

  $('.zones-palette .window-container').scrollTop(loc);
};

export var ZonesWidget = {
  initZonesWidget: initZonesWidget
};
