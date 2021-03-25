precision mediump float;
varying vec2 v_position; // the position within the maplayer of the pixel we are currently drawing (0..1 based)
uniform vec4 u_dimensions; // map width, map height, tile bank width, tile bank height (all in tiles)
uniform sampler2D u_tileLibrary; // the raw actual VSP sprite
uniform sampler2D u_tileLayout; // an image we generated in js where each pixel's color is actually the tile index incoded as a color.  1 pixel in this image represents 1 tile in the layer.
uniform float u_opacity; // the layer opacity

void main() {
    // just draw transparent black if the fragment is out of bounds
    if (v_position[0] > 1.0 || v_position[0] < -1.0 || v_position[1] > 1.0 || v_position[1] < -1.0) {
        gl_FragColor = vec4(0, 0, 0, 0);
        return;
    }

    vec4 color = vec4(0, 0, 0, 0);
    vec4 tileInfo = texture2D(u_tileLayout, v_position) * 255.0; // extract the 4-part color of the correct pixel of the tilelayer texture (and multiply the vector by 255 to convert it from 0..1 to 0..255)
    float index = dot(tileInfo, vec4(1.0, 256.0, 65536.0, 16777216.0)); // dot product multiplying each segment out by a successivly larger power of 16.
    // anyways, index is now the actual vsp-wise tile index of the tile we want to draw

    if (index >= 0.0) { // we have a valid tile if the index is >= 0.  Could be unneccesary.
        color = texture2D(u_tileLibrary, vec2( 
            // this is figuring out the location of the pixel in the tile in the vsp that we should be drawing at this current screen pixel
            (mod(index, floor(u_dimensions[2])) + fract(v_position[0] * u_dimensions[0])) / u_dimensions[2],
            (floor(index / u_dimensions[2]) + (fract(v_position[1] * u_dimensions[1]))) / u_dimensions[3]
        ));
    }

    if (color[0] == 1.0 && color[1] == 0.0 && color[2] == 1.0) { // invisible pink
        gl_FragColor = vec4(0, 0, 0, 0);
    } else {
        color[3] *= u_opacity;
        gl_FragColor = color;
    }
}
