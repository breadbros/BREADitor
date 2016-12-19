import { Tools } from '../../Tools.js';
import { modal_error } from './Util.js';
import { setZoneVisibility, getZoneVisibility, setZoneAlpha, getZoneAlpha } from './ZonesPalette.js';
import { setShowEntitiesForLayer, shouldShowEntitiesForLayer,
         setNormalEntityVisibility, getNormalEntityVisibility,
         setEntityLayersExpanded, getEntityLayersExpanded } from './EntityPalette.js';
import { TilesetSelectorWidget } from './TilesetSelectorPalette.js';
const $ = require('jquery');

let list;

let _obsAlpha = 1;

export const visibilityFix = () => {
  const $n = $('.layers-palette');

  if ($n.width() < 100) {
    $n.css('width', '230px'); // todo  minwidth/height this in the css
    $n.css('height', '330px');
  }
};

export const setObsVisibility = (val) => {
  Tools.setObstructionsVisible(val);
};

export const getObsVisibility = () => {
  return Tools.shouldShowObstructions();
};

export const setObsAlpha = (val) => {
  _obsAlpha = val;
};

export const getObsAlpha = () => {
  return _obsAlpha;
};

const new_layer_click = (evt) => {
  _layer_click(evt);
};

export const selectNumberedLayer = (num) => {
  const $list = $('.layer_name');
  for (let i = $list.length - 1; i >= 0; i--) {
    const $node = $($list[i]);
    if ($node.text().startsWith(num + ':')) {
      $node.closest('li').click();
      return;
    }
  }

  console.warn('No such layer',num,'found on this map');
};

let $zone_container = null;
export const selectZoneLayer = () => {
  const selClass = 'selected';

  removeAllSelectedLayers(selClass);

  // TODO: this is disgusting, right?  right.
  changeSelectedLayer({
    map_tileData_idx: 999,
    layer: window.$$$currentMap.zoneData,
    $container: $zone_container
  });

  $zone_container.addClass(selClass);
};

let $obs_container = null;
export const selectObstructionLayer = () => {
  const selClass = 'selected';

  removeAllSelectedLayers(selClass);

  // TODO this is the wrong place to do this
  window.$$$currentMap.obsLayerData.parallax = {
    X: 1,
    Y: 1
  };

  // TODO definitely wrong, especially when we start supporting multiple sized layers
  window.$$$currentMap.obsLayerData.dimensions = window.$$$currentMap.mapData.layers[0].dimensions;

    // TODO: this is disgusting, right?  right.
  changeSelectedLayer({
    map_tileData_idx: 998,
    layer: window.$$$currentMap.obsLayerData, // TODO why isnt this an array? :o
    $container: $obs_container
  });

  TilesetSelectorWidget.initTilesetSelectorWidget(map, map.obsLayerData, window.$$$currentMap.legacyObsData);

  $obs_container.addClass(selClass);
};

let layers = null;
let map = null;
function initLayersWidget(_map) {
  map = _map;
  layers = map.mapData.layers;

  redraw_palette(map);
};

let _selected_layer = null;
const changeSelectedLayer = (newLayer) => {
  _selected_layer = newLayer;
};

export const getSelectedLayer = () => {
  return _selected_layer;
};

const removeAllSelectedLayers = (selClass) => {
  if (window && getSelectedLayer()) {
    getSelectedLayer().$container.removeClass(selClass);
  }
};

