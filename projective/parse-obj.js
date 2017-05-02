var request = require('xhr-request')
var parseOBJ = require('parse-wavefront-obj')

function arrayBufferToString(buffer){
    var arr = new Uint8Array(buffer);
    var str = String.fromCharCode.apply(String, arr);
    console.log(arr);
    if(/[\u0080-\uffff]/.test(str)){
        throw new Error("this string seems to contain (still encoded) multibytes");
    }
    return str;
}

function parseObj(path) {
  console.log(path);
  return new Promise((yes,no)=>{
      request(path, {
        method: 'GET',
        responseType: 'text',
      }, function (err, data) {
        if (err) no(err)
          yes(parseOBJ(data));
      })
  })
}


 module.exports = parseObj