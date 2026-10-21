import { readdirSync } from 'node:fs';
import { join } from 'node:path';

import nextConfig from '@repo/eslint-config/next-js';

import { namingConfigs } from './eslint.naming';

/**
 * FSD 레이어 의존 방향 — app → page → widgets → features → entities → shared.
 * 위 레이어는 아래를 알아도 되지만, 아래 레이어는 위를 알면 안 되고,
 * 같은 레이어의 다른 slice(예: entities/a ↔ entities/b)도 서로 알면 안 된다.
 *
 * `no-restricted-imports` 는 flat config 에서 나중 설정이 앞 설정을 통째로 덮어쓰므로,
 * 파일 범위마다 `restrictImports` 로 paths·patterns 전체를 한 번에 만든다.
 */
type Layer = 'page' | 'widgets' | 'features' | 'entities';

const SRC_DIR = join(import.meta.dirname, 'src');

/** `@/entities/...`, `@entities/...`, `@entities` 를 모두 잡는다. */
const layerRegex = (layer: Layer) => `^@/?${layer}(?:/|$)`;

/** 같은 레이어 중 자기 slice 만 빼고 잡는다. */
const otherSliceRegex = (layer: Layer, slice: string) => `^@/?${layer}(?:$|/(?!${slice}(?:/|$)))`;

