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

    render: function($canvas) {
        console.log("Rendering map...");
        if (!!this.renderContainer) this.cleanUpCallbacks();

        this.renderContainer = $canvas;
    },


    cleanUpCallbacks: function() {
        this.renderContainer.off(undefined, undefined, this);
    }
};
