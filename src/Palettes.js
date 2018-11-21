const $ = require('jquery');

const capturePaletteMovementForRestore = ($node) => {
  const $pal = $($node);
  const classes = $pal.attr('class').split(' ');

  let key = null;

  classes.map(function (currentValue, index, arr) {
    if (currentValue.endsWith('-palette')) {
      if (key === null) {
        key = currentValue;
      } else {
        console.log('Why the hell does this element have two palette classes?');
        console.log("What's going on?  Let's explode!");
        throw new Error('Fuk, two paletes zomg'); // remember, friends dont let friends code error message drunk
      }
    }
  });

  if (!key) {
    console.log('NO ACTUAL PALETTE CLASS.  SEEMS WRONG BUT NOT FATAL.  EXITING FUNCTION.');
    return;
  }

  // TODO: add us into the custom palette registry
  let pals = window.localStorage['palettes'] || '{}';
  if (pals) {
    pals = JSON.parse(pals);
    pals[key] = true; // todo make this a cache-key so we can invalidate the settings?
    window.localStorage['palettes'] = JSON.stringify(pals);
  }

    // / save our specific settings
  const obj = {};
  obj['w'] = $pal.width();
  obj['h'] = $pal.height();
  obj['x'] = $pal.css('left');
  obj['y'] = $pal.css('top');
  obj['hide'] = !$pal.is(':visible');

  window.localStorage[key + ' settings'] = JSON.stringify(obj);
};

const paletteCloseListener = ($pal_close_button) => {
  $pal_close_button.closest('.ui-widget-content').hide();
  savePalettePositions();
};

// setup palette listeners
$(document).ready(() => {
  window.$$$palette_registry.map((pal) => {
    const node_selector = '.' + pal;
    const $node = $(node_selector);
    // palette motion save listener
    $node.mouseup(() => { capturePaletteMovementForRestore($node); });

    // palette "X" button listener
    const $node2 = $(node_selector + ' button.close-palette');
    $node2.click(() => { paletteCloseListener($node2); });
  });
});

export const savePalettePositions = () => {
  window.$$$palette_registry.map((pal) => {
    const node_selector = '.' + pal;
    const $node = $(node_selector);

    capturePaletteMovementForRestore($node);
  });
};

let garbage_zsort = 1;

const setupPaletteListeners = () => {
  $(function () {
    $('.draggable-window').draggable({
      handle: 'h3',
      stop: function (event, ui) {
                // console.log("draggable STOP");
                // console.log(event);
      },
      start: function (event, ui) {
                // / map palette is always on bottom.
        if ($(event.target).hasClass('map-palette')) {
          return;
        }

        $(event.target).css('z-index', garbage_zsort);
        correctResizeWidget(event.target);

        garbage_zsort += 2;
      }
    });

    var draggables = $('.resizable-window');

    $.each(draggables, (idx) => {
      var me = $(draggables[idx]);
      var options = {};

      const checkAndAdd = (name, key) => {
        const val = me.data(name);
        if(val) {
          options[key] = val; 
        }
      }

      checkAndAdd("minwidth", "minWidth");
      checkAndAdd("maxwidth", "maxWidth");
      checkAndAdd("minheight", "minHeight");
      checkAndAdd("minwidth", "minWidth");

      console.log(me.attr("class"), options)

      me.resizable(options);
    } );

    window.$MAP_WINDOW = $('.map-palette.resizable-window');

    $('.map .map_canvas').draggable('disable');
  });
};

const correctResizeWidget = (node, newZ) => {
  let z = null;

  if (newZ) {
    $(node).css('z-index', newZ);
  }

  z = $(node).css('z-index');
  if (!z) { z = 0; }

  $(node).children('.ui-resizable-e').css('z-index', z + 1);
  $(node).children('.ui-resizable-s').css('z-index', z + 1);
  $(node).children('.ui-icon-gripsmall-diagonal-se').css('z-index', z + 1);
};

export const Palettes = {
  correctResizeWidget: correctResizeWidget,
  setupPaletteListeners: setupPaletteListeners,
  savePalettePositions: savePalettePositions
};
