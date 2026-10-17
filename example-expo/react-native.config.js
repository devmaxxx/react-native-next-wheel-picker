const path = require('path');
const pkg = require('../package.json');

// Links the library from the repo root instead of node_modules.
module.exports = {
  dependencies: {
    [pkg.name]: { root: path.join(__dirname, '..') },
  },
};
