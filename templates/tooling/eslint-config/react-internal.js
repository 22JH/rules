import globals from 'globals';

import baseConfig from './base.js';
import reactConfig from './react.js';

/**
 * A custom ESLint configuration for libraries that use React.
 *
 * @type {import("eslint").FlatESLintConfig[]} */
export default [
  ...baseConfig,
  ...reactConfig,
  {
    languageOptions: {
      globals: {
        ...globals.serviceworker,
        ...globals.browser,
      },
    },
  },
];
