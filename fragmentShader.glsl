uniform float time;
varying vec2 vUv;

void main() {
    float brightness = sin(vUv.y * 10.0 + time) * 0.5 + 0.5;
    vec3 color = vec3(
        0.3 + 0.7 * brightness,
        0.5 + 0.5 * brightness,
        0.7 + 0.3 * brightness
    );
    gl_FragColor = vec4(color, 1.0);
}
