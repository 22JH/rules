# Lint 규칙

설정 원본: [templates/app/eslint.config.ts](templates/app/eslint.config.ts), [templates/app/eslint.naming.ts](templates/app/eslint.naming.ts).
앱 루트(`apps/<app>/`)에 두 파일을 그대로 두면 된다. 공용 설정 [templates/tooling/eslint-config/](templates/tooling/eslint-config/) 의 `next.js` 위에 얹는 구조.
`package.json` 의 lint 스크립트는 `eslint . --max-warnings=0`.

## 설정 구조에서 꼭 알아야 할 것
- **flat config 에서 같은 rule 키는 뒤 설정이 앞 설정을 통째로 덮어쓴다.**
  예전에 전역 `no-restricted-imports`(`@repo/ui` 루트 금지)를 레이어별 `no-restricted-imports` 가 덮어써서
  `src/**` 전체에서 루트 import 금지가 꺼져 있었다(`--print-config` 로 확인 → `{"patterns":[]}`).
  → 파일 범위마다 `restrictImports({...})` 로 **paths·patterns 전체를 한 번에** 만든다.
  `no-restricted-syntax` 도 같은 이유로 파일 범위(files)가 서로 겹치지 않게 나눈다.
- slice 목록은 `readdirSync` 로 폴더를 읽어 만든다 — slice 가 늘어도 설정을 안 고친다.
- 패턴은 gitignore 식 `group` 대신 `regex` 를 쓴다(부정 패턴으로 하위 경로를 되살릴 수 없는 문제 회피).
- 새 규칙을 넣으면 **임시 파일(probe)로 금지/허용 양쪽을 다 확인**하고 지운다. 위반 0건이라도 규칙이 실제로 동작하는지는 probe 로만 알 수 있다.
- 수동 확인: `pnpm exec eslint --print-config <file>` 로 그 파일에 실제 적용되는 rule 값을 본다.

## import 규칙 (`no-restricted-imports`)
| 규칙 | 범위 | 비고 |
|---|---|---|
| `@repo/ui` 루트 import 금지 → `@repo/ui/<subpath>` | 전체 | |
| 레이어 역방향 import 금지 | widgets/features/entities/shared | architecture.md 의 방향 |
| 같은 레이어 다른 slice import 금지 | page/widgets/features/entities 의 각 slice | 자기 slice 는 허용 |
| `entities/*/infra/dto` import 금지 | entities 밖 전부(app 포함) | DTO 는 entities 밖으로 안 나감 |
| `@repo/api-client` (값) import 금지 | `shared/api`, `*/infra/api` 밖 | `import type` 은 허용 |
| `apiClientInstance` import 금지 | `entities/*/infra/api`, `features/*/presentation/container`, `shared/api` 밖 | |
| `axios`, `ky` 금지 | 전체 | |
| hook 에서 `features/*/infra`, `entities/*/infra/api` 금지 | `features/*/presentation/hooks` | usecase 를 거쳐야 함 |

## 기타 규칙
| 규칙 | 범위 |
|---|---|
| `no-restricted-globals: fetch` | `src/**`, `app/**`, `proxy.ts` (단 `shared/api` 제외) |
| `*Params` export 금지 (interface·type·`export {}` 모두) | `*/infra/api` |
| `import/no-default-export` | `src/**` (Next.js 가 요구하는 `app/` 만 default export) |
| 파일 이름 · export 이름 규칙 | [naming.md](naming.md) |

## 이미 공용 config 에 있는 것 (base)
`consistent-type-imports`(separate), `no-explicit-any`, interface/type PascalCase, `react/jsx-sort-props`(reservedFirst·shorthandFirst·callbacksLast),
`jsx-quotes: prefer-single`, `eqeqeq`, `prefer-const`, `object-shorthand`, `arrow-body-style` 등.
`--max-warnings=0` 이라 이것들도 위반 시 CI 실패.

## 위반을 고칠 때의 결정 사례
| 위반 | 정한 해결 |
|---|---|
| entity 가 다른 entity 의 타입·라벨 상수 사용 | 각 entity 에 이름을 붙여 따로 선언 |
| widget A 가 한 곳에서만 쓰는 widget B 사용 | B 를 A 폴더 안으로 이동(`git mv`) |
| widget 이 여러 곳에서 쓰는 다른 widget 사용 | 슬롯 prop 으로 받고 page 가 만들어 넘김 |
| api 파일이 일반 함수 export | 어댑터 메서드로 이동 (`cache()` 필요하면 `readonly x = cache(...)`) |
| usecase 파일에 일반 판단 함수 | 함께 쓰이는 widget 으로 이동 |
| hook 에서 DTO 모양으로 변환하는 함수 export | 변환을 api 파일로 옮기고 Input 은 FE 형태로 |
| 컴포넌트 파일에서 헬퍼 export | 쓰는 파일로 이동 |
| 컬럼 함수 이름 `build*Columns` | `create*Columns` |
| default export 컴포넌트 | named export |
| hook 이 entity api 직접 호출 | port 메서드 추가 → 어댑터 구현 → usecase 위임 |

## Prettier
설정: [templates/tooling/prettier/index.js](templates/tooling/prettier/index.js) (공용) + [templates/app/prettier.config.js](templates/app/prettier.config.js) (앱 override).
- `semi`, `singleQuote`, `jsxSingleQuote`, `printWidth: 120`, `trailingComma: 'es5'`, `arrowParens: 'always'`, `endOfLine: 'lf'`.
- 플러그인: `@ianvs/prettier-plugin-sort-imports` → `prettier-plugin-tailwindcss` (tailwind 는 항상 마지막, `cn`·`cva` 안 클래스도 정렬).
- import 순서(앱 override 기준): type import 그룹들 → React/Next → `@repo/*` → 서드파티 → `@/entities` → `@/features` → `@/widgets` → `@/page` → `@/shared` → 상대경로.
  그룹 사이 빈 줄은 prettier 가 넣는다 — 손으로 맞추지 말고 `prettier --write`.
- 검사는 `pnpm format:check` (루트 glob `**/*.{ts,tsx,md,js,jsx,json,css,scss}` — `.mjs` 는 대상 아님).
