const glsl = require('glslify')
const GUI = require('dat-gui')
const createBox = require('geo-3d-box')
const mat4 = require('gl-mat4')
const {inverse, transpose} = require('./glsl-utils')

const NUM_BOXS = 180
const ROT_SPEED = 30
const GAP = 360 / NUM_BOXS //radians

const BOX_DEPTH_X = 1
const BOX_DEPTH_Y = 0
const BOX_DEPTH_Z = 1
const BOX_OFFSET_X = -0.5
const BOX_OFFSET_Y = 0.1
const BOX_OFFSET_Z = 0.0
const BOX_LENGTH = 0.35
const BOX_HEIGHT = 0.003
const BOX_WIDTH = 0.009

const controls = {
  radius: 0.5,
  fade: 0.5,
  scaleRepeat: 0.5,
  scaleAmp: 0.06,
  scale: 0.5,
  inverseWarp: false,
  worp: 0.5
}
const dat = new GUI.GUI(controls)
dat.add(controls, "radius", 0.01, 1)
dat.add(controls, "scale", 0.01, 1)
dat.add(controls, "scaleRepeat", 0.01, 1)
dat.add(controls, "scaleAmp", 0.01, 1)
dat.add(controls, "fade", 0.01, 1)
dat.add(controls, "worp", 0.01, 1)
dat.add(controls, "inverseWarp")

