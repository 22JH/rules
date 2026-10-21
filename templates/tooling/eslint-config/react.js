import pluginReact from 'eslint-plugin-react';
import pluginReactHooks from 'eslint-plugin-react-hooks';

/**
 * React + React Hooks 공통 설정 조각.
 * next.js / react-internal.js가 공유한다(globals는 각 환경에서 더한다).
 *
 * @type {import("eslint").FlatESLintConfig[]}
 */
export default [
  pluginReact.configs.flat.recommended,
  {
    files: ['**/*.{ts,tsx,jsx}'],
    plugins: {
      'react-hooks': pluginReactHooks,
    },
    settings: { react: { version: 'detect' } },
    rules: {
      ...pluginReactHooks.configs.recommended.rules,
      // React scope no longer necessary with new JSX transform.
      'react/react-in-jsx-scope': 'off',
    },
  },
];
