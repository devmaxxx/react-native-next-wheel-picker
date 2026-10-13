const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const pkg = require('../package.json');

const root = path.resolve(__dirname, '..');
const modules = Object.keys(pkg.peerDependencies);
const escape = (s) => s.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');

// The example runs the library from ../src. Its peer dependencies must come
// from the example's node_modules: a second copy of react or react-native
// from the library's own devDependencies breaks the app.
module.exports = mergeConfig(getDefaultConfig(__dirname), {
  watchFolders: [root],
  resolver: {
    blockList: modules.map(
      (name) => new RegExp(`^${escape(path.join(root, 'node_modules', name))}\\/.*$`)
    ),
    extraNodeModules: {
      ...Object.fromEntries(
        modules.map((name) => [name, path.join(__dirname, 'node_modules', name)])
      ),
      [pkg.name]: path.join(root, 'src'),
    },
  },
});
