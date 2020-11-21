const { regl, camera } = require('../common/regl')()

const scene = require('./scene')(camera)
const drawVideo = require('./video')(regl)
const drawVideoS = require('./video-simple')(regl)
const clear = { depth: 1, color: [0, 0, 0, 1] }

 const ASSETS = process.env.NODE_ENV === "development" ? `assets/zoetrope/` : `../assets/zoetrope/`

require('resl')({

  manifest: {
    video: {
      type: 'video',
      src: `${ASSETS}video.mp4`,
      stream: true
    },
  },

  onDone: ({
    video,
  }) => {
    video.autoplay = true
    video.loop = true
    video.play()

    const texture = regl.texture(video)

     regl.frame(() => {

      regl.clear(clear)
      //drawSky(scene)
      //drawVideo(scene)
      //drawVideo(scene, { video: texture.subimage(video) })
      drawVideoS(scene, { video: texture.subimage(video) })
      camera.tick()
      //window.frameDone()
    })

  }
})


return

/*

const ASSETS =
  process.env.NODE_ENV === "development"
    ? `assets/projective/`
    : `../assets/projective/`
const { regl, camera } = require("../common/regl")()
camera.distance = 3
camera.rotation = new Float32Array([
  -0.12710481882095337,
  -0.09740500897169113,
  0.02649819105863571,
  0.9867393374443054,
])
const mat4 = require("gl-mat4")

function init(model) {
  const setupMap = regl({
    context: {
      view: () => camera.view(),
    },
    frag: `
      precision lowp float;
      uniform samplerCube envmap;
      varying vec3 reflectDir;
      void main () {
        gl_FragColor = textureCube(envmap, reflectDir);
      }
      `,
    uniforms: {
      view: camera.view(),
      projection: ({ viewportWidth, viewportHeight }) =>
        mat4.perspective(
          [],
          Math.PI / 4,
          viewportWidth / viewportHeight,
          0.01,
          1000
        ),
    },
  })

  const drawVideo = regl({
    vert: `
      precision lowp float;
      attribute vec3 position;
      attribute vec3 normal;
      attribute vec2 uvs;
      uniform mat4, view, projection;
      varying vec4    vDrawingCoord;


      const mat4 biasMatrix = mat4( 0.5, 0.0, 0.0, 0.0,
                0.0, 0.5, 0.0, 0.0,
                0.0, 0.0, 0.5, 0.0,
                0.5, 0.5, 0.5, 1.0 );

      void main () {

        vDrawingCoord           = ( biasMatrix * (projection * view) ) * vec4(position, 1.0);

        gl_Position = projection * view * vec4(position, 1.0);
      }
    `,

    attributes: {
      position: [-1, -1, 1, -1, -1, 1, 1, 1],
    },
    depth: {
      mask: false,
      enable: false,
    },
    frag: `

    precision lowp float;

    #define PI 3.14159265359
    uniform sampler2D tVideo;
    varying vec4    vDrawingCoord;

      void main () {
        vec4 drawingCoord = vDrawingCoord / vDrawingCoord.w;
        drawingCoord.y = 1. - drawingCoord.y;

        vec3 video = texture2D(tVideo, drawingCoord.xy).rgb;

        gl_FragColor = vec4(video,1.0);
      }
      `,
    count: 4,
    uniforms: {
      //time: ({ tick }) => tick * 0.02,
      tVideo: regl.prop("video"),
      projection: ({ projection }) => projection(context),
      view: (con, { camera }) => {
        console.log(camera)
        debugger
      },
    },
  })
  console.log(`${ASSETS}video.mp4`)
  require("resl")({
    manifest: {
      video: {
        type: "video",
        src: `${ASSETS}video.mp4`,
        stream: true,
      },
    },

    onDone: ({ video }) => {
      video.autoplay = true
      video.loop = true
      video.play()

      const texture = regl.texture(video)
      regl.frame(() => {
        setupMap(() => {
          drawVideo({
            video: texture.subimage(video),
          })
          camera.tick()
        })
      })
    },
  })
}
init()
*/