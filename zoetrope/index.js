const { regl, camera } = require('../common/regl')()

const scene = require('./scene')(camera)
const drawBeams = require('./beams')(regl)
const clear = { depth: 1, color: [0, 0, 0, 1] }

 const ASSETS = process.env.NODE_ENV === "development" ? `assets/zoetrope/` : `assets/`

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
        //drawGrid(scene)
      drawBeams(scene, { video: texture.subimage(video) })
      camera.tick()
      window.frameDone()
    })

  }
})
