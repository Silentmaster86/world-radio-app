import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react-x';
import hooks from 'eslint-plugin-react-hooks';

export default [
  { ignores: ['node_modules/**', 'build/**', 'coverage/**', 'test-results/**', 'playwright-report/**', '.netlify/**'] },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx,cjs,mjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none', ignoreRestSiblings: true }],
    },
  },
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: { globals: { ...globals.browser, process: 'readonly' } },
    plugins: { 'react-x': react, 'react-hooks': hooks },
    rules: {
      'react-x/no-missing-key': 'error',
      'react-x/no-duplicate-key': 'error',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
    },
  },
  {
    files: ['**/*.cjs', '*.mjs', 'scripts/**/*.js'],
    languageOptions: { globals: { ...globals.node, ...globals.browser, ...globals.serviceworker } },
  },
  {
    files: ['src/**/*.test.{js,jsx}', 'src/test/**', 'src/setupTests.js'],
    languageOptions: { globals: { ...globals.jest, global: 'readonly', require: 'readonly' } },
  },
];
