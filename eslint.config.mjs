import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  {
    ignores: [
      'lib/',
      'node_modules/',
      'android/',
      'coverage/',
      'example/node_modules/',
      'example/android/',
      'example/ios/',
      'example/vendor/',
      'example-expo/node_modules/',
      'example-expo/android/',
      'example-expo/ios/',
      'example-expo/.expo/',
    ],
  },
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}', 'example/src/**/*.{ts,tsx}', 'example-expo/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },
  {
    files: ['*.js', 'example/*.js', 'example-expo/*.js'],
    languageOptions: { sourceType: 'commonjs', globals: { module: 'writable' } },
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  }
);
