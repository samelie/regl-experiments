const { regl } = require('./regl')
const mat4 = require('gl-mat4')
const modelRoom = (model) => {
  return regl({
    vert: `


  precision mediump float;
  attribute vec3 position;
  attribute vec2 uvs;
  attribute vec3 normals;
  uniform mat4 model, view, projection;
  uniform vec3 lightPosition;

  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vWsPosition;
  varying vec3 vEyePosition;
  varying vec3 vWsNormal;
  varying vec2 vTextureCoord;
  varying vec4 vDrawingCoord;

  varying vec3 vLightDir;

  mat4 inverse(mat4 m) {
    float
        a00 = m[0][0], a01 = m[0][1], a02 = m[0][2], a03 = m[0][3],
        a10 = m[1][0], a11 = m[1][1], a12 = m[1][2], a13 = m[1][3],
        a20 = m[2][0], a21 = m[2][1], a22 = m[2][2], a23 = m[2][3],
        a30 = m[3][0], a31 = m[3][1], a32 = m[3][2], a33 = m[3][3],

        b00 = a00 * a11 - a01 * a10,
        b01 = a00 * a12 - a02 * a10,
        b02 = a00 * a13 - a03 * a10,
        b03 = a01 * a12 - a02 * a11,
        b04 = a01 * a13 - a03 * a11,
        b05 = a02 * a13 - a03 * a12,
        b06 = a20 * a31 - a21 * a30,
        b07 = a20 * a32 - a22 * a30,
        b08 = a20 * a33 - a23 * a30,
        b09 = a21 * a32 - a22 * a31,
        b10 = a21 * a33 - a23 * a31,
        b11 = a22 * a33 - a23 * a32,

        det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

    return mat4(
        a11 * b11 - a12 * b10 + a13 * b09,
        a02 * b10 - a01 * b11 - a03 * b09,
        a31 * b05 - a32 * b04 + a33 * b03,
        a22 * b04 - a21 * b05 - a23 * b03,
        a12 * b08 - a10 * b11 - a13 * b07,
        a00 * b11 - a02 * b08 + a03 * b07,
        a32 * b02 - a30 * b05 - a33 * b01,
        a20 * b05 - a22 * b02 + a23 * b01,
        a10 * b10 - a11 * b08 + a13 * b06,
        a01 * b08 - a00 * b10 - a03 * b06,
        a30 * b04 - a31 * b02 + a33 * b00,
        a21 * b02 - a20 * b04 - a23 * b00,
        a11 * b07 - a10 * b09 - a12 * b06,
        a00 * b09 - a01 * b07 + a02 * b06,
        a31 * b01 - a30 * b03 - a32 * b00,
        a20 * b03 - a21 * b01 + a22 * b00) / det;
  }



  mat4 transpose(mat4 m) {
    return mat4(m[0][0], m[1][0], m[2][0], m[3][0],
                m[0][1], m[1][1], m[2][1], m[3][1],
                m[0][2], m[1][2], m[2][2], m[3][2],
                m[0][3], m[1][3], m[2][3], m[3][3]);
  }

  const mat4 biasMatrix = mat4( 0.5, 0.0, 0.0, 0.0,
                0.0, 0.5, 0.0, 0.0,
                0.0, 0.0, 0.5, 0.0,
                0.5, 0.5, 0.5, 1.0 );


  void main() {

    vec4 worldSpacePosition = model * vec4(position, 1.0);
    vec4 viewSpacePosition  = view * worldSpacePosition;

    mat4 modelViewMatrixInverse = inverse(view * model);
    mat4 normalMatrix = transpose(modelViewMatrixInverse);

    vNormal                 = vec4(normalMatrix * vec4(normals,1.)).xyz;
    vPosition               = viewSpacePosition.xyz;
    vWsPosition             = worldSpacePosition.xyz;

    vec4 eyeDirViewSpace    = viewSpacePosition - vec4( 0, 0, 0, 1 );
    vEyePosition            = -vec3( modelViewMatrixInverse * eyeDirViewSpace ).xyz;
    vWsNormal               = normalize( modelViewMatrixInverse * vec4(vNormal,1.) ).xyz;

    vLightDir = lightPosition - position;

    gl_Position = projection * view * model * vec4(position, 1);

    vTextureCoord           = uvs;

    vDrawingCoord           = ( biasMatrix * (projection * view) * model ) * vec4(position, 1.0);
  }

  `,


    frag: `

    precision mediump float;
    uniform sampler2D tVideo;
    uniform sampler2D tDiffuse;
    uniform sampler2D tAo;
    uniform samplerCube uRadianceMap;
    uniform samplerCube uIrradianceMap;

    varying vec3        vNormal;
    varying vec3        vPosition;
    varying vec3    vEyePosition;
    varying vec3    vWsNormal;
    varying vec3    vWsPosition;
    varying vec2    vTextureCoord;
    varying vec4    vDrawingCoord;

    varying vec3    vLightDir;

    ${require('./shader/pbr')}

    void main() {

      float d = length(vLightDir);
      vec3 L = normalize(vLightDir);
      vec3 modelN        = normalize( vNormal );
      vec3 N        = normalize( vWsNormal );
      vec3 V        = normalize( vEyePosition );



      vec4 drawingCoord = vDrawingCoord / vDrawingCoord.w;
      drawingCoord.y = 1. - drawingCoord.y;

      const float drawingBias     = .00005;
      vec4 colorDrawing = texture2DProj(tVideo, drawingCoord, drawingBias);

      vec3 diffuse       = texture2D(tDiffuse, vTextureCoord).rgb;
      //***** diffuse
      float kD = (0.01 + max(0.0, dot(L, modelN) * (0.6 + 0.2 / d) ));
      //***** specular
      float kS = 2.0 * pow(max(0.0, dot(normalize(modelN + L), V)), 10.0);
      vec3 color = diffuse * vec3(kD + kS);

      //*****NOTE*******//
      //****  -V is noutside the object
      //*****NOTE*******//

      vec3 colorGold = vec3(1.000, 0.766, 0.276);
      color       *= getPbr(N, V, colorGold, 0.95, 0.85, 0.95);

      vec3 ao       = texture2D(tAo, vTextureCoord).rgb;
      color         *= ao;

      // apply the tone-mapping
      color       = Uncharted2Tonemap( color * uExposure );
      // white balance
      color       = color * ( 1.0 / Uncharted2Tonemap( vec3( 20.0 ) ) );

      // gamma correction
      color       = pow( color, vec3( 1.0 / uGamma ) );

      color     += colorDrawing.rgb;

      gl_FragColor = vec4(diffuse, 1.);
  }`


    ,

    // this converts the vertices of the mesh into the position attribute
    attributes: {
      position: model.positions,
      normals: model.vertexNormals,
      uvs: model.vertexUVs
    },

    // and this converts the faces fo the mesh into elements
    elements: model.cells,

    uniforms: {
      tAo: regl.prop('ao'),
      tDiffuse: regl.prop('diffuse'),
      tVideo: regl.prop('video'),
      uIrradianceMap: regl.prop('irr_cube'),
      uRadianceMap: regl.prop('radiance'),
      uRoughness: .3,
      uRoughness4: .3,
      uMetallic: .2,
      uSpecular: .6,

      uExposure: 2.,
      uGamma: 1.,
      view: regl.context('view'),
      model: mat4.identity([]),
      lightPosition: ({ tick }) => {
        var t = 0.025 * tick
        return [2.0 * Math.cos(t), 1, 2.0 * Math.sin(t)]
      },
      projection: ({ viewportWidth, viewportHeight }) =>
        mat4.perspective([],
          Math.PI / 4,
          viewportWidth / viewportHeight,
          0.01,
          1000)
    }
  })

}
module.exports = modelRoom
