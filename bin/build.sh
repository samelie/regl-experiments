browserify  $1/index.js -t glslify -t [ envify --NODE_ENV production ] > $1/bundle.js
