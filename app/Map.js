var app = require('remote').require('app');
var sprintf = require("sprintf-js").sprintf;
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

export var Map = function(mapfile, mapdatafile, vspfile, updateLocationFunction) {
    console.log("Loading map", mapfile);

    this.updateLocationFn = updateLocationFunction;

    this.readyPromise = new Promise(function(resolve, reject) {
        this.promiseResolver = resolve;
        this.promiseRejecter = reject;
    }.bind(this));

    this.mapPath = mapfile;
    this.mapData = jetpack.read(mapfile, 'json');
    this.renderString = this.mapData.renderstring.split(",");
    this.mapSize = [0,0];
    for (var i = 0; i < this.mapData.layers.length; i++) {

        if (this.mapData.layers[i].MAPED_HIDDEN)  { continue; }

        if (this.mapData.layers[i].dimensions.X > this.mapSize[0]) this.mapSize[0] = this.mapData.layers[i].dimensions.X;
        if (this.mapData.layers[i].dimensions.Y > this.mapSize[1]) this.mapSize[1] = this.mapData.layers[i].dimensions.Y;
    }
    this.camera = [0, 0, 1];

    this.tileData = jetpack.read(mapdatafile, 'json').tile_data;
    this.vspData = jetpack.read(vspfile, 'json');

    this.vspImage = new Image();
    this.vspImage.onload = function() { this.promiseResolver(this); }.bind(this);
    this.vspImage.src = this.vspData.source_image;

    this.renderContainer = null;
};

Map.prototype = {
    ready: function() {
        return this.readyPromise;
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
        this.tilemapShader = new ShaderProgram(this.gl, jetpack.read("../app/vertex.glsl"), jetpack.read("../app/fragment.glsl"));

        this.tileLibraryTexture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.tileLibraryTexture);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.vspImage);

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

        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([
            0.0, 0.0,
            this.mapSize[0], 0.0,
            0.0, -this.mapSize[1],
            0.0, -this.mapSize[1],
            this.mapSize[0], 0.0,
            this.mapSize[0], -this.mapSize[1]
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
                        alert("You haven't selected a layer yet.");
                        return;
                    }

                    debugger;

                    //map.dragging = true;
                    //window.$MAP_WINDOW.draggable('disable');
                    //map.lastMouse = [ e.clientX, e.clientY ];
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

        if( this.onLoad ) {
            this.onLoad(this);
        }
    },

    render: function() {
        var gl = this.gl;

        gl.clear(gl.COLOR_BUFFER_BIT);

        this.tilemapShader.use();

        for (var i = 0; i < this.renderString.length; i++) {
            var layer = parseInt(this.renderString[i], 10) - 1;
            if (isNaN(layer)) continue;

            if (this.mapData.layers[layer].MAPED_HIDDEN) continue;

            gl.uniform4f(this.tilemapShader.uniform('u_camera'),
                Math.floor(this.mapData.layers[layer].parallax.X * this.camera[0]) / this.vspData.tilesize.width,
                Math.floor(this.mapData.layers[layer].parallax.Y * this.camera[1]) / this.vspData.tilesize.height,
                this.camera[2] * this.renderContainer.width() / this.vspData.tilesize.width,
                this.camera[2] * this.renderContainer.height() / this.vspData.tilesize.height
            );

            gl.uniform4f(this.tilemapShader.uniform('u_dimensions'),
                this.mapData.layers[layer].dimensions.X,
                this.mapData.layers[layer].dimensions.Y,
                this.vspData.tiles_per_row,
                this.vspImage.height / this.vspData.tilesize.height
            );

            var u_tileLibrary = gl.getUniformLocation(this.tilemapShader.program, "u_tileLibrary");
            gl.uniform1i(u_tileLibrary, 0);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.tileLibraryTexture);

            var u_tileLayout = gl.getUniformLocation(this.tilemapShader.program, "u_tileLayout");
            gl.uniform1i(u_tileLayout, 1);
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, this.tileLayoutTexture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.mapData.layers[layer].dimensions.X, this.mapData.layers[layer].dimensions.Y, 0, gl.RGBA, gl.UNSIGNED_BYTE, buildTileDataTexture(this.tileData[layer]));

            var a_position = gl.getAttribLocation(this.tilemapShader.program, "a_position");
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexbuffer);
            gl.enableVertexAttribArray(a_position);
            gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);

            gl.drawArrays(gl.TRIANGLES, 0, 6);
        }
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
