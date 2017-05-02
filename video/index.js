var aspect = require('aspectratio');
const mat4 = require('gl-mat4')

var regl = createREGL();
var VIDEO_HEIGHT = 360
var VIDEO_WIDTH = 640
var drawSpinningStretchyTriangle = regl({
    frag: `
  void main() {
    gl_FragColor = vec4(1, 0, 0, 1);
  }`,

    vert: `
  attribute vec2 position;
  uniform mat4 view;
  uniform float angle, scale, width, height, aspect;
  void main() {
    //float aspect = width / height;
    gl_Position =  view * vec4(
      scale * (cos(angle) * position.x - sin(angle) * position.y) * aspect,
      scale * (sin(angle) * position.x + cos(angle) * position.y),
      0,
      1.0);
  }`,

    attributes: {
        position: [
            [0, -1],
            [-1, 0],
            [1, 1]
        ]
    },

    uniforms: {
        view: ({ tick }) => {
            const t = 0.01 * tick
            return mat4.lookAt([], [0,0,0], [0, 0, 0], [0, 1, 0])
        },
        projection: ({ viewportWidth, viewportHeight }) =>
            mat4.perspective([],
                Math.PI / 4,
                viewportWidth / viewportHeight,
                0.01,
                1000),
        //
        // Dynamic properties can be functions.  Each function gets passed:
        //
        //  * context: which contains data about the current regl environment
        //  * props: which are user specified arguments
        //  * batchId: which is the index of the draw command in the batch
        //
        angle: function(context, props, batchId) {
            return props.speed * context.tick + 0.01 * batchId
        },

        // As a shortcut/optimization we can also just read out a property
        // from the props.  For example, this
        //
        aspect: regl.prop('aspect'),
        scale:(context,props)=>{
            let {scale} = props
            console.log(scale);
            return scale
        },
        //
        // is semantically equivalent to
        //
        //  scale: function (context, props) {
        //    return props.scale
        //  }
        //

        // Similarly there are shortcuts for accessing context variables
        width: function(context, props, batchId) {
            return window.innerWidth
            return props.width || window.innerWidth
        },
        height: function(context, props, batchId) {
            return window.innerHeight
        },
        //
        // which is the same as writing:
        //
        // width: function (context) {
        //    return context.viewportWidth
        // }
        //
    },

    count: 3
})

// Draws one spinning triangle
function drawTri(s = 1){
drawSpinningStretchyTriangle({
        scale: 1.0,
        aspect:VIDEO_WIDTH/VIDEO_HEIGHT,
        speed: s    ,
        width: 640, //window.innerWidth,
        height: 360 //window.innerHeight
    })
}

window.addEventListener('resize', () => {
    var w = w || window.innerWidth;
    var h = h || window.innerHeight;
    var a = h / w;
    var cameraWidth, cameraHeight;
    var scale;
    if (a < VIDEO_HEIGHT / VIDEO_WIDTH) {
        scale = w / VIDEO_WIDTH;
    } else {
        scale = h / VIDEO_HEIGHT;
    }
    cameraHeight = VIDEO_HEIGHT * scale;
    cameraWidth = VIDEO_WIDTH * scale;
    var crop = aspect.resize(640, 360, window.innerWidth, window.innerHeight);
    drawTri(scale)
})
    drawTri()