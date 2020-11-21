const canvas = document.body.appendChild(document.createElement('canvas'))
const fit = require('canvas-fit')
const camera = require('canvas-orbit-camera')(canvas, {zoom: 4})
console.log(camera);
window.addEventListener('resize', fit(canvas), false)
module.exports = {
  regl: require('regl')(canvas, {
    extensions: 'GL_EXT_shader_texture_lod'
  }),
  camera: camera
}
