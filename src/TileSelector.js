const $ = require('jquery');
const app = require('electron').remote.app;
const jetpack = require('fs-jetpack').cwd(app.getAppPath());

// TODO currently this isn't allowing the multiple-vsp thing to really be "right".
// TODO need to have virtual palletes per vsp & switch between them when you switch to a layer with a different palette.
const initializeTileSelectorsForMap = (imageFile) => {
  imageFile = jetpack.path(window.$$$currentMap.dataPath, imageFile);
  imageFile = 'file:///' + imageFile.replace(new RegExp('\\\\', 'g'), '/'); // TODO this is incredibly dirty, right?

  $('#left-palette').removeAttr('style');
  $('#right-palette').removeAttr('style');

  $('#left-palette').css('background-image', 'url(' + imageFile + ')');
  $('#right-palette').css('background-image', 'url(' + imageFile + ')');

  $('#left-palette').css('background-position', '0px 0px');
  $('#right-palette').css('background-position', '0px 0px');

  $('#left-palette').css('background-size', '2000%');
  $('#right-palette').css('background-size', '2000%');
};

const updateInfoWindow = () => {
  $('#info-selected-tiles').text(leftTile + ',' + rightTile);
};

let _last_map = null;
export const setTileSelectorUI = (whichOne, vspIDX, map, slotIdx) => {
  if (_last_map !== map) {
    initializeTileSelectorsForMap(map.vspData['default'].source_image);
    _last_map = map;
  }

  if (slotIdx === 0) {
    leftTile = vspIDX;
  } else if (slotIdx === 1) {
    rightTile = vspIDX;
  } else {
    throw new Error('Unknwon slotIdx: ' + slotIdx);
  }

  updateInfoWindow();

  const loc = map.getVSPTileLocation(window.selected_layer.layer.vsp, vspIDX);
  $(whichOne).css('background-position', '-' + (loc.x * 2) + 'px -' + (loc.y * 2) + 'px'); // (offset *2)
};

// TODO - associate an encapulated object with VSPs so each active VSP can switch it's active tiles.
let leftTile = 0;
let rightTile = 0;

export const toggleSelectedTiles = (map) => {
  const _left = leftTile;
  const _right = rightTile;

  setTileSelectorUI('#left-palette', _right, map, 0);
  setTileSelectorUI('#right-palette', _left, map, 1);
};

export const getCurrentlySelectedTile = () => {
  return leftTile;
};
