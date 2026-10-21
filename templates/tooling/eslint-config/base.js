import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import importPlugin from 'eslint-plugin-import';
import turboPlugin from 'eslint-plugin-turbo';
import { globalIgnores } from 'eslint/config';
import * as tseslint from 'typescript-eslint';

/**
 * A shared ESLint configuration for the repository.
 *
 * @type {import("eslint").FlatESLintConfig[]}
 * */
export default [
  globalIgnores(['**/dist/**', '**/build/**', '**/node_modules/**', '**/.turbo/**', '**/*.d.ts']),
  js.configs.recommended,
  eslintConfigPrettier,
  ...tseslint.configs.recommended,
  {
    plugins: {
      turbo: turboPlugin,
      import: importPlugin,
    },
    rules: {
      'turbo/no-undeclared-env-vars': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      'prefer-const': 'warn',
      'no-multiple-empty-lines': ['warn', { max: 1, maxEOF: 1 }],
      'arrow-body-style': ['warn', 'as-needed'],
      'object-shorthand': ['warn', 'always'],
      'import/no-duplicates': 'warn',
      eqeqeq: ['warn', 'always'],
      'no-var': 'warn',
      'no-throw-literal': 'warn',
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        {
          prefer: 'type-imports',
          fixStyle: 'separate-type-imports',
        },
      ],
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      '@typescript-eslint/naming-convention': [
        'warn',
        {
          selector: 'interface',
          format: ['PascalCase'],
        },
        {
          selector: 'typeAlias',
          format: ['PascalCase'],
        },
        {
          selector: 'enum',
          format: ['PascalCase'],
        },
      ],
    },
  },
];
