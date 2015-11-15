var app = require('remote').require('app');
var jetpack = require('fs-jetpack').cwd(app.getAppPath());

function buildShaderProgram(gl) {
    var vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, jetpack.read("../app/vertex.glsl"));
    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        throw new Error("Failed to compile vertex shader: " + gl.getShaderInfoLog(vertexShader));
    }

    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, jetpack.read("../app/fragment.glsl"));
    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        throw new Error("Failed to compile fragment shader: " + gl.getShaderInfoLog(fragmentShader));
    }

    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error("Failed to link shader program: " + gl.getProgramInfoLog(program));
    }

    return program;
}

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

export var Map = function(mapfile, mapdatafile, vspfile) {
    console.log("Loading map", mapfile);

    this.readyPromise = new Promise(function(resolve, reject) {
        this.promiseResolver = resolve;
        this.promiseRejecter = reject;
    }.bind(this));

    this.mapPath = mapfile;
    this.mapData = jetpack.read(mapfile, 'json');
    this.renderString = this.mapData.renderstring.split(",");
    this.mapSize = [0,0];
    for (var i = 0; i < this.mapData.layers.length; i++) {
        if (this.mapData.layers[i].dimensions.X > this.mapSize[0]) this.mapSize[0] = this.mapData.layers[i].dimensions.X;
        if (this.mapData.layers[i].dimensions.Y > this.mapSize[1]) this.mapSize[1] = this.mapData.layers[i].dimensions.Y;
    }
    this.camera = [0,0];

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
        this.program = buildShaderProgram(this.gl);

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

        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE);
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
    },

    render: function() {
        var gl = this.gl;

        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(this.program);

        for (var i = 0; i < this.renderString.length; i++) {
            var layer = parseInt(this.renderString[i], 10) - 1;
            if (isNaN(layer)) continue;

            var u_camera = gl.getUniformLocation(this.program, "u_camera");
            gl.uniform4f(u_camera, 0, 0, this.renderContainer.width() / this.vspData.tilesize.width, this.renderContainer.height() / this.vspData.tilesize.height);

            var a_position = gl.getAttribLocation(this.program, "a_position");
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexbuffer);
            gl.enableVertexAttribArray(a_position);
            gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);

            var u_dimensions = gl.getUniformLocation(this.program, "u_dimensions");
            gl.uniform4f(u_dimensions, this.mapData.layers[layer].dimensions.X, this.mapData.layers[layer].dimensions.Y, this.vspData.tiles_per_row, this.vspImage.height / this.vspData.tilesize.height);

            var u_tileLibrary = gl.getUniformLocation(this.program, "u_tileLibrary");
            gl.uniform1i(u_tileLibrary, 0);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.tileLibraryTexture);

            var u_tileLayout = gl.getUniformLocation(this.program, "u_tileLayout");
            gl.uniform1i(u_tileLayout, 1);
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, this.tileLayoutTexture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.mapData.layers[layer].dimensions.X, this.mapData.layers[layer].dimensions.Y, 0, gl.RGBA, gl.UNSIGNED_BYTE, buildTileDataTexture(this.tileData[layer]));

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
