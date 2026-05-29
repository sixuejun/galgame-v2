import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import * as parserVue from 'vue-eslint-parser'
import configPrettier from 'eslint-config-prettier'
import pluginTs from '@typescript-eslint/eslint-plugin'
import * as parserTs from '@typescript-eslint/parser'
import globals from 'globals'

export default [
  {
    ...js.configs.recommended,
    ignores: ['dist', 'node_modules', '*.config.js', 'docs/api/**'],
  },
  ...pluginVue.configs['flat/recommended'],
  {
    files: ['**/*.vue', '**/*.ts'],
    languageOptions: {
      parser: parserVue,
      parserOptions: {
        parser: parserTs,
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        ...globals.browser,
        ...globals.es2021,
        // Vite 构建时注入的全局变量
        __APP_VERSION__: 'readonly',
        __BUILD_TIME__: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': pluginTs,
    },
    rules: {
      ...pluginTs.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': 'error',
      'vue/multi-word-component-names': 'off',
      'vue/require-default-prop': 'off',
      'vue/no-v-html': 'error',
      'no-prototype-builtins': 'off',
    },
  },
  // Node.js 脚本文件规则
  {
    files: ['scripts/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
  },
  // 测试文件特殊规则
  {
    files: ['**/__tests__/**/*.ts', '**/*.test.ts', '**/*.spec.ts'],
    languageOptions: {
      globals: {
        // 测试环境全局变量
        Window: 'readonly',
        globalThis: 'readonly',
      },
    },
    rules: {
      'vue/one-component-per-file': 'off', // 测试文件中允许多个组件定义
      '@typescript-eslint/ban-ts-comment': 'off', // 测试文件中允许使用 @ts-nocheck 等注释
    },
  },
  configPrettier,
]

