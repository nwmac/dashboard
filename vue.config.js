const path = require('path');
const dir = __dirname;

module.exports = {
  configureWebpack: (config) => {
    config.resolve.alias['@shell'] = path.join(dir, 'shell');
  }
};
