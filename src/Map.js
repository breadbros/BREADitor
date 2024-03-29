import { MakeUndoRedoStack } from './UndoRedo';
import { LOG, INFO, WARN } from './Logging';
import {
  getObsVisibility,
  MAGICAL_OBS_LAYER_ID,
  MAGICAL_ZONE_LAYER_ID,
  getSelectedLayer,
} from './js/ui/LayersPalette';
import { v4 as uuidv4 } from 'uuid';
import { ShaderProgram } from './ShaderProgram.js';
import { updateRstringInfo, updateInfoDims, updateLocationText, updateZoomText } from './Tools.js';
import { getZoneVisibility, getZoneAlpha } from './js/ui/ZonesPalette';
import {
  getNormalEntityVisibility,
  shouldShowEntitiesForLayer,
  generate_unique_entity_uuid_for_this_map,
} from './js/ui/EntityPalette.js';
import { notify } from './Notification-Pane';

const path = require('path');
const { sprintf } = require('sprintf-js');

const { $ } = window;

const ENTITY_PREVIEW_ALPHA = 0.75;
const ANIMATE_TILES = true; // TODO hook this up to a toggle in the UI

const HIGHLIGHT_R = 0;
const HIGHLIGHT_G = 1;
const HIGHLIGHT_B = 1;

const TALLENT_R = 1;
const TALLENT_G = 1;
const TALLENT_B = 1;
const TALLENT_A = 1;

export const checkerColorA = [0.75, 0.75, 0.75, 1.0];
export const checkerColorB = [1.0, 1.0, 1.0, 1.0];

let lastKnownPath = '';

export const heal_uuids_for_this_map = (map) => {
  const currentEntities = map.mapData.entities;
  for (let i = currentEntities.length - 1; i >= 0; i--) {
    if (!currentEntities[i].uuid) {
      currentEntities[i].uuid = generate_unique_entity_uuid_for_this_map(map);
    }
  }
  map.mapData.entities = currentEntities;
};

export const cleanEntities = (mapData) => {
  for (let i = mapData.entities.length - 1; i >= 0; i--) {
    if (mapData.entities[i].MAPED_USEDEFAULT) {
      delete mapData.entities[i].MAPED_USEDEFAULT;
    }

    if (mapData.entities[i].MAPED_HIGHLIGHTED) {
      delete mapData.entities[i].MAPED_HIGHLIGHTED;
    }
  }
};

const animateAlpha = (t, swag) => {
  return Math.sin(t / swag) * 0.3 + 0.5;
};

// Builds an image (well a uint8 array) where each pixel of the image maps to a tile index on the vsp.
// A very dark minimap.
const buildTileDataTexture = (data, anims) => {
  const now = Date.now() / 10; // the delay is in centiseconds
  const out = new Uint8Array(data.length * 4);
  for (let i = 0; i < data.length; i++) {
    let t = data[i];

    if (anims && anims[t]) {
      const anim = anims[t];
      const frameCount = 1 + anim.end - anim.start;
      const frame = Math.floor(now / anim.delay) % frameCount;
      t = anim.start + frame;
    }

    out[i * 4 + 0] = t % 256;
    out[i * 4 + 1] = (t >> 8) % 256;
    out[i * 4 + 2] = (t >> 16) % 256;
    out[i * 4 + 3] = (t >> 24) % 256;
  }
  return out;
};

let __obsColor = [1, 1, 1, 0.5];
export const setObsColor = (r, g, b, a) => {
  __obsColor = [r, g, b, a];
};
export const getObsColor = () => {
  return __obsColor;
};

export const verifyTileData = (mapdatafile) => {
  const readyPromise = new Promise(function (resolve, reject) {
    resolve();
  });

  LOG('No verification done on tile data yet...');

  return readyPromise;
};

const saveData = (mapFile, mapData) => {
  const jetpack = require('fs-jetpack').cwd(__dirname);
  jetpack.write(mapFile, mapData);
};

let verifyPromiseResolver = null;
let verifyPromiseRejecter = null;

export const verifyMap = (mapfile) => {
  const { dialog } = require('electron');

  const readyPromise = new Promise(function (resolve, reject) {
    verifyPromiseResolver = resolve;
    verifyPromiseRejecter = reject;
  });

  const jetpack = require('fs-jetpack').cwd(__dirname);
  const mapData = jetpack.read(mapfile, 'json');

  let needsDefault = false;
  let needsObstructions = false;

  if (typeof mapData.vsp === 'string') {
    window.alert(
      `Detected old format vsps: '${mapData.vsp}'.\n\nPlease select a json vsp for the map's default and` +
        ` a second one for the obstructions.`
    );
    needsDefault = true;
    needsObstructions = true;
  } else {
    if (!mapData.vsp.default) {
      needsDefault = true;
    }

    if (!mapData.vsp.obstructions) {
      needsObstructions = true;
    }
  }

  if (typeof mapData.tallentitylayer === 'string') {
    const truth = new Set();
    mapData.layers.map((a) => {
      truth.add(a.name === mapData.tallentitylayer);
    });

    if (!truth.has(true)) {
      throw new Error(
        `looking for mapData.tallentitylayer "${mapData.tallentitylayer}", but could not find it`
      );
    }
  }

  if ($.isNumeric(mapData.tallentitylayer)) {
    try {
      mapData.tallentitylayer = mapData.layers[mapData.tallentitylayer].name; // convert to name
    } catch (e) {
      console.error(e);
      mapData.tallentitylayer = false;
    }
  }

  if (!mapData.tallentitylayer) {
    const stack = mapData.renderstring.split(',');
    while (stack.length && !mapData.tallentitylayer) {
      const rCode = stack.pop();
      if (!$.isNumeric(rCode)) {
        continue;
      }

      mapData.tallentitylayer = mapData.layers[parseInt(rCode) - 1].name;
    }

    if (!mapData.tallentitylayer) {
      throw new Error('no tallentitylayer, and couldnt default to a valid candidate');
    }
  }

  INFO(`mapData.tallentitylayer verified as ${mapData.tallentitylayer}`);

  if (typeof mapData.vsp !== 'object') {
    mapData.vsp = {};
  }

  let filenames;
  let filename;

  if (needsDefault) {
    window.alert(
      'Due to sins (surely on your part) you do not have a default tile vsp set.' +
        'Please select the correct one.'
    );

    filenames = dialog.showOpenDialog({
      title: 'Choose a default tileset',
      filters: [{ name: 'tileset', extensions: ['vsp.json'] }],
    });

    filename = filenames[0].replace(path.dirname(mapfile) + path.sep, '');

    mapData.vsp.default = filename;
  }

  if (needsObstructions) {
    window.alert('Please select the obstruction tileset for this map.');

    filenames = dialog.showOpenDialog({
      title: 'Choose an obstruction tileset',
      filters: [{ name: 'tileset', extensions: ['obsvsp.json'] }],
    });

    filename = filenames[0].replace(path.dirname(mapfile) + path.sep, '');

    mapData.vsp.obstructions = filename;
  }

  for (let i = mapData.layers.length - 1; i >= 0; i--) {
    if (!mapData.layers[i].vsp) {
      LOG(`setting layer[${i}]s vsp to default...`);
      mapData.layers[i].vsp = 'default';
    }
  }

  saveData(mapfile, mapData);

  verifyPromiseResolver();

  return readyPromise;
};

