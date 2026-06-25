import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'node_modules', 'test-results', 'playwright-report']),
  
  // Frontend/React client files
  {
    files: ['src/**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-undef': 'warn',
      'no-useless-escape': 'warn',
      'no-empty': 'warn',
      'react-refresh/only-export-components': 'warn',
      'react-hooks/rules-of-hooks': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/set-state-in-effect': 'off', // Disable custom warning block
      'react-hooks/refs': 'warn', // Demote ref access warning in render to warning
      'no-useless-assignment': 'warn', // Demote useless assignment to warning
    }
  },

  // Backend/Server and tool config files (Node.js environments)
  {
    files: ['server/**/*.js', 'tests/**/*.js', 'tests/**/*.cjs', '*.config.js'],
    extends: [js.configs.recommended],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-undef': 'warn',
      'no-useless-escape': 'warn',
      'no-empty': 'warn',
      'no-console': 'off',
    }
  }
])
