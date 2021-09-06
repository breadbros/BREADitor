precision mediump float;
// varying vec2 v_position; // the position within the maplayer of the pixel we are currently drawing (0..1 based)
uniform vec4 u_borderColor; // the color to draw the border.

void main() {
    gl_FragColor = u_borderColor;
}
