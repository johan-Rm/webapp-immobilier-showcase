import type { Linter } from 'eslint'

import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import prettierConfig from 'eslint-config-prettier'
import importPlugin from 'eslint-plugin-import-x'
import prettierPlugin from 'eslint-plugin-prettier'
import unusedImports from 'eslint-plugin-unused-imports'
import vuePlugin from 'eslint-plugin-vue'
import vueParser from 'vue-eslint-parser'

const configRootDir = dirname(fileURLToPath(import.meta.url))

const config: Linter.FlatConfig[] = [
  {
    ignores: [
      '**/.nuxt/**',
      '**/.output/**',
      '**/.data/**',
      '**/.tmp/**',
      '**/coverage/**',
      '**/dist/**',
      '**/node_modules/**',
      '**/schemas/**',
      '**/content/**/web-pages/index.ts',
    ],
  },

  ...tsPlugin.configs['flat/recommended'],

  ...vuePlugin.configs['flat/recommended'],

  prettierConfig,

  {
    files: ['**/*.{ts,tsx,vue}'],
    plugins: {
      '@typescript-eslint': tsPlugin,
      import: importPlugin,
      prettier: prettierPlugin,
      'unused-imports': unusedImports,
      vue: vuePlugin,
    },
    rules: {
      'no-console': ['error', { allow: ['warn', 'error'] }],

      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],

      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],

      'import/order': [
        'error',
        {
          alphabetize: { order: 'asc', caseInsensitive: true },
          'newlines-between': 'always',
          groups: [
            'type',
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
            'object',
          ],
          pathGroups: [
            { pattern: '~/**', group: 'internal' },
            { pattern: '@/**', group: 'internal' },
            { pattern: '@schemas/**', group: 'internal' },
            { pattern: '@services/**', group: 'internal' },
          ],
          pathGroupsExcludedImportTypes: ['type'],
        },
      ],

      'prettier/prettier': 'error',
      'vue/block-order': ['error', { order: ['template', 'script', 'style'] }],
      'vue/multi-word-component-names': 'off',
    },
    settings: {
      'import/resolver': {
        typescript: {
          project: ['./tsconfig.json'],
          tsconfigRootDir: configRootDir,
        },
      },
    },
  },

  {
    files: ['app/pages/**/*.vue', 'app/layouts/**/*.vue'],
    rules: {
      'vue/multi-word-component-names': 'off',
    },
  },

  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        extraFileExtensions: ['.vue'],
        parser: tsParser,
      },
    },
  },
]

export default config
