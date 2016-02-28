precision mediump float;
varying vec2 v_position;
uniform vec4 u_dimensions;
uniform sampler2D u_tileLibrary;
uniform sampler2D u_tileLayout;

void main() {
    // gl_FragColor = vec4(v_position[0] * 0.5 + 0.5, v_position[1] * 0.5 + 0.5, 0, 1);

    // vec4 color = texture2D(u_tileLayout, v_position);

    // vec4 color = texture2D(u_tileLibrary, v_position);

    vec4 color = vec4(0, 0, 0, 0);
    vec4 tileInfo = texture2D(u_tileLayout, v_position) * 255.0;
    float index = dot(tileInfo, vec4(1.0, 256.0, 65536.0, 16777216.0));

    if (index >= 0.0) {
        color = texture2D(u_tileLibrary, vec2(
            (mod(index, floor(u_dimensions[2])) + fract(v_position[0] * u_dimensions[0])) / u_dimensions[2],
            (floor(index / u_dimensions[2]) + (fract(v_position[1] * u_dimensions[1]))) / u_dimensions[3]
        ));
    }

    if (color[0] == 1.0 && color[1] == 0.0 && color[2] == 1.0) { // invisible pink
        gl_FragColor = vec4(0, 0, 0, 0);
    } else {
        gl_FragColor = color;
    }
}
