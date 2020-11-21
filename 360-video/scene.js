const mat4 = require('gl-mat4')
const TAU = 6.283185307179586

module.exports = function(camera) {

  const a1 = []
  const a2 = []

  camera.rotate([0, Math.PI / 4], [0, Math.PI / 2])
  camera.distance = 6

  return {
    projection: ({ viewportWidth, viewportHeight }) => (
      mat4.perspective(
        a1,
        TAU * 0.05,
        viewportWidth / viewportHeight,
        0.01,
        1000
      )
    ),
    camera: camera,
  }
}
