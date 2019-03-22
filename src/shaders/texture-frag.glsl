#version 300 es
precision highp float;

uniform vec3 u_Eye, u_Ref, u_Up;
uniform vec2 u_Dimensions;
uniform float u_Time;

in vec2 fs_Pos;
out vec4 out_Col;

vec2 smoothF(vec2 pos) {
    return pos * pos * (3.0 - 2.0 * pos);
}

float noise(vec2 uv) {
    const float k = 257.0;
    vec4 l  = vec4(floor(uv), fract(uv));
    float u = l.x + l.y * k;
    vec4 v = vec4(u, u + 1.0, u + k, u + k + 1.0);
    v = fract(fract(1.23456789 * v) * v / 0.987654321);
    l.zw = smoothF(l.zw);
    l.x = mix(v.x, v.y, l.z);
    l.y = mix(v.z, v.w, l.z);
    return mix(l.x, l.y, l.w);
}

float fbm(vec2 pos) {
    float amp = 0.5;
    float freq = 5.0;
    float ret = 0.0;
    for(int i = 0; i < 8; i++) {
        ret += noise(pos * freq) * amp;
        amp *= .5;
        freq *= 2.;
    }
    return ret;
}

float getWaterMap(vec2 pos) {
	vec2 elevationPos = pos - vec2(1.1, 0.4);
	float fbm = fbm(elevationPos / 2.0);
	fbm = clamp((fbm - 0.378) / 0.622, 0.0, 1.0);
	return fbm == 0.0 ? 0.0 : 1.0;
}

float getElevationMap(vec2 pos) {
	float water = getWaterMap(pos);
	vec2 elevationPos = pos - vec2(1.1, 0.4);
	float fbm = fbm(elevationPos / 2.0);
	fbm = clamp((fbm - 0.2), 0.0, 1.0);
	return water == 0.0 ? 0.0 : fbm;
}

float getPopulationMap(vec2 pos) {
	float water = getWaterMap(pos);
	vec2 populationPos = pos - vec2(-0.02, 0);
	float fbm = fbm(populationPos / 2.0);
	return water == 0.0 ? 0.0 : fbm;
}

vec2 getQuadToMapPos(float originalX, float originalY) {
	float x = mix(-0.15, 0.35, originalX);
	float y = mix(0.057, 0.557, originalY);
	return vec2(x, y);
}

vec3 getOutputTexture() {
	// Return Format, (water fbm, elevation fbm, population fbm)
	float x_position = (fs_Pos.x + 1.0) / 2.0;
	float y_position = (fs_Pos.y + 1.0) / 2.0;
	vec2 mapPos = getQuadToMapPos(x_position, y_position);
	return vec3(getWaterMap(mapPos), getElevationMap(mapPos), getPopulationMap(mapPos));
}

void main() {
	vec3 color = getOutputTexture();
	out_Col = vec4(color, 1.0);
}
