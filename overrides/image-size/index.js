'use strict';

const fs = require('fs');
const loaded = require('image-size-next');
const imageSizeFn =
  typeof loaded === 'function'
    ? loaded
    : loaded.imageSize || loaded.default;

function toUint8Array(input) {
  if (typeof input === 'string') {
    return new Uint8Array(fs.readFileSync(input));
  }
  if (Buffer.isBuffer(input)) {
    return new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
  }
  if (input instanceof Uint8Array) {
    return input;
  }
  throw new TypeError('image-size expected a Buffer, Uint8Array, or file path');
}

function getImageSize(input, callback) {
  try {
    const result = imageSizeFn(toUint8Array(input));
    if (typeof callback === 'function') {
      callback(null, result);
      return;
    }
    return result;
  } catch (error) {
    if (typeof callback === 'function') {
      callback(error);
      return;
    }
    throw error;
  }
}

module.exports = getImageSize;
module.exports.imageSize = imageSizeFn;
module.exports.default = getImageSize;
if (loaded && typeof loaded === 'object') {
  if (loaded.types) {
    module.exports.types = loaded.types;
  }
  if (typeof loaded.disableTypes === 'function') {
    module.exports.disableTypes = loaded.disableTypes;
  }
}