// todo all of this.mapData should be obfuscated
export function Map(mapfile, mapdatafile, updateLocationFunction) {
  let i;
  INFO('Loading map', mapfile);

  if (typeof mapfile !== typeof mapdatafile) {
    throw new Error(
      sprintf(
        "type mismatch on mapfile and mapdatafile.  both must be object or string. got: '%s', '%s'",
        typeof mapfile,
        typeof mapdatafile
      )
    );
  }

  this.selfDestruct = () => {
    for (let i = this.vspImages.length - 1; i >= 0; i--) {
      LOG('deleting vspImages', i, this.vspImages[i]);
      delete this.vspImages[i];
    }

    for (const key in this.entityTextures) {
      if (this.entityTextures.hasOwnProperty(key)) {
        LOG('deleting entityTextures', key, this.entityTextures[key].img);
        delete this.entityTextures[key].img;
      }
    }
  };

  let tallentitylayer_layerref = null;
  this.getEntityTallRedrawLayer = () => {
    return tallentitylayer_layerref;
  };

  this.setEntityTallRedrawLayerByName = (name) => {
    // this.mapData.tallentitylayer_layerref
    if (this.layerLookup[name]) {
      tallentitylayer_layerref = this.layerLookup[name];
      this.mapData.tallentitylayer = name;
      return tallentitylayer_layerref;
    }

    throw new Error(`Unknown layer name: "${name}"`);
  };

  const FILELOAD_MODE = typeof mapfile === 'string';

  this.filenames = {};

  if (FILELOAD_MODE) {
    this.filenames.mapfile = mapfile;
    this.filenames.mapdatafile = mapdatafile;

    this.dataPath = path.dirname(mapdatafile);
    lastKnownPath = this.dataPath;

    // TODO probably need a better concept of project management
    this.mapedConfigFile = path.join(this.dataPath, '$$$_MAPED.json');
  } else {
    this.dataPath = '';

    // TODO probably need a better concept of project management
    this.mapedConfigFile = path.join(lastKnownPath, '$$$_MAPED.json');
  }

  this.updateLocationFn = updateLocationFunction;

  this.readyPromise = new Promise(
    function (resolve, reject) {
      this.promiseResolver = resolve;
      this.promiseRejecter = reject;
    }.bind(this)
  );

  if (FILELOAD_MODE) {
    const jetpack = require('fs-jetpack').cwd(__dirname);
    this.mapData = jetpack.read(mapfile, 'json');
    this.mapPath = mapfile;
  } else {
    this.mapData = mapfile;
    this.mapPath = null; // TODO, I dunno, maybe this is stupid?  What do we use this for anyway?
  }

  // TODO eventually hide access to map.layers
  this.layers = this.mapData.layers;

  this.getLayerByName = (name) => {
    for (let i = this.layers.length - 1; i >= 0; i--) {
      if (this.layers[i].name === name) {
        return this.layers[i];
      }
    }

    throw new Error(`Unknown layer by name of "${name}"`);
  };

  this.getLayerByRStringCode = (rstringcode) => {
    if ($.isNumeric(rstringcode)) {
      const i = parseInt(rstringcode);

      if (i > 0 && i <= this.layers.length) {
        return this.layers[i - 1];
      }
    }

    notify(
      `Cannot get layer ${rstringcode}, it doesnt exist on this map!\nValid range [1, ${this.layers.length}]`
    );
    return { name: false };
  };

  this.getLayerByIdx_DANGEROUS = (idx) => {
    if ($.isNumeric(idx)) {
      const i = parseInt(idx);

      if (i >= 0 && i < this.layers.length) {
        return this.layers[i];
      }
    }

    throw new Error(`Invalid layer index "${idx}".  Valid range [0, ${this.layers.length - 1}]`);
  };

  const jetpack = require('fs-jetpack').cwd(__dirname);
  this.mapedConfigData = jetpack.read(this.mapedConfigFile, 'json');

  this.checkerColorA = checkerColorA;
  this.checkerColorB = checkerColorB;

  if (this.mapedConfigData) {
    if (this.mapedConfigData.checkerColorA && !this.mapData.isTileSelectorMap) {
      this.checkerColorA = this.mapedConfigData.checkerColorA;
    }

    if (this.mapedConfigData.checkerColorB && !this.mapData.isTileSelectorMap) {
      this.checkerColorB = this.mapedConfigData.checkerColorB;
    }
  } else {
    alert(`Failed to read config file expected at ${this.mapedConfigFile}`);
  }

  this.filenames.vspfiles = this.mapData.vsp;

  // Initialize an undo/redostack just for this map!
  this.UndoRedo = MakeUndoRedoStack(this);

  // for "E" layer rendering
  this.fakeEntityLayer = {
    name: 'Entity Layer (E)',
    parallax: {
      X: 1,
      Y: 1,
    },
    vsp: 'default',
  };

  this.updateRstring = (rstring) => {
    if (typeof rstring === 'string') {
      LOG(`Setting new rstring: '${rstring}'`);
      this.layerRenderOrder = rstring.split(',');
    } else if (typeof rstring.length === 'number') {
      LOG("Setting new rstring: '");
      this.layerRenderOrder = rstring.map((r) => `${r}`);
      LOG(this.layerRenderOrder);
    } else {
      throw new Error('What fresh hell is this.  What are you throwing at updateRstring?!');
    }

    this.mapData.renderstring = this.layerRenderOrder.join(',');

    updateRstringInfo(this.layerRenderOrder);
  };

  this.updateRstring(this.mapData.renderstring);
  this.mapSizeInTiles = {
    width: 0,
    height: 0,
  };

  // YOU BIG FAT PHONY
  this.regenerateLayerLookup = () => {
    this.calculateSize();

    this.layerLookup = {};
    this.layerLookup[this.fakeEntityLayer.name] = this.fakeEntityLayer;

    // populate this.layerLookup
    for (let i = 0; i < this.mapData.layers.length; i++) {
      LOG(i);
      LOG(this.mapData.layers[i].name);

      const layerName = this.uniqueLayerName(this.mapData.layers[i].name);
      this.mapData.layers[i].name = layerName; // clean up the non unique name if necessary
      this.layerLookup[layerName] = this.mapData.layers[i];
    }
  };
  this.regenerateLayerLookup();

  // TODO: this branch-code is bad
  if (!this.mapData.isTileSelectorMap) {
    this.setEntityTallRedrawLayerByName(this.mapData.tallentitylayer);
  }

  this.camera = [0, 0, 1];

  if (FILELOAD_MODE) {
    const jetpack = require('fs-jetpack').cwd(__dirname);
    this.mapRawTileData = jetpack.read(mapdatafile, 'json'); // zone_data: [{x:x,y:y,z:zIdx}, ...]
  } else {
    this.mapRawTileData = mapdatafile;
  }

  this.legacyObsData = this.mapRawTileData.legacy_obstruction_data;
  this.tileData = this.mapRawTileData.tile_data;

  this.regenerateZoneData = () => {
    const tmpZones = this.mapRawTileData.zone_data;
    this.zoneData = new Array(this.mapSizeInTiles.width * this.mapSizeInTiles.height);

    $.each(tmpZones, (idx) => {
      this.zoneData[getFlatIdx(tmpZones[idx].x, tmpZones[idx].y, this.mapSizeInTiles.width)] =
        tmpZones[idx].z;
    });
  };

  this.regenerateZoneData();

  this.vspData = {};

  // if( FILELOAD_MODE ) {
  for (const k in this.filenames.vspfiles) {
    const tmppath = path.join(this.dataPath, this.filenames.vspfiles[k]);
    INFO(`Loading '${tmppath}'...`);
    const jetpack = require('fs-jetpack').cwd(__dirname);
    this.vspData[k] = jetpack.read(tmppath, 'json');
    INFO(k, '->', this.vspData[k]);
  }

  // / "if this.dataPath" as a sentinel for only doing this to "real" maps.  This file is garbage.
  if (this.dataPath && this.mapData.vsp.obstructions) {
    const tmppath = path.join(this.dataPath, this.mapData.vsp.obstructions);
    const jetpack = require('fs-jetpack').cwd(__dirname);
    this.obsLayerData = jetpack.read(tmppath, 'json');
    if (!this.obsLayerData) {
      debugger;
    }
    if (!this.obsLayerData.vsp) {
      this.obsLayerData.vsp = 'obstructions';
    }
    INFO(`loaded obsLayerData from ${tmppath}`);
  }

  // todo: stop being evil
  // todo: that probably won't happen. MWAHAHAHAHHA.
  this.vspData.zones = $.extend(true, {}, this.vspData.obstructions);
  this.vspData.zones.source_image = $('#zones_tileset')[0].src;

  this.compactifyZones = () => {
    // zone_data: [{x,y,z}, ...]
    const tmpZones = [];
    const mapWidth = this.mapSizeInTiles.width;

    // walk the in-memory zoneData layer, anything with zone >0, add.
    $.each(this.zoneData, (idx) => {
      if (this.zoneData[idx] > 0) {
        const x = getXfromFlat(idx, mapWidth);
        const y = getYfromFlat(idx, mapWidth);

        const zone = { x, y, z: this.zoneData[idx] };

        LOG('saving out flatzone', zone);

        tmpZones.push(zone);
      }
    });

    this.mapRawTileData.zone_data = tmpZones;
  };

  this.entitySortFn = (a, b) => {
    const entityDataA = this._getEntityData(a);
    const entityDataB = this._getEntityData(b);

    // Entities should Z-sort (within their layers) by the bottom of their hitbox (PY + hitbox.H), not the top.
    if (a.location.py && b.location.py) {
      return a.location.py + entityDataA.hitbox[3] - (b.location.py + entityDataB.hitbox[3]);
    }

    WARN('Entity sorting is being done without px/py or hitbox calculations.  WARNING!');
    return a.location.ty - b.location.ty;
  };

  this.toLoad = 0;
  this.doneLoading = function (name) {
    this.toLoad--;
    LOG(`done loading ${name}`);
    LOG(`${this.toLoad} left...`);
    if (this.toLoad === 0) {
      this.promiseResolver(this);
    }
    if (this.toLoad < 0) {
      throw new Error('Someone done fucked up');
    }
  }.bind(this);

  this.vspImages = {};
  this.vspAnimations = {};
  for (const k in this.vspData) {
    const vsp = this.vspData[k];
    if (!vsp) {
      continue;
    }
    // TODO probably actually want to fail the load or do something other than
    // just silently carry on when the image can't be loaded
    this.toLoad++;
    this.vspImages[k] = new window.Image();
    this.vspImages[k].onload = this.doneLoading;

    if (k !== 'zones') {
      // TODO: a better solution to map-relative assets versus app-relative assets.
      // THIS IS SAD AND PATHETIC AND SADTHETIC
      this.vspImages[k].src = path.join(this.dataPath, this.vspData[k].source_image);
    } else {
      this.vspImages[k].src = this.vspData[k].source_image;
    }

    this.vspAnimations[k] = {};
    if (vsp.animations) {
      for (const anim of vsp.animations) {
        this.vspAnimations[k][anim.start] = anim;
      }
    }
  }

  this.toLoad++;
  this.entityTexturesKeynameInEntityData = 'MAPED_ENTITYTEXTURE_KEY';

  // sets entityData, returns the key for the corresponding this.entityTexture
  this.setEntityDataEntry = function (key, data) {
    // entityData's filename-based key SHOULD be fine for now.
    // TODO: make this not based on filename
    this.entityData[key] = data;

    let uuid = this.entityData[key][this.entityTexturesKeynameInEntityData];
    if (!uuid) {
      uuid = uuidv4();
      this.entityData[key][this.entityTexturesKeynameInEntityData] = uuid;
    }
    return uuid;
  };

  this.entityTextures = {
    __default__: { img: new window.Image() },
  };
  this.entityTextures.__default__.img.onload = this.doneLoading;
  this.entityTextures.__default__.img.src = $('#default_sprite').src; // path.join(window.appPath, 'assets/images/defaultsprite.png');

  const defaultEntityLayer = this.fakeEntityLayer.name;

  this.resetEntityData = () => {
    this.entityData = {
      __default__: {
        animations: {
          'Idle Down': [[[0, 100]], 'Looping'],
          'Idle Up': [[[0, 100]], 'Looping'],
          'Idle Left': [[[0, 100]], 'Looping'],
          'Idle Right': [[[0, 100]], 'Looping'],
        },
        animation: 'Idle Down',
        dims: [16, 32],
        hitbox: [0, 16, 16, 16],
        regions: {},
        frames: 1,
        image: '__default__',
        inner_pad: 0,
        outer_pad: 0,
        per_row: 1,
      },
    };
  };

  this.resetEntityData();

  this.createEntityRenderData = () => {
    if (!this.mapData.entities || !this.mapData.entities.length) {
      return;
    }

    const tilewidth = this.vspData.default.tilesize.width;
    const tileheight = this.vspData.default.tilesize.height;

    INFO('createEntityRenderData...');
    this.entities = {};
    for (i = 0; i < this.mapData.entities.length; i++) {
      const entity = this.mapData.entities[i];

      entity.location.layer = entity.location.layer || defaultEntityLayer;

      entity.location.px = entity.location.px || entity.location.tx * tilewidth;
      entity.location.py = entity.location.py || entity.location.ty * tileheight;

      this.addEntityWithoutSort(entity, entity.location, false);
    }

    for (const i in this.entities) {
      if (this.entities[i]) {
        INFO('Sorting entities on layer', i, ', ', this.entities[i].length, 'entities to sort');
        this.entities[i].sort(this.entitySortFn);
      }
    }
  };

  this.createEntityRenderData();

  this.renderContainer = null;

  this.selectionMaker = function () {
    return {
      add(x, y, w, h) {
        if (x < this.hull.x || this.hull.x === null) {
          this.hull.x = x;
        }
        if (y < this.hull.y || this.hull.y === null) {
          this.hull.y = y;
        }
        if (x + w > this.hull.x + this.hull.w) {
          this.hull.w = x + w;
        }
        if (y + h > this.hull.y + this.hull.h) {
          this.hull.h = y + h;
        }

        let ix = null;
        let iy = null;
        let i = null;
        for (iy = 0; iy < h; iy++) {
          for (ix = 0; ix < w; ix++) {
            i = getFlatIdx(x + ix, y + iy, this.map.mapSizeInTiles.width);
            this.tiles[i] = true;
          }
        }

        this.recalculateLines();
      },
      remove(x, y, w, h) {
        // TODO update hull -- it's much harder to recalc the hull on subtraction
        let ix = null;
        let iy = null;
        let i = null;
        for (iy = 0; iy < h; iy++) {
          for (ix = 0; ix < w; ix++) {
            i = getFlatIdx(x + ix, y + iy, this.map.mapSizeInTiles.width);
            this.tiles[i] = false;
          }
        }

        this.recalculateLines();
      },
      deselect() {
        this.hull.x = null;
        this.hull.y = null;
        this.hull.w = 0;
        this.hull.h = 0;

        this.tiles = [];
        this.lines = [];
      },

      // "private"
      recalculateLines() {
        this.lines = [];

        const mapWidth = this.map.mapSizeInTiles.width;
        let x = null;
        let y = null;
        let i = null;
        for (y = this.hull.y; y < this.hull.y + this.hull.h; y++) {
          for (x = this.hull.x; x < this.hull.x + this.hull.w; x++) {
            i = getFlatIdx(x, y, mapWidth);
            if (this.tiles[i] !== this.tiles[i - 1]) {
              this.lines.push(x, y, x, y + 1);
            }
            if (this.tiles[i] !== this.tiles[i - mapWidth]) {
              this.lines.push(x, y, x + 1, y);
            }
          }
        }

        // INFO('Recalculated lines:');
        // INFO(this.hull);
        // INFO(this.tiles);
        // INFO(this.lines);
      },

      hull: { x: null, y: null, w: 0, h: 0 }, // TODO: it's not w/x at least in mark mode.  It's x2,y2 (non-inclusive)
      tiles: [],
      lines: [],
    };
  };

  this.windowOverlayMaker = function () {
    return {
      map: null,
      on: false,

      viewport: {
        x: 0,
        y: 0,
        width: 320,
        height: 180,
      },
      shade: {
        color: [0.5, 0.5, 0],
        opacity: 0.5,
      },
    };
  };

  this.selection = this.selectionMaker();
  this.selection.map = this;

  this.windowOverlay = this.windowOverlayMaker();
  this.windowOverlay.map = this;

  this.visibleHoverTile = this.selectionMaker();
  this.visibleHoverTile.map = this;

  // heal uuids into uuid-less maps
  if (has_unset_uuids(this)) {
    heal_uuids_for_this_map(this);
    notify(
      "Your map lacked entity uuids.\nWe've added them in.\nPlease save before using these uuids."
    );
  }

  this.doneLoading();
}

