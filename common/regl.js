/* globals headlessRegl */
const regl = require('regl')
const canvas = document.body.appendChild(document.createElement('canvas'))
const fit = require('canvas-fit')
const mat4 = require('gl-mat4')
const camera = require('canvas-orbit-camera')(canvas)

window.addEventListener('resize', fit(canvas), false)

module.exports = function reglSettings (config = {}) {
  let finalConfig = Object.assign({
    onDone: (err) => {
      if (typeof config.onDone === 'function') {
        config.onDone.apply(this, arguments)
      }
      if (err) {
        const div = document.createElement('div')
        document.body.appendChild(div)
        div.className = 'error'

        const divInner = document.createElement('div')
        divInner.innerText = err
        div.appendChild(divInner)
      }
    }
  }, config)

  if (typeof headlessRegl === 'function') {
    finalConfig = headlessRegl(finalConfig)
  } else {
    window.frameDone = () => {}
  }

  return {regl:regl(canvas, finalConfig), camera:camera}
}
