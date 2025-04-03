import { INFO } from './Logging'

const {$} = window;

const init = () => {
  $('#btn-tool-debugger').on('click', () => {
    debugSelectedTiles();
  });
};

let thisisdumb = false;
// TODO currently this isn't allowing the multiple-vsp thing to really be "right".
// TODO need to have virtual palletes per vsp & switch between them when you switch to a layer with a different palette.
const initializeTileSelectorsForMap = (imageFile, whichvsp) => {
  const jetpack = require('fs-jetpack').cwd(__dirname);

  let img = jetpack.path(window.$$$currentMap.dataPath, imageFile);
  img = `file:///${img.replace(new RegExp('\\\\', 'g'), '/')}`; // TODO this is incredibly dirty, right?

  $('#left-palette').removeAttr('style');
  $('#right-palette').removeAttr('style');

  $('#left-palette').css('background-image', `url(${img})`);
  $('#right-palette').css('background-image', `url(${img})`);

  $('#left-palette').css('background-position', '0px 0px');
  $('#right-palette').css('background-position', '0px 0px');

  $('#left-palette').css('background-size', '2000%');
  $('#right-palette').css('background-size', '2000%');

  if( whichvsp === 'obstructions' && thisisdumb !== whichvsp ) {
    setDefaultObsTiles();
  }

  thisisdumb = whichvsp;
};


const updateInfoWindow = () => {
  $('#info-selected-tiles').text(`${leftTile()  },${  rightTile()  } (vsp: ${  last_vsp  })`);
};

const selectedTilesPerVSP = {};
let last_vsp = null;

export const moveSelectedTile = (wasd, map) => {
  if (!(wasd === 'W' || wasd === 'A' || wasd === 'S' || wasd === 'D')) {
    console.error(`wasd was called with non-wasd chr: ${  wasd}`);
    return false;
  }

  if (!map) {
    console.error('no tileset map currently exists');
    return false;
  }

  if (!$('#tool-title').text() === 'Draw') {
    console.error(`mode not Draw, was: ${  $('#tool-title').text()}`);
    return false;
  }

  let newTile = null;
  switch (wasd) {
    case 'W':
      newTile = leftTile() - 20; // TODO calculate this from the per_row value of the actual VSP.
      break;
    case 'A':
      newTile = leftTile() - 1;
      break;
    case 'S':
      newTile = leftTile() + 20; // TODO calculate this from the per_row value of the actual VSP.
      break;
    case 'D':
      newTile = leftTile() + 1;
      break;
    default:
      break;
  }

  console.log('DO BOUNDS CHECKING HERE FOR FUCKS SAKE');

  if (newTile !== null) {
    setCurrentlySelectedTile(newTile);
    setTileSelectorUI('#left-palette', leftTile(), map, 0, last_vsp);
    return true;
  }

  return false;
};

export const debugSelectedTiles = () => {
  const i = selectedTilesPerVSP;
};

const leftTile = (val) => {
  if (last_vsp === null) {
    return 0;
  }

  if (typeof val !== 'undefined') {
    selectedTilesPerVSP[last_vsp].leftTile = parseInt(val, 10);
  }

  return selectedTilesPerVSP[last_vsp].leftTile;
};

const rightTile = (val) => {
  if (last_vsp === null) {
    return 0;
  }

  if (typeof val !== 'undefined') {
    selectedTilesPerVSP[last_vsp].rightTile = parseInt(val);
  }

  return selectedTilesPerVSP[last_vsp].rightTile;
};

export const setTileSelectorUI = (whichOne, vspIDX, map, slotIdx, whichVSP) => {
  // TODO this should only change if the vsp is different not the map
  // if (_last_map !== map) {
  //   selectedTilesPerVSP = {};
  //   _last_map = map;
  // }

  if (!selectedTilesPerVSP[whichVSP]) {
    INFO('generating new placeholder tiles for', whichVSP);

    selectedTilesPerVSP[whichVSP] = {
      leftTile: 0,
      rightTile: 0
    };
  }

  if (last_vsp !== whichVSP) {
    INFO('_last_vsp !== whichVSP', last_vsp, whichVSP);

    last_vsp = whichVSP;

    // setLayerSelectCallback(afterFn); //TODO: sideeffecty :( 
    initializeTileSelectorsForMap(map.vspData[whichVSP].source_image, whichVSP);
  } 

  // TODO: This slotIdx paradigm is dumb.  Kill it.
  if (slotIdx === 0) {
    leftTile(vspIDX);
  } else if (slotIdx === 1) {
    rightTile(vspIDX);
  } else {
    throw new Error(`Unknwon slotIdx: ${  slotIdx}`);
  }

  if (whichOne === '#left-palette') {
    updateTileSelectorPaletteMapAnts(vspIDX);
  }

  updateInfoWindow();

  const loc = map.getVSPTileLocation(whichVSP, vspIDX);
  $(whichOne).css('background-position', `-${  loc.x * 2  }px -${  loc.y * 2  }px`); // (offset *2)

};

export const updateTileSelectorPaletteMapAnts = (vspIdx) => { // TODO should this be in the TileSelectorPalette?
  const tY = parseInt(vspIdx / 20, 10); // TODO calculate this from the per_row value of the actual VSP.
  const tX = parseInt(vspIdx % 20, 10); // TODO calculate this from the per_row value of the actual VSP.

  // TODO do not use window.$$$currentTilsesetSelectorMap
  try {
    window.$$$currentTilsesetSelectorMap.selection.deselect();
    window.$$$currentTilsesetSelectorMap.selection.add(tX, tY, 1, 1);
  } catch(e) {
    console.error('Caught a race condition around tileSelectorMap init and the pallete ants.  Non-fatal but annoying.   Please fix.');
  }
};

export const toggleSelectedTiles = (map) => {
  const l = parseInt(leftTile(), 10);
  const r = parseInt(rightTile(), 10);

  setTileSelectorUI('#left-palette', r, map, 0, last_vsp);
  setTileSelectorUI('#right-palette', l, map, 1, last_vsp);
};

export const setCurrentlySelectedTile = (idx) => {
  leftTile(idx);
};

export const getCurrentlySelectedTile = () => {
  return leftTile();
};

export const setDefaultObsTiles = () => {
  if(!window.$$$currentMap) {
    console.error('window.$$$currentMap unset!  Cannot set default obs tiles...');
    return;
  }
  const map = window.$$$currentMap; // SIGH
  const obs_vsp_name = 'obstructions';

  setTileSelectorUI('#left-palette', 1, map, 0, obs_vsp_name);
  setTileSelectorUI('#right-palette', 0, map, 1, obs_vsp_name);  
}