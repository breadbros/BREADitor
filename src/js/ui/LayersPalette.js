import { updateRstringInfo } from '../../Tools.js';
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
  window.$$$currentMap.mapData.MAPED_OBSLAYER_VISIBLE = val;
};

export const getObsVisibility = () => {
  return window.$$$currentMap.mapData.MAPED_OBSLAYER_VISIBLE;
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

export const selectNamedLayer = (name) => {
  const $list = $('.layer_name');
  for (let i = $list.length - 1; i >= 0; i--) {
    const $node = $($list[i]);
    if ($node.text().trim().startsWith(name)) {
      $node.closest('li').click();
      return true;
    }
  }

  console.warn('No such named layer', name, 'found on this map');

  return false;
};

export const selectNumberedLayer = (rstringNum) => {
  const name = window.$$$currentMap.getLayerByRStringCode(rstringNum).name;

  if (!name) {
    console.warn('No such numbered layer', rstringNum, 'found on this map');
  } else {
    selectNamedLayer(name);
  }
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

  closeEditLayerDialog();
};

let $ent_container = null;
export const selectEntityLayer = () => {
  const selClass = 'selected';

  removeAllSelectedLayers(selClass);

  // TODO: this is disgusting, right?  right.
  changeSelectedLayer({
    map_tileData_idx: 997,
    layer: {
      name: 'Entity Layer (E)'
    },
    $container: $zone_container
  });

  $ent_container.addClass(selClass);

  closeEditLayerDialog();
};

export const selectLayer = (name) => {
  switch (name) {
    case 'O':
      selectObstructionLayer();
      return;
    case 'E':
      selectEntityLayer();
      return;
    case 'Z':
      selectZoneLayer();
      return;
    default:
      selectNamedLayer(name);
  }
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

  closeEditLayerDialog();
};

let layers = null;
let map = null;
function initLayersWidget(_map) {
  map = _map;
  layers = map.mapData.layers;

  redraw_palette(map);
};

let _selected_layer = null;
export const changeSelectedLayer = (newLayer) => {
  _selected_layer = newLayer;

  // TODO in a codebase filled with shame, this is the most shameful. SHAAAAME.
  if (!_selected_layer.layer.parallax) {
    _selected_layer.layer.parallax = {
      X: 1,
      Y: 1
    };
  }
  if (!_selected_layer.layer.dimensions) {
    _selected_layer.layer.dimensions = {
      X: map.layers[0].dimensions.X,
      Y: map.layers[0].dimensions.Y
    };
  }
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

      const $friendNode = $(evt.target.parentElement.parentElement).find('.entity_layer .eyeball_button');
      if (!layers[i].MAPED_HIDDEN) {
        $friendNode.prop('disabled', false);
      } else {
        $friendNode.prop('disabled', true);
      }

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

  const addEntitySelectHandler = (_$ent_container) => {
    $ent_container = _$ent_container;
    $ent_container.on('click', (evt) => {
      selectEntityLayer();
      evt.stopPropagation();
    });

    $ent_container.on('dblclick', (evt) => {
      window.$$$toggle_pallete('entity', true);

      if (!getNormalEntityVisibility()) {
        $('li.layer.selected button.eyeball_button').click();
      }

      evt.stopPropagation();
    });
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

      if (!getZoneVisibility()) {
        $('li.layer.selected button.eyeball_button').click();
      }

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

      if (dialog) {
        _layer_click(evt, i);
      }

      evt.stopPropagation();
    });
  };

  const addLayerEditHandler = ($layer_container, i) => {
    $layer_container.on('dblclick', (evt) => {
      console.log('addLayerEditHandler', i);
      _layer_click(evt, i);

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

    $obs_container.on('dblclick', function (evt) {
      window.$$$toggle_pallete('tileset-selector', true);
      if (!getObsVisibility()) {
        $('li.layer.selected button.eyeball_button').click();
      }
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

      if (!getNormalEntityVisibility()) {
        const $allEntSublayerButtons = $('.entity_layer .eyeball_button');
        $allEntSublayerButtons.prop('disabled', true);
      } else {
        $('.layer').each((a, b) => {
          const $layer = $(b);
          const idx = $layer.data('layer_idx');
          if ($.isNumeric(idx)) {

            //console.log( "layers[",idx,"].MAPED_HIDDEN", layers[idx].MAPED_HIDDEN )

            $layer.find('.entity_layer .eyeball_button').prop('disabled', !!layers[idx].MAPED_HIDDEN);
          }
        });
      }

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

  const setup_shitty_entity_layer = (node, $list) => {
    _setup_entity_eyeball(node);

    _setup_entity_expand(node);

    addEntitySelectHandler(node);

    $list.append(node);
  };

  const reorder_layers_by_rstring_priority = ($list, map) => {
    const childs = $list.children('li');
    childs.detach();

    let rstring_ref = null;
    let rstring_cur_target = null;
    let cur_kid = null;
    let node = null;

    setup_shitty_zone_layer($list);
    setup_shitty_obstruction_layer($list);
    setup_shitty_layer_seperator($list);

    // ZONES

    for (let i = map.layerRenderOrder.length - 1; i >= 0; i--) {
      rstring_cur_target = map.layerRenderOrder[i];
      rstring_ref = parseInt(rstring_cur_target, 10);
      if (isNaN(rstring_ref)) {
        // TODO this is certainly the wrong place to populate "R" and "E" visually.
        if (rstring_cur_target === 'E') {
          node = $(
            "<li class='layer ui-state-default'>" +
            "<button class='eyeball_button'></button>" +
            "<button class='entity_expand_button'></button>" +
            '<span class="name-label">Entities (default)</span></li>');

          node.data('rstring_ref', 'E');
          node.data('layer_name', 'Entity Layer (E)');

          setup_shitty_entity_layer(node, $list);
        } else if (rstring_cur_target === 'R') {
          node = $("<li class='layer ui-state-default'>" +
                   "<button class='eyeball_button question_mark'>?</button>" +
                   "<span class='name-label'>'Render'</span></li>");
          node.data('rstring_ref', 'R');
          $list.append(node);
        } else {
          console.log("UNKNOWN RSTRING PARTICLE '" + rstring_cur_target + "'");
        }

        continue;
      }

      for (let j = childs.length - 1; j >= 0; j--) {
        cur_kid = $(childs[j]);
        if (cur_kid.data('rstring_ref') === rstring_cur_target) {
          $list.append(cur_kid); // re-add to list
          childs.splice(j, 1); // remove from childs array
          break;
        }
      };

      $('.eyeball_button.question_mark').click(function () {
        console.log('unimplemented, weirdo.');
      });
    };

    const $expand_entities = $(node).find('.entity_expand_button');
    handleEntityExpand($expand_entities);
  };

  function resizeWindow() {
    let h = 0;
    let w = 0;

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
    let val = $('#new_layer_lucent').val().trim();

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
    let idx = null;
    let layer = null;
    let dialog = null;
    const $me = $(evt.target).closest('li');
    let special = '';

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
      let template = '<div>Layer: ' + layer.name + '</div>';
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
    const idx = parseInt($(this).closest('li').data('rstring_ref')) - 1;
    const layer = window.$$$currentMap.mapData.layers[idx];

    evt.stopPropagation();

    // var newLucent = dialog
    let dialog = null;

    $(() => {
      let template = '<div>Layer: ' + layer.name + '</div>';
      template += '<div>Current (X:Y): ' + layer.parallax.X + ':' + layer.parallax.Y + '</div>';
      template += "<div>New: <input id='new_layer_parallax_x' size=3>&nbsp;:&nbsp;";
      template += "<input id='new_layer_parallax_y' size=3></div>";

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
    let x = $('#new_layer_parallax_x').val().trim();
    let y = $('#new_layer_parallax_y').val().trim();
    const newParallax = {};

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
      const nodeLayer = $(layer);
      const rstring = nodeLayer.data('rstring_ref');
      let lucentDomNode = null;
      let parallaxDomNode = null;
      let mapLayer = null;

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
    const normalContainer = $("<div class='normal_layer'></div>");

    const visible_div = $("<button class='eyeball_button'></button>");
    const tall_div = $("<button class='tall-entity-layer' title='Tall entities redraw on this layer'></button>");
    const name_div = $("<div class='layer_name'></div>");

    const right_div = $("<div class='rightmost_div'></div>");

    const lucent_div = $("<div class='layer_lucency'></div>");
    const parallax_div = $("<div class='layer_parallax'>?:?</div>");

    const entityContainer = $("<div class='entity_layer'><button class='eyeball_button'></button>" +
                              "<div class='layer_name'></div></div>");

    const entity_name_div = entityContainer.find('.layer_name');

    handleEyeball(visible_div, l);

    // TODO we are using id's as classes for most buttons.  STOPIT.
    name_div.html(
      '<button class="no-button" id="white-icon-art"></button> <span class="name-label">' + l.name + '</span>'
    );
    entity_name_div.html(
      '<button class="no-button" id="white-icon-entity"></button> <span class="entity-name-label">' + l.name + '</span>'
    );

    lucent_div.text(formatAlphaAsPercentage(l.alpha) + '%');

    lucent_div.click(lucent_click);
    parallax_div.click(parallax_click);

    normalContainer.append(visible_div);

    if (l === window.$$$currentMap.getEntityTallRedrawLayer()) {
      normalContainer.append(tall_div);
    }

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
    newLayerContainer.data('layer_idx', layer_index);

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
    const kids = $('.layers-list').children();
    let i = null;
    let val = null;

    const rstring = [];

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
  const ret = [];
  const childs = list.children('li');
  let cur_kid = null;
  let rstring_cur_target = null;
  let rstring_ref = null;

  const map = window.$$$currentMap;

  for (let i = map.layerRenderOrder.length - 1; i >= 0; i--) {
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

    for (let j = childs.length - 1; j >= 0; j--) {
      cur_kid = $(childs[j]);
      if (cur_kid.data('rstring_ref') === rstring_cur_target) {
        ret.push(cur_kid.data('layer_name'));
        break;
      }
    };
  }

  return ret;
};

let template = "<div>Name: <input id='layer_name'></div>";
template += "<div>Parallax: x: <input id='layer_parallax_x' value='1' size=3> ";
template += "   y: <input id='layer_parallax_y' value='1' size=3></div>";
template += "<div>Dimensions (tiles): w: <input id='layer_dims_x' size=3> h: <input id='layer_dims_y' size=3></div>";
template += "<div>Alpha: <input id='layer_opacity' value='1' size=3></div>";
template += "<div>vsp: <input id='layer_vsp' value='default'></div>";
template += "<div>isTallEntity Redraw Layer? <input type='checkbox' id='layer_is_tall_redraw_layer'></div>";
template += "<div>Index: <span id='layer_idx'></span></div>";

function setup_template() {
  const $template = $(template);

  const $dims_x = $template.find('#layer_dims_x');
  const $dims_y = $template.find('#layer_dims_y');

  $dims_x.val(window.$$$currentMap.mapSizeInTiles[0]);
  $dims_y.val(window.$$$currentMap.mapSizeInTiles[1]);

  return $template;
}

let dialog = null;
const closeEditLayerDialog = () => {
  if (dialog) {
    dialog.dialog('close');
    dialog = null;
  }
};

function _layer_click(evt, layerIdx) {
  evt.stopPropagation();

  if (dialog) {
    closeEditLayerDialog();
  }

  if (typeof layerIdx === 'undefined') {
    layerIdx = false;
  }

  $(() => {
    const $template = setup_template();
    let newLayerId = null;

    $('#modal-dialog').html('');
    $('#modal-dialog').append($template);

    let title = null;

    if (typeof layerIdx === 'number') {
      const layer = window.$$$currentMap.mapData.layers[layerIdx]; // TODO needs better accessor

      title = 'Edit Layer: ' + layer.name;

      $template.find('#layer_name').val(layer.name);
      $template.find('#layer_parallax_x').val(layer.parallax.X);
      $template.find('#layer_parallax_y').val(layer.parallax.Y);
      $template.find('#layer_dims_x').val(layer.dimensions.X);
      $template.find('#layer_dims_y').val(layer.dimensions.Y);
      $template.find('#layer_opacity').val(layer.alpha);
      $template.find('#layer_vsp').val(layer.vsp);
      $template.find('#layer_idx').text(layerIdx);
      $template.find('#layer_is_tall_redraw_layer').prop(
        'checked', layer === window.$$$currentMap.getEntityTallRedrawLayer()
      );

      newLayerId = layerIdx;
    } else {
      title = 'Add New Layer';
      newLayerId = window.$$$currentMap.mapData.layers.length;
    }

    $('#modal-dialog').show();
    dialog = $('#modal-dialog').dialog({
      width: 500,
      modal: true,
      title: title,
      buttons: {
        Save: () => {
          update_layer(dialog, newLayerId);
        },
        'Cancel': function () {
          closeEditLayerDialog();
        }
      },
      close: function () {
        $('#modal-dialog').html('');
      }
    });
  });
}

const update_layer = (dialog, layer_id) => {
  const name = dialog.find('#layer_name').val();
  const par_x = dialog.find('#layer_parallax_x').val();
  const par_y = dialog.find('#layer_parallax_y').val();
  let dims_x = dialog.find('#layer_dims_x').val();
  let dims_y = dialog.find('#layer_dims_y').val();
  let alpha = dialog.find('#layer_opacity').val();
  const vsp = dialog.find('#layer_vsp').val();
  let layer = null;

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

  const map = window.$$$currentMap;
  const layers = map.mapData.layers;

  const nameSet = map.mapData.layers.map((l) => { return l.name; });

  if (nameSet.indexOf(name) !== -1) {
    if (layers[layer_id] && layers[layer_id].name !== name) {
      modal_error('Invalid input: name (' + name + ') is not unique on this map.  Try a new, unique name.');
      return;
    }
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

  if (layer_id === layers.length) {
    layers.push(layer);
    const layersLength = layers.length;
    map.layerLookup[name] = layers[layersLength - 1];
    map.layerRenderOrder.push('' + (layersLength));
    map.mapRawTileData.tile_data.push(new Array((dims_x * dims_y)).fill(0));
  } else {
    // TODO do all layer-name-updating here
    if (name !== layers[layer_id].name) {
      const oldName = layers[layer_id].name;

      map.layerLookup[name] = map.layerLookup[oldName];
      delete map.layerLookup[oldName];
    }

    for (const k in layer) {
      layers[layer_id][k] = layer[k];
    }
  }

  if (window.document.getElementById('layer_is_tall_redraw_layer').checked) {
    map.setEntityTallRedrawLayerByName(name);
  }

  redraw_palette(map);
  updateRstringInfo();

  closeEditLayerDialog();
};

export const LayersWidget = {
  initLayersWidget: initLayersWidget,
  get_layernames_by_rstring_order: get_layernames_by_rstring_order
};
