'use strict';

const loaded = require('image-size-next');
const imageSize =
  typeof loaded === 'function'
    ? loaded
    : loaded.imageSize || loaded.default;

function getImageSize(input, callback) {
  if (typeof callback === 'function') {
    try {
      callback(null, imageSize(input));
    } catch (error) {
      callback(error);
    }
    return;
  }
  return imageSize(input);
}

module.exports = getImageSize;
module.exports.imageSize = imageSize;
module.exports.default = getImageSize;
if (loaded && typeof loaded === 'object') {
  if (loaded.types) {
    module.exports.types = loaded.types;
  }
  if (typeof loaded.disableTypes === 'function') {
    module.exports.disableTypes = loaded.disableTypes;
  }
}