module.exports = function(regl) {
  const box = createBox({
    size: [
      BOX_WIDTH,
      BOX_HEIGHT,
      BOX_LENGTH
    ]
  })

  const a1 = []
  const a2 = []

  const drawBox = regl({
    attributes: {
      position: box.positions,
      uvs: box.uvs,
      normal: box.normals
    },
    uniforms: {
      tVideo: (context, { video }) => video,
      time: ({ time }) => time,
      worp: () => controls.worp * (controls.inverseWarp ? -1 : 1),
      fade: () => controls.fade,
      moire: () => Math.random(),
      id: (context, { id }) => id,
      scale: ({time}, { id }) => ((id*controls.scale) % (NUM_BOXS*controls.scaleRepeat)) * controls.scaleAmp,
      projection: (context, { projection }) => projection(context),
      view: (context, {camera}) => camera.view(),
      model: ({ time }, { position,id }) => {
        return mat4.translate(a1, mat4.identity(a2), [
          Math.cos(Math.PI * ((id+1 + time * ROT_SPEED)/NUM_BOXS) * GAP) * controls.radius,
          Math.sin(Math.PI * ((id+1 + time * ROT_SPEED)/NUM_BOXS) * GAP) *  controls.radius,
          position[2] * controls.radius,
        ])
      }
    },
    vert: glsl `
      precision mediump float;
      #pragma glslify: snoise2 = require(glsl-noise/simplex/2d)
      attribute vec3 position;
      attribute vec3 normal;
      attribute vec2 uvs;
      uniform mat4 model, view, projection;
      uniform float time;
      uniform float moire;
      uniform float id;
      uniform float scale;
      varying vec3 vNormal;
      varying vec2 vUv;
      varying vec3 vPosition;
      varying vec3    vEyePosition;
      varying vec3    vWsNormal;
      varying vec3    vWsPosition;
      varying vec2    vTextureCoord;
      varying vec4    vDrawingCoord;
      float JUMP_AMOUNT = 0.05;
      float JUMP_MOVEMENT_SPEED = 0.5;
      float JUMP_PERIOD = 2.0;
      float JUMP_CUTOFF = 0.0;


      const mat4 biasMatrix = mat4( 0.5, 0.0, 0.0, 0.0,
                0.0, 0.5, 0.0, 0.0,
                0.0, 0.0, 0.5, 0.0,
                0.5, 0.5, 0.5, 1.0 );

      ${inverse}

      void main () {
        vNormal = normal;

        float jump = snoise2(vec2(
          time * JUMP_MOVEMENT_SPEED,
          id * JUMP_PERIOD
        ));

        vec3 position3 = position;
        vec4 worldSpaceUvs = model * vec4(vec3(uvs,1.), 1.0);

        vec2 modz = clamp(mod(normalize(worldSpaceUvs).xy * id, vec2(moire)) * 0.5 - 0.5,0., 1.);

        position3.x += modz.x;
        position3.x += (id * 0.5 - id* 0.5) * 0.02;
        position3.y -= (id);
        position3.y *= 0.01;
        position3.z -= position3.z / 2.;
        position3.y += modz.y;
        position3.z *= scale;

        vec4 worldSpacePosition = model * vec4(position3, 1.0);
        vec4 viewSpacePosition  = view * worldSpacePosition;

        mat4 modelViewMatrixInverse = inverse(view * model);

        vWsPosition             = worldSpacePosition.xyz;

        vec4 eyeDirViewSpace    = viewSpacePosition - vec4( 0, 0, 0, 1 );
        vEyePosition            = -vec3( modelViewMatrixInverse * eyeDirViewSpace ).xyz;
        vWsNormal               = normalize( modelViewMatrixInverse * vec4(vNormal,1.) ).xyz;

        vPosition = position3;

        //mod(vec2(id), vec2(1.))
        vUv = modz;
        //vUv = mod(normalize(worldSpacePosition).xy * id, vec2(1.)) * 0.5 - 0.5;
        //vUv = normalize(worldSpaceUvs).xy;

        vDrawingCoord           = ( biasMatrix * (projection * view) * model ) * vec4(position3, 1.0);

        gl_Position = projection * view * model * vec4(position3, 1.0);
      }
    `,
    frag: glsl `
      precision mediump float;

      #define PI 3.1415926535897932384626433832795

      uniform sampler2D tVideo;
      uniform float time;
      uniform float fade;
      uniform float id;
      uniform float worp;
      varying vec3 vNormal;
      varying vec2 vUv;
      varying vec3 vPosition;
      varying vec3    vEyePosition;
      varying vec3    vWsNormal;
      varying vec3    vWsPosition;
      varying vec2    vTextureCoord;
      varying vec4    vDrawingCoord;



      vec3 changeSaturation(vec3 color, float saturation) {
        float luma = dot(vec3(0.2125, 0.7154, 0.0721) * color, vec3(1.));
        return mix(vec3(luma), color, saturation);
      }

      void main () {

        vec4 drawingCoord = vDrawingCoord / vDrawingCoord.w;

        //**********NOTE*******//
        //move right to left
        //drawingCoord.x = mod(drawingCoord.x + time * 0.3, 1.);
        //**********NOTE*******//
        drawingCoord.y = 1. - drawingCoord.y;

        drawingCoord.xy = mix(drawingCoord.xy, (drawingCoord.xy + normalize(vPosition*vWsNormal).gb ) / 2. + 0.5, worp);

        const float drawingBias     = .00005;
        vec4 colorDrawing = texture2DProj(tVideo, drawingCoord, drawingBias);

        const vec3 light = vec3(1., 0.5, 1.);
        float sinfade = (sin(time) *.5 + .5);
        float fadecos = (cos(time) *.5 + .5);
        vec3 lightDir = mix(light, vec3(sinfade, fadecos, sinfade), fade);

        vec3 V        = normalize( vEyePosition * (PI/2.)) + PI/4.;
        vec3 L = normalize(lightDir);
        float kD = min((0.01 + max(0.0, dot(L, vec3(vUv, 0.5)) * (0.6 + 0.8) )),1.0);

        float fractF = 10.;
        vec3 color = vec3(fract(id / fractF), fract((id + 2.)/fractF), fract((id + 4.)/fractF));
        vec3 videoC = changeSaturation(colorDrawing.rgb, 4.0) * vec3(kD * 1.5);
        gl_FragColor = vec4(mix(color, videoC, 0.9) ,1.0 );
        //gl_FragColor = vec4(vec3(fract(id/10.)) ,1.0 );
        //gl_FragColor = vec4(vec3(fract(1.) * 10. + 0.5) ,1.0 );
      }
    `,
    elements: box.cells
  })

  const props = Array(NUM_BOXS).fill(0).map((n, i) => {
    return {
      position: [
        Math.cos(Math.PI * ((i+1)/NUM_BOXS)) + GAP,
        Math.sin(Math.PI * ((i+1)/NUM_BOXS)) + GAP,
        0
      ],
      id: i + 1,
    }

  })

  return (scene, options) => {
    props.forEach(prop => {
      Object.assign(prop, scene, options)
    })
    drawBox(props)
  }
}
