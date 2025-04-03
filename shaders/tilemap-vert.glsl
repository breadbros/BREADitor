precision mediump float;
attribute vec2 a_position;
varying vec2 v_position; // the position within the maplayer of the current vertex we are currently drawing (0..1 based)
uniform vec4 u_dimensions; // map width, map height, tile bank width, tile bank height (all in tiles)
uniform vec4 u_camera; // camera offset x, camera offset y, camera scale x, camera scale y

void main() {
    gl_Position = vec4(
        -1.0 + ((a_position[0] - u_camera[0]) / u_camera[2]) * 2.0,
        1.0 + ((a_position[1] + u_camera[1]) / u_camera[3]) * 2.0,
        0,
        1
    );
    v_position = vec2(a_position[0] / u_dimensions[0], -a_position[1] / u_dimensions[1]);
}
