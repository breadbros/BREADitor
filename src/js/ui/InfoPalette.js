import { updateInfoDims } from '../../Tools.js';

const path = require('path');

export const updateMapAndVSPFileInfo = (map) => {

  $('#info-mapname').attr('src', map.mapPath);

  const pathParts = map.mapPath.split(path.sep);
  $('#info-mapname').text(pathParts[pathParts.length - 1]);

  $('#info-vsp-list').html('');
	
  Object.keys(map.mapData.vsp).forEach( (keyName) => { 
    const vspPath = map.mapData.vsp[keyName];
    const node = $(`<li>${keyName}: ${vspPath}</li>`);
    $('#info-vsp-list').append( node );  
  } );

  updateInfoDims(map);
};
