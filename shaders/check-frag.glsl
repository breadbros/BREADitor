precision mediump float;
uniform vec4 u_colorA;
uniform vec4 u_colorB;
uniform vec4 u_camera; // camera offset x, camera offset y, camera scale x, camera scale y
uniform vec4 u_dimensions;
varying vec2 v_position;

void main() {
    if (fract(v_position[0] * u_dimensions[0]) < 0.5) {
        if (fract(v_position[1] * u_dimensions[1]) < 0.5) gl_FragColor = u_colorB;
        else gl_FragColor = u_colorA;
    } else {
        if (fract(v_position[1] * u_dimensions[1]) < 0.5) gl_FragColor = u_colorA;
        else gl_FragColor = u_colorB;
    }
}
