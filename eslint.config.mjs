import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  { ignores: ['lib/', 'node_modules/', 'android/', 'coverage/'] },
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },
  {
    files: ['*.js'],
    languageOptions: { sourceType: 'commonjs', globals: { module: 'writable' } },
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  }
);
