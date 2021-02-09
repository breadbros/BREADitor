import { modal_error } from './Util.js';
const $ = require('jquery');

import { paletteToTop } from '../../Palettes';
import { popPaletteToTop } from '../../Palettes';

const { clipboard } = require('electron');
import { notify } from '../../Notification-Pane';

const paletteToTop = ( selector ) => {
  const fakeEvent = {
    target: $(selector)
  };

  popPaletteToTop(selector, fakeEvent)
}


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

  const select = $template.find('#zone_activation_chance');

  const max = 1;
  const interval = 0.005; // 0.5%
  const steps = max / interval;

  // Front load list with common values
  const vals = [ 0.00, 0.125, 0.25, 0.333, 0.50, 0.667, 0.75, 0.95, 1.00 ]; // 0, 1/8, 1/4, 1/3, 1/2, 2/3, 3/4, 1
  var frontloadCount = vals.length;

  // Full Range of "Detailed" Values (Every 0.5%)
  for (var i = 0; i <= steps; i++) { // <= so that max gets included
    var v = (i / steps) * max;
    vals.push(v);
  }

  // Add Values To UI Element
  for (var i = 0; i < vals.length; i++) {
    var v = vals[i];
    var p = (v*100).toFixed(1) + "%";
    var $option = $('<option />').val(v).text(p);
    if (i < frontloadCount) { $option.css('font-weight', 'bold'); }
    select.append($option);
  }

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
    let is_new = false;

    $('#modal-dialog').html('');

    if (zone) {
      $('#modal-dialog').attr('title', 'Edit Zone (' + id + ')');
    } else {
      $('#modal-dialog').attr('title', 'Add New Zone (id: ' + (currentZones.length) + ')');
      is_new = true;
    }

    $('#modal-dialog').append($template);

    if (zone) {
      console.log('Editing: ' + zone.name);

      $template.find('#zone_name').val(zone.name);
      $template.find('#zone_activation_script').val(zone.activation_script);
      $template.find('#zone_activation_chance').val(zone.activation_chance);
      $template.find('#zone_can_by_adjacent_activated').prop('checked', zone.can_by_adjacent_activated);
      $template.find('#zone_can_by_same_tile_activated').prop('checked', zone.can_by_same_tile_activated);
    }

    $('#modal-dialog').show();
    dialog = $('#modal-dialog').dialog({
      width: 500,
      modal: true,
      title: $('#modal-dialog').attr('title'),
      buttons: {
        Save: () => {
          const _id = ($.isNumeric(id) && zone) ? id : currentZones.length;

          update_zone(dialog, _id, is_new);
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

const update_zone = (dialog, zone_id, is_new) => {
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
    can_by_same_tile_activated: sameAct
  };

  currentZones[zone_id] = zone;
  redraw_palette();

  dialog.dialog('close');

  if(is_new) {
    paletteToTop('.zones-palette');
  }

  select_zone_by_index(zone_id);
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

// just mock it you jerk
export const _test_setActiveZone = (newZone) => {
  _activeZone = newZone;
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

const get_sully_code_line_for_zone = (z, idx) => {
  let tmp = '';

  if(z.activation_script) {
    tmp += `public void ${z.activation_script}( ZoneActivationData zad ) { `;
  } else {
    tmp += `// no activation script `;
  }
  tmp += `//Zone #${idx}, name: "${z.name}, act chance: ${z.activation_chance}, adj?${z.can_by_adjacent_activated}, same?${z.can_by_same_tile_activated}\n`;

  if(z.activation_script) {
    tmp += `\n}\n\n`;    
  }

  return tmp;
}

const copy_useful_zone_data_to_clipboard = () => {
  let tmp = '';

  let i = 0;

  window.$$$currentMap.mapData.zones.forEach((z) => {
    if(i) { // skip zone #0
      tmp += get_sully_code_line_for_zone(z, i);
    }

    i++;    
  });

  clipboard.writeText(tmp, 'clipboard');
  notify("Copied all entity data to clipboard in Sully format.");
};

const copy_useful_single_zone_data_to_clipboard = (z) => {
  clipboard.writeText(get_sully_code_line_for_zone(z), 'clipboard');
  notify(`Copied entity data for "${z.name}" to clipboard in Sully format.`);
};

$(function() {
  $.contextMenu({
    selector: '.zones-palette h3.ui-widget-header', 
    callback: function(key, options) {
      switch(key) {
        default:
          console.log('unknown key: ' + key);
          return;
        case 'copy_scriptnames':
          copy_useful_zone_data_to_clipboard();
          return;
      }
    },
    items: {
      "copy_scriptnames": {name: "Copy useful zone data to clipboard", icon: "copy"},
    },
  });
});

export const ZonesWidget = {
  initZonesWidget: initZonesWidget
};
