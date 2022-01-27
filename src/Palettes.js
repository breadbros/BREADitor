import { LOG } from './Logging';

const {$} = window;

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
  let pals = window.localStorage.palettes || '{}';
  if (pals) {
    pals = JSON.parse(pals);
    pals[key] = true; // todo make this a cache-key so we can invalidate the settings?
    window.localStorage.palettes = JSON.stringify(pals);
  }

    // / save our specific settings
  const obj = {};
  obj.w = $pal.width();
  obj.h = $pal.height();
  obj.x = $pal.css('left');
  obj.y = $pal.css('top');
  obj.hide = !$pal.is(':visible');

  window.localStorage[`${key  } settings`] = JSON.stringify(obj);
};

const paletteCloseListener = ($pal_close_button) => {
  $pal_close_button.closest('.ui-widget-content').hide();
  savePalettePositions();
};

export const savePalettePositions = () => {
  window.$$$palette_registry.map((pal) => {
    const node_selector = `.${  pal}`;
    const $node = $(node_selector);

    capturePaletteMovementForRestore($node);
  });
};

let garbage_zsort = 0;

let active_palette_selector = '.tool-palette'; 

export const setupPaletteListeners = () => {
  window.$$$palette_registry.map((pal) => {
    const node_selector = `.${  pal}`;
    const $node = $(node_selector);

    if(node_selector === '.tool-palette') {
      $('.tool-palette .close-palette').remove();
    }

    $node.mousedown( (evt)=> { 
      active_palette_selector = node_selector;
      pop_me_to_the_top(evt);
    } );

    // palette motion save listener
    $node.mouseup(() => { capturePaletteMovementForRestore($node); });

    // palette "X" button listener
    const $node2 = $(`${node_selector  } button.close-palette`);
    $node2.click(() => { paletteCloseListener($node2); });
  });

  $('.draggable-window .ui-widget-header').click( (event) => {
      // File this under Monster: History's Greatest
      const fakeEvent = {
        target: event.currentTarget.parentElement
      };

      if ($(fakeEvent.target).hasClass('map-palette')) {
        return;
      }

      pop_me_to_the_top(fakeEvent);
  } );

  $('.draggable-window').draggable({
    handle: 'h3',
    stop (event, ui) {
              // console.log("draggable STOP");
              // console.log(event);
    },
    start (event, ui) {
              // / map palette is always on bottom.
      if ($(event.target).hasClass('map-palette')) {
        return;
      }

      pop_me_to_the_top(event);
    }
  });

  const draggables = $('.resizable-window');

  $.each(draggables, (idx) => {
    const me = $(draggables[idx]);
    const options = {};

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

    LOG(me.attr("class"), options)

    me.resizable(options);

    me.mousedown();
  } );

  window.$MAP_WINDOW = $('.map-palette.resizable-window');

  $('.map .map_canvas').draggable('disable');
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

function setupPaletteRegistry() {
  window.$$$palette_registry = [
    'map-palette',
    'screenview-indicator-palette',
    'tool-palette',
    'layers-palette',
    'zones-palette',
    'entity-palette',
    'info-palette',
    'tileset-selector-palette',
  ];
}

const pop_me_to_the_top = (event) => {
  let zsort = 0;
  if(active_palette_selector === '.map-palette') {
    zsort = 1;
  } else {
    zsort = garbage_zsort;
  }

  $(event.target).css('z-index', zsort);
  correctResizeWidget(event.target, zsort);

  garbage_zsort += 2;
};

export const popPaletteToTop = ( new_active_selector, evt ) => {
  active_palette_selector = new_active_selector;
  pop_me_to_the_top(evt);
}

export const Palettes = {
  correctResizeWidget,
  setupPaletteRegistry,
  setupPaletteListeners,
  savePalettePositions,
  popPaletteToTop,
  getActivePaletteSelector: () => { return active_palette_selector; }
};
