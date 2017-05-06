/*
  tags: basic, video

  <p>This example shows how to overlay a chroma keyed video over a background rendered by regl. </p>

 */

 const ASSETS = process.env.NODE_ENV === "development" ? `assets/projective/` : `../assets/projective/`;

//const {regl,camera} = require('./regl')
const { regl, camera } = require('../common/regl')()
camera.distance = 3;
camera.rotation = new Float32Array([-0.12710481882095337, -0.09740500897169113,
  0.02649819105863571,
  0.9867393374443054
])
const mat4 = require('gl-mat4')

function init(model) {
  const setupMap = regl({
    context: {
      view: () => camera.view(),
    },
    frag: `
  precision mediump float;
  uniform samplerCube envmap;
  varying vec3 reflectDir;
  void main () {
    gl_FragColor = textureCube(envmap, reflectDir);
  }`,
    uniforms: {
      view: camera.view(),
      projection: ({ viewportWidth, viewportHeight }) =>
        mat4.perspective([],
          Math.PI / 4,
          viewportWidth / viewportHeight,
          0.01,
          1000),
      //invView: ({ view }) => mat4.invert([], view)
    }
  })

  const drawBackground = regl({
    vert: `
  precision mediump float;
  attribute vec2 position;
  uniform mat4 view;
  varying vec2 vPos;
  void main() {
    vec2 p = position;
    p.y -= 10.0;
    vPos = p;
    gl_Position = vec4(position, 0, 1);
  }`,
    attributes: {
      position: [
      -1, -1,
       1, -1,
      -1, 1,
      1, 1,
      ]
    },
    depth: {
      mask: false,
      enable: false
    },
    frag:`precision mediump float;

    #define PI 3.14159265359

  uniform float time;
  varying vec2 vPos;
  void main () {

    //https://www.shadertoy.com/view/MdXGDH
    vec2 uv = vPos * 0.5+ 0.5;
    float color1, color2, color;

  color1 = (sin(dot(uv.xy,vec2(sin(time*3.0),cos(time*3.0)))*0.02+time*3.0)+1.0)/2.0;


  color2 = (cos(length(uv.xy - vec2(0.5,0.5))*0.03)+1.0)/2.0;

  color = (color1)/2.0;

  float red = (cos(PI*color/0.5+time*3.0)+1.0)/2.0;
  float green = (sin(PI*color/0.5+time*3.0)+1.0)/2.0;
  float blue  = (sin(+time*3.0)+1.0)/2.0;

    gl_FragColor = vec4(vec3(red,green,blue),1.0);
  }`,
    count: 4,
    uniforms:{
      time:({tick})=>tick *0.02
    }
  })

  const modelRoom = require('./model-room')(regl, model)


  require('resl')({

    manifest: {
      video: {
        type: 'video',
        src: `${ASSETS}video.mp4`,
        stream: true
      },
      diffuse: {
        type: 'image',
        src: `${ASSETS}1492547381514_0-fs8.png`,
      },
      ao: {
        type: 'image',
        src: `${ASSETS}1492547381514_0_OCC.png`,
      },
      /*radiance: {
        type: 'binary',
        src: `${ASSETS}xlight_radiance.dds`,
        parser: (data) => {
          console.log(data);
          const dds = require('./parse-dds')(data)
          console.log(dds);
          const image = dds.images[0]
          return regl.texture({
            format: 'rgba s3tc ' + dds.format,
            shape: dds.shape,
            mag: 'linear',
            data: new Uint8Array(data, image.offset, image.length)
          })
        }
      },*/
      posx: {
        type: 'image',
        src: `${ASSETS}posx.jpg`
      },
      negx: {
        type: 'image',
        src: `${ASSETS}negx.jpg`
      },
      posy: {
        type: 'image',
        src: `${ASSETS}posy.jpg`
      },
      negy: {
        type: 'image',
        src: `${ASSETS}negy.jpg`
      },
      posz: {
        type: 'image',
        src: `${ASSETS}posz.jpg`
      },
      negz: {
        type: 'image',
        src: `${ASSETS}negz.jpg`
      },
    },

    onDone: ({
      video,
      posx,
      negx,
      posy,
      negy,
      posz,
      negz,
      /*irr_posx,
      irr_negx,
      irr_posy,
      irr_negy,
      irr_posz,
      irr_negz,*/
      diffuse,
      ao,
      radiance
    }) => {
      video.autoplay = true
      video.loop = true
      video.play()

      const cube = regl.cube(
        posx, negx,
        posy, negy,
        posz, negz)

      /*const irr_cube = regl.cube(
        irr_posx, irr_negx,
        irr_posy, irr_negy,
        irr_posz, irr_negz)*/

      const texture = regl.texture(video)
      const diffusetexture = regl.texture(diffuse)
      const aotexture = regl.texture(ao)


      regl.frame(() => {

        setupMap(()=>{
          drawBackground()
          modelRoom({
            radiance: radiance,
            cube: cube,
            irr_cube: cube,
            video: texture.subimage(video),
            ao: aotexture.subimage(ao),
            diffuse: diffusetexture.subimage(diffuse),
          })
          camera.tick()

        })

        ////drawDoggie({ video: texture.subimage(video) })
        //drawBunny({ video: texture.subimage(video) })
        //camera.tick()
      })
    }
  })
}

require('./parse-obj')(`${ASSETS}ben.obj`).then(d =>{
  init(d)
})
