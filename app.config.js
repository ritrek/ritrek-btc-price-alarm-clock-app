const packageJson = require('./package.json');

module.exports = ({ config }) => {
  return {
    ...config,
    version: packageJson.version,
  };
};
