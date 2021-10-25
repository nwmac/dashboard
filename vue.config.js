const path = require('path');
const dir = __dirname;
const webpack = require('webpack');

console.log(dir);
console.log(path.join(dir, 'shell'));

const contextFolders = ['chart', 'cloud-credential', 'content', 'detail', 'edit', 'list', 'machine-config', 'models', 'promptRemove'];
const contextMap = contextFolders.reduce((map, obj) => {
  map[obj] = true;

  return map;
}, {});

module.exports = {
  configureWebpack: (config) => {
    config.resolve.alias['@shell'] = path.join(dir, '.shell');
    config.resolve.alias['./node_modules'] = path.join(dir, 'node_modules');
    config.resolve.alias['@/models'] = path.join(dir, '.shell/models');
    config.resolve.alias['~shell'] = path.join(dir, '.shell');

    delete config.resolve.alias['@'];

    contextFolders.forEach((f) => {
      config.resolve.alias[`@/${ f }`] = path.join(dir, '.shell', f);
    });
  }
};
