function clamp(value, min, max) {
  if (min > max) {
    return clamp(value, max, min);
  }

  if (value < min) return min;
  else if (value > max) return max;
  else return value;
}

function parseDds(path) {

  //  CHECKING MIP MAP LEVELS
  const ddsInfos = parse(mArrayBuffer);
  const { flags } = ddsInfos;
  const header = new Int32Array(mArrayBuffer, 0, headerLengthInt);
  let mipmapCount = 1;
  if (flags & DDSD_MIPMAPCOUNT) {
    mipmapCount = Math.max(1, header[OFF_MIPMAPCOUNT]);
  }
  const sources = ddsInfos.images.map((img) => {
    const faceData = new Float32Array(mArrayBuffer.slice(img.offset, img.offset + img.length));
    return {
      data: faceData,
      shape: img.shape,
      mipmapCount,
    };
  });
}


module.exports = parseDds
