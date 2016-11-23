var app = require('remote').require('app');
var path = require('path');
var jetpack = require('fs-jetpack').cwd(app.getAppPath());
import { ShaderProgram } from "./ShaderProgram.js";
import { Tools } from "./Tools.js";
import { getNormalEntityVisibility, shouldShowEntitiesForLayer } from './js/ui/EntityPalette.js'
var sprintf = require("sprintf-js").sprintf;

function buildTileDataTexture(data) {    
    var out = new Uint8Array(data.length * 4);
    for (var i = 0; i < data.length; i++) {
        var t = data[i];
        out[i * 4 + 0] = t % 256;
        out[i * 4 + 1] = (t >> 8) % 256;
        out[i * 4 + 2] = (t >> 16) % 256;
        out[i * 4 + 3] = (t >> 24) % 256;
    }
    return out;
}

var __obsColor = [1, 1, 1, 0.5];
function setColor(r,g,b,a) {
    __obsColor = [r,g,b,a];
}

export var verifyTileData = (mapdatafile) => {
    var promiseResolver;
    var promiseRejecter;
    var readyPromise = new Promise(function(resolve, reject) {
        promiseResolver = resolve;
        promiseRejecter = reject;
    });

    console.log("No verification done on tile data yet...");

    promiseResolver();

    return readyPromise;
}; 

var saveData = (mapFile, mapData) => {
    var app = require('remote').require('app');
    var jetpack = require('fs-jetpack').cwd(app.getAppPath());

    var map = window.$$$currentMap;

    jetpack.write(mapFile, mapData);
};


var verifyPromiseResolver;
var verifyPromiseRejecter;

export var verifyMap = (mapfile) => {
    var remote = require('remote');
    var dialog = remote.require('dialog');

    var readyPromise = new Promise(function(resolve, reject) {
        verifyPromiseResolver = resolve;
        verifyPromiseRejecter = reject;
    });

    var mapData = jetpack.read( mapfile, 'json' );

    var needsDefault = false;
    var needsObstructions = false;

    if( typeof mapData.vsp == "string" ) {
        //alert("Detected old format vsps: '"+mapdata.vsp+"'.\n\nPlease select a json vsp for the map's default and a second one for the obstructions.");
        needsDefault = true;
        needsObstructions = true;
    } else {
        if( !mapData.vsp['default'] ) {
            needsDefault = true;            
        }

        if( !mapData.vsp['obstructions'] ) {
            needsObstructions = true;            
        }
    } 

    if( typeof mapData.vsp != "object" ) {
        mapData.vsp = {};
    }

    var filenames;
    var filename;

    if( needsDefault ) {
        alert("Due to sins (surely on your part) you do not have a default tile vsp set.  Please select the correct one.");

        filenames = dialog.showOpenDialog({
                title:'Choose a default tileset',
                filters: [{  name: "tileset", extensions: ['vsp.json'] }]
            }
        );

        filename = filenames[0].replace(path.dirname(mapfile) + path.sep,'')
        
        mapData.vsp["default"] = filename;
    } 

    if( needsObstructions ) {
        alert("Please select the obstruction tileset for this map.");

        filenames = dialog.showOpenDialog({
                title:'Choose an obstruction tileset',
                filters: [{  name: "tileset", extensions: ['obsvsp.json'] }]
            }
        );

        filename = filenames[0].replace(path.dirname(mapfile) + path.sep,'')
        
        mapData.vsp["obstructions"] = filename;
    }

    for (var i = mapData.layers.length - 1; i >= 0; i--) {
        if( !mapData.layers[i].vsp ) {f
            console.log('setting layer['+i+']s vsp to default...');
            mapData.layers[i].vsp = 'default';
        }
    }

    saveData( mapfile, mapData );

    verifyPromiseResolver();

    return readyPromise;
};

