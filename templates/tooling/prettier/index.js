/** @typedef {import("prettier").Config} PrettierConfig */
/** @typedef {import("prettier-plugin-tailwindcss").PluginOptions} TailwindConfig */
/** @typedef {import("@ianvs/prettier-plugin-sort-imports").PluginConfig} SortImportsConfig */

/** @type { PrettierConfig | SortImportsConfig | TailwindConfig } */
const config = {
  // Base formatting options
  semi: true,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'es5',
  printWidth: 120,
  bracketSpacing: true,
  arrowParens: 'always',
  endOfLine: 'lf',
  jsxSingleQuote: true,
  // Plugins (tailwind 플러그인은 항상 마지막)
  plugins: ['@ianvs/prettier-plugin-sort-imports', 'prettier-plugin-tailwindcss'],
  tailwindFunctions: ['cn', 'cva'],

  // Import 정렬 규칙 (CLAUDE.md 문서 순서를 실제로 강제)
  // 1) 타입 import(그룹별) → 2) React/Next → 3) @repo/*(워크스페이스 패키지, 디자인 시스템 포함) →
  // 4) 서드파티 → 5) 도메인 alias(@/domain·@/shared 등) → 6) 상대경로
  // 앱별 추가 alias(@entities 등)는 각 앱 prettier 설정에서 override.
  importOrder: [
    // Type imports (순서대로)
    '<TYPES>^(react|next|expo)',
    '<TYPES>^@repo',
    '<TYPES>^@entities',
    '<TYPES>^@/entities',
    '<TYPES>^@features',
    '<TYPES>^@/features',
    '<TYPES>^@widgets',
    '<TYPES>^@/widgets',
    '<TYPES>^@shared',
    '<TYPES>^@/shared',
    '<TYPES>^@public',
    '<TYPES>^@/public',
    '<TYPES>',
    '',
    // Regular imports
    '^(react/(.*)$)|^(react$)|^(react-native(.*)$)',
    '^(next/(.*)$)|^(next$)',
    '^(expo(.*)$)|^(expo$)',
    '',
    '^@repo/ui/(.*)$',
    '^@repo/api-client/(.*)$',
    '^@repo/(.*)$',
    '',
    '<THIRD_PARTY_MODULES>',
    '',
    '^@entities/(.*)$',
    '^@/entities/(.*)$',
    '',
    '^@features/(.*)$',
    '^@/features/(.*)$',
    '',
    '^@widgets/(.*)$',
    '^@/widgets/(.*)$',
    '',
    '^@shared/(.*)$',
    '^@/shared/(.*)$',
    '',
    '^@public/(.*)$',
    '^@/public/(.*)$',
    '',
    '^[../]',
    '^[./]',
  ],
  overrides: [
    {
      files: '*.json.hbs',
      options: {
        parser: 'json',
      },
    },
    {
      files: '*.ts.hbs',
      options: {
        parser: 'babel',
      },
    },
  ],
};

export default config;