const slicesOf = (layer: Layer) =>
  readdirSync(join(SRC_DIR, layer), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

const FORBIDDEN_LAYERS: Record<Layer | 'shared', Layer[]> = {
  page: [],
  widgets: ['page'],
  features: ['page', 'widgets'],
  entities: ['page', 'widgets', 'features'],
  shared: ['page', 'widgets', 'features', 'entities'],
};

const UI_ROOT_PATH = {
  name: '@repo/ui',
  message:
    '루트 import는 금지입니다. "@repo/ui/<subpath>" 형태로만 import 해주세요. (예: @repo/ui/button, 아이콘은 @repo/icons)',
};

/** HTTP 클라이언트는 `shared/api` 와 `*\/infra/api` 에서만 만든다 — 타입 import 는 허용. */
const API_CLIENT_PATH = {
  name: '@repo/api-client',
  allowTypeImports: true,
  message: 'HTTP 호출은 shared/api 또는 */infra/api 에서만 합니다. 이 레이어에서는 api 어댑터를 사용하세요.',
};

/** 공용 클라이언트 인스턴스는 어댑터를 만드는 곳(entities infra/api, features container)에서만 쓴다. */
const API_INSTANCE_PATHS = [
  {
    name: '@/shared/api/client',
    message: 'apiClientInstance 는 entities/*/infra/api 또는 features/*/presentation/container 에서만 사용합니다.',
  },
  {
    name: '@/shared/api',
    importNames: ['apiClientInstance'],
    message: 'apiClientInstance 는 entities/*/infra/api 또는 features/*/presentation/container 에서만 사용합니다.',
  },
];

const HTTP_LIBRARY_PATHS = ['axios', 'ky'].map((name) => ({
  name,
  message: 'HTTP 호출은 @repo/api-client 를 사용합니다.',
}));

/** DTO 는 BE 계약이라 entities 안에서만 다룬다 — 밖에서는 model 을 쓰고, features 는 자기 DTO 를 따로 선언한다. */
const ENTITY_DTO_PATTERN = {
  regex: '^@/?entities/[^/]+/infra/dto(?:/|$)',
  message:
    'entities 의 DTO 는 entities 레이어 밖에서 import할 수 없습니다. model 을 쓰거나 자기 레이어에 DTO 를 선언하세요.',
};

/** feature hook 은 usecase(container)를 거쳐서만 API 를 부른다. */
const USECASE_ONLY_PATTERNS = [
  {
    regex: '^@/?features/[^/]+/infra(?:/|$)',
    message: 'hook 에서 api 어댑터를 직접 쓸 수 없습니다. container 의 usecase 를 사용하세요.',
  },
  {
    regex: '^@/?entities/[^/]+/infra/api(?:/|$)',
    message: 'hook 에서 api 를 직접 호출할 수 없습니다. usecase 에 메서드를 추가하세요.',
  },
];

interface RestrictImportsOptions {
  layer?: Layer | 'shared';
  slice?: string;
  allowApiClient?: boolean;
  allowApiInstance?: boolean;
  usecaseOnly?: boolean;
}

function restrictImports({
  layer,
  slice,
  allowApiClient = false,
  allowApiInstance = false,
  usecaseOnly = false,
}: RestrictImportsOptions) {
  const forbiddenLayers = layer ? FORBIDDEN_LAYERS[layer] : [];

  return {
    'no-restricted-imports': [
      'error',
      {
        paths: [
          UI_ROOT_PATH,
          ...HTTP_LIBRARY_PATHS,
          ...(allowApiClient ? [] : [API_CLIENT_PATH]),
          ...(allowApiInstance ? [] : API_INSTANCE_PATHS),
        ],
        patterns: [
          ...(layer === 'entities' ? [] : [ENTITY_DTO_PATTERN]),
          ...(usecaseOnly ? USECASE_ONLY_PATTERNS : []),
          ...forbiddenLayers.map((target) => ({
            regex: layerRegex(target),
            message: `${layer} 레이어에서 ${target}를 import할 수 없습니다. (FSD 규칙)`,
          })),
          ...(layer && layer !== 'shared' && slice
            ? [
                {
                  regex: otherSliceRegex(layer, slice),
                  message: `${layer}/${slice} 에서 같은 레이어의 다른 slice 를 import할 수 없습니다. (FSD 규칙)`,
                },
              ]
            : []),
        ],
      },
    ],
  };
}

const sliceConfigs = (['page', 'widgets', 'features', 'entities'] as const).flatMap((layer) =>
  slicesOf(layer).map((slice) => ({
    files: [`src/${layer}/${slice}/**`],
    rules: restrictImports({ layer, slice }),
  }))
);

/** 어댑터를 만드는 곳 — slice 규칙 위에 HTTP 허용만 더해 다시 선언한다. */
const httpConfigs = [
  ...slicesOf('entities').map((slice) => ({
    files: [`src/entities/${slice}/infra/api/**`],
    rules: restrictImports({ layer: 'entities', slice, allowApiClient: true, allowApiInstance: true }),
  })),
  ...slicesOf('features').flatMap((slice) => [
    {
      files: [`src/features/${slice}/infra/api/**`],
      rules: restrictImports({ layer: 'features', slice, allowApiClient: true }),
    },
    {
      files: [`src/features/${slice}/presentation/container/**`],
      rules: restrictImports({ layer: 'features', slice, allowApiInstance: true }),
    },
    {
      files: [`src/features/${slice}/presentation/hooks/**`],
      rules: restrictImports({ layer: 'features', slice, usecaseOnly: true }),
    },
  ]),
];

/** @type {import("eslint").FlatESLintConfig[]} */
export default [
  {
    ignores: ['**/.next/**'],
  },
  ...nextConfig,
  {
    rules: {
      ...restrictImports({}),
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
    },
  },
  { files: ['src/shared/**'], rules: restrictImports({ layer: 'shared' }) },
  {
    files: ['src/shared/api/**'],
    rules: restrictImports({ layer: 'shared', allowApiClient: true, allowApiInstance: true }),
  },
  ...sliceConfigs,
  ...httpConfigs,
  {
    files: ['src/**', 'app/**', 'proxy.ts'],
    ignores: ['src/shared/api/**'],
    rules: {
      'no-restricted-globals': [
        'error',
        { name: 'fetch', message: 'HTTP 호출은 @repo/api-client 를 사용합니다. (shared/api 에서만 fetch 허용)' },
      ],
    },
  },
  {
    // default export 는 Next.js 가 요구하는 app/ 라우트 파일에서만 쓴다.
    files: ['src/**'],
    rules: {
      'import/no-default-export': 'error',
    },
  },
  ...namingConfigs,
];
