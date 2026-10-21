import pluginNext from '@next/eslint-plugin-next';
import pluginA11y from 'eslint-plugin-jsx-a11y';
import pluginReactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

import baseConfig from './base.js';
import reactConfig from './react.js';

/**
 * A custom ESLint configuration for libraries that use Next.js.
 *
 * @type {import("eslint").FlatESLintConfig[]}
 * */
export default [
  ...baseConfig,
  ...reactConfig,
  {
    languageOptions: {
      globals: {
        ...globals.serviceworker,
      },
    },
  },
  {
    plugins: {
      '@next/next': pluginNext,
    },
    rules: {
      ...pluginNext.configs.recommended.rules,
      ...pluginNext.configs['core-web-vitals'].rules,
    },
  },
  {
    plugins: {
      'react-hooks': pluginReactHooks,
      'jsx-a11y': pluginA11y,
    },
    rules: {
      // 추가 React 규칙
      'react/prop-types': 'off', // TypeScript를 사용하므로 비활성화
      'react/jsx-sort-props': [
        'warn',
        {
          callbacksLast: true,
          shorthandFirst: true,
          reservedFirst: true,
        },
      ],
      'react/self-closing-comp': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
      'jsx-quotes': ['warn', 'prefer-single'],

      // 접근성(a11y) 규칙
      'jsx-a11y/alt-text': 'warn',
      'jsx-a11y/aria-props': 'warn',
      'jsx-a11y/aria-proptypes': 'warn',
      'jsx-a11y/aria-unsupported-elements': 'warn',
      'jsx-a11y/role-has-required-aria-props': 'warn',
      'jsx-a11y/role-supports-aria-props': 'warn',
      'jsx-a11y/anchor-has-content': 'warn',
      'jsx-a11y/anchor-is-valid': 'warn',
      'jsx-a11y/img-redundant-alt': 'warn',
      'jsx-a11y/no-access-key': 'warn',
      'jsx-a11y/tabindex-no-positive': 'warn',
    },
  },
];
