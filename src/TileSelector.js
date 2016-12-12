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
  $('#info-selected-tiles').text(leftTile() + ',' + rightTile() + ' (vsp: ' + _last_vsp + ')');
};

let selectedTilesPerVSP = {};
let _last_vsp = null;
let _last_map = null;

const leftTile = (val) => {
  if (typeof val !== 'undefined') {
    selectedTilesPerVSP[_last_vsp].leftTile = parseInt(val);
  }

  return selectedTilesPerVSP[_last_vsp].leftTile;
};

const rightTile = (val) => {
  if (typeof val !== 'undefined') {
    selectedTilesPerVSP[_last_vsp].rightTile = parseInt(val);
  }

  return selectedTilesPerVSP[_last_vsp].rightTile;
};

export const setTileSelectorUI = (whichOne, vspIDX, map, slotIdx, whichVSP) => {
  if (_last_map !== map) {
    console.info('last_map !== map', _last_map, map);
    selectedTilesPerVSP = {};
    _last_map = map;
  }

  if (!selectedTilesPerVSP[whichVSP]) {
    console.info('generating new placeholder tiles for', whichVSP);
    selectedTilesPerVSP[whichVSP] = {
      leftTile: 0,
      rightTile: 0
    };
  }

  if (_last_vsp !== whichVSP) {
    console.info('_last_vsp !== whichVSP', _last_vsp, whichVSP);
    initializeTileSelectorsForMap(map.vspData[whichVSP].source_image);

    _last_vsp = whichVSP;
  }

  /// TODO: This slotIdx paradigm is dumb.  Kill it.
  if (slotIdx === 0) {
    leftTile(vspIDX);
  } else if (slotIdx === 1) {
    rightTile(vspIDX);
  } else {
    throw new Error('Unknwon slotIdx: ' + slotIdx);
  }

  updateInfoWindow();

  const loc = map.getVSPTileLocation(whichVSP, vspIDX);
  $(whichOne).css('background-position', '-' + (loc.x * 2) + 'px -' + (loc.y * 2) + 'px'); // (offset *2)
};

export const toggleSelectedTiles = (map) => {
  const _left = leftTile();
  const _right = rightTile();

  leftTile(_right);
  rightTile(_left);

  setTileSelectorUI('#left-palette', leftTile(), map, 0, _last_vsp);
  setTileSelectorUI('#right-palette', rightTile(), map, 1, _last_vsp);
};

export const getCurrentlySelectedTile = () => {
  return leftTile;
};
