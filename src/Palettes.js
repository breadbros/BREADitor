var $ = require('jquery');


var garbage_zsort = 1;

var setupPaletteListeners = () => {
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

    $('.resizable-window').resizable();

    window.$MAP_WINDOW = $('.map-palette.resizable-window');

    $('.map .map_canvas').draggable('disable');
  });
};


var correctResizeWidget = (node, newZ) => {
  var z;

  if (newZ) {
    $(node).css('z-index', newZ);
  }

  z = $(node).css('z-index');
  if (!z) { z = 0; }

  $(node).children('.ui-resizable-e').css('z-index', z + 1);
  $(node).children('.ui-resizable-s').css('z-index', z + 1);
  $(node).children('.ui-icon-gripsmall-diagonal-se').css('z-index', z + 1);
};

export var Palettes = {
  correctResizeWidget: correctResizeWidget,
  setupPaletteListeners: setupPaletteListeners
};
