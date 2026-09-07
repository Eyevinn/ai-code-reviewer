import eslint from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import eslintConfigPrettier from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';
import globals from 'globals';

const sharedLanguageOptions = {
  ecmaVersion: 'latest',
  sourceType: 'module',
  globals: {
    ...globals.browser,
    ...globals.node,
    ...globals.jest
  }
};

export default [
  {
    ignores: [
      '.next/**',
      'coverage/**',
      'next-env.d.ts',
      'node_modules/**',
      'out/**'
    ]
  },
  {
    ...eslint.configs.recommended,
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: sharedLanguageOptions
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ...sharedLanguageOptions,
      parser: tsParser
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      prettier: prettierPlugin
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...eslintConfigPrettier.rules,
      'prettier/prettier': 'error'
    }
  },
  {
    files: ['**/*.{js,mjs,cjs}'],
    plugins: {
      prettier: prettierPlugin
    },
    rules: {
      ...eslintConfigPrettier.rules,
      'prettier/prettier': 'error'
    }
  }
];
