import { MakeUndoRedoStack } from './UndoRedo';
import { getObsVisibility } from './js/ui/LayersPalette';
const app = require('electron').remote.app;
const path = require('path');
const appPath = app.getAppPath();
const jetpack = require('fs-jetpack').cwd(appPath);
import { ShaderProgram } from './ShaderProgram.js';
import { updateRstringInfo, getCurrentHoverTile } from './Tools.js';
import { getZoneVisibility, getZoneAlpha } from './js/ui/ZonesPalette';
import { getNormalEntityVisibility, shouldShowEntitiesForLayer } from './js/ui/EntityPalette.js';
const sprintf = require('sprintf-js').sprintf;
const $ = require('jquery');

import { getSelectedLayer } from './js/ui/LayersPalette.js';

const ENTITY_PREVIEW_ALPHA = 0.75;

const HIGHLIGHT_R = 0;
const HIGHLIGHT_G = 1;
const HIGHLIGHT_B = 1;

const TALLENT_R = 1;
const TALLENT_G = 1;
const TALLENT_B = 1;
const TALLENT_A = 0.5;

const animateAlpha = (t, swag) => {
  return Math.sin(t / swag) * 0.3 + 0.5;
};

const buildTileDataTexture = (data) => {
  const out = new Uint8Array(data.length * 4);
  for (let i = 0; i < data.length; i++) {
    const t = data[i];
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
  let promiseResolver = null;
  // let promiseRejecter = null;
  const readyPromise = new Promise(function (resolve, reject) {
    promiseResolver = resolve;
    // promiseRejecter = reject;
    // TODO add promise rejection here
  });

  console.log('No verification done on tile data yet...');

  promiseResolver();

  return readyPromise;
};

const saveData = (mapFile, mapData) => {
  // TODO these lines shouldnt be necessary.  delete?
  // var app = require('electron').remote.app;
  // var jetpack = require('fs-jetpack').cwd(app.getAppPath());

  // var map = window.$$$currentMap;

  jetpack.write(mapFile, mapData);
};

let verifyPromiseResolver = null;
let verifyPromiseRejecter = null;

export const verifyMap = (mapfile) => {
  const { dialog } = require('electron').remote;

  const readyPromise = new Promise(function (resolve, reject) {
    verifyPromiseResolver = resolve;
    verifyPromiseRejecter = reject;
  });

  const mapData = jetpack.read(mapfile, 'json');

  let needsDefault = false;
  let needsObstructions = false;

  if (typeof mapData.vsp === 'string') {
    window.alert(
      "Detected old format vsps: '" + mapData.vsp + "'.\n\nPlease select a json vsp for the map's default and" +
      ' a second one for the obstructions.');
    needsDefault = true;
    needsObstructions = true;
  } else {
    if (!mapData.vsp['default']) {
      needsDefault = true;
    }

    if (!mapData.vsp['obstructions']) {
      needsObstructions = true;
    }
  }

  if (typeof mapData.tallentitylayer === 'string') {
    const truth = new Set();
    mapData.layers.map((a) => {
      truth.add(a.name === mapData.tallentitylayer);
    });

    if (!truth.has(true)) {
      throw new Error('looking for mapData.tallentitylayer "' + mapData.tallentitylayer + '", but could not find it');
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

      mapData.tallentitylayer = mapData.layers[(parseInt(rCode) - 1)].name;
    }

    if (!mapData.tallentitylayer) {
      throw new Error('no tallentitylayer, and couldnt default to a valid candidate');
    }
  }

  console.info('mapData.tallentitylayer verified as ' + mapData.tallentitylayer);

  if (typeof mapData.vsp !== 'object') {
    mapData.vsp = {};
  }

  let filenames;
  let filename;

  if (needsDefault) {
    window.alert('Due to sins (surely on your part) you do not have a default tile vsp set.' +
                 'Please select the correct one.');

    filenames = dialog.showOpenDialog({
      title: 'Choose a default tileset',
      filters: [{ name: 'tileset', extensions: ['vsp.json'] }]
    });

    filename = filenames[0].replace(path.dirname(mapfile) + path.sep, '');

    mapData.vsp['default'] = filename;
  }

  if (needsObstructions) {
    window.alert('Please select the obstruction tileset for this map.');

    filenames = dialog.showOpenDialog({
      title: 'Choose an obstruction tileset',
      filters: [{ name: 'tileset', extensions: ['obsvsp.json'] }]
    });

    filename = filenames[0].replace(path.dirname(mapfile) + path.sep, '');

    mapData.vsp['obstructions'] = filename;
  }

  for (let i = mapData.layers.length - 1; i >= 0; i--) {
    if (!mapData.layers[i].vsp) {
      console.log('setting layer[' + i + ']s vsp to default...');
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
  console.info('Loading map', mapfile);

  if (typeof mapfile !== typeof mapdatafile) {
    throw new Error(
      sprintf(
        "type mismatch on mapfile and mapdatafile.  both must be object or string. got: '%s', '%s'",
        typeof mapfile, typeof mapdatafile
      )
    );
  }

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

    throw new Error('Unknown layer name: "' + name + '"');
  };

  const FILELOAD_MODE = (typeof mapfile === 'string');

  this.filenames = {};

  if (FILELOAD_MODE) {
    this.filenames.mapfile = mapfile;
    this.filenames.mapdatafile = mapdatafile;
    this.dataPath = path.dirname(mapdatafile);
  } else {
    this.dataPath = '';
  }

  this.mapedConfigFile = path.join(this.dataPath, '$$$_MAPED.json');

  this.updateLocationFn = updateLocationFunction;

  this.readyPromise = new Promise(function (resolve, reject) {
    this.promiseResolver = resolve;
    this.promiseRejecter = reject;
  }.bind(this));

  if (FILELOAD_MODE) {
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

    throw new Error('Unknown layer by name of "' + name + '"');
  };

  this.getLayerByRStringCode = (rstringcode) => {
    if ($.isNumeric(rstringcode)) {
      const i = parseInt(rstringcode);

      if (i > 0 && i <= this.layers.length) {
        return this.layers[i - 1];
      }
    }

    throw new Error('Invalid rstring code "' + rstringcode + '".  Valid range [1, ' + (this.layers.length) + ']');
  };

  this.getLayerByIdx_DANGEROUS = (idx) => {
    if ($.isNumeric(idx)) {
      const i = parseInt(idx);

      if (i >= 0 && i < this.layers.length) {
        return this.layers[i];
      }
    }

    throw new Error('Invalid layer index "' + idx + '".  Valid range [0, ' + (this.layers.length - 1) + ']');
  };

  this.mapedConfigData = jetpack.read(this.mapedConfigFile, 'json');

  this.filenames.vspfiles = this.mapData.vsp;

  // Initialize an undo/redostack just for this map!
  this.UndoRedo = MakeUndoRedoStack(this);

    // for "E" layer rendering
  this.fakeEntityLayer = {
    name: 'Entity Layer (E)',
    parallax: {
      X: 1,
      Y: 1
    },
    vsp: 'default'
  };

  this.updateRstring = (rstring) => {
    if (typeof rstring === 'string') {
      console.log("Setting new rstring: '" + rstring + "'");
      this.layerRenderOrder = rstring.split(',');
    } else if (typeof rstring.length === 'number') {
      console.log("Setting new rstring: '");
      console.log(rstring);

      this.layerRenderOrder = rstring;
    } else {
      throw new Error('What fresh hell is this.  What are you throwing at updateRstring?!');
    }

    this.mapData.renderstring = this.layerRenderOrder.join(',');

    updateRstringInfo();
  };

  this.updateRstring(this.mapData.renderstring);
  this.mapSizeInTiles = [0, 0];
  this.layerLookup = {};

  // YOU BIG FAT PHONY
  this.layerLookup[this.fakeEntityLayer.name] = this.fakeEntityLayer;

  // populate this.layerLookup
  for (i = 0; i < this.mapData.layers.length; i++) {
    console.log(i);
    console.log(this.mapData.layers[i].name);

    if (this.mapData.layers[i].dimensions.X > this.mapSizeInTiles[0]) {
      this.mapSizeInTiles[0] = this.mapData.layers[i].dimensions.X;
    }
    if (this.mapData.layers[i].dimensions.Y > this.mapSizeInTiles[1]) {
      this.mapSizeInTiles[1] = this.mapData.layers[i].dimensions.Y;
    }

    const layerName = this.uniqueLayerName(this.mapData.layers[i].name);
    this.mapData.layers[i].name = layerName; // clean up the non unique name if necessary
    this.layerLookup[layerName] = this.mapData.layers[i];
  }

  // TODO: this branch-code is bad
  if (!this.mapData.isTileSelectorMap) {
    this.setEntityTallRedrawLayerByName(this.mapData.tallentitylayer);
  }

  this.camera = [0, 0, 1];

  if (FILELOAD_MODE) {
    this.mapRawTileData = jetpack.read(mapdatafile, 'json'); // zone_data: [{x:x,y:y,z:zIdx}, ...]
  } else {
    this.mapRawTileData = mapdatafile;
  }

  this.legacyObsData = this.mapRawTileData.legacy_obstruction_data;
  this.tileData = this.mapRawTileData.tile_data;

  let tmpZones = null;
  tmpZones = this.mapRawTileData.zone_data;
  this.zoneData = new Array(this.tileData[0].length);

  console.info('unpacking zones...');
  $.each(tmpZones, (idx) => {
    // todo verify this is right
    console.info('unpacking zone', tmpZones[idx].z, 'to coordinates', tmpZones[idx].x, tmpZones[idx].y);
    this.zoneData[getFlatIdx(tmpZones[idx].x, tmpZones[idx].y, this.mapSizeInTiles[0])] = tmpZones[idx].z;
  });
  console.info('zones ->', this.zoneData);

  this.vspData = {};

    // if( FILELOAD_MODE ) {
  for (const k in this.filenames.vspfiles) {
    const tmppath = path.join(this.dataPath, this.filenames.vspfiles[k]);
    console.info("Loading '" + tmppath + "'...");
    this.vspData[k] = jetpack.read(tmppath, 'json');
    console.info(k, '->', this.vspData[k]);
  }

    // / "if this.dataPath" as a sentinel for only doing this to "real" maps.  This file is garbage.
  if (this.dataPath && this.mapData.vsp.obstructions) {
    const tmppath = path.join(this.dataPath, this.mapData.vsp.obstructions);
    this.obsLayerData = jetpack.read(tmppath, 'json');
    if (!this.obsLayerData.vsp) {
      this.obsLayerData.vsp = 'obstructions';
    }
    console.info('loaded obsLayerData from ' + tmppath);
  }

    // todo: stop being evil
    // todo: that probably won't happen. MWAHAHAHAHHA.
  this.vspData['zones'] = $.extend(true, {}, this.vspData['obstructions']);

  this.vspData['zones'].source_image = path.join(window.appPath, '/images/zones.png');

  this.compactifyZones = () => {
    // zone_data: [{x,y,z}, ...]
    const tmpZones = [];
    const mapWidth = this.mapData.layers[0].dimensions.X; // todo - make canonical width NOT layer 0's.

    // walk the in-memory zoneData layer, anything with zone >0, add.
    $.each(this.zoneData, (idx) => {
      if (this.zoneData[idx] > 0) {
        const x = getXfromFlat(idx, mapWidth);
        const y = getYfromFlat(idx, mapWidth);

        const zone = {x: x, y: y, z: this.zoneData[idx]};

        console.log('saving out flatzone', zone);

        tmpZones.push(zone);
      }
    });

    this.mapRawTileData.zone_data = tmpZones;
  };

  this.toLoad = 1;
  this.doneLoading = function () {
    this.toLoad--;
    if (this.toLoad === 0) {
      this.promiseResolver(this);
    }
  }.bind(this);

  this.vspImages = {};
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

    if (k !== 'zones') { // TODO: a better solution to map-relative assets versus app-relative assets.
                         // THIS IS SAD AND PATHETIC AND SADTHETIC
      this.vspImages[k].src = path.join(this.dataPath, this.vspData[k].source_image);
    } else {
      this.vspImages[k].src = this.vspData[k].source_image;
    }
  }

  this.toLoad++;
  this.entityTextures = {
    '__default__': { img: new window.Image() }
  };
  this.entityTextures['__default__'].img.onload = this.doneLoading;
  this.entityTextures['__default__'].img.src = path.join(window.appPath, '/images/defaultsprite.png');

  const defaultEntityLayer = this.fakeEntityLayer.name;

  this.entityData = {
    '__default__': {
      animations: { 'Idle Down': [ [ [ 0, 100 ] ], 'Looping' ] },
      animation: 'Idle Down',
      dims: [ 16, 32 ],
      hitbox: [ 0, 16, 16, 16 ],
      regions: {},
      frames: 1,
      image: '__default__',
      inner_pad: 0,
      outer_pad: 0,
      per_row: 1
    }
  };

  this.createEntityRenderData = () => {
    console.info('createEntityRenderData...');
    this.entities = {};
    for (i = 0; i < this.mapData.entities.length; i++) {
      const entity = this.mapData.entities[i];
      console.info(entity);

      entity.location.layer = entity.location.layer || defaultEntityLayer;
      this.addEntityWithoutSort(entity, entity.location, false);
    }

    for (const i in this.entities) {
      if (this.entities[i]) {
        console.info('Sorting entities on layer', i, ', ', this.entities[i].length, 'entities to sort');
        this.entities[i].sort(function (a, b) {
          return a.location.ty - b.location.ty;
        });
      }
    }
  };

  this.createEntityRenderData();

  this.renderContainer = null;

  this.selectionMaker = function () {
    return {
      add: function (x, y, w, h) {
        if (x < this.hull.x || this.hull.x === null) { this.hull.x = x; }
        if (y < this.hull.y || this.hull.y === null) { this.hull.y = y; }
        if (x + w > this.hull.x + this.hull.w) { this.hull.w = x + w; }
        if (y + h > this.hull.y + this.hull.h) { this.hull.h = y + h; }

        let ix = null;
        let iy = null;
        let i = null;
        for (iy = 0; iy < h; iy++) {
          for (ix = 0; ix < w; ix++) {
            i = getFlatIdx(x + ix, y + iy, this.map.mapSizeInTiles[0]);
            this.tiles[i] = true;
          }
        }

        this.recalculateLines();
      },
      remove: function (x, y, w, h) {
              // TODO update hull -- it's much harder to recalc the hull on subtraction

        let ix = null;
        let iy = null;
        let i = null;
        for (iy = 0; iy < h; iy++) {
          for (ix = 0; ix < w; ix++) {
            i = getFlatIdx(x + ix, y + iy, this.map.mapSizeInTiles[0]);
            this.tiles[i] = false;
          }
        }

        this.recalculateLines();
      },
      deselect: function () {
        this.hull.x = null;
        this.hull.y = null;
        this.hull.w = 0;
        this.hull.h = 0;

        this.tiles = [];
        this.lines = [];
      },

          // "private"
      recalculateLines: function () {
        this.lines = [];

        const mapWidth = this.map.mapSizeInTiles[0];
        let x = null;
        let y = null;
        let i = null;
        for (y = this.hull.y; y < this.hull.y + this.hull.h; y++) {
          for (x = this.hull.x; x < this.hull.x + this.hull.w; x++) {
            i = getFlatIdx(x, y, mapWidth);
            if (this.tiles[i] !== this.tiles[i - 1]) { this.lines.push(x, y, x, y + 1); }
            if (this.tiles[i] !== this.tiles[i - mapWidth]) { this.lines.push(x, y, x + 1, y); }
          }
        }

        // console.info('Recalculated lines:');
        // console.info(this.hull);
        // console.info(this.tiles);
        // console.info(this.lines);
      },

      hull: { x: null, y: null, w: 0, h: 0 },
      tiles: [],
      lines: []
    };
  };

  this.selection = this.selectionMaker();
  this.selection.map = this;

  this.visibleHoverTile = this.selectionMaker();
  this.visibleHoverTile.map = this;

  this.doneLoading();
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

    if (!this.entityData[entity.filename]) {
      const datafile = jetpack.path(this.dataPath, this.mapedConfigData.path_to_chrs, entity.filename);
      let data = null;

      if (entity.filename.endsWith('chr')) {
        console.warn("entity ('" + entity.filename + "') is binary in format.  Skipping for now.");
        entity.MAPED_USEDEFAULT = true;
        return;
      }

      if (!entity.filename.endsWith('chr') && !entity.filename.endsWith('json')) {
        console.warn("entity ('" + entity.filename + "') has an unknown format.  Skipping for now.");
        entity.MAPED_USEDEFAULT = true;
        return;
      }

      try {
        // TODO: use aen's loaders in MAPPO and convert binary chrs to images and json files, motherfucker!
        data = jetpack.read(datafile, 'json');
      } catch (e) {
        if (entity.filename.endsWith('json')) {
          console.error('Couldnt read a json entity file:', entity.filename);
        }
        console.warn("Totally couldnt read datafile: '" + datafile + "'");
      }

      if (data) {
        this.entityData[entity.filename] = data;

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

        if (!this.entityTextures[data.image]) {
          // TODO maybe make this definable in this.mapedConfigData too?
          let imagePath = jetpack.path(this.dataPath, this.mapedConfigData.path_to_chrs, data.image);
          if (!jetpack.inspect(imagePath)) {
            imagePath += '.png'; // TODO this is stupid and bad and wrong.
          }
          if (!jetpack.inspect(imagePath)) {
            console.warn("Couldn't load image", data.image, 'for entity', entity.filename, '; falling back.');
                        // this.entityData[entity.filename].image = '__default__';
            entity.MAPED_USEDEFAULT = true;
            return;
          }

          console.info("Adding '" + imagePath + "' to entityTextures cache...");
          this.toLoad++;
          this.entityTextures[data.image] = {};
          this.entityTextures[data.image].img = new window.Image();
          this.entityTextures[data.image].img.onload = this.doneLoading;
          this.entityTextures[data.image].img.src = imagePath;
        }

        entity.MAPED_USEDEFAULT = false;
        console.log('NOT USING DEFAULT ENTITY FOR ', data.image);
      } else {
        console.warn("Could not find '" + entity.filename + "', using the default. Path: ", datafile);
        entity.MAPED_USEDEFAULT = true;
      }
    }

    if (entity.filename.endsWith('chr')) {
      console.warn("entity ('" + entity.filename + "') is binary in format.  Skipping for now.");
      entity.MAPED_USEDEFAULT = true;
      return;
    }

    if (!entity.filename.endsWith('chr') && !entity.filename.endsWith('json')) {
      console.warn("entity ('" + entity.filename + "') has an unknown format.  Skipping for now.");
      entity.MAPED_USEDEFAULT = true;
      return;
    }

    if (!entity.MAPED_USEDEFAULT) {
      if (
        this.entityData[entity.filename].regions &&
        this.entityData[entity.filename].regions['Tall_Redraw'] &&
        !this.getEntityTallRedrawLayer()
      ) {
        window.alert('ERROR: Loading tall entity ' + entity.filename + ' with no tallentitylayer in map!');
      }

      entity.animation = entity.animation || Object.keys(this.entityData[entity.filename].animations)[0];
    } else {
      entity.animation = 'Idle Down'; // / m-m-m-magick (__default__ has this)
    }
  },
  addEntity: function (filename, location) {
    this.addEntityWithoutSort(filename, location);
    this.entities[location.layer].sort(function (a, b) {
      if (a.location.py && b.location.py) {
        return a.location.py - b.location.py; // TODO almost certainly wrong; probably should convery from ty -> py if
                                              //      no py and then compare py.
      }
      return a.location.ty - b.location.ty;
    });
  },

  getVSPTileLocation: function (vsp, idx) {
    let x = null;
    let y = null;

    y = parseInt(idx / this.vspData[vsp].tiles_per_row);
    x = idx - y * this.vspData[vsp].tiles_per_row;

    y *= this.vspData[vsp].tilesize.height;
    x *= this.vspData[vsp].tilesize.width;

    return {
      x: x,
      y: y
    };
  },

  getZone: function (tileX, tileY) {
    const idx = getFlatIdx(tileX, tileY, this.mapSizeInTiles[0]);

    return this.zoneData[idx];
  },

  setZone: function (tileX, tileY, zoneIdx) {
    const idx = getFlatIdx(tileX, tileY, this.mapSizeInTiles[0]);

    this.zoneData[idx] = zoneIdx;
  },

  getTile: function (tileX, tileY, layerIdx) {
    const idx = getFlatIdx(tileX, tileY, this.mapSizeInTiles[0]);

    if (layerIdx === 998) { // TODO the obs sentinel is the WORST
      if (this.legacyObsData) { // we are in the main map.
        return this.legacyObsData[idx];
      } else if (this.tileData && this.tileData.length === 1) { // we are in the obs map
        layerIdx = 0;
      } else {
        throw new Error(
          'Something very strange happened where you were trying to access obs data when there was both no obs ' +
          'tiledata and multiple non-obs tile layers.');
      }
    }

    return this.tileData[layerIdx][idx];
  },

  setTile: function (tileX, tileY, layerIdx, tileIdx) {
    const idx = getFlatIdx(tileX, tileY, this.mapSizeInTiles[0]);

    if (layerIdx === 998) { // TODO the obs sentinel is the WORST
      this.legacyObsData[idx] = tileIdx;
    } else {
      this.tileData[layerIdx][idx] = tileIdx;
    }
  },

  ready: function () {
    const key = 'map-' + this.mapData.name;
    const $cont = $('.map-palette');

    const setPaletteLocations = function (paletteDict) {
      let configVar = null;
      let obj = null;

      for (const k in paletteDict) {
        // console.info('paletteDict.' + k);
        configVar = k + ' settings'; // this should be CONST'd somewhere and referenced in both places
        const $pal = $('.' + k);

        // console.info('configVar: ' + configVar);
        // console.info('$pal: ' + $pal);
        // console.info('localStorage[configVar]: ' + localStorage[configVar]);

        if (localStorage[configVar] && $pal) {
          obj = JSON.parse(localStorage[configVar]);

          if (obj.w) { $pal.width(obj.w); }
          if (obj.h) { $pal.height(obj.h); }
          if (obj.x) { $pal.css('left', obj.x); }
          if (obj.y) { $pal.css('top', obj.y); }
          obj.hide ? $pal.hide() : $pal.show();
        } else {
          console.info('lol, no');
        }
      }
    };

    const localStorage = window.localStorage;

    if (localStorage[key] + '-mapx') {
      // TODO This is weird.  Why is the map palette being set here and then again in setPaletteLocations?
      if (localStorage[key + '-width']) { $cont.width(localStorage[key + '-width']); }
      if (localStorage[key + '-height']) { $cont.height(localStorage[key + '-height']); }
      if (localStorage[key + '-top']) { $cont.css('top', localStorage[key + '-top']); }
      if (localStorage[key + '-left']) { $cont.css('left', localStorage[key + '-left']); }
      if (localStorage[key + '-mapx']) { this.camera[0] = parseInt(localStorage[key + '-mapx']); }
      if (localStorage[key + '-mapy']) { this.camera[1] = parseInt(localStorage[key + '-mapy']); }

      if (localStorage[key + '-layerspallete']) { this.camera[1] = parseInt(localStorage[key + '-mapy']); }

      if (localStorage['palettes']) {
        console.info('palletes found...');
        setPaletteLocations(JSON.parse(localStorage['palettes']));
      } else {
        console.warn('no palettes registered.');
      }
    }

    return this.readyPromise;
  },

  uniqueLayerName: function (like) {
    if (like && !this.layerLookup[like]) { return like; }
    if (!like) { like = 'Layer 0'; } // will have 1 added to the 0 so unnamed layers will be Layer 1, Layer 2, etc.

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

  setCanvas: function ($canvas) {
    console.info('Setting canvas on map');
    if (this.renderContainer) { this.cleanUpCallbacks(); }

        // set up callbacks
    $(window).on('resize', this.resize.bind(this));

        // set up context
    this.renderContainer = $canvas;
    this.gl = this.renderContainer[0].getContext('webgl'); // we're targeting Electron not the Internet at large so
                                                           // don't worry about failing to get a GL context
    this.gl.clearColor(0.5, 0.5, 0.5, 1.0);

    const readShader = (path) => {
      const p = jetpack.path(appPath, 'app', path);
      const res = jetpack.read(p);
      return res;
    };

    this.checkerShader = new ShaderProgram(
      this.gl, readShader('shaders/tilemap-vert.glsl'), readShader('shaders/check-frag.glsl'));
    this.tilemapShader = new ShaderProgram(
      this.gl, readShader('shaders/tilemap-vert.glsl'), readShader('shaders/tilemap-frag.glsl'));
    this.spriteShader = new ShaderProgram(
      this.gl, readShader('shaders/sprite-vert.glsl'), readShader('shaders/sprite-frag.glsl'));
    this.obstructionmapShader = new ShaderProgram(
      this.gl, readShader('shaders/tilemap-vert.glsl'), readShader('shaders/tilemapObs-frag.glsl'));
    this.zonemapShader = new ShaderProgram(
      this.gl, readShader('shaders/tilemap-vert.glsl'), readShader('shaders/tilemap-frag.glsl'));
    this.selectionShader = new ShaderProgram(
      this.gl, readShader('shaders/selection-vert.glsl'), readShader('shaders/selection-frag.glsl'));

    this.tileLibraryTextures = {};
    for (const k in this.vspImages) {
      if (!this.vspImages[k]) { return; }
      this.tileLibraryTextures[k] = this.gl.createTexture();
      this.gl.bindTexture(this.gl.TEXTURE_2D, this.tileLibraryTextures[k]);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
      this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.vspImages[k]);
    }

    this.tileLayoutTexture = this.gl.createTexture();
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.tileLayoutTexture);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
    this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
    this.gl.texImage2D(
      this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.mapData.layers[0].dimensions.X, this.mapData.layers[0].dimensions.Y,
      0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, buildTileDataTexture(this.tileData[0])
    );

    this.gl.enable(this.gl.BLEND);

    this.vertexbuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexbuffer);

    this.entityVertexBuffer = this.gl.createBuffer();
    this.selectionVertexBuffer = this.gl.createBuffer();

    for (const k in this.entityTextures) {
      const texture = this.entityTextures[k];

      texture.tex = this.gl.createTexture();
      this.gl.bindTexture(this.gl.TEXTURE_2D, texture.tex);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
      this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, texture.img);
    }

    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([
      0.0, 0.0,
      this.mapSizeInTiles[0], 0.0,
      0.0, -this.mapSizeInTiles[1],
      0.0, -this.mapSizeInTiles[1],
      this.mapSizeInTiles[0], 0.0,
      this.mapSizeInTiles[0], -this.mapSizeInTiles[1]
    ]), this.gl.STATIC_DRAW);

        // make sure the size is right
    this.resize();

    if (this.onLoad) {
      this.onLoad(this);
    }
  },

  drawEntities: function (i, map, layer, tallEntities, tick) {
    // Layered Entities
    if (getNormalEntityVisibility()) {
      if (map.entities[layer.name] && map.entities[layer.name].length > 0 && shouldShowEntitiesForLayer(layer.name)) {
        const entities = map.entities[layer.name];

        const showEntityPreview = (getSelectedLayer() && layer === getSelectedLayer().layer && map.entityPreview);
        map.spriteShader.use();

        for (let e = 0; e < entities.length; e++) {
          if (showEntityPreview &&
              map.entityPreview.location.ty < entities[e].location.ty && // TODO this whole check should favor py.
              (e === 0 || map.entityPreview.location.ty >= entities[e - 1].location.ty)
          ) {
            map.renderEntity(map.entityPreview, layer, [1, 1, 1, ENTITY_PREVIEW_ALPHA]);
          }
          if (entities[e].MAPED_HIGHLIGHTED) {
            map.renderEntity(entities[e], layer, [HIGHLIGHT_R, HIGHLIGHT_G, HIGHLIGHT_B, animateAlpha(tick, 100)]);
          } else {
            map.renderEntity(entities[e], layer, [1, 1, 1, 1]);
          }
          if (!entities[e].MAPED_USEDEFAULT && map.entityData[entities[e].filename].regions &&
              map.entityData[entities[e].filename].regions['Tall_Redraw']) {
            tallEntities.push(entities[e]);
          }
        }
      } else if (map.entityPreview) {
        map.spriteShader.use();
        map.renderEntity(map.entityPreview, layer, [1, 1, 1, ENTITY_PREVIEW_ALPHA]);
      }

      if (map.getEntityTallRedrawLayer() === layer) {
        map.spriteShader.use();
        for (const e in tallEntities) {
          const entity = tallEntities[e];
          map.renderEntity(entity, layer, [TALLENT_R, TALLENT_G, TALLENT_B, TALLENT_A], map.entityData[entity.filename].regions['Tall_Redraw']);
        }
      }
    }
  },

  maybeRenderZones: function (gl) {
    // ZONES
    if (getZoneVisibility() && this.zoneData.length > 1) {
      const vsp = 'zones'; // TODO zones layer shouldn't just default like this
      const layer = {
        parallax: { X: 1, Y: 1 },
        alpha: getZoneAlpha(),
        dimensions: this.mapData.layers[0].dimensions // TODO this shouldnt be where layer dims are defined.
      };

      this.tilemapShader.use();

      gl.uniform4f(this.tilemapShader.uniform('u_camera'),
                Math.floor(layer.parallax.X * this.camera[0]) / this.vspData[vsp].tilesize.width,
                Math.floor(layer.parallax.Y * this.camera[1]) / this.vspData[vsp].tilesize.height,
                this.camera[2] * this.renderContainerDimensions.w / this.vspData[vsp].tilesize.width,
                this.camera[2] * this.renderContainerDimensions.h / this.vspData[vsp].tilesize.height
            );

      gl.uniform4f(this.tilemapShader.uniform('u_dimensions'),
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
        gl.TEXTURE_2D, 0, gl.RGBA, layer.dimensions.X, layer.dimensions.Y, 0,
        gl.RGBA, gl.UNSIGNED_BYTE, buildTileDataTexture(this.zoneData)
      );

      const a_position = this.tilemapShader.attribute('a_position');
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexbuffer);
      gl.enableVertexAttribArray(a_position);
      gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
  },

  maybeRenderObstructions: function (gl) {
    // OBSTRUCTIONS
    if (getObsVisibility() && this.legacyObsData) {
      const vsp = 'obstructions'; // TODO obstruction layer shouldn't just default like this
      const layer = {
        parallax: { X: 1, Y: 1 },
        dimensions: this.mapData.layers[0].dimensions // TODO this shouldnt be where layer dims are defined.
      };

      this.obstructionmapShader.use();

      gl.uniform4f(this.obstructionmapShader.uniform('u_camera'),
        Math.floor(layer.parallax.X * this.camera[0]) / this.vspData[vsp].tilesize.width,
        Math.floor(layer.parallax.Y * this.camera[1]) / this.vspData[vsp].tilesize.height,
        this.camera[2] * this.renderContainerDimensions.w / this.vspData[vsp].tilesize.width,
        this.camera[2] * this.renderContainerDimensions.h / this.vspData[vsp].tilesize.height
      );

      gl.uniform4f(this.obstructionmapShader.uniform('u_dimensions'),
        layer.dimensions.X,
        layer.dimensions.Y,
        this.vspData[vsp].tiles_per_row,
        this.vspImages[vsp].height / this.vspData[vsp].tilesize.height
      );

      gl.uniform4f(
        this.obstructionmapShader.uniform('u_color'),
        __obsColor[0], __obsColor[1], __obsColor[2], __obsColor[3]
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
        gl.TEXTURE_2D, 0, gl.RGBA, layer.dimensions.X, layer.dimensions.Y, 0,
        gl.RGBA, gl.UNSIGNED_BYTE, buildTileDataTexture(this.legacyObsData)
      );

      const a_position = this.obstructionmapShader.attribute('a_position');
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexbuffer);
      gl.enableVertexAttribArray(a_position);
      gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
  },

  renderTilesAndEntityLayers: function (gl, tick) {
    const tallEntities = [];

    // render each layer in turn

    this.gl.blendFuncSeparate(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA, this.gl.SRC_ALPHA, this.gl.DST_ALPHA);
    const len = this.layerRenderOrder.length;
    for (let i = 0; i < len; i++) {

      // something about optimization means this runs 2x faster if renderLayer is its own function
      // <Tene> 100% glad that I've avoided javascript so far
      this.renderLayer(gl, i, tallEntities, tick);
    }
  },

  renderLayer: function (gl, i, tallEntities, tick) {
    const layerIndex = parseInt(this.layerRenderOrder[i], 10) - 1;
    const layer = this.mapData.layers[layerIndex];

    if (this.layerRenderOrder[i] === 'E') {
      this.drawEntities(i, this, this.fakeEntityLayer, tallEntities, tick);
      return;
    }
    if (isNaN(layerIndex)) {
      return;
    }
    if (layer.MAPED_HIDDEN) {
      return;
    }

    const vsp = layer.vsp;

    this.tilemapShader.use();

    gl.uniform4f(this.tilemapShader.uniform('u_camera'),
      Math.floor(layer.parallax.X * this.camera[0]) / this.vspData[vsp].tilesize.width,
      Math.floor(layer.parallax.Y * this.camera[1]) / this.vspData[vsp].tilesize.height,
      this.camera[2] * this.renderContainerDimensions.w / this.vspData[vsp].tilesize.width,
      this.camera[2] * this.renderContainerDimensions.h / this.vspData[vsp].tilesize.height
    );

    gl.uniform4f(this.tilemapShader.uniform('u_dimensions'),
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
      gl.TEXTURE_2D, 0, gl.RGBA, layer.dimensions.X, layer.dimensions.Y, 0,
      gl.RGBA, gl.UNSIGNED_BYTE, buildTileDataTexture(this.tileData[layerIndex])
    );

    const a_position = this.tilemapShader.attribute('a_position');
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexbuffer);
    gl.enableVertexAttribArray(a_position);
    gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    this.drawEntities(i, this, layer, tallEntities, tick);
  },

  maybeRenderMarchingAnts: function (gl, selection) {
    const vsp = 'default'; // TODO this is definitely wrong. Definitely if we allow vsp size mixing.

    // MARCHING ANTS
    if (selection.lines.length > 0 && typeof vsp !== 'undefined') {
      // TODO remove these fake layer shenanegans
      // TODO something smells about getSelectedLayer().layer
      const layer = getSelectedLayer() ? getSelectedLayer().layer : {
        parallax: { X: 1, Y: 1 },
        dimensions: this.mapData.layers[0].dimensions
      };

      this.selectionShader.use();
      gl.uniform4f(
        this.selectionShader.uniform('u_camera'),
        Math.floor(layer.parallax.X * this.camera[0]) / this.vspData[vsp].tilesize.width,
        Math.floor(layer.parallax.Y * this.camera[1]) / this.vspData[vsp].tilesize.height,
        this.camera[2] * this.renderContainerDimensions.w / this.vspData[vsp].tilesize.width,
        this.camera[2] * this.renderContainerDimensions.h / this.vspData[vsp].tilesize.height
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
      this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(selection.lines), this.gl.STATIC_DRAW);

      gl.drawArrays(gl.LINES, 0, selection.lines.length / 2);
    }
  },

  render: function () {
    const gl = this.gl;
    const tick = Date.now();

    this.renderContainerDimensions = {
      w: this.renderContainer.width(),
      h: this.renderContainer.height()
    };

    this.renderBackground(gl);

    this.renderTilesAndEntityLayers(gl, tick);

    this.maybeRenderObstructions(gl);

    this.maybeRenderZones(gl);

    this.maybeRenderMarchingAnts(gl, this.selection);

    this.maybeRenderMarchingAnts(gl, this.visibleHoverTile);

    // uncomment these to get frame render times
    // const tock = new Date().getTime();
    // console.log((tock-tick) + 'ms to render');
  },

  renderBackground: function (gl) {
    gl.clear(gl.COLOR_BUFFER_BIT);

    // fill the map part of display with transparent pixels, first

    var layer = this.layers[0]; // sigh

    this.gl.blendFunc(this.gl.ONE, this.gl.ZERO);

    this.checkerShader.use();

    gl.uniform4f(this.checkerShader.uniform('u_camera'),
      Math.floor(this.camera[0]) / this.vspData[layer.vsp].tilesize.width,
      Math.floor(this.camera[1]) / this.vspData[layer.vsp].tilesize.height,
      this.camera[2] * this.renderContainerDimensions.w / this.vspData[layer.vsp].tilesize.width,
      this.camera[2] * this.renderContainerDimensions.h / this.vspData[layer.vsp].tilesize.height
    );

    gl.uniform4f(this.checkerShader.uniform('u_dimensions'),
      layer.dimensions.X,
      layer.dimensions.Y,
      this.vspData[layer.vsp].tiles_per_row,
      this.vspImages[layer.vsp].height / this.vspData[layer.vsp].tilesize.height
    );

    gl.uniform4f(this.checkerShader.uniform('u_colorA'), 0.75, 0.75, 0.75, 1.0);
    gl.uniform4f(this.checkerShader.uniform('u_colorB'), 1.0, 1.0, 1.0, 1.0);

    const a_position = this.checkerShader.attribute('a_position');
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexbuffer);
    gl.enableVertexAttribArray(a_position);
    gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  },

  cleanEntities: function () {
    for (let i = this.mapData.entities.length - 1; i >= 0; i--) {
      if (this.mapData.entities[i].MAPED_USEDEFAULT) {
        delete this.mapData.entities[i].MAPED_USEDEFAULT;
      }
    }
  },

  _getEntityData: function (entity) {
    const e = entity.MAPED_USEDEFAULT ? this.entityData['__default__'] : this.entityData[entity.filename];

    if (!entity.MAPED_USEDEFAULT && e === this.entityData['__default__']) {
      debugger;
    }

    return e;
  },

  renderEntity: function (entity, layer, tint, clip) {
    const gl = this.gl;
    const tilesize = this.vspData[layer.vsp].tilesize;
    const entityData = this._getEntityData(entity);
    const entityTexture = this.entityTextures[entityData.image];

    clip = (clip === undefined ? [0, 0, entityData.dims[0], entityData.dims[1]] : clip);

    const a_vertices = this.spriteShader.attribute('a_vertices');
    gl.bindBuffer(gl.ARRAY_BUFFER, this.entityVertexBuffer);
    gl.enableVertexAttribArray(a_vertices);
    gl.vertexAttribPointer(a_vertices, 4, gl.FLOAT, false, 0, 0);

    let tx;
    let ty;

    if (entity.location.px && entity.location.px) {
      tx = entity.location.px / tilesize.width;
      ty = entity.location.py / tilesize.height;
    } else {
      tx = entity.location.tx;
      ty = entity.location.ty;
    }

    tx -= (entityData.hitbox[0] / tilesize.width);
    ty -= (entityData.hitbox[1] / tilesize.height);

    const tw = clip[2] / tilesize.width;
    const th = clip[3] / tilesize.height;

    let fx = (entityData.outer_pad + clip[0]) / entityTexture.img.width;
    let fy = (entityData.outer_pad + clip[1]) / entityTexture.img.height;
    const fw = clip[2] / entityTexture.img.width;
    const fh = clip[3] / entityTexture.img.height;

    const f = entityData.animations[entity.animation][0][0][0];
    fx += ((entityData.dims[0] + entityData.inner_pad) / entityTexture.img.width) * (f % entityData.per_row);
    fy += ((entityData.dims[1] + entityData.inner_pad) / entityTexture.img.height) * Math.floor(f / entityData.per_row);

    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([
      tx, -ty, fx, fy,
      tx + tw, -ty, fx + fw, fy,
      tx, -ty - th, fx, fy + fh,
      tx + tw, -ty - th, fx + fw, fy + fh,
      tx, -ty - th, fx, fy + fh,
      tx + tw, -ty, fx + fw, fy
    ]), this.gl.STATIC_DRAW);

    gl.uniform4f(
      this.spriteShader.uniform('u_camera'),
      Math.floor(layer.parallax.X * this.camera[0]) / tilesize.width,
      Math.floor(layer.parallax.Y * this.camera[1]) / tilesize.height,
      this.camera[2] * this.renderContainerDimensions.w / tilesize.width,
      this.camera[2] * this.renderContainerDimensions.h / tilesize.height
    );

    gl.uniform4f(this.spriteShader.uniform('u_tint'), tint[0], tint[1], tint[2], tint[3]);

    const u_texture = this.tilemapShader.uniform('u_spriteAtlas');
    gl.uniform1i(u_texture, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, entityTexture.tex);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  },

  cleanUpCallbacks: function () {
    this.renderContainer.off(undefined, undefined, this);
  },

  resize: function () {
    if (!this.renderContainer || !this.gl) { return; }
    var w = this.renderContainer.width();
    var h = this.renderContainer.height();
    this.renderContainer.attr('width', w);
    this.renderContainer.attr('height', h);
    this.gl.viewport(0, 0, w, h);
  }
};
