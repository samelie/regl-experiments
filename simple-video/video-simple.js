const VERTEX_BUFFER = [0, 0, 0, 1, 1, 0, 1, 1]

module.exports = function(regl) {
  const drawVideo = regl({
    vert: `
            precision lowp float;
            attribute vec2 position;
            uniform mat4 projection, view, model;
            varying vec2 vUv;

            void main () {
              vUv = position;
              vec2 adjusted = 1.0 - 2.0 * position;
              vec4 pos =  vec4(adjusted,0,1);
              gl_Position =  pos;
            }
         `,

    frag: `

      precision lowp float;
      uniform sampler2D texture;
      varying vec2 vUv;

      void main () {
        vec2 uv = vUv;
        vec3 color = texture2D(texture, uv).rgb;
        //color = Posterize(color);
        gl_FragColor = vec4(color,1);
      }`,

    attributes: {
      position: VERTEX_BUFFER,
    },
    primitive: "triangle strip",
    count: 4,
    depth: {
      mask: false,
      enable: false,
    },
    uniforms: {
      texture: regl.prop("video"),
    },
  })

  return (scene, options) => {
    drawVideo()
  }
}
