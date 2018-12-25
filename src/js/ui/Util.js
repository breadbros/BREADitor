const $ = require('jquery');

import { getFlatIdx } from '../../Map';

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

export const resize_layer = ( old_layer_data, old_dim_x, old_dim_y, new_dim_x, new_dim_y ) => {

  if( !old_dim_x || !old_dim_y || !new_dim_x || !new_dim_y ) {
    throw "invalid dims: cannot be zero";
  }

  if( old_dim_x < 0 || old_dim_y  < 0 || new_dim_x  < 0 || new_dim_y  < 0 ) {
    throw "invalid dims: cannot be negative";
  }

  if( old_dim_x != parseInt(old_dim_x) || old_dim_y != parseInt(old_dim_y) || new_dim_x != parseInt(new_dim_x) || new_dim_y != parseInt(new_dim_y) ) {
    throw "invalid dims: cannot be float";
  }

  let x = 0;
  let y = 0;

  let new_data = [];

  for( y=0; y<new_dim_y; y++ ) {
    for( x=0; x<new_dim_x; x++ ) {
      if( x <= old_dim_x-1 && y <= old_dim_y-1 ) {
        new_data.push(old_layer_data[getFlatIdx(x, y, old_dim_x)]);
      } else {
        new_data.push(0);
      }
    } 
  }

  return new_data;
}