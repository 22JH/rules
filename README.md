# jude-rule

프론트엔드 작업에서 합의한 규칙 모음. 새 세션은 이 파일부터 읽고, 작업 주제에 맞는 문서를 이어서 읽는다.

| 문서 | 내용 |
|---|---|
| [working-style.md](working-style.md) | 답변 언어, 확인 요청, 보고 방식 |
| [git-workflow.md](git-workflow.md) | 이슈·브랜치·워크트리·커밋·PR 규칙 |
| [architecture.md](architecture.md) | FSD 레이어, DTO·model·Params, feature(port/usecase/container) 규칙 |
| [lint.md](lint.md) | eslint 로 강제하는 규칙과 설정 구조 |
| [naming.md](naming.md) | 레이어·폴더별 파일 이름 / export 이름 규칙 |
| [table-sort.md](table-sort.md) | 테이블 정렬(searchParams · TanStack Table) 규칙 |
| [templates/](templates/) | 그대로 복사해 쓰는 eslint · prettier 설정 (아래 표) |

## templates — 저장소에 두는 위치

| templates 경로 | 저장소 경로 | 내용 |
|---|---|---|
| `app/eslint.config.ts` | `apps/<app>/eslint.config.ts` | 레이어·import·HTTP·default export 규칙 ([lint.md](lint.md)) |
| `app/eslint.naming.ts` | `apps/<app>/eslint.naming.ts` | 파일·export 이름 규칙 ([naming.md](naming.md)) |
| `app/prettier.config.js` | `apps/<app>/prettier.config.js` | 공용 prettier 위에 앱 import 순서 override |
| `tooling/eslint-config/*` | `tooling/eslint-config/` | 공용 eslint (`@repo/eslint-config`: base · react · next · react-internal) |
| `tooling/prettier/*` | `tooling/prettier/` | 공용 prettier (`@repo/prettier-config`) |
| `.prettierignore` | 저장소 루트 | 빌드·생성물 제외 목록 (패키지 경로는 저장소에 맞게 조정) |

앱 `package.json`: `"lint": "eslint . --max-warnings=0"`, devDependencies 에 `"@repo/eslint-config": "workspace:*"`, 최상위에 `"prettier": "@repo/prettier-config"`.

## 전제 스택
Next.js App Router · React · TypeScript · pnpm + turbo 모노레포 · TanStack Table/Query · `@repo/*` 워크스페이스 패키지
(`@repo/ui` 디자인 시스템, `@repo/api-client` HTTP 클라이언트).

## 검증 명령 (CI 와 동일하게)

```bash
pnpm turbo check-types lint build test --filter=<app> --ui=stream
pnpm format:check
```

lint 는 `eslint . --max-warnings=0` — 경고도 실패다.
