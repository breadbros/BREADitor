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

export var Map = function(mapfile, mapdatafile, vspfile) {
    console.log("Init map...");

    this.readyPromise = new Promise(function(resolve, reject) {
        this.promiseResolver = resolve;
        this.promiseRejecter = reject;
    }.bind(this));

    this.mapData = mapfile;
    this.tileData = mapdatafile.tile_data;
    this.vspData = vspfile;
    this.vspImage = $('<img src="' + this.vspData.source_image  + '">');
    this.vspImage.on('load', function() { this.promiseResolver(); }.bind(this));

    this.renderContainer = null;
};

Map.prototype = {
    ready: function() {
        console.log("Got ready");
        return this.readyPromise;
    },

    setCanvas: function($canvas) {
        console.log("Setting canvas");
        if (!!this.renderContainer) this.cleanUpCallbacks();

        // set up callbacks
        $(window).on('resize', this.resize.bind(this));

        // set up context
        this.renderContainer = $canvas;
        this.gl = this.renderContainer[0].getContext('webgl'); // we're targeting Electron not the Internet at large so don't worry about failing to get a GL context
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        this.program = buildShaderProgram(this.gl);

        this.vertexbuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexbuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([
            -1.0, -1.0,
             1.0, -1.0,
            -1.0,  1.0,
            -1.0,  1.0,
             1.0, -1.0,
             1.0,  1.0
        ]), this.gl.STATIC_DRAW);

        // make sure the size is right
        this.resize();
    },

    render: function() {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        this.gl.useProgram(this.program);

        var a_position = this.gl.getAttribLocation(this.program, "a_position");
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexbuffer);
        this.gl.enableVertexAttribArray(a_position);
        this.gl.vertexAttribPointer(a_position, 2, this.gl.FLOAT, false, 0, 0);

        this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
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
