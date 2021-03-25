import { Map } from '../../Map.js';
import {
  two_zoom_seriously_all_zoom_functions_suck_kill_them_all, zoomLevels, updateLocationFunction, initTools,
  deriveMapZoomForPixels
} from '../../Tools.js';
const $ = window.$;

let old_map = null;
let old_layer = null;

let vsp_mapdata = null;
let vsp_tiledata = null;
let vsp_map = null;

const create_dynamic_map = (vspName) => {
  const dynMap = {
    isTileSelectorMap: true, // TODO: this is for special-case branch code.  Rework everythgin so branching
                             // isnt necessary later?
    entities: [],
    layers: [{
      MAPED_HIDDEN: false,
      alpha: 1,
      dimensions: {
        X: -1, // TODO: get this from the vsp definition file
        Y: -1  // TODO: calculate this from the vsp definition file and the size of the source image
      },
      name: 'Dynamic Tileselector VspMap Layer xTreem 7',
      parallax: {
        X: 1,
        Y: 1
      },
      vsp: vspName
    }],
    name: 'The magical dynamically generated vsp map for the tileselector(tm)!',
    notes: [],
    renderstring: '1', // TODO: needs at least one E?
    starting_coordinates: [0, 0], // TODO: probably unnecessary
    vsp: {},
    zones: undefined
  };

  dynMap.vsp[vspName] = window.$$$currentMap.mapData.vsp[vspName];

  return dynMap;
};

const create_dynamic_tiledata = (mapdata, layerdata) => {
  return { tile_data: [0, 1, 2, 3, 4, 5], zone_data: [] };
};

const create_map = (mapData, tileData, updateLocationFunction, newMap, newLayer) => {
  return new Map(
      mapData, tileData, updateLocationFunction
  ).ready().then((m) => {
    m.vspImages = newMap.vspImages; // TODO: somewhere something is going wrong here.  FIX.
    m.vspData = newMap.vspData;
    m.vspAnimations = newMap.vspAnimations;

    m.mapData.layers[0].dimensions.X =
        parseInt(m.vspImages[newLayer.vsp].width / m.vspData[newLayer.vsp].tilesize.width);
    m.mapData.layers[0].dimensions.Y =
        parseInt(m.vspImages[newLayer.vsp].height / m.vspData[newLayer.vsp].tilesize.height);
    m.mapSizeInTiles = {
      width: m.mapData.layers[0].dimensions.X,
      height: m.mapData.layers[0].dimensions.Y
    };

    const tileSetSize = m.mapData.layers[0].dimensions.X * m.mapData.layers[0].dimensions.Y;

    // / this overwrites most of create_dynamic_tiledata, which was temporary.
    m.tileData = [[]];
    for (let i = 0; i < tileSetSize; i++) {
      m.tileData[0].push(i);
    }

    m.setCanvas($('.tileset_selector_canvas'));

    // TODO need to set a channel up to the tile selectors.
    vsp_map = m;

    initTools($('.tileset_selector_canvas'), vsp_map);

    $('#btn-vsp-zero').click(function (e) {
      two_zoom_seriously_all_zoom_functions_suck_kill_them_all(vsp_map);
      $('#vsp-zoom-label').text((zoomLevels[vsp_map.zoom_level] * 100) + '%');
    });

    finalize_process(newMap, newLayer);

    window.$$$currentTilsesetSelectorMap = m;
  });
};

const finalize_process = (newMap, newLayer) => {
  if (old_map && old_map !== newMap) {
    console.warn('oh dear god are we handling map reloading?');
    // throw new Error("I dont think we're handling map reloading well yet.  Audit when people complain of this message.");
  }

  // full init
  if (!old_layer && newLayer) {
    console.warn('first time');

  // maybe reinit for new layer vsp?
  } else if (old_layer && old_layer !== newLayer) {
    console.warn('VSP layer shifting!  Reset things!');
  }

  old_map = newMap;
  old_layer = newLayer;

  vsp_map.render();

  two_zoom_seriously_all_zoom_functions_suck_kill_them_all(vsp_map);

  set_height_for_scrollbars(vsp_map);
};

const set_height_for_scrollbars = (vsp_map) => {
  const tileWidth = vsp_map.vspData[vsp_map.layers[0].vsp].tilesize.width;
  const tileHeight = vsp_map.vspData[vsp_map.layers[0].vsp].tilesize.height;

  const tilesWide = vsp_map.layers[0].dimensions.X;
  const tilesHigh = vsp_map.layers[0].dimensions.Y;

  const zoomMultiplier = deriveMapZoomForPixels(vsp_map);

  $('.tileset_selector_canvas').width(tileWidth * tilesWide * zoomMultiplier);
  $('.tileset_selector_canvas').height(tileHeight * tilesHigh * zoomMultiplier);
};

let obsLayerData = null;

const initTilesetSelectorWidget = (newMap, newLayer, optionalTiledata, callback) => {
  if (optionalTiledata) {
    obsLayerData = optionalTiledata;

    for (const k in optionalTiledata) {
      if (!newLayer[k]) {
        newLayer[k] = optionalTiledata[k];
      }
    }
  } else {
    obsLayerData = null;
  }

  if (newLayer) {
    $('.tileset_selector_canvas_container h3.note').hide();
    $('.tileset_selector_canvas_container canvas').show();
  } else {
    $('.tileset_selector_canvas_container h3.note').show();
    $('.tileset_selector_canvas_container canvas').hide();
  }

  if (newLayer) {
    if (!window.$$$currentMap.vspData[newLayer.vsp]) {
      throw new Error(
        "current map didnt contain vsp '" + newLayer.vsp + "'.  Only contained: " +
        Object.keys(window.$$$currentMap.vspData).join(',')
      );
    }

    vsp_mapdata = create_dynamic_map(newLayer.vsp);
    vsp_tiledata = create_dynamic_tiledata(vsp_mapdata, newLayer);

    create_map(vsp_mapdata, vsp_tiledata, updateLocationFunction, newMap, newLayer);
  }

  if(callback) {
    callback();
  }
};

const renderTilesetSelectorWidget = () => {
  if (vsp_map) {
    vsp_map.render();
  }
};

const getObsLayerData = () => {
  return obsLayerData;
};

export const TilesetSelectorWidget = {
  initTilesetSelectorWidget: initTilesetSelectorWidget,
  renderTilesetSelectorWidget: renderTilesetSelectorWidget,
  getObsLayerData: getObsLayerData
};
