const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const pkg = require('../package.json');

const root = path.resolve(__dirname, '..');
const modules = Object.keys(pkg.peerDependencies);
const escape = (s) => s.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');

// The demo runs the library from ../src. Its peer dependencies must come from
// the demo's node_modules: a second copy of react or react-native from the
// library's own devDependencies breaks the app.
const config = getDefaultConfig(__dirname);
config.watchFolders = [root];
config.resolver.blockList = modules.map(
  (name) => new RegExp(`^${escape(path.join(root, 'node_modules', name))}\\/.*$`)
);
config.resolver.extraNodeModules = {
  ...Object.fromEntries(modules.map((name) => [name, path.join(__dirname, 'node_modules', name)])),
  [pkg.name]: path.join(root, 'src'),
};

module.exports = config;
