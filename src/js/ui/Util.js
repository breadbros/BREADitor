const $ = require('jquery');

export var modal_error = (errormsg) => {
  console.error(errormsg);
  alert(errormsg); // for now...
};

/// TODO NO NO NONONONON
export const do_the_no_things = (entity, redraw_palette) => {
  redraw_palette();

  window.$$$currentMap.resetEntityData(); // TODO: NO NO NO NO NONONONNONONNONO
  window.$$$currentMap.createEntityRenderData(); // TODO: NO NO NO NO NONONONNONONNONO
  window.$$$currentMap.setCanvas($('.map_canvas'));
};