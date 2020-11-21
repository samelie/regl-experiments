const glsl = require('glslify')
const GUI = require('dat-gui')
const createBox = require('geo-3d-box')
const sphereGeo = require('primitive-sphere')
const mat4 = require('gl-mat4')
const { inverse, transpose } = require('./glsl-utils')

module.exports = function(regl) {
  const sphere = sphereGeo(200, {
    segments: 16
  })

  console.log(sphere);

  const drawSphere = regl({
    attributes: {
      position: sphere.positions,
      uvs: sphere.uvs,
      normal: sphere.normals
    },
    uniforms: {
      tVideo: (context, { video }) => video,
      projection: (context, { projection }) => projection(context),
      view: (context, { camera }) => camera.view(),
      model: ({ time }, { position, id }) => mat4.identity([])
    },
    vert: glsl `
      precision mediump float;
      attribute vec3 position;
      attribute vec3 normal;
      attribute vec2 uvs;
      uniform mat4 model, view, projection;
      uniform float time;

      varying vec2 vTextureCoord;
      varying vec3 vView;

      mat4 rotationMatrix(vec3 axis, float angle) {
          axis = normalize(axis);
          float s = sin(angle);
          float c = cos(angle);
          float oc = 1.0 - c;

          return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
                      oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
                      oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
                      0.0,                                0.0,                                0.0,                                1.0);
      }

      vec3 rotate(vec3 v, vec3 axis, float angle) {
        mat4 m = rotationMatrix(axis, angle);
        return (m * vec4(v, 1.0)).xyz;
      }

      void main () {
        vTextureCoord           = uvs;

        vView  = mod( projection * vec4(normal,1.), 1.0 ).xyz;

        gl_Position = projection * (rotationMatrix(vec3(1., 1., 1.), 1.9) * view * rotationMatrix(vec3(0., 1., 0.), 2.) ) * model * vec4(position, 1.0);
      }
    `,
    frag: glsl `
      precision mediump float;
      uniform sampler2D tVideo;

      varying vec2    vTextureCoord;
      varying vec3 vView;

      void main () {
        vec3 diffuse       = texture2D(tVideo, vTextureCoord).rgb;
        gl_FragColor = vec4(diffuse,1. );
      }
    `,
    elements: sphere.cells
  })

  return (scene, options) => {
    drawSphere(Object.assign({}, scene, options))
  }

}
