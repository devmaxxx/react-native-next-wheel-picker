module.exports = {
  preset: 'react-native',
  // A cold CI runner can take several seconds on the first fireEvent.
  testTimeout: 20000,
  modulePathIgnorePatterns: ['<rootDir>/lib/'],
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/android/'],
};
