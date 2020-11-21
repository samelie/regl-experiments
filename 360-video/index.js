const { regl, camera } = require('../common/regl')()

const scene = require('./scene')(camera)
//const drawBeams = require('./beams')(regl)
const drawSphere = require('./sphere')(regl)

const clear = { depth: 1, color: [0, 0, 0, 1] }

 const ASSETS = process.env.NODE_ENV === "development" ? `assets/360-video/` : `../assets/360-video/`

require('resl')({

  manifest: {
    video: {
      type: 'video',
      src: `${ASSETS}orchardlane.mp4`,
      stream: true
    },
  },

  onDone: ({
    video,
  }) => {
    video.autoplay = true
    video.loop = true
    video.muted = true
    video.play()

    const texture = regl.texture(video)

     regl.frame(() => {

      regl.clear(clear)
      //drawSky(scene)
        //drawGrid(scene)
        //
      drawSphere(scene,{ video: texture.subimage(video) })
      camera.tick()
      window.frameDone()
    })

  }
})
