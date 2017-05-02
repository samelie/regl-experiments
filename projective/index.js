/*
  tags: basic, video

  <p>This example shows how to overlay a chroma keyed video over a background rendered by regl. </p>

 */


const {regl,camera} = require('./regl')
const mat4 = require('gl-mat4')

function init(model) {

  const setupEnvMap = regl({
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
      envmap: regl.prop('cube'),
      view: regl.context('view'),
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
  varying vec3 reflectDir;
  void main() {
    reflectDir = (view * vec4(position, 1, 0)).xyz;
    gl_Position = vec4(position, 0, 1);
  }`,
    attributes: {
      position: [-4, -4, -4, 4,
        8, 0
      ]
    },
    depth: {
      mask: false,
      enable: false
    },
    count: 3
  })

  const modelRoom = require('./model-room')(model)


  require('resl')({

    manifest: {
      video: {
        type: 'video',
        src: 'assets/video.mp4',
        stream: true
      },
      diffuse: {
        type: 'image',
        src: 'assets/1492547381514_0-fs8.png',
      },
      ao: {
        type: 'image',
        src: 'assets/1492547381514_0_OCC.png',
      },
      /*radiance: {
        type: 'binary',
        src: 'assets/xlight_radiance.dds',
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
        src: 'assets/posx.jpg'
      },
      negx: {
        type: 'image',
        src: 'assets/negx.jpg'
      },
      posy: {
        type: 'image',
        src: 'assets/posy.jpg'
      },
      negy: {
        type: 'image',
        src: 'assets/negy.jpg'
      },
      posz: {
        type: 'image',
        src: 'assets/posz.jpg'
      },
      negz: {
        type: 'image',
        src: 'assets/negz.jpg'
      },
      /*irr_posx: {
        type: 'image',
        src: 'assets/irr_posx.jpg'
      },
      irr_negx: {
        type: 'image',
        src: 'assets/irr_negx.jpg'
      },
      irr_posy: {
        type: 'image',
        src: 'assets/irr_posy.jpg'
      },
      irr_negy: {
        type: 'image',
        src: 'assets/irr_negy.jpg'
      },
      irr_posz: {
        type: 'image',
        src: 'assets/irr_posz.jpg'
      },
      irr_negz: {
        type: 'image',
        src: 'assets/irr_negz.jpg'
      }*/
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

        setupEnvMap({ cube }, () => {
          //drawBackground()
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

require('./parse-obj')('assets/ben.obj').then(d => {
  console.log(d);
  //init(d)
})