export var Map = function(mapfile, mapdatafile, updateLocationFunction) {
    var i;
    console.info("Loading map", mapfile);

    if( typeof mapfile != typeof mapdatafile ) {
        throw sprintf("type mismatch on mapfile and mapdatafile.  both must be object or string. got: '%s', '%s'", typeof mapfile, typeof mapdatafile); 
    }

    var FILELOAD_MODE = (typeof mapfile == "string");

    this.filenames = {};

    if( FILELOAD_MODE ) {
        this.filenames.mapfile = mapfile;
        this.filenames.mapdatafile = mapdatafile;
    }

    this.dataPath = path.dirname(mapdatafile);

    this.mapedConfigFile = path.join(this.dataPath,"$$$_MAPED.json")

    this.updateLocationFn = updateLocationFunction;

    this.readyPromise = new Promise(function(resolve, reject) {
        this.promiseResolver = resolve;
        this.promiseRejecter = reject;
    }.bind(this));

    if( FILELOAD_MODE ) {
        this.mapData = jetpack.read( mapfile, 'json' );
        this.mapPath = mapfile;
    } else {
        this.mapData = mapfile;
        this.mapPath = "There is no path, this was pure data ya dummy.";
    }
    
    this.mapedConfigData = jetpack.read( this.mapedConfigFile, 'json' );

    this.filenames.vspfiles = this.mapData.vsp;    
    
    // for "E" layer rendering
    this.fakeEntityLayer = {
        name: "Entity Layer (E)",
        parallax: {
            X: 1,
            Y: 1,
        },
        vsp: "default"
    }

    this.updateRstring = (rstring) => {

        if( typeof rstring === "string" ) {
            console.log("Setting new rstring: '"+rstring+"'");
            this.layerRenderOrder = rstring.split(",");        
        } else if(typeof rstring.length == "number") {
            console.log("Setting new rstring: '");
            console.log(rstring);

            this.layerRenderOrder = rstring;
        } else {
            throw "What fresh hell is this.  What are you throwing at updateRstring?!";
        }

        this.mapData.renderstring = this.layerRenderOrder.join(",");

        Tools.updateRstringInfo()
    };

    this.updateRstring( this.mapData.renderstring );
    this.mapSizeInTiles = [0,0];
    this.layerLookup = {};

    /// YOU BIG FAT PHONY
    this.layerLookup[this.fakeEntityLayer.name] = this.fakeEntityLayer;

    for (i = 0; i < this.mapData.layers.length; i++) {
        //if (this.mapData.layers[i].MAPED_HIDDEN)  { continue; }

        if (this.mapData.layers[i].dimensions.X > this.mapSizeInTiles[0]) this.mapSizeInTiles[0] = this.mapData.layers[i].dimensions.X;
        if (this.mapData.layers[i].dimensions.Y > this.mapSizeInTiles[1]) this.mapSizeInTiles[1] = this.mapData.layers[i].dimensions.Y;

        var layerName = this.uniqueLayerName(this.mapData.layers[i].name);
        this.mapData.layers[i].name = layerName; // clean up the non unique name if necessary
        this.layerLookup[layerName] = this.mapData.layers[i];
    }
    this.camera = [0, 0, 1];

    if( FILELOAD_MODE ) {
        this.mapRawTileData = jetpack.read(mapdatafile, 'json') // zone_data: [{x,y,z}, ...]    
    } else {
        this.mapRawTileData = mapdatafile;   
    }
    
    this.legacyObsData = this.mapRawTileData.legacy_obstruction_data;
    this.tileData = this.mapRawTileData.tile_data;

    var tmpZones;
    tmpZones = this.mapRawTileData.zone_data;
    this.zoneData = new Array(this.tileData[0].length);

    $.each(tmpZones, (idx) => {
        // todo verify this is right
        this.zoneData[getFlatIdx(tmpZones[idx].x, tmpZones[idx].y,this.mapSizeInTiles[0])] = tmpZones[idx].z;
     } );
     console.info("zones ->", this.zoneData);

    this.vspData = {};

    // if( FILELOAD_MODE ) {
        for (var k in this.filenames.vspfiles) {
            let tmppath = path.join( this.dataPath, this.filenames.vspfiles[k] );
            console.info( "Loading '"+tmppath+"'..." );
            this.vspData[k] = jetpack.read(tmppath, 'json');
            console.info(k, "->", this.vspData[k]);
        }        
    // } else {
    //     debugger;
    // }

    // todo: stop being evil
    // todo: that probably won't happen. MWAHAHAHAHHA.
    this.vspData["zones"] = $.extend(true, {}, this.vspData["obstructions"]);

    this.vspData["zones"].source_image = path.join(window.appPath, "/images/zones.png");

    this.compactifyZones = () => {
        // zone_data: [{x,y,z}, ...]

        var tmpZones, x, y;
        tmpZones = [];

        // walk the in-memory zoneData layer, anything with zone >0, add.
        $.each(this.zoneData, (idx) => {
            if(this.zoneData[idx] > 0) {
                x = getXfromFlat( idx, 20 ) //todo : variable vsp width for zones.
                y = getYfromFlat( idx, 20 ) //todo : variable vsp width for zones.
            }
        } );
    };

    this.toLoad = 1;
    this.doneLoading = function() {
        this.toLoad--;
        if (this.toLoad === 0) this.promiseResolver(this);
    }.bind(this);

    this.vspImages = {};
    for (k in this.vspData) {
        var vsp = this.vspData[k];
        if (!vsp) continue;
        // TODO probably actually want to fail the load or do something other than
        // just silently carry on when the image can't be loaded

        let tmppath = path.join( this.dataPath, this.vspData[k].source_image );

        this.toLoad++;
        this.vspImages[k] = new Image();
        this.vspImages[k].onload = this.doneLoading;


        if( k != "zones" ) { // TODO: a better solution to map-relative assets versus app-relative assets.  THIS IS SAD AND PATHETIC AND SADTHETIC
            this.vspImages[k].src = tmppath;
        } else {
            this.vspImages[k].src = this.vspData[k].source_image;
        }
    }

    this.toLoad++;
    this.entityTextures = {
        '__default__': { img: new Image() }
    };
    this.entityTextures['__default__'].img.onload = this.doneLoading;
    this.entityTextures['__default__'].img.src =  path.join(window.appPath, "/images/defaultsprite.png");

    var defaultEntityLayer = this.fakeEntityLayer.name;

    this.entityData = {
        '__default__': {
            animations: { "Idle Down": [ [ [ 0, 100 ] ], "Looping" ] },
            animation: "Idle Down",
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
        this.entities = {};
        for (i = 0; i < this.mapData.entities.length; i++) {
            var entity = this.mapData.entities[i];
            // console.log(entity);

            entity.location.layer = entity.location.layer || defaultEntityLayer;
            this.addEntityWithoutSort(entity, entity.location, false);
        }

        for (var i in this.entities) {
            if (this.entities[i]) {
                console.info("Sorting entities on layer", i, ", ", this.entities[i].length, "entities to sort");
                this.entities[i].sort(function(a, b) {
                    return a.location.ty - b.location.ty;
                });
            }
        }        
    };

    this.createEntityRenderData();

    this.renderContainer = null;

    this.selection = {
        add: function(x, y, w, h) {
            if (x < this.hull.x || this.hull.x === null) this.hull.x = x;
            if (y < this.hull.y || this.hull.y === null) this.hull.y = y;
            if (x + w > this.hull.x + this.hull.w) this.hull.w = x + w;
            if (y + h > this.hull.y + this.hull.h) this.hull.h = y + h;

            var ix, iy, i;
            for (iy = 0; iy < h; iy++) {
                for (ix = 0; ix < w; ix++) {
                    i = getFlatIdx(x + ix, y + iy, this.map.mapSizeInTiles[0]);
                    this.tiles[i] = true;
                }
            }

            this.recalculateLines();
        },
        remove: function(x, y, w, h) {
            // TODO update hull -- it's much harder to recalc the hull on subtraction

            var ix, iy, i;
            for (iy = 0; iy < h; iy++) {
                for (ix = 0; ix < w; ix++) {
                    i = getFlatIdx(x + ix, y + iy, this.map.mapSizeInTiles[0]);
                    this.tiles[i] = false;
                }
            }

            this.recalculateLines();
        },
        deselect: function() {
            hull.x = null;
            hull.y = null;
            hull.w = 0;
            hull.h = 0;

            tiles = [];
            lines = [];
        },

        // "private"
        recalculateLines: function() {
            this.lines = [];

            var mapWidth = this.map.mapSizeInTiles[0];
            var x, y, i;
            for (y = this.hull.y; y < this.hull.y + this.hull.h; y++) {
                for (x = this.hull.x; x < this.hull.x + this.hull.w; x++) {
                    i = getFlatIdx(x, y, mapWidth);
                    if (this.tiles[i] != this.tiles[i - 1]) this.lines.push(x, y, x, y + 1);
                    if (this.tiles[i] != this.tiles[i - mapWidth]) this.lines.push(x, y, x + 1, y);
                }
            }

            console.info("Recalculated lines:");
            console.info(this.hull);
            console.info(this.tiles);
            console.info(this.lines);
        },

        hull: { x:null, y:null, w:0, h:0 },
        tiles: [],
        lines: []
    };
    this.selection.map = this;

    //// Test selection drawing!
    // this.selection.add(40, 35, 6, 5);
    // this.selection.remove(41, 36, 1, 2);

    this.doneLoading();
};

function getFlatIdx( x, y, width ) {
    return parseInt(width, 10) * parseInt(y, 10) + parseInt(x, 10);
}

// extracts the first dimension of a flat-indexed 2 dimensionally array given 
// the second dimension's maximum value and the value of the flat index you
// wish to extract the first dimension's value from.
//
function getXfromFlat( idx, numColumns ) {
    return idx%numColumns;
}

// extracts the second dimension of a flat-indexed 2 dimensionally array given 
// the second dimension's maximum value and the value of the flat index you
// wish to extract the second dimension's value from.
//
function getYfromFlat( idx, numColumns ) {
    var flatval = idx - getXfromFlat( idx,numColumns );
    return parseInt(flatval/numColumns);
}

Map.prototype = {
    addEntityWithoutSort(entity, location) {
        if (!this.entities[location.layer]) {
            this.entities[location.layer] = [];
        }
        this.entities[location.layer].push(entity);

        if (!this.entityData[entity.filename]) {
            var datafile = jetpack.path(this.dataPath, this.mapedConfigData.path_to_chrs, entity.filename);
            var data;
        
            try {
                data = jetpack.read(datafile, 'json');
            } catch(e) {
                console.log( "Totally couldnt read datafile: '"+datafile+"'" );
            }
             
            if (data) {
                this.entityData[entity.filename] = data;

                for (var name in data.animations) {
                    // convert short-hand to useful-hand
                    if (typeof data.animations[name][0] === "string") {
                        var chunks = data.animations[name][0].split(" ");
                        var t = parseInt(chunks.shift().substring(1), 10);

                        data.animations[name][0] = [];
                        for (var f = 0; f < chunks.length; f++) {
                            data.animations[name][0].push([parseInt(chunks[f], 10), t]);
                        }
                    }
                }

                if (!this.entityTextures[data.image]) {
                    var imagePath = jetpack.path(this.dataPath, this.mapedConfigData.path_to_chrs, data.image); // TODO maybe make this definable in this.mapedConfigData too?
                    if (!jetpack.inspect(imagePath)) {
                        imagePath += ".png"; // TODO this is stupid and bad and wrong. 
                    }
                    if (!jetpack.inspect(imagePath)) {
                        console.warn("Couldn't load image", data.image, "for entity", entity.filename, "; falling back.");
                        //this.entityData[entity.filename].image = '__default__';
                        entity.MAPED_USEDEFAULT = true;
                        return;
                    }

                    this.toLoad++;
                    this.entityTextures[data.image] = {};
                    this.entityTextures[data.image].img = new Image();
                    this.entityTextures[data.image].img.onload = this.doneLoading;
                    this.entityTextures[data.image].img.src = imagePath;
                }

                entity.MAPED_USEDEFAULT = false;
            } else {
                console.warn("Could not find '"+entity.filename+"', using the default. Path: ", datafile);
                entity.MAPED_USEDEFAULT = true;
            }
        }

        if( !entity.MAPED_USEDEFAULT ) {
            if (this.entityData[entity.filename].regions && this.entityData[entity.filename].regions['Tall_Redraw'] && !this.mapData.tallentitylayer) {
                alert("ERROR: Loading tall entity " + entity.filename + " with no tallentitylayer in map!");
            }

            entity.animation = entity.animation || Object.keys(this.entityData[entity.filename].animations)[0];            
        } else {
            entity.animation = "Idle Down"; /// m-m-m-magick (__default__ has this)
        }

    },

    addEntity: function(filename, location) {
        this.addEntityWithoutSort(filename, location);
        this.entities[location.layer].sort(function(a, b) {
            if( a.location.py && b.location.py ) {
                returna.location.py - b.location.py; // TODO almost certainly wrong; probably should convery from ty -> py if no py and then compare py.
            }
            return a.location.ty - b.location.ty;
        });
    },

    getVSPTileLocation: function(vsp, idx) {
        var x, y;

        y = parseInt(idx / this.vspData[vsp].tiles_per_row);
        x = idx - y*this.vspData[vsp].tiles_per_row;

        y *= this.vspData[vsp].tilesize.height;
        x *= this.vspData[vsp].tilesize.width;

        return {
            x: x,
            y: y
        };
    },


    getZone: function( tileX, tileY ) {
        var idx = getFlatIdx(tileX, tileY,this.mapSizeInTiles[0]);

        return this.zoneData[idx]
    },

    setZone: function( tileX, tileY, zoneIdx ) {
        var idx = getFlatIdx(tileX, tileY,this.mapSizeInTiles[0]);

        this.zoneData[idx] = zoneIdx;
    },

    getTile: function( tileX, tileY, layerIdx ) {
        var idx = getFlatIdx(tileX, tileY,this.mapSizeInTiles[0]);

        return this.tileData[layerIdx][idx]
    },

    setTile: function( tileX, tileY, layerIdx, tileIdx ) {
        var idx = getFlatIdx(tileX, tileY,this.mapSizeInTiles[0]);

        this.tileData[layerIdx][idx] = tileIdx;
    },

    ready: function() {

        var key = 'map-'+ this.mapData.name;
        var $cont = $('.map-palette');

        var setPaletteLocations = function(paletteDict) {
            var $pal = null;
            var configVar = null;
            var obj = null;
            var k = null;

            for( k in paletteDict ) {
                console.info( 'paletteDict.' + k );
                configVar = k + ' settings'; // this should be CONST'd somewhere and referenced in both places
                $pal = $('.' + k);

                console.info( 'configVar: ' + configVar );
                console.info( '$pal: ' + $pal );
                console.info( 'localStorage[configVar]: ' + localStorage[configVar] )

                if( localStorage[configVar] && $pal ) {
                    obj = JSON.parse(localStorage[configVar]);

                    console.info('oh yeah: ' + obj);

                    if( obj.w ) { $pal.width(obj.w); }
                    if( obj.h ) { $pal.height(obj.h); }
                    if( obj.x ) { $pal.css('left', obj.x); }
                    if( obj.y ) { $pal.css('top', obj.y); }
                    obj.hide ? $pal.hide() : $pal.show(); 
                } else {
                    console.info('lol, no');
                }
            }
        }

        if( localStorage[key] ) {

            /// TODO This is weird.  Why is the map palette being set here and then again in setPaletteLocations?
            if( localStorage[key+'-width'] )  { $cont.width(localStorage[key+'-width']); }
            if( localStorage[key+'-height'] ) { $cont.height(localStorage[key+'-height']); }
            if( localStorage[key+'-top'] )    { $cont.css( 'top', localStorage[key+'-top']); }
            if( localStorage[key+'-left'] )   { $cont.css( 'left', localStorage[key+'-left']);  }
            if( localStorage[key+'-mapx'] )   { this.camera[0] = parseInt(localStorage[key+'-mapx']); }
            if( localStorage[key+'-mapy'] )   { this.camera[1] = parseInt(localStorage[key+'-mapy']); }

            if( localStorage[key+'-layerspallete'] )   { this.camera[1] = parseInt(localStorage[key+'-mapy']); }

            if( localStorage['palettes'] ) {
                console.info('palletes found...');
                setPaletteLocations( JSON.parse(localStorage['palettes']) );
            } else {
                console.warn('no palettes registered.');
            }
        }

        return this.readyPromise;
    },

    uniqueLayerName: function(like) {
        if (like && !this.layerLookup[like]) return like;
        if (!like) like = "Layer 0"; // will have 1 added to the 0 so unnamed layers will be Layer 1, Layer 2, etc.

        var name = '';
        var num = parseInt(like.match(/\d*$/)[0], 10) || 1; // || 1 so that two layers named "Foo" become "Foo" and "Foo 2"
        var stem = like.replace(/\d*$/, "");
        num++;

        name = stem + num;

        while(this.layerLookup[name]) {
            num++;
            name = stem + num;
        }

        return name;
    },

    setCanvas: function($canvas) {
        console.info("Setting canvas on map");
        if (!!this.renderContainer) this.cleanUpCallbacks();

        // set up callbacks
        $(window).on('resize', this.resize.bind(this));

        // set up context
        this.renderContainer = $canvas;
        this.gl = this.renderContainer[0].getContext('webgl'); // we're targeting Electron not the Internet at large so don't worry about failing to get a GL context
        this.gl.clearColor(0.0, 0.0, 0.0, 0.0);
        this.tilemapShader = new ShaderProgram(this.gl, jetpack.read("../app/shaders/tilemap-vert.glsl"), jetpack.read("../app/shaders/tilemap-frag.glsl"));
        this.spriteShader = new ShaderProgram(this.gl, jetpack.read("../app/shaders/sprite-vert.glsl"), jetpack.read("../app/shaders/sprite-frag.glsl"));
        this.obstructionmapShader = new ShaderProgram(this.gl, jetpack.read("../app/shaders/tilemap-vert.glsl"), jetpack.read("../app/shaders/tilemapObs-frag.glsl"));
        this.zonemapShader = new ShaderProgram(this.gl, jetpack.read("../app/shaders/tilemap-vert.glsl"), jetpack.read("../app/shaders/tilemap-frag.glsl"));

        this.selectionShader = new ShaderProgram(this.gl, jetpack.read("../app/shaders/selection-vert.glsl"), jetpack.read("../app/shaders/selection-frag.glsl"));

        this.tileLibraryTextures = {};
        for (var k in this.vspImages) {
            if (!this.vspImages[k]) return;
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
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.mapData.layers[0].dimensions.X, this.mapData.layers[0].dimensions.Y, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, buildTileDataTexture(this.tileData[0]));

        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
        this.gl.enable(this.gl.BLEND);

        this.vertexbuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexbuffer);

        this.entityVertexBuffer = this.gl.createBuffer();
        this.selectionVertexBuffer = this.gl.createBuffer();

        for (var k in this.entityTextures) {
            var texture = this.entityTextures[k];

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

        if( this.onLoad ) {
            this.onLoad(this);
        }
    },

    drawEntities: function(i, map, layer, tallEntities) {
        /// Layered Entities
        if( getNormalEntityVisibility() ) {
            if (map.entities[layer.name] && map.entities[layer.name].length > 0 && shouldShowEntitiesForLayer(layer.name) ) {
                var entities = map.entities[layer.name];
                var showEntityPreview = (window.selected_layer && layer === window.selected_layer.layer && map.entityPreview);
                map.spriteShader.use();

                for (var e = 0; e < entities.length; e++) {
                    if( showEntityPreview && 
                        map.entityPreview.location.ty < entities[e].location.ty && // TODO this whole check should favor py.
                        (e === 0 || map.entityPreview.location.ty >= entities[e - 1].location.ty)
                    ) {
                        map.renderEntity(map.entityPreview, layer, [1, 1, 1, 0.75]);
                    }
                    map.renderEntity(entities[e], layer, [1,1,1,1]);
                    if (!entities[e].MAPED_USEDEFAULT && map.entityData[entities[e].filename].regions && map.entityData[entities[e].filename].regions['Tall_Redraw']) {
                        tallEntities.push(entities[e]);
                    }
                }
            } else if (map.entityPreview) {
                map.spriteShader.use();
                map.renderEntity(map.entityPreview, layer, [1, 1, 1, 0.75]);
            }

            if (map.mapData.tallentitylayer === i) {
                map.spriteShader.use();
                for (var e in tallEntities) {
                    var entity = tallEntities[e];
                    map.renderEntity(entity, layer, [1, 1, 1, 1], map.entityData[entity.filename].regions['Tall_Redraw']);
                }
            }
        }
    },

    render: function() {
        var gl = this.gl;
        var i = 0;

        gl.clear(gl.COLOR_BUFFER_BIT);

        var tallEntities = [];

        for (i = 0; i < (this.layerRenderOrder.length); i++) {
            var layerIndex;
            var layer;

            layerIndex = parseInt(this.layerRenderOrder[i], 10) - 1;
            layer = this.mapData.layers[layerIndex];

            if( this.layerRenderOrder[i] == 'E' ) {
                this.drawEntities(i, this, this.fakeEntityLayer, tallEntities);
                continue;
            }  
            if (isNaN(layerIndex)) continue;
            if (layer.MAPED_HIDDEN) continue;

            var vsp = layer.vsp;

            this.tilemapShader.use();

            gl.uniform4f(this.tilemapShader.uniform('u_camera'),
                Math.floor(layer.parallax.X * this.camera[0]) / this.vspData[vsp].tilesize.width,
                Math.floor(layer.parallax.Y * this.camera[1]) / this.vspData[vsp].tilesize.height,
                this.camera[2] * this.renderContainer.width() / this.vspData[vsp].tilesize.width,
                this.camera[2] * this.renderContainer.height() / this.vspData[vsp].tilesize.height
            );

            gl.uniform4f(this.tilemapShader.uniform('u_dimensions'),
                layer.dimensions.X,
                layer.dimensions.Y,
                this.vspData[vsp].tiles_per_row,
                this.vspImages[vsp].height / this.vspData[vsp].tilesize.height
            );

            gl.uniform1f(this.tilemapShader.uniform('u_opacity'), layer.alpha);

            var u_tileLibrary = this.tilemapShader.uniform('u_tileLibrary');
            gl.uniform1i(u_tileLibrary, 0);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.tileLibraryTextures[vsp]);

            var u_tileLayout = this.tilemapShader.uniform('u_tileLayout');
            gl.uniform1i(u_tileLayout, 1);
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, this.tileLayoutTexture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, layer.dimensions.X, layer.dimensions.Y, 0, gl.RGBA, gl.UNSIGNED_BYTE, buildTileDataTexture(this.tileData[layerIndex]));

            var a_position = this.tilemapShader.attribute('a_position');
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexbuffer);
            gl.enableVertexAttribArray(a_position);
            gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);

            gl.drawArrays(gl.TRIANGLES, 0, 6);

            this.drawEntities(i, this, layer, tallEntities);
        }

        /// OBSTRUCTIONS
        if (Tools.shouldShowObstructions()) {
            var vsp = 'obstructions';
            // TODO obstruction layer shouldn't just default like this
            var layer = {
                parallax: { X: 1, Y: 1 },
                dimensions: this.mapData.layers[0].dimensions // TODO this shouldnt be where layer dims are defined.
            }

            this.obstructionmapShader.use();

            gl.uniform4f(this.obstructionmapShader.uniform('u_camera'),
                Math.floor(layer.parallax.X * this.camera[0]) / this.vspData[vsp].tilesize.width,
                Math.floor(layer.parallax.Y * this.camera[1]) / this.vspData[vsp].tilesize.height,
                this.camera[2] * this.renderContainer.width() / this.vspData[vsp].tilesize.width,
                this.camera[2] * this.renderContainer.height() / this.vspData[vsp].tilesize.height
            );

            gl.uniform4f(this.obstructionmapShader.uniform('u_dimensions'),
                layer.dimensions.X,
                layer.dimensions.Y,
                this.vspData[vsp].tiles_per_row,
                this.vspImages[vsp].height / this.vspData[vsp].tilesize.height
            );

            gl.uniform4f(this.obstructionmapShader.uniform('u_color'), __obsColor[0], __obsColor[1], __obsColor[2], __obsColor[3]);

            var u_tileLibrary = this.obstructionmapShader.uniform('u_tileLibrary');
            gl.uniform1i(u_tileLibrary, 0);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.tileLibraryTextures[vsp]);

            var u_tileLayout = this.obstructionmapShader.uniform('u_tileLayout');
            gl.uniform1i(u_tileLayout, 1);
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, this.tileLayoutTexture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, layer.dimensions.X, layer.dimensions.Y, 0, gl.RGBA, gl.UNSIGNED_BYTE, buildTileDataTexture(this.legacyObsData));

            var a_position = this.obstructionmapShader.attribute('a_position');
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexbuffer);
            gl.enableVertexAttribArray(a_position);
            gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);

            gl.drawArrays(gl.TRIANGLES, 0, 6);
        }

        /// ZONES
        if (Tools.shouldShowZones()) {
            var vsp = 'zones';
            // TODO zones layer shouldn't just default like this
            var layer = {
                parallax: { X: 1, Y: 1 },
                alpha: Tools.getZonesAlpha(),
                dimensions: this.mapData.layers[0].dimensions // TODO this shouldnt be where layer dims are defined.
            }

            this.tilemapShader.use();

            gl.uniform4f(this.tilemapShader.uniform('u_camera'),
                Math.floor(layer.parallax.X * this.camera[0]) / this.vspData[vsp].tilesize.width,
                Math.floor(layer.parallax.Y * this.camera[1]) / this.vspData[vsp].tilesize.height,
                this.camera[2] * this.renderContainer.width() / this.vspData[vsp].tilesize.width,
                this.camera[2] * this.renderContainer.height() / this.vspData[vsp].tilesize.height
            );

            gl.uniform4f(this.tilemapShader.uniform('u_dimensions'),
                layer.dimensions.X,
                layer.dimensions.Y,
                this.vspData[vsp].tiles_per_row,
                this.vspImages[vsp].height / this.vspData[vsp].tilesize.height
            );

            gl.uniform1f(this.tilemapShader.uniform('u_opacity'), layer.alpha);

            var u_tileLibrary = this.tilemapShader.uniform('u_tileLibrary');
            gl.uniform1i(u_tileLibrary, 0);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.tileLibraryTextures[vsp]);

            var u_tileLayout = this.tilemapShader.uniform('u_tileLayout');
            gl.uniform1i(u_tileLayout, 1);
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, this.tileLayoutTexture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, layer.dimensions.X, layer.dimensions.Y, 0, gl.RGBA, gl.UNSIGNED_BYTE, buildTileDataTexture(this.zoneData));

            var a_position = this.tilemapShader.attribute('a_position');
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexbuffer);
            gl.enableVertexAttribArray(a_position);
            gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);

            gl.drawArrays(gl.TRIANGLES, 0, 6);
        }

        /// MARCHING ANTS
        if (this.selection.lines.length > 0) {
            var layer = window.selected_layer ? window.selected_layer.layer : {
                parallax: { X: 1, Y: 1 },
                dimensions: this.mapData.layers[0].dimensions
            };

            this.selectionShader.use();
            gl.uniform4f(this.selectionShader.uniform('u_camera'),
                Math.floor(layer.parallax.X * this.camera[0]) / this.vspData[vsp].tilesize.width,
                Math.floor(layer.parallax.Y * this.camera[1]) / this.vspData[vsp].tilesize.height,
                this.camera[2] * this.renderContainer.width() / this.vspData[vsp].tilesize.width,
                this.camera[2] * this.renderContainer.height() / this.vspData[vsp].tilesize.height
            );
            gl.uniform4f(this.selectionShader.uniform('u_dimensions'),
                layer.dimensions.X,
                layer.dimensions.Y,
                this.vspData[vsp].tiles_per_row,
                this.vspImages[vsp].height / this.vspData[vsp].tilesize.height
            );
            gl.uniform1i(this.selectionShader.uniform('u_time'), Date.now());

            var a_position = this.selectionShader.attribute('a_position');
            gl.bindBuffer(gl.ARRAY_BUFFER, this.selectionVertexBuffer);
            gl.enableVertexAttribArray(a_position);
            gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);
            this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.selection.lines), this.gl.STATIC_DRAW);

            gl.drawArrays(gl.LINES, 0, this.selection.lines.length / 2);
        }
    },

    renderEntity: function(entity, layer, tint, clip) {
        var gl = this.gl;
        var tilesize = this.vspData[layer.vsp].tilesize;
        var entityData = entity.MAPED_USEDEFAULT ? this.entityData['__default__'] : this.entityData[entity.filename];
        var entityTexture = this.entityTextures[entityData.image]

        clip = (clip === undefined ? [0, 0, entityData.dims[0], entityData.dims[1]] : clip);

        var a_vertices = this.spriteShader.attribute('a_vertices');
        gl.bindBuffer(gl.ARRAY_BUFFER, this.entityVertexBuffer);
        gl.enableVertexAttribArray(a_vertices);
        gl.vertexAttribPointer(a_vertices, 4, gl.FLOAT, false, 0, 0);

        var tx, ty;

        if( entity.location.px && entity.location.px ) {
            tx = entity.location.px / tilesize.width;
            ty = entity.location.py / tilesize.height;
        } else {
            tx = entity.location.tx;
            ty = entity.location.ty; 
        }

        tx -= (entityData.hitbox[0] / tilesize.width);
        ty -= (entityData.hitbox[1] / tilesize.height);

        var tw = clip[2] / tilesize.width;
        var th = clip[3] / tilesize.height;

        var fx = (entityData.outer_pad + clip[0]) / entityTexture.img.width;
        var fy = (entityData.outer_pad + clip[1]) / entityTexture.img.height;
        var fw = clip[2] / entityTexture.img.width;
        var fh = clip[3] / entityTexture.img.height;

        var f = entityData.animations[entity.animation][0][0][0];
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

        gl.uniform4f(this.spriteShader.uniform('u_camera'),
            Math.floor(layer.parallax.X * this.camera[0]) / tilesize.width,
            Math.floor(layer.parallax.Y * this.camera[1]) / tilesize.height,
            this.camera[2] * this.renderContainer.width() / tilesize.width,
            this.camera[2] * this.renderContainer.height() / tilesize.height
        );

        gl.uniform4f(this.spriteShader.uniform('u_tint'), tint[0], tint[1], tint[2], tint[3]);

        var u_texture = this.tilemapShader.uniform('u_spriteAtlas');
        gl.uniform1i(u_texture, 0);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, entityTexture.tex);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
    },

    cleanUpCallbacks: function() {
        this.renderContainer.off(undefined, undefined, this);
    },

    resize: function() {
        if (!this.renderContainer || !this.gl) return;
        this.renderContainer.attr('width', this.renderContainer.width());
        this.renderContainer.attr('height', this.renderContainer.height());
        this.gl.viewport(0, 0, this.renderContainer.width(), this.renderContainer.height());
    },
};
