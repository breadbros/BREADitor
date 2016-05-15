var app = require('remote').require('app');
var sprintf = require("sprintf-js").sprintf;
var path = require('path');
var jetpack = require('fs-jetpack').cwd(app.getAppPath());
import { ShaderProgram } from "./ShaderProgram.js";

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

/// FROM https://www.w3.org/wiki/Dynamic_style_-_manipulating_CSS_with_JavaScript
/// TODO move to a more general location?
function getStyleSheet(unique_title) {
  for(var i=0; i<document.styleSheets.length; i++) {
    var sheet = document.styleSheets[i];
    if(sheet.title == unique_title) {
      return sheet;
    }
  }
}

var __obsColor = [1, 1, 1, 0.5];
function setColor(r,g,b,a) {
    __obsColor = [r,g,b,a];
}

function initializeTileSelectorsForMap(imageFile) {
    $("#left-palette").removeAttr('style');
    $("#right-palette").removeAttr('style');

    $('#left-palette').css('background-image', 'url(' + imageFile + ')');
    $('#right-palette').css('background-image', 'url(' + imageFile + ')');

    $('#left-palette').css('background-position', '0px 0px');
    $('#right-palette').css('background-position', '0px 0px');

    $('#left-palette').css('background-size', '2000%');
    $('#right-palette').css('background-size', '2000%');
}

function setTileSelectorUI( whichOne, vspIDX, map ) {
    var loc = map.getVSPTileLocation("default", vspIDX);
    $(whichOne).css('background-position', '-'+(loc.x*2)+'px -'+(loc.y*2)+'px'); //(offset *2)
}

export var Map = function(mapfile, mapdatafile, vspfiles, updateLocationFunction) {
    var i;
    console.log("Loading map", mapfile);

    this.filenames = {
        'mapfile' : mapfile,
        'mapdatafile': mapdatafile,
        'vspfiles' : vspfiles
    };

    this.updateLocationFn = updateLocationFunction;

    this.readyPromise = new Promise(function(resolve, reject) {
        this.promiseResolver = resolve;
        this.promiseRejecter = reject;
    }.bind(this));

    this.mapPath = mapfile;
    this.mapData = jetpack.read(mapfile, 'json');
    // TEMPORARY -- should come from the mapdata itself
    this.mapData.layers.forEach((layer) => {
        layer.vsp = "default";
    });

    this.renderString = this.mapData.renderstring.split(",");
    console.log("Renderstring:", this.renderString);
    this.mapSizeInTiles = [0,0];
    this.layerLookup = {};

    for (i = 0; i < this.mapData.layers.length; i++) {
        if (this.mapData.layers[i].MAPED_HIDDEN)  { continue; }

        if (this.mapData.layers[i].dimensions.X > this.mapSizeInTiles[0]) this.mapSizeInTiles[0] = this.mapData.layers[i].dimensions.X;
        if (this.mapData.layers[i].dimensions.Y > this.mapSizeInTiles[1]) this.mapSizeInTiles[1] = this.mapData.layers[i].dimensions.Y;

        var layerName = this.uniqueLayerName(this.mapData.layers[i].name);
        this.mapData.layers[i].name = layerName; // clean up the non unique name if necessary
        this.layerLookup[layerName] = this.mapData.layers[i];
    }
    this.camera = [0, 0, 1];

    //this.RAWDATA = jetpack.read(mapdatafile, 'json');

    this.mapRawTileData = jetpack.read(mapdatafile, 'json')
    this.legacyObsData = this.mapRawTileData.legacy_obstruction_data;
    this.tileData = this.mapRawTileData.tile_data;

    this.vspData = {};
    for (var k in vspfiles) {
        this.vspData[k] = jetpack.read(vspfiles[k], 'json');
        console.log(k, "->", this.vspData[k]);
    }

    /// TODO move this somewhere else...
    initializeTileSelectorsForMap(this.vspData['default'].source_image);
    setTileSelectorUI( "#left-palette", 971, this );
    setTileSelectorUI( "#right-palette", 1122, this );

    var toLoad = 1;
    var doneLoading = function() {
        toLoad--;
        if (toLoad === 0) this.promiseResolver(this);
    }.bind(this);

    this.vspImages = {};
    for (k in this.vspData) {
        var vsp = this.vspData[k];
        if (!vsp) continue;
        // TODO probably actually want to fail the load or do something other than
        // just silently carry on when the image can't be loaded

        toLoad++;
        this.vspImages[k] = new Image();
        this.vspImages[k].onload = doneLoading;
        this.vspImages[k].src = this.vspData[k].source_image;
    }

    toLoad++;
    this.entityTextures = {
        '__default__': { img: new Image() }
    };
    this.entityTextures['__default__'].img.onload = doneLoading;
    this.entityTextures['__default__'].img.src = "../app/images/defaultsprite.png";

    var lastLayer = "";
    var defaultEntityLayer = "";
    for (i = 0; i < this.renderString.length; i++) {
        if (this.renderString[i] === 'E') {
            defaultEntityLayer = this.mapData.layers[lastLayer].name;
        }
        lastLayer = parseInt(this.renderString[i], 10);
    }
    if (!defaultEntityLayer) {
        defaultEntityLayer = this.mapData.layers[0].name;
    }
    console.log("LAYERS:");
    for(i in this.mapData.layers) {
        console.log("   ", this.mapData.layers[i].name);
    }

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

    this.entities = {};
    for (i = 0; i < this.mapData.entities.length; i++) {
        var entity = this.mapData.entities[i];
        // console.log(entity);

        var layer = entity.location.layer || defaultEntityLayer;
        if (!this.entities[layer]) {
            this.entities[layer] = [];
        }
        this.entities[layer].push(entity);

        if (!this.entityData[entity.filename]) {
            var datafile = jetpack.path(path.dirname(mapdatafile), entity.filename);
            var data = jetpack.read(datafile, 'json');
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
                    var imagePath = jetpack.path(path.dirname(mapdatafile), data.image);
                    if (!jetpack.inspect(imagePath)) {
                        imagePath += ".png";
                    }
                    if (!jetpack.inspect(imagePath)) {
                        console.log("Couldn't load image", data.image, "for entity", entity.filename, "; falling back.");
                        this.entityData[entity.filename].image = '__default__';
                        continue;
                    }

                    toLoad++;
                    this.entityTextures[data.image] = {};
                    this.entityTextures[data.image].img = new Image();
                    this.entityTextures[data.image].img.onload = doneLoading;
                    this.entityTextures[data.image].img.src = imagePath;
                }
            } else {
                console.log("Could not find '"+entity.filename+"', using the default.");
                entity.filename = '__default__';
            }
        }

        entity.animation = entity.animation || Object.keys(this.entityData[entity.filename].animations)[0];
    }

    for (var i in this.entities) {
        if (this.entities[i]) {
            console.log("Sorting entities on layer", i, ", ", this.entities[i].length, "entities to sort");
            this.entities[i].sort(function(a, b) {
                return a.location.ty - b.location.ty;
            });
        }
    }

    this.renderContainer = null;

    doneLoading();
};

