precision mediump float;
varying vec2 v_texcoords;
uniform vec4 u_dimensions;
uniform sampler2D u_spriteAtlas;

void main() {
    vec4 color = vec4(1, 0, 1, 1);

    // color = texture2D(u_spriteAtlas, v_texcoords);
    // color = texture2D(u_spriteAtlas, vec2(v_texcoords[0], 0.5));
    color = vec4(v_texcoords[0], v_texcoords[1], 0, 1);

    // if (color[0] == 1.0 && color[1] == 0.0 && color[2] == 1.0) { // invisible pink
    //     gl_FragColor = vec4(0, 0, 0, 0);
    // } else {
        gl_FragColor = color;
    // }
}
