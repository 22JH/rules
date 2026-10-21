import { basename } from 'node:path';
import type { Rule } from 'eslint';

/**
 * 레이어·폴더별 파일 이름과 export 이름 규칙.
 *
 * - 파일 이름은 `local/filename-pattern` 으로 폴더마다 정규식을 건다. `index.ts(x)` 와 `*.test.ts(x)` 는 검사하지 않는다.
 * - export 이름은 `no-restricted-syntax` 로 건다. 같은 파일에 두 설정이 겹치면 뒤 설정이 앞을 덮어쓰므로
 *   파일 범위(files)가 서로 겹치지 않게 나눈다.
 */

interface FilenamePatternOptions {
  pattern: string;
  message: string;
}

const filenamePattern: Rule.RuleModule = {
  meta: {
    type: 'suggestion',
    schema: [
      {
        type: 'object',
        properties: { pattern: { type: 'string' }, message: { type: 'string' } },
        required: ['pattern', 'message'],
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    const { pattern, message } = context.options[0] as FilenamePatternOptions;
    const name = basename(context.filename);

    if (/^index\.tsx?$/.test(name) || /\.test\.tsx?$/.test(name)) return {};
    if (new RegExp(pattern).test(name)) return {};

    return {
      Program(node) {
        context.report({ node, message: `파일 이름 '${name}' — ${message}` });
      },
    };
  },
};

const localPlugin = { rules: { 'filename-pattern': filenamePattern } };

const FILENAME_RULES: { files: string[]; pattern: string; message: string }[] = [
  { files: ['src/*/*/infra/api/**'], pattern: '^[a-z][a-zA-Z0-9]*\\.api\\.ts$', message: 'infra/api 는 <name>.api.ts' },
  { files: ['src/*/*/infra/dto/**'], pattern: '^[a-z][a-zA-Z0-9]*\\.dto\\.ts$', message: 'infra/dto 는 <name>.dto.ts' },
  {
    files: ['src/entities/*/models/**'],
    pattern: '^[a-z][a-zA-Z0-9]*\\.(model|mapper)\\.ts$',
    message: 'models 는 <name>.model.ts 또는 <name>.mapper.ts',
  },
  {
    files: ['src/entities/*/hooks/**', 'src/features/*/presentation/hooks/**'],
    pattern: '^[a-z][a-zA-Z0-9]*\\.hook\\.ts$',
    message: 'hooks 는 <name>.hook.ts',
  },
  {
    files: ['src/features/*/port/**'],
    pattern: '^[a-z][a-zA-Z0-9]*\\.(port|contract)\\.ts$',
    message: 'port 는 <name>.port.ts 또는 <name>.contract.ts',
  },
  {
    files: ['src/features/*/application/usecase/**'],
    pattern: '^[a-z][a-zA-Z0-9]*\\.usecase\\.ts$',
    message: 'usecase 는 <name>.usecase.ts',
  },
  {
    files: ['src/features/*/application/store/**'],
    pattern: '^[a-z][a-zA-Z0-9]*\\.(store\\.ts|provider\\.tsx)$',
    message: 'store 는 <name>.store.ts 또는 <name>.provider.tsx',
  },
  {
    files: ['src/features/*/presentation/container/**'],
    pattern: '^[a-z][a-zA-Z0-9]*\\.(container|presenter)\\.ts$',
    message: 'container 는 <name>.container.ts 또는 <name>.presenter.ts',
  },
  {
    files: ['src/features/*/presentation/schema/**'],
    pattern: '^[a-z][a-zA-Z0-9]*\\.schema\\.ts$',
    message: 'schema 는 <name>.schema.ts',
  },
  { files: ['src/shared/hooks/**'], pattern: '^use[A-Z][a-zA-Z0-9]*\\.tsx?$', message: 'shared/hooks 는 use<Name>.ts' },
  {
    files: [
      'src/page/**/*.tsx',
      'src/widgets/**/*.tsx',
      'src/shared/components/**/*.tsx',
      'src/shared/modals/**/*.tsx',
    ],
    pattern: '^[A-Z][a-zA-Z0-9]*\\.tsx$',
    message: '컴포넌트 파일은 PascalCase.tsx',
  },
  {
    files: ['src/page/**/*.ts', 'src/widgets/**/*.ts'],
    pattern: '^(use[A-Z][a-zA-Z0-9]*|[a-zA-Z][a-zA-Z0-9]*(\\.(types|constants|schema))?)\\.ts$',
    message: 'camelCase/PascalCase 에 .types·.constants·.schema 접미사만 허용, 훅은 use<Name>.ts',
  },
  {
    files: [
      'src/shared/utils/**',
      'src/shared/constants/**',
      'src/shared/validation/**',
      'src/shared/server/**',
      'src/shared/api/**',
    ],
    pattern: '^[a-z][a-zA-Z0-9]*\\.ts$',
    message: 'shared 모듈은 camelCase.ts',
  },
];

const TYPES_ONLY = {
  selector: 'ExportNamedDeclaration > :matches(FunctionDeclaration, VariableDeclaration, ClassDeclaration)',
  message: '이 파일에는 타입만 둡니다.',
};

const exportedTypeName = (regex: string, message: string) => ({
  selector: `ExportNamedDeclaration > :matches(TSInterfaceDeclaration, TSTypeAliasDeclaration)[id.name!=/${regex}/]`,
  message,
});

const exportedFunctionName = (regex: string, message: string) => [
  { selector: `ExportNamedDeclaration > FunctionDeclaration[id.name!=/${regex}/]`, message },
  { selector: `ExportNamedDeclaration > VariableDeclaration > VariableDeclarator[id.name!=/${regex}/]`, message },
];

const exportedClassName = (regex: string, message: string) => ({
  selector: `ExportNamedDeclaration > ClassDeclaration[id.name!=/${regex}/]`,
  message,
});

const PARAMS_EXPORT = [
  {
    selector: 'ExportNamedDeclaration > :matches(TSInterfaceDeclaration, TSTypeAliasDeclaration)[id.name=/Params$/]',
    message: 'api 입력 타입(*Params)은 export 하지 않습니다. api 파일 안에서만 사용하세요.',
  },
  {
    selector: 'ExportSpecifier[local.name=/Params$/]',
    message: 'api 입력 타입(*Params)은 export 하지 않습니다. api 파일 안에서만 사용하세요.',
  },
];

/** 상수(SCREAMING_CASE)는 어느 파일에서나 export 할 수 있다. */
const CONSTANT = '[A-Z][A-Z0-9_]*';

const SYNTAX_RULES: { files: string[]; selectors: { selector: string; message: string }[] }[] = [
  {
    // api 입력 타입(GetXxxParams)은 api 파일 안에서만 쓴다 — 화면은 model 이나 화면 타입을 넘긴다.
    files: ['src/*/*/infra/api/**'],
    selectors: [
      ...PARAMS_EXPORT,
      exportedClassName('ApiAdapter$', 'api 파일의 class 는 <Name>ApiAdapter 입니다.'),
      ...exportedFunctionName(
        `^([a-z][a-zA-Z0-9]*Api|${CONSTANT})$`,
        'api 파일은 어댑터 인스턴스(<name>Api)만 export 합니다.'
      ),
    ],
  },
  {
    files: ['src/*/*/infra/dto/**'],
    selectors: [TYPES_ONLY, exportedTypeName('Dto$', 'dto 타입 이름은 <Name>Dto 입니다.')],
  },
  {
    files: ['src/entities/*/models/*.model.ts'],
    selectors: [TYPES_ONLY, exportedTypeName('Model$', 'model 타입 이름은 <Name>Model 입니다.')],
  },
  {
    files: ['src/entities/*/models/*.mapper.ts'],
    selectors: [
      exportedClassName('Mapper$', 'mapper class 이름은 <Name>Mapper 입니다.'),
      {
        selector:
          'ClassDeclaration[id.name=/Mapper$/] > ClassBody > MethodDefinition[static=true][accessibility!="private"][key.name!=/^to[A-Z]/]',
        message: 'mapper 의 공개 static 메서드는 to<Name> 입니다.',
      },
    ],
  },
  {
    files: ['src/features/*/port/*.port.ts'],
    selectors: [TYPES_ONLY, exportedTypeName('Port$', 'port 타입 이름은 <Name>Port 입니다.')],
  },
  { files: ['src/features/*/port/*.contract.ts'], selectors: [TYPES_ONLY] },
  {
    files: ['src/features/*/application/usecase/**'],
    selectors: [
      exportedClassName('Usecase$', 'usecase class 이름은 <Name>Usecase 입니다.'),
      ...exportedFunctionName(`^${CONSTANT}$`, 'usecase 파일은 <Name>Usecase class 만 export 합니다.'),
    ],
  },
  {
    files: ['src/**/*.hook.ts', 'src/shared/hooks/**'],
    selectors: exportedFunctionName(`^(use[A-Z][a-zA-Z0-9]*|${CONSTANT})$`, '훅 파일은 use<Name> 훅만 export 합니다.'),
  },
  {
    files: [
      'src/page/**/*.tsx',
      'src/widgets/**/*.tsx',
      'src/shared/components/**/*.tsx',
      'src/shared/modals/**/*.tsx',
    ],
    selectors: exportedFunctionName(
      `^([A-Z][a-zA-Z0-9]*|use[A-Z][a-zA-Z0-9]*|create[A-Z][a-zA-Z0-9]*Columns)$`,
      '컴포넌트 파일은 PascalCase 컴포넌트, use<Name> 훅, create<Name>Columns 만 export 합니다.'
    ),
  },
];

export const namingConfigs = [
  { plugins: { local: localPlugin } },
  ...FILENAME_RULES.map(({ files, pattern, message }) => ({
    files,
    rules: { 'local/filename-pattern': ['error', { pattern, message }] },
  })),
  ...SYNTAX_RULES.map(({ files, selectors }) => ({
    files,
    rules: { 'no-restricted-syntax': ['error', ...selectors] },
  })),
];