function getFlatIdx( x, y, width ) {
    return parseInt(width*y) + parseInt(x);
}

Map.prototype = {

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

        if( localStorage[key] ) {
            if( localStorage[key+'-width'] )  { $cont.width(localStorage[key+'-width']); }
            if( localStorage[key+'-height'] ) { $cont.height(localStorage[key+'-height']); }
            if( localStorage[key+'-top'] )    { $cont.css( 'top', localStorage[key+'-top']); }
            if( localStorage[key+'-left'] )   { $cont.css( 'left', localStorage[key+'-left']);  }
            if( localStorage[key+'-mapx'] )   { this.camera[0] = parseInt(localStorage[key+'-mapx']); }
            if( localStorage[key+'-mapy'] )   { this.camera[1] = parseInt(localStorage[key+'-mapy']); }
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
        console.log("Setting canvas on map");
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

        var zoomFn = function(map, e, zoomout) {
            var mouseX = map.camera[0] + e.clientX * map.camera[2];
            var mouseY = map.camera[1] + e.clientY * map.camera[2];
            if (!zoomout) {
                map.camera[2] = Math.max(map.camera[2] / 2, 0.125);
            } else {
                map.camera[2] = Math.min(map.camera[2] * 2, 16);
            }
            map.camera[0] = mouseX - (e.clientX * map.camera[2]);
            map.camera[1] = mouseY - (e.clientY * map.camera[2]);
        };

        // function to be renamed (and probably changed) later.
        this.grue_zoom = function(zoomout, evt) {
            // if no event, fake it and center on current view.
            if( !evt ) {
                evt = {};
                evt.clientX = this.renderContainer.width() / 2;
                evt.clientY = this.renderContainer.height() / 2;
            }

            zoomFn( this, evt, zoomout );
        }

        var toolLogic = {
            "DRAG" : {
                "mousedown": function(map, e) {
                    map.dragging = true;
                    window.$MAP_WINDOW.draggable('disable');
                    map.lastMouse = [ e.clientX, e.clientY ];
                },
                "mousemove": function(map, e) {
                    if( map.dragging ) {
                        map.camera[0] += (map.lastMouse[0] - e.clientX) * map.camera[2];
                        map.camera[1] += (map.lastMouse[1] - e.clientY) * map.camera[2];
                        map.lastMouse = [ e.clientX, e.clientY ];
                    }
                },
                "mouseup": function(map, e) {
                    map.dragging = false;
                    map.updateLocationFn(map);
                    window.$MAP_WINDOW.draggable('enable');
                }

                /*,
                "mousewheel": function(map, e) {
                    zoomFn(map, e, e.originalEvent.deltaY < 0);
                }*/
            },

            "EYEDROPPER" : {
                "mousedown": function(map, e) {
                    if( !window.selected_layer ) {
                        console.log("You havent selected a layer yet.");
                        return;
                    }

                    if( !(e.button === 0 || e.button === 2) ) {
                        console.log("Unknown eyedropper button: we know left/right (0/2), got: '"+e.button+"'.");
                        return;
                    }

                    var oX, oY, tX, tY, tIdx, selector;
                    var mapOffsetX = map.camera[0];
                    var mapOffsetY= map.camera[1];
                    var mouseOffsetX = e.offsetX;
                    var mouseOffsetY = e.offsetY;

                    oX = mapOffsetX + mouseOffsetX;
                    oY = mapOffsetY + mouseOffsetY;

                    tX = parseInt(oX/16);
                    tY = parseInt(oY/16);

                    tIdx = map.getTile(tX,tY,window.selected_layer.map_tileData_idx)

                    window.$CURRENT_SELECTED_TILES[e.button] = tIdx;
                    $("#info-selected-tiles").text(
                        window.$CURRENT_SELECTED_TILES[0] +
                        ","+
                        window.$CURRENT_SELECTED_TILES[2]
                    );

                    if( e.button === 2 ) {
                        selector = "#right-palette";
                    } else {
                        selector = "#left-palette";
                    }

                    setTileSelectorUI( selector, tIdx, map );

                    //map.dragging = true;
                    //window.$MAP_WINDOW.draggable('disable');
                    //map.lastMouse = [ e.clientX, e.clientY ];
                },
                "mouseup": function(map, e) {
                    console.log("EYEDROPPER->mouseup: NOTHING");
                },
                "mousemove": function(map, e) {
                    console.log("EYEDROPPER->mousemove: NOTHING");
                }
            },

            "DRAW" : {
                "mousedown": function(map, e) {
                    if( !window.selected_layer ) {
                        console.log("You havent selected a layer yet.");
                        return;
                    }

                    if( !(e.button === 0 || e.button === 2) ) {
                        console.log("Unknown draw button: we know left/right (0/2), got: '"+e.button+"'.");
                        return;
                    }

                    window.foo = true;

                    var oX, oY, tX, tY, tIdx, selector;
                    var mapOffsetX = map.camera[0];
                    var mapOffsetY= map.camera[1];
                    var mouseOffsetX = e.offsetX;
                    var mouseOffsetY = e.offsetY;

                    oX = mapOffsetX + mouseOffsetX;
                    oY = mapOffsetY + mouseOffsetY;

                    tX = parseInt(oX/16);
                    tY = parseInt(oY/16);

                    map.setTile(
                        tX,tY,
                        window.selected_layer.map_tileData_idx,
                        window.$CURRENT_SELECTED_TILES[e.button]
                    );
                },
                "mouseup": function(map, e) {
                    console.log("EYEDROPPER->mouseup: NOTHING");
                },

                /// todo this doesn't seem to drag correctly for rightmouse...
                /// todo this doesn't perform correctly if you move the mouse too quickly.  Should keep track of position-1, draw a line between points, and change all those on this layer?
                "mousemove": function(map, e) {

                    /// if there's one button pressed and it's the left or right button...
                    if( e.buttons === 1 && (e.button===0 || e.button===2) ) {

                        // TODO this duplicates work. if it's costly, check before everything.  I doubt it'll matter.
                        toolLogic["DRAW"]["mousedown"](map, e); // let's be lazy.
                    }
                }
            }
        };

        var tools = function( action, map, evt ) {
            var mode = window.TOOLMODE;

            if( toolLogic.hasOwnProperty(mode) && toolLogic[mode].hasOwnProperty(action) ) {
                toolLogic[mode][action](map, evt);
            } else {
                console.log( sprintf("No action '%s' for mode '%s'", action, mode) );
            }
        };

        // DEBUG JUNK
        this.dragging = false;
        this.lastMouse = [0,0];
        this.renderContainer.on('mousedown', function(e) {
            tools( 'mousedown', this, e );
        }.bind(this));
        this.renderContainer.on('mousemove', function(e) {
            tools( 'mousemove', this, e );
        }.bind(this));
        this.renderContainer.on('mouseup', function(e) {
            tools( 'mouseup', this, e );
        }.bind(this));
        this.renderContainer.on('mousewheel', function(e) {
            tools( 'mousewheel', this, e );
        }.bind(this));

        this.entityPreview = null;
        $('#btn-add-tree').on('click', (e) => {
            window.TOOLMODE = 'TREE';
            this.entityPreview = {
                location: { tx: 0, ty: 0 },
                animation: "Idle Down",
                filename: "chrs_json/object_tree2.json"
            };

            toolLogic.TREE = {
                mousemove: (map, evt) => {
                    var mapOffsetX = map.camera[0];
                    var mapOffsetY= map.camera[1];
                    var mouseOffsetX = evt.offsetX;
                    var mouseOffsetY = evt.offsetY;
                    var tilesize = map.vspData[window.selected_layer.layer.vsp].tilesize;

                    map.entityPreview.location.tx = Math.floor((mapOffsetX + (mouseOffsetX * map.camera[2])) / tilesize.width);
                    map.entityPreview.location.ty = Math.floor((mapOffsetY + (mouseOffsetY * map.camera[2])) / tilesize.height);
                },
                mouseup: (map, evt) => {
                    map.entityPreview = null;
                    window.TOOLMODE = 'DRAG';
                },
                mousedown: () => {},
                moousewheel: () => {}
            }
        });

        if( this.onLoad ) {
            this.onLoad(this);
        }
    },

    render: function() {
        var gl = this.gl;

        gl.clear(gl.COLOR_BUFFER_BIT);

        for (var i = 0; i < this.renderString.length; i++) {
            var layerIndex = parseInt(this.renderString[i], 10) - 1;
            var layer = this.mapData.layers[layerIndex];

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

            if (this.entities[layer.name] && this.entities[layer.name].length > 0) {
                var entities = this.entities[layer.name];
                var showEntityPreview = (window.selected_layer && layer === window.selected_layer.layer && this.entityPreview);
                this.spriteShader.use();

                for (var e = 0; e < entities.length; e++) {
                    if (showEntityPreview && this.entityPreview.location.ty < entities[e].location.ty && (e === 0 || this.entityPreview.location.ty >= entities[e - 1].location.ty)) {
                        this.renderEntity(this.entityPreview, layer, [1, 1, 1, 0.75]);
                    }
                    this.renderEntity(entities[e], layer, [1,1,1,1]);
                }
            }
        }

        var vsp = 'obstructions';
        // TODO obstruction layer shouldn't just default like this
        var layer = {
            parallax: { X: 1, Y: 1 },
            dimensions: this.mapData.layers[0].dimensions
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

    },

    renderEntity: function(entity, layer, tint) {
        var gl = this.gl;
        var tilesize = this.vspData[layer.vsp].tilesize;

        var entityData = this.entityData[entity.filename];
        var entityTexture = this.entityTextures[entityData.image]

        var a_vertices = this.spriteShader.attribute('a_vertices');
        gl.bindBuffer(gl.ARRAY_BUFFER, this.entityVertexBuffer);
        gl.enableVertexAttribArray(a_vertices);
        gl.vertexAttribPointer(a_vertices, 4, gl.FLOAT, false, 0, 0);

        var tx = entity.location.tx - (entityData.hitbox[0] / tilesize.width);
        var ty = entity.location.ty - (entityData.hitbox[1] / tilesize.height);
        var tw = entityData.dims[0] / tilesize.width;
        var th = entityData.dims[1] / tilesize.height;

        var fx = entityData.outer_pad / entityTexture.img.width;
        var fy = entityData.outer_pad / entityTexture.img.height;
        var fw = entityData.dims[0] / entityTexture.img.width;
        var fh = entityData.dims[1] / entityTexture.img.height;

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