const has_unset_uuids = (map) => {
  for (let i = map.mapData.entities.length - 1; i >= 0; i--) {
    if (!map.mapData.entities[i].uuid) {
      return true;
    }
  }

  return false;
};

export const getFlatIdx = (x, y, width) => {
  return parseInt(width, 10) * parseInt(y, 10) + parseInt(x, 10);
};

// extracts the first dimension of a flat-indexed 2 dimensionally array given
// the second dimension's maximum value and the value of the flat index you
// wish to extract the first dimension's value from.
//
export const getXfromFlat = (idx, numColumns) => {
  return idx % numColumns;
};

// extracts the second dimension of a flat-indexed 2 dimensionally array given
// the second dimension's maximum value and the value of the flat index you
// wish to extract the second dimension's value from.
//
export const getYfromFlat = (idx, numColumns) => {
  const flatval = idx - getXfromFlat(idx, numColumns);
  return parseInt(flatval / numColumns, 10);
};

Map.prototype = {
  sullyDataHealing(entity) {
    // TODO this section is full of asset-healing code that's super Sully-specific.  Clean it up for general release.
    if (!this.entityData[entity.filename]) {
      const jetpack = require('fs-jetpack').cwd(__dirname);
      const originalDatafile = jetpack.path(
        this.dataPath,
        this.mapedConfigData.path_to_chrs,
        entity.filename
      );
      let datafile = jetpack.path(
        this.dataPath,
        this.mapedConfigData.path_to_chrs,
        entity.filename
      );
      let data = null;

      if (entity.filename.endsWith('chr')) {
        if (jetpack.exists(`${datafile}.json`)) {
          entity.filename += '.json';
          datafile += '.json';
        } else {
          const lastDitch = jetpack.path(
            this.dataPath,
            this.mapedConfigData.path_to_chrs,
            'chrs',
            entity.filename
          );

          if (jetpack.exists(lastDitch)) {
            entity.filename = `${'chrs' + '/'}${entity.filename}.json`;
            datafile = `${lastDitch}.json`;
          } else {
            datafile = null;
          }
        }
      }

      if (datafile === null && !entity.filename.endsWith('json')) {
        const lastDitch = jetpack.path(
          this.dataPath,
          this.mapedConfigData.path_to_chrs,
          `${entity.filename}.chr.json`
        );

        if (jetpack.exists(lastDitch)) {
          entity.filename = jetpack.path(`${entity.filename}.chr.json`);
          datafile = lastDitch;
        } else {
          datafile = null;
        }
      }

      if (datafile === null && !entity.filename.startsWith('chr')) {
        const lastDitch = jetpack.path(
          this.dataPath,
          this.mapedConfigData.path_to_chrs,
          'chrs',
          entity.filename
        );

        if (jetpack.exists(lastDitch)) {
          entity.filename = jetpack.path('chrs', entity.filename);
          datafile = lastDitch;
        } else {
          datafile = null;
        }
      }

      if (
        datafile === null &&
        !entity.filename.startsWith('chr') &&
        !entity.filename.endsWith('json')
      ) {
        const lastDitch = jetpack.path(
          this.dataPath,
          this.mapedConfigData.path_to_chrs,
          'chrs',
          `${entity.filename}.chr.json`
        );

        if (jetpack.exists(lastDitch)) {
          entity.filename = jetpack.path('chrs', `${entity.filename}.chr.json`);
          datafile = lastDitch;
        } else {
          datafile = null;
        }
      }

      try {
        // TODO: use aen's loaders in MAPPO and convert binary chrs to images and json files, motherfucker!
        data = jetpack.read(datafile, 'json');
      } catch (e) {
        window.alert(`Failure while attempting to parse json for ${datafile}\nReason: \n${e}`);
        if (entity.filename.endsWith('json')) {
          console.error('Couldnt read a json entity file:', entity.filename);
        }
        console.warn(`Totally couldnt read datafile: '${datafile}'`);
        data = null;
      }

      if (data) {
        this._maybeAddEntityTexture(data, entity, datafile);
      } else {
        console.warn(`Could not find '${entity.filename}', using the default. Path: `, datafile);
        // debugger;
        entity.MAPED_USEDEFAULT = true;
      }
    }
  },

  maybeAddEntityTextureFromFilename(data, filename) {
    this._maybeAddEntityTexture(data, false, filename);
  },

  _maybeAddEntityTexture(data, entity, filename) {
    try {
      let imageFilename = '';
      const jetpack = require('fs-jetpack').cwd(__dirname);

      const projectBasePath = jetpack.path(this.dataPath, this.mapedConfigData.path_to_chrs);
      const jsonDirPath = path.dirname(jetpack.path(filename));

      if (entity) {
        filename = entity.filename;
        //debugger;
      }

      function _isIllegalPath(path) {
        return !(path.indexOf('../') == -1 && path.indexOf('..\\') == -1);
      }

      function _isProjectRelative(path) {
        return path.startsWith('~/') || path.startsWith('~\\');
      }

      function _isDatafileRelative(path) {
        if (_isProjectRelative(path)) {
          return false;
        }

        let validFilenameStart = (str) => {
          const regexp = new RegExp('^[a-z0-9_-]', 'i'); // TODO: this is almost certainly wrong; different filesystems will have different allowed things.  Let's only accept the intersection of win/mac/linux/ps4-5/xbox/switch tho
          return regexp.test(str);
        };

        return path.startsWith('./') || path.startsWith('.\\') || validFilenameStart(path);
      }

      if (_isIllegalPath(data.image)) {
        const msg = `Illegal imagefile path in chr json '${filename}'.  field 'image' had value '${data.image}', and we do not allow 'walking up' the dirtree.`;
        alert(msg);
        throw Error(msg);
      } else if (_isProjectRelative(data.image)) {
        const tmp = data.image.substr(2);
        imageFilename = jetpack.path(projectBasePath, tmp);
      } else if (_isDatafileRelative(data.image)) {
        imageFilename = jetpack.path(jsonDirPath, data.image);
      } else {
        const msg = `Illegal imagefile path in chr json '${filename}'.  field 'image' had value '${data.image}' is neither project-relative (starts with '~/') nor datafile-relative (is a naked filename or is a path in a subdir from the json file)...`;

        alert(msg);
        throw Error(msg);
      }

      const textureKey = this.setEntityDataEntry(filename, data);

      for (const name in data.animations) {
        // convert short-hand to useful-hand
        if (typeof data.animations[name][0] === 'string') {
          const chunks = data.animations[name][0].split(' ');
          const t = parseInt(chunks.shift().substring(1), 10);

          data.animations[name][0] = [];
          for (let f = 0; f < chunks.length; f++) {
            data.animations[name][0].push([parseInt(chunks[f], 10), t]);
          }
        }
      }

      /// TODO: for gods sake put this all under test dammit
      /// TODO: this is a bad scheme for storing entity textures.  If there's the same filename but different paths, there'll be a colission.  Change to full normalized path maybe?
      LOG(`this.entityTextures[${textureKey}] ${this.entityTextures[textureKey]}`);
      if (!this.entityTextures[textureKey]) {
        // TODO maybe make this definable in this.mapedConfigData too?
        let imagePath = imageFilename;

        if (!jetpack.inspect(imagePath)) {
          imagePath += '.png'; // TODO this is stupid and bad and wrong.
        }
        if (!jetpack.inspect(imagePath)) {
          console.warn(
            `Couldnt load image (${data.image}) for entity ({filename}); falling back...`
          );
          // this.entityData[filename].image = '__default__';
          if (entity) {
            entity.MAPED_USEDEFAULT = false;
          }

          return;
        }

        INFO(`Adding '${imagePath}' to entityTextures cache...`);
        this.toLoad++;
        this.entityTextures[textureKey] = {};
        this.entityTextures[textureKey].img = new window.Image();
        const fn = this.doneLoading;
        this.entityTextures[textureKey].img.onload = function () {
          fn(data.image);
        };
        this.entityTextures[textureKey].img.src = imagePath;
      }

      if (entity) {
        entity.MAPED_USEDEFAULT = false;
      }
      LOG('NOT USING DEFAULT ENTITY FOR ', data.image);
    } catch (e) {
      alert(e);

      debugger;
    }
  },

  addEntityWithoutSort(entity, location) {
    // TODO we just shouldnt save any "MAPED_" properties in the first place.
    // TODO we should have a universal MAPED_CONF type that lives parallel to objects, not in them
    if (entity.MAPED_USEDEFAULT) {
      delete entity.MAPED_USEDEFAULT;
    }

    if (!this.entities[location.layer]) {
      this.entities[location.layer] = [];
    }
    this.entities[location.layer].push(entity);

    this.sullyDataHealing(entity);

    if (entity.filename.endsWith('chr')) {
      console.warn(`entity ('${entity.filename}') is binary in format.  Skipping for now.`);
      entity.MAPED_USEDEFAULT = true;
      return;
    }

    if (!entity.filename.endsWith('chr') && !entity.filename.endsWith('json')) {
      console.warn(`entity ('${entity.filename}') has an unknown format.  Skipping for now. (2)`);
      entity.MAPED_USEDEFAULT = true;
      return;
    }

    if (!entity.MAPED_USEDEFAULT) {
      try {
        if (
          this.entityData[entity.filename].regions &&
          this.entityData[entity.filename].regions.Tall_Redraw &&
          !this.getEntityTallRedrawLayer()
        ) {
          window.alert(
            `ERROR: Loading tall entity ${entity.filename} with no tallentitylayer in map!`
          );
        }

        entity.animation =
          entity.animation || Object.keys(this.entityData[entity.filename].animations)[0];
      } catch (e) {
        debugger;
        throw e;
      }
    } else {
      entity.animation = 'Idle Down'; // / m-m-m-magick (__default__ has this)
    }
  },
  addEntity(filename, location) {
    this.addEntityWithoutSort(filename, location);
    this.entities[location.layer].sort(this.entitySortFn);
  },

  getVSPTileLocation(vsp, idx) {
    let x = null;
    let y = null;

    y = parseInt(idx / this.vspData[vsp].tiles_per_row);
    x = idx - y * this.vspData[vsp].tiles_per_row;

    y *= this.vspData[vsp].tilesize.height;
    x *= this.vspData[vsp].tilesize.width;

    return {
      x,
      y,
    };
  },

  getZone(tileX, tileY) {
    const idx = getFlatIdx(tileX, tileY, this.mapSizeInTiles.width);

    return this.zoneData[idx];
  },

  setZone(tileX, tileY, zoneIdx) {
    const idx = getFlatIdx(tileX, tileY, this.mapSizeInTiles.width);

    this.zoneData[idx] = zoneIdx;
  },

  getTile(tileX, tileY, layerIdx) {
    let idx;

    if (layerIdx === MAGICAL_OBS_LAYER_ID) {
      // TODO the obs sentinel is the WORST
      idx = getFlatIdx(tileX, tileY, this.mapSizeInTiles.width);
      if (this.legacyObsData) {
        // we are in the main map.
        return this.legacyObsData[idx];
      }
      if (this.tileData && this.tileData.length === 1) {
        // we are in the obs map
        layerIdx = 0;
      } else {
        throw new Error(
          'Something very strange happened where you were trying to access obs data when there was both no obs ' +
            'tiledata and multiple non-obs tile layers.'
        );
      }
    } else if (layerIdx === MAGICAL_ZONE_LAYER_ID) {
      // TODO the obs sentinel is the WORST
      idx = getFlatIdx(tileX, tileY, this.mapSizeInTiles.width);

      try {
        return this.zoneData[idx];
      } catch (ig) {
        return 0;
      }
    } else {
      // we are on a normal  layer
      idx = getFlatIdx(tileX, tileY, this.layers[layerIdx].dimensions.X);
    }

    return this.tileData[layerIdx][idx];
  },

  setTile(tileX, tileY, layerIdx, tileIdx) {
    let idx;

    // / jesus, right?  One day this won't be a thing, he lied to himself.
    if (layerIdx !== MAGICAL_OBS_LAYER_ID && layerIdx !== MAGICAL_ZONE_LAYER_ID) {
      if (
        tileX < 0 ||
        tileY < 0 ||
        tileX >= this.layers[layerIdx].dimensions.X ||
        tileY >= this.layers[layerIdx].dimensions.Y
      ) {
        console.warn(`attempted to set a tile out of layer bounds. (${tileX},${tileY})`);
        INFO(`layerIdx: ${layerIdx}`);
        INFO(this.layers[layerIdx].dimensions);
        return;
      }

      idx = getFlatIdx(tileX, tileY, this.layers[layerIdx].dimensions.X);
    } else {
      idx = getFlatIdx(tileX, tileY, this.mapSizeInTiles.width);
    }

    if (layerIdx === MAGICAL_OBS_LAYER_ID) {
      // TODO the obs sentinel is the WORST
      this.legacyObsData[idx] = tileIdx;
    } else if (layerIdx === MAGICAL_ZONE_LAYER_ID) {
      if (!tileIdx) {
        delete this.zoneData[idx];
      } else {
        this.zoneData[idx] = tileIdx;
      }
    } else {
      this.tileData[layerIdx][idx] = tileIdx;
    }
  },

  ready() {
    const key = `map-${this.mapData.name}`;
    const $cont = $('.map-palette');

    const setPaletteLocations = function (paletteDict) {
      let configVar = null;
      let obj = null;

      for (const k in paletteDict) {
        // INFO('paletteDict.' + k);
        configVar = `${k} settings`; // this should be CONST'd somewhere and referenced in both places
        const $pal = $(`.${k}`);

        // INFO('configVar: ' + configVar);
        // INFO('$pal: ' + $pal);
        // INFO('localStorage[configVar]: ' + localStorage[configVar]);

        if (localStorage[configVar] && $pal) {
          obj = JSON.parse(localStorage[configVar]);

          if (obj.w) {
            $pal.width(obj.w);
          }
          if (obj.h) {
            $pal.height(obj.h);
          }
          if (obj.x) {
            $pal.css('left', obj.x);
          }
          if (obj.y) {
            $pal.css('top', obj.y);
          }
          obj.hide ? $pal.hide() : $pal.show();
        } else {
          INFO('lol, no');
        }
      }
    };

    const { localStorage } = window;

    if (`${localStorage[key]}-mapx`) {
      if (localStorage[`${key}-width`]) {
        $cont.width(localStorage[`${key}-width`]);
      }
      if (localStorage[`${key}-height`]) {
        $cont.height(localStorage[`${key}-height`]);
      }
      if (localStorage[`${key}-top`]) {
        $cont.css('top', localStorage[`${key}-top`]);
      }
      if (localStorage[`${key}-left`]) {
        $cont.css('left', localStorage[`${key}-left`]);
      }
      if (localStorage[`${key}-mapx`]) {
        this.camera[0] = parseInt(localStorage[`${key}-mapx`]);
      }
      if (localStorage[`${key}-mapy`]) {
        this.camera[1] = parseInt(localStorage[`${key}-mapy`]);
      }
      if (localStorage[`${key}-mapzoom`]) {
        this.camera[2] = parseInt(localStorage[`${key}-mapzoom`]);
      }
      if (!this.camera[2]) {
        this.camera[2] = 1;
      }

      if (localStorage[`${key}-layerspallete`]) {
        this.camera[1] = parseInt(localStorage[`${key}-layerspallete`]);
      }

      if (localStorage.palettes) {
        INFO('palletes found...');
        setPaletteLocations(JSON.parse(localStorage.palettes));
      } else {
        console.warn('no palettes registered.');
      }

      updateInfoDims(this);
      updateLocationText(this);
      updateZoomText(this);
    }

    return this.readyPromise;
  },

  uniqueLayerName(like) {
    if (like && !this.layerLookup[like]) {
      return like;
    }
    if (!like) {
      like = 'Layer 0';
    } // will have 1 added to the 0 so unnamed layers will be Layer 1, Layer 2, etc.

    let name = '';
    let num = parseInt(like.match(/\d*$/)[0], 10) || 1; // || 1 so that two layers named "Foo" become "Foo" and "Foo 2"
    const stem = like.replace(/\d*$/, '');
    num++;

    name = stem + num;

    while (this.layerLookup[name]) {
      num++;
      name = stem + num;
    }

    return name;
  },

  setCanvas($canvas) {
    INFO('Setting canvas on map');
    if (this.renderContainer) {
      this.cleanUpCallbacks();
    }

    // set up callbacks
    $(window).on('resize', this.resize.bind(this));

    // set up context
    this.renderContainer = $canvas;
    this.gl = this.renderContainer[0].getContext('webgl'); // we're targeting Electron not the Internet at large so
    // don't worry about failing to get a GL context
    this.gl.clearColor(0.5, 0.5, 0.5, 1.0);

    const readShader = (shaderPath) => {
      const jetpack =
        process.env.NODE_ENV !== 'production'
          ? require('fs-jetpack')
          : require('fs-jetpack').cwd(__dirname);
      const p = jetpack.path(shaderPath);
      const res = jetpack.read(p);
      return res;
    };

    this.checkerShader = new ShaderProgram(
      this.gl,
      readShader('shaders/tilemap-vert.glsl'),
      readShader('shaders/check-frag.glsl')
    );
    this.tilemapShader = new ShaderProgram(
      this.gl,
      readShader('shaders/tilemap-vert.glsl'),
      readShader('shaders/tilemap-frag.glsl')
    );
    this.spriteShader = new ShaderProgram(
      this.gl,
      readShader('shaders/sprite-vert.glsl'),
      readShader('shaders/sprite-frag.glsl')
    );
    this.obstructionmapShader = new ShaderProgram(
      this.gl,
      readShader('shaders/tilemap-vert.glsl'),
      readShader('shaders/tilemapObs-frag.glsl')
    );
    this.zonemapShader = new ShaderProgram(
      this.gl,
      readShader('shaders/tilemap-vert.glsl'),
      readShader('shaders/tilemap-frag.glsl')
    );
    this.selectionShader = new ShaderProgram(
      this.gl,
      readShader('shaders/selection-vert.glsl'),
      readShader('shaders/selection-frag.glsl')
    );
    this.screenviewShader = new ShaderProgram(
      this.gl,
      readShader('shaders/screenview-vert.glsl'),
      readShader('shaders/screenview-frag.glsl')
    );
    this.layerBorderShader = new ShaderProgram(
      this.gl,
      readShader('shaders/tilemap-vert.glsl'),
      readShader('shaders/layerborder-frag.glsl')
    );
    this.entityBoundsShader = new ShaderProgram(
      this.gl,
      readShader('shaders/sprite-vert.glsl'),
      readShader('shaders/entitybounds-frag.glsl')
    );

    this.tileLibraryTextures = {};
    for (const k in this.vspImages) {
      if (!this.vspImages[k]) {
        return;
      }
      this.tileLibraryTextures[k] = this.gl.createTexture();
      this.gl.bindTexture(this.gl.TEXTURE_2D, this.tileLibraryTextures[k]);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
      this.gl.texImage2D(
        this.gl.TEXTURE_2D,
        0,
        this.gl.RGBA,
        this.gl.RGBA,
        this.gl.UNSIGNED_BYTE,
        this.vspImages[k]
      );
    }

    this.tileLayoutTexture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.tileLayoutTexture);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
    this.gl.texImage2D(
      this.gl.TEXTURE_2D,
      0,
      this.gl.RGBA,
      this.mapData.layers[0].dimensions.X,
      this.mapData.layers[0].dimensions.Y,
      0,
      this.gl.RGBA,
      this.gl.UNSIGNED_BYTE,
      buildTileDataTexture(this.tileData[0])
    );

    this.gl.enable(this.gl.BLEND);

    this.vertexbuffer = this.gl.createBuffer();
    this.entityVertexBuffer = this.gl.createBuffer();
    this.selectionVertexBuffer = this.gl.createBuffer();
    this.screenviewVertexBuffer = this.gl.createBuffer();
    this.lineBuf = this.gl.createBuffer();

    this.calculateSize();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.screenviewVertexBuffer);
    this.gl.bufferData(
      this.gl.ARRAY_BUFFER,
      new Float32Array([-1.0, -1.0, 1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, -1.0, 1.0]),
      this.gl.STATIC_DRAW
    );

    for (const k in this.entityTextures) {
      const texture = this.entityTextures[k];

      texture.tex = this.gl.createTexture();
      this.gl.bindTexture(this.gl.TEXTURE_2D, texture.tex);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
      this.gl.texImage2D(
        this.gl.TEXTURE_2D,
        0,
        this.gl.RGBA,
        this.gl.RGBA,
        this.gl.UNSIGNED_BYTE,
        texture.img
      );
    }

    // make sure the size is right
    this.resize();

    if (this.onLoad) {
      this.onLoad(this);
    }
  },

  calculateSize() {
    this.mapSizeInTiles = {
      width: 0,
      height: 0,
    };
    for (let i = 0; i < this.mapData.layers.length; i++) {
      if (this.mapData.layers[i].dimensions.X > this.mapSizeInTiles.width) {
        this.mapSizeInTiles.width = this.mapData.layers[i].dimensions.X;
      }
      if (this.mapData.layers[i].dimensions.Y > this.mapSizeInTiles.height) {
        this.mapSizeInTiles.height = this.mapData.layers[i].dimensions.Y;
      }
    }

    updateInfoDims(this);

    // this could get called before this.gl is created, potentially, so don't blow up
    // if that's the case
    if (this.gl) {
      this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexbuffer);
      this.gl.bufferData(
        this.gl.ARRAY_BUFFER,
        new Float32Array([
          0.0,
          0.0,
          this.mapSizeInTiles.width,
          0.0,
          0.0,
          -this.mapSizeInTiles.height,
          0.0,
          -this.mapSizeInTiles.height,
          this.mapSizeInTiles.width,
          0.0,
          this.mapSizeInTiles.width,
          -this.mapSizeInTiles.height,
        ]),
        this.gl.STATIC_DRAW
      );
    }
  },

  drawEntities(i, map, layer, tallEntities, tick) {
    if (!map.entities) {
      return;
    }

    // Layered Entities
    if (getNormalEntityVisibility()) {
      if (
        map.entities[layer.name] &&
        map.entities[layer.name].length > 0 &&
        shouldShowEntitiesForLayer(layer.name)
      ) {
        const entities = map.entities[layer.name];

        const showEntityPreview =
          getSelectedLayer() && layer === getSelectedLayer().layer && map.entityPreview;
        map.spriteShader.use();

        for (let e = 0; e < entities.length; e++) {
          const mask =
            !entities[e].MAPED_USEDEFAULT &&
            map.entityData[entities[e].filename].regions &&
            map.entityData[entities[e].filename].regions.Tall_Redraw
              ? map.entityData[entities[e].filename].regions.Tall_Redraw
              : null;

          if (
            showEntityPreview &&
            map.entityPreview.location.ty < entities[e].location.ty && // TODO this whole check should favor py.
            (e === 0 || map.entityPreview.location.ty >= entities[e - 1].location.ty)
          ) {
            map.renderEntity(
              map.entityPreview,
              layer,
              [1, 1, 1, ENTITY_PREVIEW_ALPHA],
              null,
              mask,
              false
            );
          }
          if (entities[e].MAPED_HIGHLIGHTED) {
            map.renderEntity(
              entities[e],
              layer,
              [HIGHLIGHT_R, HIGHLIGHT_G, HIGHLIGHT_B, animateAlpha(tick, 100)],
              null,
              mask,
              false
            );
          } else {
            map.renderEntity(entities[e], layer, [1, 1, 1, 1], null, mask, false);
          }
          if (mask) {
            tallEntities.push(entities[e]);
          }
        }
      } else if (map.entityPreview) {
        map.renderEntity(
          map.entityPreview,
          layer,
          [1, 1, 1, ENTITY_PREVIEW_ALPHA],
          null,
          null,
          false
        );
      }

      if (map.getEntityTallRedrawLayer() === layer) {
        for (const e in tallEntities) {
          const entity = tallEntities[e];

          if (entity.MAPED_HIGHLIGHTED) {
            map.renderEntity(
              entity,
              layer,
              [HIGHLIGHT_R, HIGHLIGHT_G, HIGHLIGHT_B, animateAlpha(tick, 100)],
              map.entityData[entity.filename].regions.Tall_Redraw,
              null,
              true
            );
          } else {
            map.renderEntity(
              entity,
              layer,
              [TALLENT_R, TALLENT_G, TALLENT_B, TALLENT_A],
              map.entityData[entity.filename].regions.Tall_Redraw,
              null,
              true
            );
          }
        }
      }
    }
  },

  maybeRenderZones(gl) {
    // ZONES
    if (getZoneVisibility() && this.zoneData.length > 1) {
      const vsp = 'zones'; // TODO zones layer shouldn't just default like this
      const layer = {
        parallax: { X: 1, Y: 1 },
        alpha: getZoneAlpha(),
        dimensions: { X: this.mapSizeInTiles.width, Y: this.mapSizeInTiles.height },
      };

      this.tilemapShader.use();

      const viewport = this.windowOverlay.on ? this.windowOverlay.viewport : { x: 0, y: 0 };
      gl.uniform4f(
        this.tilemapShader.uniform('u_camera'),
        Math.floor(layer.parallax.X * (this.camera[0] + viewport.x) - viewport.x) /
          this.vspData[vsp].tilesize.width,
        Math.floor(layer.parallax.Y * (this.camera[1] + viewport.y) - viewport.y) /
          this.vspData[vsp].tilesize.height,
        this.renderContainerDimensions.w / this.vspData[vsp].tilesize.width / this.camera[2],
        this.renderContainerDimensions.h / this.vspData[vsp].tilesize.height / this.camera[2]
      );

      gl.uniform4f(
        this.tilemapShader.uniform('u_dimensions'),
        layer.dimensions.X,
        layer.dimensions.Y,
        this.vspData[vsp].tiles_per_row,
        this.vspImages[vsp].height / this.vspData[vsp].tilesize.height
      );

      gl.uniform1f(this.tilemapShader.uniform('u_opacity'), layer.alpha);

      const u_tileLibrary = this.tilemapShader.uniform('u_tileLibrary');
      gl.uniform1i(u_tileLibrary, 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.tileLibraryTextures[vsp]);

      const u_tileLayout = this.tilemapShader.uniform('u_tileLayout');
      gl.uniform1i(u_tileLayout, 1);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this.tileLayoutTexture);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        layer.dimensions.X,
        layer.dimensions.Y,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        buildTileDataTexture(this.zoneData)
      );

      const a_position = this.tilemapShader.attribute('a_position');
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexbuffer);
      gl.enableVertexAttribArray(a_position);
      gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
  },

  maybeRenderObstructions(gl) {
    // OBSTRUCTIONS
    if (getObsVisibility() && this.legacyObsData) {
      const vsp = 'obstructions'; // TODO obstruction layer shouldn't just default like this
      const layer = {
        parallax: { X: 1, Y: 1 },
        dimensions: { X: this.mapSizeInTiles.width, Y: this.mapSizeInTiles.height },
      };

      if (this.mapData.obstructions_layer) {
        layer.dimensions = this.mapData.obstructions_layer.dimensions;
      }

      // TODO this.mapData.obstructions_layer.offset

      this.obstructionmapShader.use();

      const viewport = this.windowOverlay.on ? this.windowOverlay.viewport : { x: 0, y: 0 };
      gl.uniform4f(
        this.obstructionmapShader.uniform('u_camera'),
        Math.floor(layer.parallax.X * (this.camera[0] + viewport.x) - viewport.x) /
          this.vspData[vsp].tilesize.width,
        Math.floor(layer.parallax.Y * (this.camera[1] + viewport.y) - viewport.y) /
          this.vspData[vsp].tilesize.height,
        this.renderContainerDimensions.w / this.vspData[vsp].tilesize.width / this.camera[2],
        this.renderContainerDimensions.h / this.vspData[vsp].tilesize.height / this.camera[2]
      );

      gl.uniform4f(
        this.obstructionmapShader.uniform('u_dimensions'),
        layer.dimensions.X,
        layer.dimensions.Y,
        this.vspData[vsp].tiles_per_row,
        this.vspImages[vsp].height / this.vspData[vsp].tilesize.height
      );

      gl.uniform4f(
        this.obstructionmapShader.uniform('u_color'),
        __obsColor[0],
        __obsColor[1],
        __obsColor[2],
        __obsColor[3]
      );

      const u_tileLibrary = this.obstructionmapShader.uniform('u_tileLibrary');
      gl.uniform1i(u_tileLibrary, 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.tileLibraryTextures[vsp]);

      const u_tileLayout = this.obstructionmapShader.uniform('u_tileLayout');
      gl.uniform1i(u_tileLayout, 1);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this.tileLayoutTexture);

      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        layer.dimensions.X,
        layer.dimensions.Y,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        buildTileDataTexture(this.legacyObsData)
      );

      const a_position = this.obstructionmapShader.attribute('a_position');
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexbuffer);
      gl.enableVertexAttribArray(a_position);
      gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
  },

  renderTilesAndEntityLayers(gl, tick) {
    const tallEntities = [];

    // render each layer in turn
    this.gl.blendFuncSeparate(
      this.gl.SRC_ALPHA,
      this.gl.ONE_MINUS_SRC_ALPHA,
      this.gl.SRC_ALPHA,
      this.gl.DST_ALPHA
    );
    const len = this.layerRenderOrder.length;
    for (let i = 0; i < len; i++) {
      // something about optimization means this runs 2x faster if renderLayer is its own function
      // <Tene> 100% glad that I've avoided javascript so far
      this.renderLayer(gl, i, tallEntities, tick);
    }
  },

  renderLayer(gl, i, tallEntities, tick) {
    const layerIndex = parseInt(this.layerRenderOrder[i], 10) - 1;
    const layer = this.mapData.layers[layerIndex];

    if (this.layerRenderOrder[i] === 'E') {
      this.drawEntities(i, this, this.fakeEntityLayer, tallEntities, tick);
      return;
    }
    if (isNaN(layerIndex)) {
      return;
    }

    if (!layer) {
      console.warn('sub-tick escape for when youre making a new map. this is dumb and bad.');
      return;
    }

    if (layer.MAPED_HIDDEN) {
      if (this.getEntityTallRedrawLayer() === layer) {
        this.spriteShader.use();
        for (const e in tallEntities) {
          const entity = tallEntities[e];

          if (entity.MAPED_HIGHLIGHTED) {
            this.renderEntity(
              entity,
              layer,
              [HIGHLIGHT_R, HIGHLIGHT_G, HIGHLIGHT_B, animateAlpha(tick, 100)],
              this.entityData[entity.filename].regions.Tall_Redraw,
              null,
              null
            );
          } else {
            this.renderEntity(
              entity,
              layer,
              [TALLENT_R, TALLENT_G, TALLENT_B, TALLENT_A],
              this.entityData[entity.filename].regions.Tall_Redraw,
              null,
              null
            );
          }
        }
      }

      return;
    }

    const { vsp } = layer;

    this.tilemapShader.use();

    const appliedOffset = layer.offset ? layer.offset : { X: 0, Y: 0 }; // If layer has an offset, use other, otherwise use default value
    const viewport = this.windowOverlay.on ? this.windowOverlay.viewport : { x: 0, y: 0 };
    gl.uniform4f(
      this.tilemapShader.uniform('u_camera'),
      Math.floor(layer.parallax.X * (this.camera[0] - appliedOffset.X + viewport.x) - viewport.x) /
        this.vspData[vsp].tilesize.width,
      Math.floor(layer.parallax.Y * (this.camera[1] - appliedOffset.Y + viewport.y) - viewport.y) /
        this.vspData[vsp].tilesize.height,
      this.renderContainerDimensions.w / this.vspData[vsp].tilesize.width / this.camera[2],
      this.renderContainerDimensions.h / this.vspData[vsp].tilesize.height / this.camera[2]
    );

    gl.uniform4f(
      this.tilemapShader.uniform('u_dimensions'),
      layer.dimensions.X,
      layer.dimensions.Y,
      this.vspData[vsp].tiles_per_row,
      this.vspImages[vsp].height / this.vspData[vsp].tilesize.height
    );

    gl.uniform1f(this.tilemapShader.uniform('u_opacity'), layer.alpha);

    const u_tileLibrary = this.tilemapShader.uniform('u_tileLibrary');
    gl.uniform1i(u_tileLibrary, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.tileLibraryTextures[vsp]);

    // todo: rename u_tileLayout to something eles?  "Dark Minimap?"
    const u_tileLayout = this.tilemapShader.uniform('u_tileLayout');
    gl.uniform1i(u_tileLayout, 1);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.tileLayoutTexture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      layer.dimensions.X,
      layer.dimensions.Y,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      buildTileDataTexture(
        this.tileData[layerIndex],
        ANIMATE_TILES ? this.vspAnimations[vsp] : undefined
      )
    );

    const a_position = this.tilemapShader.attribute('a_position');
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexbuffer);
    gl.enableVertexAttribArray(a_position);
    gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);

    // draw the tiles!
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // / TODO: extract everything below this this into its own helper function?
    this.layerBorderShader.use();

    const a_positionLayer = this.layerBorderShader.attribute('a_position');
    gl.bindBuffer(gl.ARRAY_BUFFER, this.lineBuf);
    gl.enableVertexAttribArray(a_positionLayer);
    gl.vertexAttribPointer(a_positionLayer, 2, gl.FLOAT, false, 0, 0);

    gl.uniform4f(
      this.layerBorderShader.uniform('u_camera'),
      Math.floor(layer.parallax.X * (this.camera[0] - appliedOffset.X + viewport.x) - viewport.x) /
        this.vspData[vsp].tilesize.width,
      Math.floor(layer.parallax.Y * (this.camera[1] - appliedOffset.Y + viewport.y) - viewport.y) /
        this.vspData[vsp].tilesize.height,
      this.renderContainerDimensions.w / this.vspData[vsp].tilesize.width / this.camera[2],
      this.renderContainerDimensions.h / this.vspData[vsp].tilesize.height / this.camera[2]
    );

    gl.uniform4f(
      this.layerBorderShader.uniform('u_dimensions'),
      layer.dimensions.X,
      layer.dimensions.Y,
      this.vspData[vsp].tiles_per_row,
      this.vspImages[vsp].height / this.vspData[vsp].tilesize.height
    );

    const r = layer.borderColor ? layer.borderColor.R : 0;
    const g = layer.borderColor ? layer.borderColor.G : 0;
    const b = layer.borderColor ? layer.borderColor.B : 0;
    const a = layer.borderColor ? layer.borderColor.A : 0;

    gl.uniform4f(this.layerBorderShader.uniform('u_borderColor'), r, g, b, a);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.lineBuf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        0,
        0,
        layer.dimensions.X,
        0,
        layer.dimensions.X,
        0,
        layer.dimensions.X,
        -layer.dimensions.Y,
        layer.dimensions.X,
        -layer.dimensions.Y,
        0,
        -layer.dimensions.Y,
        0,
        -layer.dimensions.Y,
        0,
        0,
      ]),
      this.gl.STATIC_DRAW
    );

    gl.drawArrays(gl.LINES, 0, 8);

    this.drawEntities(i, this, layer, tallEntities, tick);
  },

  maybeRenderMarchingAnts(gl, selection) {
    const vsp = 'default'; // TODO this is definitely wrong. Definitely if we allow vsp size mixing.

    // MARCHING ANTS
    if (selection.lines.length > 0 && typeof vsp !== 'undefined') {
      // TODO remove these fake layer shenanegans
      // TODO something smells about getSelectedLayer().layer
      const layer = getSelectedLayer()
        ? getSelectedLayer().layer
        : {
            parallax: { X: 1, Y: 1 },
            offset: { X: 0, Y: 0 },
            dimensions: { X: this.mapSizeInTiles.width, Y: this.mapSizeInTiles.width },
          };
      const appliedOffset = selection.map.mapData.isTileSelectorMap ? { X: 0, Y: 0 } : layer.offset; // If tileset selector, ignore offset

      const viewport = this.windowOverlay.on ? this.windowOverlay.viewport : { x: 0, y: 0 };
      this.selectionShader.use();
      gl.uniform4f(
        this.selectionShader.uniform('u_camera'),
        Math.floor(
          layer.parallax.X * (this.camera[0] - appliedOffset.X + viewport.x) - viewport.x
        ) / this.vspData[vsp].tilesize.width,
        Math.floor(
          layer.parallax.Y * (this.camera[1] - appliedOffset.Y + viewport.y) - viewport.y
        ) / this.vspData[vsp].tilesize.height,
        this.renderContainerDimensions.w / this.vspData[vsp].tilesize.width / this.camera[2],
        this.renderContainerDimensions.h / this.vspData[vsp].tilesize.height / this.camera[2]
      );
      gl.uniform4f(
        this.selectionShader.uniform('u_dimensions'),
        layer.dimensions.X,
        layer.dimensions.Y,
        this.vspData[vsp].tiles_per_row,
        this.vspImages[vsp].height / this.vspData[vsp].tilesize.height
      );
      gl.uniform1i(this.selectionShader.uniform('u_time'), Date.now());

      const a_position = this.selectionShader.attribute('a_position');
      gl.bindBuffer(gl.ARRAY_BUFFER, this.selectionVertexBuffer);
      gl.enableVertexAttribArray(a_position);
      gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);
      this.gl.bufferData(
        this.gl.ARRAY_BUFFER,
        new Float32Array(selection.lines),
        this.gl.STATIC_DRAW
      );

      gl.drawArrays(gl.LINES, 0, selection.lines.length / 2);
    }
  },

  maybeRenderScreenviewOverlay(gl, overlay) {
    /*
      overlay = {
        on: boolean,
        viewport: {
          x: int,
          y: int,
          width: int,
          height: int
        },
        shade: {
          color: default to [0,0,0],
          opacity: default to .5
        }
      }
    */

    if (overlay.on) {
      this.screenviewShader.use();

      // uniforms...
      gl.uniform4f(
        this.screenviewShader.uniform('u_camera'),
        Math.floor(this.camera[0]),
        Math.floor(this.camera[1]),
        this.renderContainerDimensions.w / this.camera[2],
        this.renderContainerDimensions.h / this.camera[2]
      );
      gl.uniform4f(
        this.screenviewShader.uniform('u_viewport'),
        Math.floor(overlay.viewport.x),
        Math.floor(overlay.viewport.y),
        Math.floor(overlay.viewport.width),
        Math.floor(overlay.viewport.height)
      );
      gl.uniform4f(
        this.screenviewShader.uniform('u_color'),
        overlay.shade.color[0],
        overlay.shade.color[1],
        overlay.shade.color[2],
        overlay.shade.opacity
      );

      const a_position = this.screenviewShader.attribute('a_position');
      gl.bindBuffer(gl.ARRAY_BUFFER, this.screenviewVertexBuffer);
      gl.enableVertexAttribArray(a_position);
      gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
  },

  render() {
    const { gl } = this;
    const tick = Date.now();

    this.renderContainerDimensions = {
      w: this.renderContainer.width(),
      h: this.renderContainer.height(),
    };

    this.renderBackground(gl);

    this.renderTilesAndEntityLayers(gl, tick);

    this.maybeRenderObstructions(gl);

    this.maybeRenderZones(gl);

    this.maybeRenderMarchingAnts(gl, this.selection);

    this.maybeRenderMarchingAnts(gl, this.visibleHoverTile);

    this.maybeRenderScreenviewOverlay(gl, this.windowOverlay);

    // uncomment these to get frame render times
    // const tock = new Date().getTime();
    // LOG((tock-tick) + 'ms to render');
  },

  renderBackground(gl) {
    gl.clear(gl.COLOR_BUFFER_BIT);

    if (window.$$$SCREENSHOT) {
      return;
    }

    // fill the map part of display with transparent pixels, first

    const layer = this.layers[0];

    this.gl.blendFunc(this.gl.ONE, this.gl.ZERO);

    this.checkerShader.use();

    const viewport = this.windowOverlay.on ? this.windowOverlay.viewport : { x: 0, y: 0 };
    gl.uniform4f(
      this.checkerShader.uniform('u_camera'),
      Math.floor(layer.parallax.X * (this.camera[0] + viewport.x) - viewport.x) /
        this.vspData[layer.vsp].tilesize.width,
      Math.floor(layer.parallax.Y * (this.camera[1] + viewport.y) - viewport.y) /
        this.vspData[layer.vsp].tilesize.height,
      this.renderContainerDimensions.w / this.vspData[layer.vsp].tilesize.width / this.camera[2],
      this.renderContainerDimensions.h / this.vspData[layer.vsp].tilesize.height / this.camera[2]
    );

    gl.uniform4f(
      this.checkerShader.uniform('u_dimensions'),
      layer.dimensions.X,
      layer.dimensions.Y,
      this.vspData[layer.vsp].tiles_per_row,
      this.vspImages[layer.vsp].height / this.vspData[layer.vsp].tilesize.height
    );

    gl.uniform4f(
      this.checkerShader.uniform('u_colorA'),
      this.checkerColorA[0],
      this.checkerColorA[1],
      this.checkerColorA[2],
      this.checkerColorA[3]
    );
    gl.uniform4f(
      this.checkerShader.uniform('u_colorB'),
      this.checkerColorB[0],
      this.checkerColorB[1],
      this.checkerColorB[2],
      this.checkerColorB[3]
    );

    const a_position = this.checkerShader.attribute('a_position');
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexbuffer);
    gl.enableVertexAttribArray(a_position);
    gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  },

  _getEntityData(entity) {
    const e = entity.MAPED_USEDEFAULT
      ? this.entityData.__default__
      : this.entityData[entity.filename];

    if (!entity.MAPED_USEDEFAULT && e === this.entityData.__default__) {
      debugger;
    }

    e.___filename = entity.MAPED_USEDEFAULT ? 'DEFAULT' : entity.filename;

    return e;
  },

  _getAnimationSafe(entity, entityData) {
    if (entityData.animations[entity.animation]) {
      return entityData.animations[entity.animation][0][0][0];
    }

    if (Object.keys(entityData.animations).length) {
      return entityData.animations[Object.keys(entityData.animations)[0]][0][0][0];
    }

    ERROR("Entity didnt have any animations.  THAT'S ILLEGAL.");
    debugger;
  },

  renderEntity(entity, layer, tint, clip, mask, isTallRedraw) {
    this.spriteShader.use();

    const { gl } = this;
    const { tilesize } = this.vspData[layer.vsp];

    let layerOffsetTx = 0;
    let layerOffsetTy = 0;

    if (layer.offset) {
      layerOffsetTx = layer.offset.X / tilesize.width;
      layerOffsetTy = layer.offset.Y / tilesize.height;
    }

    const entityData = this._getEntityData(entity);
    const entityTexture = this.entityTextures[entityData[this.entityTexturesKeynameInEntityData]]; // || this.entityTextures["__default__"];
    if (!entityTexture) {
      alert(
        `Entity '${entity.name}' at (TX(${entity.location.tx},${entity.location.ty}) PX(${entity.location.px},${entity.location.py})) with image path \`${entityData.image}\` tried to render without an assigned asset! Make sure the appropriate asset (png?) exists.`
      );
    }

    clip = !clip ? [0, 0, entityData.dims[0], entityData.dims[1]] : clip;

    const a_vertices = this.spriteShader.attribute('a_vertices');
    gl.bindBuffer(gl.ARRAY_BUFFER, this.entityVertexBuffer);
    gl.enableVertexAttribArray(a_vertices);
    gl.vertexAttribPointer(a_vertices, 4, gl.FLOAT, false, 0, 0);

    let tx;
    let ty;

    // the coordinatespace isn't what you think it is.  tx/ty can be fractional here.  Time is a flat circle
    if (Number.isInteger(entity.location.px) && Number.isInteger(entity.location.py)) {
      tx = entity.location.px / tilesize.width;
      ty = entity.location.py / tilesize.height;
    } else {
      tx = entity.location.tx;
      ty = entity.location.ty;
    }

    // apply hitbox xform
    tx -= entityData.hitbox[0] / tilesize.width;
    ty -= entityData.hitbox[1] / tilesize.height;

    // apply layer offset xform
    tx += layerOffsetTx;
    ty += layerOffsetTy;

    const tw = clip[2] / tilesize.width;
    const th = clip[3] / tilesize.height;

    let fx = (entityData.outer_pad + clip[0]) / entityTexture.img.width;
    let fy = (entityData.outer_pad + clip[1]) / entityTexture.img.height;
    const fw = clip[2] / entityTexture.img.width;
    const fh = clip[3] / entityTexture.img.height;

    const f = this._getAnimationSafe(entity, entityData);
    fx +=
      ((entityData.dims[0] + entityData.inner_pad) / entityTexture.img.width) *
      (f % entityData.per_row);
    fy +=
      ((entityData.dims[1] + entityData.inner_pad) / entityTexture.img.height) *
      Math.floor(f / entityData.per_row);

    const verts = [];
    if (!mask) {
      verts.push(tx, -ty, fx, fy);
      verts.push(tx + tw, -ty, fx + fw, fy);
      verts.push(tx, -ty - th, fx, fy + fh);
      verts.push(tx + tw, -ty - th, fx + fw, fy + fh);
      verts.push(tx, -ty - th, fx, fy + fh);
      verts.push(tx + tw, -ty, fx + fw, fy);
    } else {
      const tm = [
        mask[0] / tilesize.width,
        mask[1] / tilesize.height,
        mask[2] / tilesize.width,
        mask[3] / tilesize.height,
      ];
      const fm = [
        mask[0] / entityTexture.img.width,
        mask[1] / entityTexture.img.height,
        mask[2] / entityTexture.img.width,
        mask[3] / entityTexture.img.height,
      ];

      if (mask[1] > 0) {
        verts.push(tx, -ty, fx, fy);
        verts.push(tx + tw, -ty, fx + fw, fy);
        verts.push(tx, -ty - tm[1], fx, fy + fm[1]);
        verts.push(tx + tw, -ty - tm[1], fx + fw, fy + fm[1]);
        verts.push(tx, -ty - tm[1], fx, fy + fm[1]);
        verts.push(tx + tw, -ty, fx + fw, fy);
      }
      if (mask[0] > 0) {
        verts.push(tx, -ty, fx, fy);
        verts.push(tx + tm[0], -ty, fx + fm[0], fy);
        verts.push(tx, -ty - th, fx, fy + fh);
        verts.push(tx + tm[0], -ty - th, fx + fm[0], fy + fh);
        verts.push(tx, -ty - th, fx, fy + fh);
        verts.push(tx + tm[0], -ty, fx + fm[0], fy);
      }
      if (mask[0] + mask[2] < entityData.dims[0]) {
        verts.push(tx + tm[0] + tm[2], -ty, fx + fm[0] + fm[2], fy);
        verts.push(tx + tw, -ty, fx + fw, fy);
        verts.push(tx + tm[0] + tm[2], -ty - th, fx + fm[0] + fm[2], fy + fh);
        verts.push(tx + tw, -ty - th, fx + fw, fy + fh);
        verts.push(tx + tm[0] + tm[2], -ty - th, fx + fm[0] + fm[2], fy + fh);
        verts.push(tx + tw, -ty, fx + fw, fy);
      }
      // assume we at least have the "below the mask" part of the entity to draw
      verts.push(tx, -ty - tm[1] - tm[3], fx, fy + fm[1] + fm[3]);
      verts.push(tx + tw, -ty - tm[1] - tm[3], fx + fw, fy + fm[1] + fm[3]);
      verts.push(tx, -ty - th, fx, fy + fh);
      verts.push(tx + tw, -ty - th, fx + fw, fy + fh);
      verts.push(tx, -ty - th, fx, fy + fh);
      verts.push(tx + tw, -ty - tm[1] - tm[3], fx + fw, fy + fm[1] + fm[3]);
    }
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(verts), this.gl.STATIC_DRAW);

    const viewport = this.windowOverlay.on ? this.windowOverlay.viewport : { x: 0, y: 0 };
    gl.uniform4f(
      this.spriteShader.uniform('u_camera'),
      Math.floor(layer.parallax.X * (this.camera[0] + viewport.x) - viewport.x) / tilesize.width,
      Math.floor(layer.parallax.Y * (this.camera[1] + viewport.y) - viewport.y) / tilesize.height,
      this.renderContainerDimensions.w / tilesize.width / this.camera[2],
      this.renderContainerDimensions.h / tilesize.height / this.camera[2]
    );

    gl.uniform4f(this.spriteShader.uniform('u_tint'), tint[0], tint[1], tint[2], tint[3]);

    const u_texture = this.tilemapShader.uniform('u_spriteAtlas');
    gl.uniform1i(u_texture, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, entityTexture.tex);

    gl.drawArrays(gl.TRIANGLES, 0, verts.length / 4);

    // if A is 0, it's not being drawn anyway.
    if (
      this.mapData.MAPED_GLOBAL_ENTITY_BOUNDS_DRAWING &&
      this.mapData.MAPED_GLOBAL_ENTITY_BOUNDS_DRAWING.A
    ) {
      this.renderEntityBounds(entity, layer, tint, clip, mask, verts, viewport);
    }

    // if A is 0, it's not being drawn anyway.
    if (
      this.mapData.MAPED_GLOBAL_ENTITY_HITBOX_BOUNDS_DRAWING &&
      this.mapData.MAPED_GLOBAL_ENTITY_HITBOX_BOUNDS_DRAWING.A
    ) {
      this.renderEntityHitBoxBounds(entity, layer, tint, clip, mask, verts, viewport);
    }

    // if A is 0, it's not being drawn anyway.
    if (
      isTallRedraw &&
      this.mapData.MAPED_GLOBAL_ENTITY_TALLREDRAW_BOUNDS_DRAWING &&
      this.mapData.MAPED_GLOBAL_ENTITY_TALLREDRAW_BOUNDS_DRAWING.A
    ) {
      this.renderEntityTallRedrawBoundsBounds(entity, layer, tint, clip, mask, verts, viewport);
    }
  },

  renderEntityTallRedrawBoundsBounds(entity, layer, tint, clip, mask, verts, viewport) {
    this.entityBoundsShader.use();

    const { gl } = this;
    const { tilesize } = this.vspData[layer.vsp];

    let layerOffsetTx = 0;
    let layerOffsetTy = 0;

    if (layer.offset) {
      layerOffsetTx = layer.offset.X / tilesize.width;
      layerOffsetTy = layer.offset.Y / tilesize.height;
    }

    const entityData = this._getEntityData(entity);
    const entityTexture = this.entityTextures[entityData[this.entityTexturesKeynameInEntityData]]; // || this.entityTextures["__default__"];
    if (!entityTexture) {
      alert(
        `Entity '${entity.name}' at (${entity.location.tx},${entity.location.ty}) with image path \`${entityData.image}\` tried to render without an assigned asset! Make sure the appropriate asset (png?) exists.`
      );
    }

    clip = !clip ? [0, 0, entityData.dims[0], entityData.dims[1]] : clip;

    const a_vertices = this.spriteShader.attribute('a_vertices');
    gl.bindBuffer(gl.ARRAY_BUFFER, this.lineBuf);
    gl.enableVertexAttribArray(a_vertices);
    gl.vertexAttribPointer(a_vertices, 2, gl.FLOAT, false, 0, 0);

    const hitbox_x = entityData.hitbox[0]; // -entityData.hitbox[0]
    const hitbox_y = entityData.hitbox[1]; // -entityData.hitbox[1]
    const hitbox_w = entityData.hitbox[2]; // -entityData.hitbox[0]
    const hitbox_h = entityData.hitbox[3]; // -entityData.hitbox[1]

    let x = entity.location.px / tilesize.width || entity.location.tx;
    let y = entity.location.py / tilesize.height || entity.location.ty;
    x += layerOffsetTx;
    y += layerOffsetTy;
    x -= hitbox_x / tilesize.width;
    y -= hitbox_y / tilesize.height;
    x += clip[0] / tilesize.width;
    y += clip[1] / tilesize.height;

    const w = clip[2] / tilesize.width;
    const h = clip[3] / tilesize.height;

    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        x,
        -y,
        x + w,
        -y,
        x + w,
        -y,
        x + w,
        -(y + h),
        x + w,
        -(y + h),
        x,
        -(y + h),
        x,
        -(y + h),
        x,
        -y,
      ]),
      this.gl.STATIC_DRAW
    );

    gl.uniform4f(
      this.entityBoundsShader.uniform('u_camera'),
      Math.floor(layer.parallax.X * (this.camera[0] + viewport.x) - viewport.x) / tilesize.width,
      Math.floor(layer.parallax.Y * (this.camera[1] + viewport.y) - viewport.y) / tilesize.height,
      this.renderContainerDimensions.w / tilesize.width / this.camera[2],
      this.renderContainerDimensions.h / tilesize.height / this.camera[2]
    );

    const borderColor = this.mapData.MAPED_GLOBAL_ENTITY_TALLREDRAW_BOUNDS_DRAWING;

    gl.uniform4f(
      this.entityBoundsShader.uniform('u_entBoundsColor'),
      borderColor.R,
      borderColor.G,
      borderColor.B,
      borderColor.A
    );

    gl.drawArrays(gl.LINES, 0, 8);
  },

  renderEntityBounds(entity, layer, tint, clip, mask, verts, viewport) {
    this.entityBoundsShader.use();

    const { gl } = this;
    const { tilesize } = this.vspData[layer.vsp];

    let layerOffsetTx = 0;
    let layerOffsetTy = 0;

    if (layer.offset) {
      layerOffsetTx = layer.offset.X / tilesize.width;
      layerOffsetTy = layer.offset.Y / tilesize.height;
    }

    const entityData = this._getEntityData(entity);
    const entityTexture = this.entityTextures[entityData[this.entityTexturesKeynameInEntityData]]; // || this.entityTextures["__default__"];
    if (!entityTexture) {
      alert(
        `Entity '${entity.name}' at (${entity.location.tx},${entity.location.ty}) with image path \`${entityData.image}\` tried to render without an assigned asset! Make sure the appropriate asset (png?) exists.`
      );
    }

    clip = !clip ? [0, 0, entityData.dims[0], entityData.dims[1]] : clip;

    const a_vertices = this.spriteShader.attribute('a_vertices');
    gl.bindBuffer(gl.ARRAY_BUFFER, this.lineBuf);
    gl.enableVertexAttribArray(a_vertices);
    gl.vertexAttribPointer(a_vertices, 2, gl.FLOAT, false, 0, 0);

    const hitbox_x = entityData.hitbox[0]; // -entityData.hitbox[0]
    const hitbox_y = entityData.hitbox[1]; // -entityData.hitbox[1]
    const hitbox_w = entityData.hitbox[2]; // -entityData.hitbox[0]
    const hitbox_h = entityData.hitbox[3]; // -entityData.hitbox[1]

    let x = entity.location.px / tilesize.width || entity.location.tx;
    let y = entity.location.py / tilesize.height || entity.location.ty;
    x -= hitbox_x / tilesize.width;
    y -= hitbox_y / tilesize.height;
    x += layerOffsetTx;
    y += layerOffsetTy;
    const w = entityData.dims[0] / tilesize.width;
    const h = entityData.dims[1] / tilesize.height;

    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        x,
        -y,
        x + w,
        -y,
        x + w,
        -y,
        x + w,
        -(y + h),
        x + w,
        -(y + h),
        x,
        -(y + h),
        x,
        -(y + h),
        x,
        -y,
      ]),
      this.gl.STATIC_DRAW
    );

    gl.uniform4f(
      this.entityBoundsShader.uniform('u_camera'),
      Math.floor(layer.parallax.X * (this.camera[0] + viewport.x) - viewport.x) / tilesize.width,
      Math.floor(layer.parallax.Y * (this.camera[1] + viewport.y) - viewport.y) / tilesize.height,
      this.renderContainerDimensions.w / tilesize.width / this.camera[2],
      this.renderContainerDimensions.h / tilesize.height / this.camera[2]
    );

    const borderColor = this.mapData.MAPED_GLOBAL_ENTITY_BOUNDS_DRAWING;

    gl.uniform4f(
      this.entityBoundsShader.uniform('u_entBoundsColor'),
      borderColor.R,
      borderColor.G,
      borderColor.B,
      borderColor.A
    );

    gl.drawArrays(gl.LINES, 0, 8);
  },

  renderEntityHitBoxBounds(entity, layer, tint, clip, mask, verts, viewport) {
    this.entityBoundsShader.use();

    const { gl } = this;
    const { tilesize } = this.vspData[layer.vsp];
    let layerOffsetTx = 0;
    let layerOffsetTy = 0;

    if (layer.offset) {
      layerOffsetTx = layer.offset.X / tilesize.width;
      layerOffsetTy = layer.offset.Y / tilesize.height;
    }
    const entityData = this._getEntityData(entity);
    const entityTexture = this.entityTextures[entityData[this.entityTexturesKeynameInEntityData]]; // || this.entityTextures["__default__"];
    if (!entityTexture) {
      alert(
        `Entity '${entity.name}' at (${entity.location.tx},${entity.location.ty}) with image path \`${entityData.image}\` tried to render without an assigned asset! Make sure the appropriate asset (png?) exists.`
      );
    }

    clip = !clip ? [0, 0, entityData.dims[0], entityData.dims[1]] : clip;

    const a_vertices = this.spriteShader.attribute('a_vertices');
    gl.bindBuffer(gl.ARRAY_BUFFER, this.lineBuf);
    gl.enableVertexAttribArray(a_vertices);
    gl.vertexAttribPointer(a_vertices, 2, gl.FLOAT, false, 0, 0);

    let x = entity.location.px / tilesize.width || entity.location.tx;
    let y = entity.location.py / tilesize.height || entity.location.ty;
    x += layerOffsetTx;
    y += layerOffsetTy;
    const w = entityData.hitbox[2] / tilesize.width;
    const h = entityData.hitbox[3] / tilesize.height;

    let x1 = x;
    let x2 = x + w;

    let y1 = y;
    let y2 = y + h;

    if (x2 < x1) {
      [x1, x2] = [x2, x1];
    }

    if (y2 < y1) {
      [y1, y2] = [y2, y1];
    }

    const arLines = [
      x,
      -y,
      x + w,
      -y,
      x + w,
      -y,
      x + w,
      -(y + h),
      x + w,
      -(y + h),
      x,
      -(y + h),
      x,
      -(y + h),
      x,
      -y,
    ];

    /* Playing around with "architectural" shading but I think I need some trig to do it how I thought I could :(
  
    let xi = x1;
    let yi = y1;

    while( xi < x2+w || yi < y2+w ) {
      xi += .2;
      yi += .2;

      arLines.push(x1, -Math.min(yi, y2), Math.min(xi, x2), -y1);
      arLines.push(Math.min(xi, x2), -y2, x2, -Math.max(yi, y1));
    }
    
    */

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(arLines), this.gl.STATIC_DRAW);

    gl.uniform4f(
      this.entityBoundsShader.uniform('u_camera'),
      Math.floor(layer.parallax.X * (this.camera[0] + viewport.x) - viewport.x) / tilesize.width,
      Math.floor(layer.parallax.Y * (this.camera[1] + viewport.y) - viewport.y) / tilesize.height,
      this.renderContainerDimensions.w / tilesize.width / this.camera[2],
      this.renderContainerDimensions.h / tilesize.height / this.camera[2]
    );

    const borderColor = this.mapData.MAPED_GLOBAL_ENTITY_HITBOX_BOUNDS_DRAWING;

    gl.uniform4f(
      this.entityBoundsShader.uniform('u_entBoundsColor'),
      borderColor.R,
      borderColor.G,
      borderColor.B,
      borderColor.A
    );

    gl.drawArrays(gl.LINES, 0, arLines.length / 2);
  },

  cleanUpCallbacks() {
    this.renderContainer.off(undefined, undefined, this);
  },

  resize() {
    if (!this.renderContainer || !this.gl) {
      return;
    }
    const w = this.renderContainer.width();
    const h = this.renderContainer.height();
    this.renderContainer.attr('width', w);
    this.renderContainer.attr('height', h);
    this.gl.viewport(0, 0, w, h);
  },

  resetCamera(x, y, z) {
    if (typeof x === 'undefined') {
      x = 0;
      y = 0;
      z = 1;
    }

    this.camera[0] = x;
    this.camera[1] = y;
    this.camera[2] = z;
  },
};
