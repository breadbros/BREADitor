import { updateInfoDims } from '../../Tools.js';

const {shell} = require('electron');
const { clipboard } = require('electron');

const path = require('path');

const mapAndFileMenus = [];

export const updateMapAndVSPFileInfo = (map) => {

  if(mapAndFileMenus.length) {

    mapAndFileMenus.forEach( (sel) => {
      $.contextMenu('destroy', sel);
      $(sel).off();
    } );
  }

  $('#info-mapname').attr('src', map.mapPath);

  const mapMenu = $(function() {
      $.contextMenu({
          selector: `#info-mapname`, 
          callback(key, options) {
              switch(key) {
              	case "JSON":
              		shell.openItem(map.mapPath);
              		
              }
          },
          items: {
              "JSON": {name: "Open Map JSON", icon: "fa-edit"},
          }
      });
  });

  const pathParts = map.mapPath.split(path.sep);
  $('#info-mapname').text(pathParts[pathParts.length - 1]);

  $('#info-vsp-list').html('');

  let vspMenu = null;

  Object.keys(map.mapData.vsp).forEach( (keyName) => { 
    const vspPath = map.mapData.vsp[keyName];
    const className = `vsp-info-${keyName}`;
    const $node = $(`<li class="${className}">${keyName}: ${vspPath}</li>`);

    const fullpath = path.dirname($$$currentMap.mapPath) + path.sep + vspPath;

    $('#info-vsp-list').append( $node );  

    vspMenu = $(function() {
      $.contextMenu({
          selector: `.${className}`, 
          callback(key, options) {
              switch(key) {
                case "JSON":
                  shell.openItem(fullpath);
                  return;
                case "Image":
                  shell.openItem(map.vspImages[keyName].src);
              		return;
                case "Copy-JSON":
                  clipboard.writeText(fullpath, 'clipboard');
                  return;
                case "Copy-Image":
                  clipboard.writeText(map.vspImages[keyName].src, 'clipboard');
                  
              }
          },
          items: {
              "JSON": {name: "Open VSP JSON", icon: "fa-edit"},
              "Copy-JSON": {name: "Copy VSP JSON Path to Clipboard", icon: "fa-edit"},
              "Image": {name: "Open VSP Image", icon: "fa-palette"},
              "Copy-Image": {name: "Copy VSP Image Path to Clipboard", icon: "fa-palette"},
          }
      });
    });

    mapAndFileMenus.push(vspMenu);
  } );
  mapAndFileMenus.push(mapMenu);

  updateInfoDims(map);
};