const redraw_palette = (map) => {
  list = $('.layers-palette .layers-list');
  let newLayerContainer = null;
  let l = null;

  const handleEyeball = (layerDiv, layer) => {
    layerDiv.removeClass('eye-open');
    layerDiv.removeClass('eye-closed');

    if (!layer.MAPED_HIDDEN) {
      layerDiv.addClass('eye-open');
    } else {
      layerDiv.addClass('eye-closed');
    }
  };

  $('.layers-palette #layers-new').click((evt) => {
    new_layer_click(evt);
  });

  const addLayerEyeballHandler = ($eyeball, i) => {
    $eyeball.on('click', function (evt) {
      layers[i].MAPED_HIDDEN = !layers[i].MAPED_HIDDEN;

      handleEyeball($eyeball, layers[i]);

      evt.stopPropagation();
    });
  };

  const handleEntityEyeball = ($btn, layerName) => {
    $btn.removeClass('showEnts');
    $btn.removeClass('hideEnts');

    if (shouldShowEntitiesForLayer(layerName)) {
      $btn.addClass('showEnts');
    } else {
      $btn.addClass('hideEnts');
    }
  };

  const addLayerEntityEyeballHandler = ($layerContainer, idx) => {
    const layerName = layers[idx].name;
    const $btn = $layerContainer.find('.entity_layer .eyeball_button');

    handleEntityEyeball($btn, layerName);

    $btn.on('click', (evt) => {
      setShowEntitiesForLayer(layerName, !shouldShowEntitiesForLayer(layerName));

      handleEntityEyeball($btn, layerName);

      evt.stopPropagation();
    });
  };

  const addZoneSelectHandler = (_$zone_container) => {
    $zone_container = _$zone_container;
    $zone_container.on('click', (evt) => {
      selectZoneLayer();
      evt.stopPropagation();
    });

    $zone_container.on('dblclick', (evt) => {
      window.$$$toggle_pallete('zones', true);
      evt.stopPropagation();
    });
  };

  const addLayerSelectHandler = ($layer_container, i) => {
    $layer_container.on('click', (evt) => {
      const selClass = 'selected';

      removeAllSelectedLayers(selClass);

      changeSelectedLayer({
        map_tileData_idx: i,
        layer: layers[i],
        $container: $layer_container
      });
      $layer_container.addClass(selClass);

      TilesetSelectorWidget.initTilesetSelectorWidget(map, layers[i]);

      evt.stopPropagation();
    });
  };

  const addLayerEditHandler = ($layer_container, i) => {
    $layer_container.on('dblclick', (evt) => {
      console.log("Allow editing of the layer's name here?");

      evt.stopPropagation();
    });
  };

  const setup_shitty_zone_layer = ($list) => {
    const tmpLayer = {
      MAPED_HIDDEN: !getZoneVisibility(),
      alpha: getZoneAlpha()
    };

    const newLayerContainer = generateLayerContainer(l, 0);
    const $eyeball = generateContent(999, tmpLayer, newLayerContainer);

    newLayerContainer.find('.layer_name').text('Zones');
    newLayerContainer.find('.entity_layer').remove();
    newLayerContainer.addClass('nosort');
    newLayerContainer.data('alpha', getZoneAlpha());
    newLayerContainer.data('rstring_ref', 'ZZZ');

    newLayerContainer.find('.layer_parallax').remove();

    addZoneSelectHandler(newLayerContainer);
    $eyeball.on('click', (evt) => {
      setZoneVisibility(!getZoneVisibility());

      tmpLayer.MAPED_HIDDEN = !getZoneVisibility();

      handleEyeball($eyeball, tmpLayer);

      evt.stopPropagation();
    });

    $list.append(newLayerContainer);
  };

  const addObstructionSelectHandler = (_$obs_container) => {
    $obs_container = _$obs_container;
    $obs_container.on('click', function (evt) {
      selectObstructionLayer();
      evt.stopPropagation();
    });
  };

  const setup_shitty_layer_seperator = ($list) => {
    $list.append('<li><hr></li>');
  };

  const setup_shitty_obstruction_layer = ($list) => {
    const tmpLayer = {
      MAPED_HIDDEN: !getObsVisibility(),
      alpha: getObsAlpha()
    };

    const newLayerContainer = generateLayerContainer(l, 0);
    const $eyeball = generateContent(998, tmpLayer, newLayerContainer);

    newLayerContainer.find('.layer_name').text('Obstructions');
    newLayerContainer.find('.entity_layer').remove();
    newLayerContainer.addClass('nosort');
    newLayerContainer.data('alpha', getObsAlpha());
    newLayerContainer.data('rstring_ref', 'ZZZ');

    newLayerContainer.find('.layer_parallax').remove();

    addObstructionSelectHandler(newLayerContainer);
    $eyeball.on('click', (evt) => {
      setObsVisibility(!getObsVisibility());

      tmpLayer.MAPED_HIDDEN = !getObsVisibility();
      handleEyeball($eyeball, tmpLayer);
      evt.stopPropagation();
    });

    $list.append(newLayerContainer);
  };

  const _setup_entity_eyeball = (node) => {
    const $eyeball = $(node).find('.eyeball_button');
    const tmpLayer = {
      MAPED_HIDDEN: !getNormalEntityVisibility(),
      alpha: 1
    };

    handleEyeball($eyeball, tmpLayer);

    $eyeball.click((evt) => {
      setNormalEntityVisibility(!getNormalEntityVisibility());

      tmpLayer.MAPED_HIDDEN = !getNormalEntityVisibility(); // TODO nouns need to align. entityVisibile vs HIDDEN wtf

      handleEyeball($eyeball, tmpLayer);

      evt.stopPropagation();
    });
  };

  function handleEntityExpand(button) {
    button.removeClass('expand');
    button.removeClass('contract');

    if (getEntityLayersExpanded()) {
      button.addClass('expand');

      $('.entity_layer').show();
    } else {
      button.addClass('contract');

      $('.entity_layer').hide();
    }

    resizeWindow();
  }

  function _setup_entity_expand(node) {
    const $expand_entities = $(node).find('.entity_expand_button');

    $expand_entities.click((evt) => {
      setEntityLayersExpanded(!getEntityLayersExpanded());

      handleEntityExpand($expand_entities);

      evt.stopPropagation();
    });
  }

  function setup_shitty_entity_layer(node, $list) {

    _setup_entity_eyeball(node);

    _setup_entity_expand(node);


    $list.append(node);
  }

  function reorder_layers_by_rstring_priority($list, map) {

    var childs = $list.children('li');
    childs.detach();

    var rstring_ref = null;
    var rstring_cur_target = null;
    var cur_kid = null;
    var node = null;

    setup_shitty_zone_layer($list);
    setup_shitty_obstruction_layer($list);
    setup_shitty_layer_seperator($list);

    // / ZONES

    // node = $("<li class='layer ui-state-default'><button class='eyeball_button'>?</button>Entities (default)</li>");
    // node.data("rstring_ref", "E");
    // $list.append(node);

    for (var i = map.layerRenderOrder.length - 1; i >= 0; i--) {
      rstring_cur_target = map.layerRenderOrder[i];
      rstring_ref = parseInt(rstring_cur_target, 10);
      if (isNaN(rstring_ref)) {

        // TODO this is certainly the wrong place to populate "R" and "E" visually.
        if (rstring_cur_target == 'E') {
          node = $("<li class='layer ui-state-default'><button class='eyeball_button'></button><button class='entity_expand_button'></button>Entities (default)</li>");
          node.data('rstring_ref', 'E');
          node.data('layer_name', 'Entity Layer (E)');

          setup_shitty_entity_layer(node, $list);

        } else if (rstring_cur_target == 'R') {
          node = $("<li class='layer ui-state-default'><button class='eyeball_button question_mark'>?</button>'Render'</li>");
          node.data('rstring_ref', 'R');
          $list.append(node);
        } else {
          console.log("UNKNOWN RSTRING PARTICLE '" + rstring_cur_target + "'");
        }

        continue;
      }

      for (var j = childs.length - 1; j >= 0; j--) {
        cur_kid = $(childs[j]);
        if (cur_kid.data('rstring_ref') == rstring_cur_target) {
          $list.append(cur_kid); // re-add to list
          childs.splice(j, 1); // remove from childs array
          break;
        }
      };

      $('.eyeball_button.question_mark').click(function () {
        console.log('unimplemented, weirdo.');
      });
    };

    var $expand_entities = $(node).find('.entity_expand_button');
    handleEntityExpand($expand_entities);
  }

  function resizeWindow() {
    var h = 0;
    var w = 0;

    // / hackery of the worst calibur; probably a flaming trashbin.  do not trust.
    $('.layers-palette').children().each(function (idx, kid) {
      if (idx >= $('.layers-palette').children().length - 3) {
        return; // / the last three are chrome for resizable windows.
      }

      h += $(kid).outerHeight(true);
    });

    w += $('.layers-palette .window-container').outerWidth(true);

    h += 14; // todo fix this - needs to calc from top padding

    $('.layers-palette').width(w);
    $('.layers-palette').height(h);
  }

  function update_lucency(layer, dialog, special_case) {
    var val = $('#new_layer_lucent').val().trim();

    if (!$.isNumeric(val)) {
      modal_error('Invalid input: not numeric.');
      return;
    }

    if (val.indexOf('.') === -1) {
      val = parseInt(val);

      if (val < 0 || val > 100) {
        modal_error('INVALID PERCENTAGE VALUE, range: [0...100]');
        return;
      } else {
        val = val / 100;
      }
    } else { // parse fraction
      val = parseFloat(val);
      if (val < 0 || val > 1) {
        modal_error('INVALID FLOAT VALUE, range:  [0...1]');
        return;
      }
    }

    switch (special_case) {
      case 'zone':
        setZoneAlpha(val);
        break;
      default:
        layer.alpha = val;
        break;
    }

    redrawAllLucentAndParallax();

    dialog.dialog('close');
  }

  function lucent_click(evt) {
    var idx, layer, dialog;
    var $me = $(evt.target).closest('li');
    var special = '';

    // TODO: this is special-case and evil.  make more better.
    if ($me.data('rstring_ref') === 'ZZZ') {
      layer = {
        name: 'Zones',
        alpha: getZoneAlpha()
      };

      special = 'zone';

    } else {
      idx = parseInt($me.data('rstring_ref')) - 1;
      layer = window.$$$currentMap.mapData.layers[idx];
    }


    evt.stopPropagation();

    $(() => {

      var template = '<div>Layer: ' + layer.name + '</div>';
      template += '<div>Current: ' + formatAlphaAsPercentage(layer.alpha) + '</div>';
      template += "<div>New: <input id='new_layer_lucent'>%</div>";

      $('#modal-dialog').attr('title', 'Set layer Opacity');
      $('#modal-dialog').html(template);

      $('#modal-dialog').show();
      dialog = $('#modal-dialog').dialog({
        modal: true,
        buttons: {
          Save: () => { update_lucency(layer, dialog, special); },
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

  function parallax_click(evt) {
    var idx = parseInt($(this).closest('li').data('rstring_ref')) - 1;
    var layer = window.$$$currentMap.mapData.layers[idx];

    evt.stopPropagation();

    // var newLucent = dialog
    var dialog;

    $(() => {

      var template = '<div>Layer: ' + layer.name + '</div>';
      template += '<div>Current (X:Y): ' + layer.parallax.X + ':' + layer.parallax.Y + '</div>';
      template += "<div>New: <input id='new_layer_parallax_x' size=3>&nbsp;:&nbsp;<input id='new_layer_parallax_y' size=3></div>";

      $('#modal-dialog').attr('title', 'Set layer Parallax');
      $('#modal-dialog').html(template);

      $('#modal-dialog').show();
      dialog = $('#modal-dialog').dialog({
        modal: true,
        buttons: {
          Save: () => { update_parallax(layer, dialog); },
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

  function update_parallax(layer, dialog) {
    var x = $('#new_layer_parallax_x').val().trim();
    var y = $('#new_layer_parallax_y').val().trim();
    var newParallax = {};

    if (!$.isNumeric(x)) {
      modal_error('Invalid input: x not numeric.');
      return;
    }
    if (!$.isNumeric(y)) {
      modal_error('Invalid input: y not numeric.');
      return;
    }

    x = parseFloat(x);
    y = parseFloat(y);

    newParallax.X = x;
    newParallax.Y = y;

    layer.parallax = newParallax;

    redrawAllLucentAndParallax();

    dialog.dialog('close');
  }

  function formatAlphaAsPercentage(alpha) {
    return (alpha.toFixed(2) * 100);
  }

  function redrawAllLucentAndParallax(map) {

    if (!map) {
      map = window.$$$currentMap;
    }

    $('.layer').each(function (idx, layer) {
      var nodeLayer = $(layer);
      var rstring = nodeLayer.data('rstring_ref');
      var lucentDomNode = null;
      var parallaxDomNode = null;

      var mapLayer = null;

      if (nodeLayer.hasClass('nosort')) {

        if (nodeLayer.data('rstring_ref') === 'ZZZ') {
          lucentDomNode = nodeLayer.find('.layer_lucency');
          lucentDomNode.text(formatAlphaAsPercentage(getZoneAlpha()) + '%');
        }

        return;
      }

      if (!$.isNumeric(rstring)) {
        return;
      } else {
        mapLayer = map.mapData.layers[parseInt(rstring) - 1]; // todo: seperate human-indx from 0-based.
        lucentDomNode = nodeLayer.find('.layer_lucency');
        lucentDomNode.text(formatAlphaAsPercentage(mapLayer.alpha) + '%');

        parallaxDomNode = nodeLayer.find('.layer_parallax');
        parallaxDomNode.text(mapLayer.parallax.X + ':' + mapLayer.parallax.Y);

        if (!mapLayer.alpha) {
          debugger;
        }

        nodeLayer.data('alpha', mapLayer.alpha); // TODO: remove this, only one source of truth: the data.
      }

    });
  }

  function generateContent(i, l, $parent) {

    var normalContainer = $("<div class='normal_layer'></div>");

    var visible_div = $("<button class='eyeball_button'></button>");
    var name_div = $("<div class='layer_name'></div>");

    var right_div = $("<div class='rightmost_div'></div>");

    var lucent_div = $("<div class='layer_lucency'></div>");
    var parallax_div = $("<div class='layer_parallax'>?:?</div>");

    var entityContainer = $("<div class='entity_layer'><button class='eyeball_button'></button><div class='layer_name'></div></div>");

    var entity_name_div = entityContainer.find('.layer_name');

    handleEyeball(visible_div, l);

    name_div.text((i + 1) + ': ' + l.name);
    entity_name_div.text((i + 1) + ' (entities)');

    lucent_div.text(formatAlphaAsPercentage(l.alpha) + '%');

    lucent_div.click(lucent_click);
    parallax_div.click(parallax_click);

    normalContainer.append(visible_div);
    normalContainer.append(name_div);

    // right div
    right_div.append(lucent_div);
    right_div.append(parallax_div);

    normalContainer.append(right_div);

    $parent.append(entityContainer);
    $parent.append(normalContainer);

    return visible_div;
  }

  function generateLayerContainer(layer, layer_index) {
    const newLayerContainer = $("<li class='layer ui-state-default'></li>");
    newLayerContainer.data('alpha', layer.alpha);
    newLayerContainer.data('rstring_ref', '' + (layer_index + 1));
    newLayerContainer.data('layer_name', layer.name);

    return newLayerContainer;
  }

  let eyeballButton = null;

  for (let i = layers.length - 1; i >= 0; i--) {
    l = layers[i];

    newLayerContainer = generateLayerContainer(l, i);
    eyeballButton = generateContent(i, l, newLayerContainer);

    addLayerEntityEyeballHandler(newLayerContainer, i);
    addLayerEyeballHandler(eyeballButton, i);
    addLayerSelectHandler(newLayerContainer, i);
    addLayerEditHandler(newLayerContainer, i);

    list.append(newLayerContainer);
  };

  // / RSTRING is weird and needs to die.
  reorder_layers_by_rstring_priority(list, map);
  resizeWindow();

  // / make the layers sortable
  $('.layers-list').sortable({
    revert: true,
    cancel: '.nosort'
  });
  $('ul, li').disableSelection();

  const skipWeirdThings = (rstring_val) => {
    if (rstring_val === 'ZZZ') {
      return true;
    }

    return false;
  };

  $('.layers-list').on('sortupdate', function (event, ui) {
    var kids = $('.layers-list').children();
    var i, val;

    var rstring = [];

    try {
      for (i in kids) {
        if (kids.hasOwnProperty(i)) {
          val = $(kids[i]).data('rstring_ref');
          if (val && !skipWeirdThings(val)) {
            rstring.unshift($(kids[i]).data('rstring_ref'));
          }
        }
      }
    } catch (e) {
      console.log('error');
      console.log(e);
      throw e;
    }

    window.$$$currentMap.updateRstring(rstring);
  });

  redrawAllLucentAndParallax(map);
};

function get_layernames_by_rstring_order() {
  var ret = [];
  var childs = list.children('li');
  var cur_kid;
  var rstring_cur_target;
  var rstring_ref;

  var map = window.$$$currentMap;

  for (var i = map.layerRenderOrder.length - 1; i >= 0; i--) {
    rstring_cur_target = map.layerRenderOrder[i];
    rstring_ref = parseInt(rstring_cur_target, 10);

    if (isNaN(rstring_ref)) {
      switch (rstring_cur_target) {
        case 'E':
          ret.push('Entity Layer (E)');
          continue;

        case 'R': // ignore everything else for now
        default:
          continue;
      }
    }

    for (var j = childs.length - 1; j >= 0; j--) {
      cur_kid = $(childs[j]);
      if (cur_kid.data('rstring_ref') == rstring_cur_target) {
        ret.push(cur_kid.data('layer_name'));
        break;
      }
    };
  }

  return ret;
};

/*
{
  "name":"Background Art",
  "parallax":{"X":1,"Y":1},
  "dimensions":{"X":78,"Y":75},
  "alpha":1,
  "vsp":"default",
  "MAPED_HIDDEN":false,
  "maped_HIDE_ENTS":false
}
*/


var template = "<div>Name: <input id='layer_name'></div>";
template += "<div>Parallax: x: <input id='layer_parallax_x' value='1' size=3> y: <input id='layer_parallax_y' value='1' size=3></div>";
template += "<div>Dimensions (tiles): w: <input id='layer_dims_x' size=3> h: <input id='layer_dims_y' size=3></div>";
template += "<div>Alpha: <input id='layer_opacity' value='1' size=3></div>";
template += "<div>vsp: <input id='layer_vsp' value='default'></div>";

function setup_template() {
  var $template = $(template);

  var $dims_x = $template.find('#layer_dims_x');
  var $dims_y = $template.find('#layer_dims_y');

  $dims_x.val(window.$$$currentMap.mapSizeInTiles[0]);
  $dims_y.val(window.$$$currentMap.mapSizeInTiles[1]);

  return $template;
}

function _layer_click(evt) {
  evt.stopPropagation();

  var dialog;

  // var zone = currentZones[id];

  var layer = false;

  $(() => {

    var $template = setup_template();
    var newLayerId = window.$$$currentMap.mapData.layers.length + 1;

    if (layer) {
      $('#modal-dialog').attr('title', 'Edit Layer ' + id + ')');
    } else {
      $('#modal-dialog').attr('title', 'Add New Layer (id: ' + (newLayerId) + ')');
    }
    $('#modal-dialog').html('');
    $('#modal-dialog').append($template);

    if (layer) {
      // console.log("Editing: " + zone.name);

      // $template.find("#zone_name").val(zone.name);
      // $template.find("#zone_activation_script").val(zone.activation_script);
      // $template.find("#zone_activation_chance").val(zone.activation_chance);
      // $template.find("#zone_can_by_adjacent_activated").prop( "checked", zone.can_by_adjacent_activated );
    }

    $('#modal-dialog').show();
    dialog = $('#modal-dialog').dialog({
      width: 500,
      modal: true,
      buttons: {
        Save: () => {
          update_layer(dialog, newLayerId);
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

function update_layer(dialog, layer_id) {

/*
var template = "<div>Name: <input id='layer_name'></div>";
template += "<div>Parallax: x: <input id='layer_parallax_x' value='1' size=3> y: <input id='layer_parallax_y' value='1' size=3></div>";
template += "<div>Dimensions (tiles): w: <input id='layer_dims_x' size=3> h: <input id='layer_dims_y' size=3></div>";
template += "<div>Alpha: <input id='layer_opacity' value='1' size=3></div>";
template += "<div>vsp: <input id='layer_vsp' value='default'></div>";
*/

  var name = dialog.find('#layer_name').val();
  var par_x = dialog.find('#layer_parallax_x').val();
  var par_y = dialog.find('#layer_parallax_y').val();
  var dims_x = dialog.find('#layer_dims_x').val();
  var dims_y = dialog.find('#layer_dims_y').val();
  var alpha = dialog.find('#layer_opacity').val();
  var vsp = dialog.find('#layer_vsp').val();
  var layer = null;

  if (!$.isNumeric(par_x)) {
    modal_error('Invalid input: parralax x (' + par_x + ') is invalid.');
    return;
  }
  if (!$.isNumeric(par_y)) {
    modal_error('Invalid input: parralax y (' + par_y + ') is invalid.');
    return;
  }
  if (!$.isNumeric(dims_x) && dims_x >= 0) {
    modal_error('Invalid input: dimension x (' + dims_x + ') is invalid.');
    return;
  }
  dims_x = parseInt(dims_x);
  if (!$.isNumeric(dims_y) && dims_y >= 0) {
    modal_error('Invalid input: dimension y (' + dims_y + ') is invalid.');
    return;
  }
  dims_y = parseInt(dims_y);
  if (!$.isNumeric(alpha) || alpha < 0 || alpha > 1) {
    modal_error('Invalid input: alpha (' + alpha + ') is invalid.  Try values [0...1]');
    return;
  }

  if (!name) {
    modal_error('Invalid name: you must define a name.');
    return;
  }

  var nameSet = window.$$$currentMap.mapData.layers.map((l) => { return l.name; });
  if (nameSet.indexOf(name) != -1) {
    modal_error('Invalid input: name (' + name + ') is not unique on this map.  Try a new, unique name.');
    return;
  }

  alpha = parseFloat(alpha);

  layer = {
    name: name,
    alpha: alpha,
    dimensions: {
      X: parseInt(dims_x),
      Y: parseInt(dims_y)
    },
    parallax: {
      X: parseFloat(par_x),
      Y: parseFloat(par_y)
    },
    vsp: vsp
  };

  window.$$$currentMap.mapData.layers.push(layer);
  const layersLength = window.$$$currentMap.mapData.layers.length;
  window.$$$currentMap.layerLookup[name] = window.$$$currentMap.mapData.layers[layersLength - 1];
  window.$$$currentMap.layerRenderOrder.push('' + (layersLength));
  window.$$$currentMap.mapRawTileData.tile_data.push(new Array((dims_x * dims_y)).fill(0));

  redraw_palette(window.$$$currentMap);
  Tools.updateRstringInfo();

  dialog.dialog('close');
}

export const LayersWidget = {
  initLayersWidget: initLayersWidget,
  get_layernames_by_rstring_order: get_layernames_by_rstring_order
};
