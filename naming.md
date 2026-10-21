# 이름 규칙

[templates/app/eslint.naming.ts](templates/app/eslint.naming.ts) 가 강제한다.

- 파일 이름: 로컬 규칙 `local/filename-pattern` (플러그인 설치 없이 config 안에 정의). `index.ts(x)`, `*.test.ts(x)` 는 검사 제외.
- export 이름: `no-restricted-syntax`. SCREAMING_CASE 상수(쿼리 키 등)는 어디서나 export 허용.

## 파일 이름

| 위치                                                              | 파일 이름                                                                           |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `*/infra/api/`                                                    | `<name>.api.ts`                                                                     |
| `*/infra/dto/`                                                    | `<name>.dto.ts`                                                                     |
| `entities/*/models/`                                              | `<name>.model.ts`, `<name>.mapper.ts`                                               |
| `entities/*/hooks/`, `features/*/presentation/hooks/`             | `<name>.hook.ts`                                                                    |
| `features/*/port/`                                                | `<name>.port.ts`, `<name>.contract.ts`                                              |
| `features/*/application/usecase/`                                 | `<name>.usecase.ts`                                                                 |
| `features/*/application/store/`                                   | `<name>.store.ts`, `<name>.provider.tsx`                                            |
| `features/*/presentation/container/`                              | `<name>.container.ts`, `<name>.presenter.ts`                                        |
| `features/*/presentation/schema/`                                 | `<name>.schema.ts`                                                                  |
| `shared/hooks/`                                                   | `use<Name>.ts(x)`                                                                   |
| 컴포넌트 `.tsx` (page, widgets, shared/components, shared/modals) | `PascalCase.tsx`                                                                    |
| page·widgets 의 `.ts`                                             | camel/PascalCase + 선택 접미사 `.types` `.constants` `.schema`, 훅은 `use<Name>.ts` |
| shared 모듈 (utils, constants, validation, server, api)           | `camelCase.ts`                                                                      |

`<name>` 은 camelCase.

## export 이름

| 파일                          | 규칙                                                                              |
| ----------------------------- | --------------------------------------------------------------------------------- |
| `*.api.ts`                    | class 는 `<Name>ApiAdapter`, 값(인스턴스)은 `<name>Api` 만. `*Params` export 금지 |
| `*.dto.ts`                    | **타입만**(함수·상수·class 금지), 이름은 `<Name>Dto`                              |
| `*.model.ts`                  | **타입만**, 이름은 `<Name>Model`                                                  |
| `*.mapper.ts`                 | class 는 `<Name>Mapper`, 공개 static 메서드는 `to<Name>` (private static 은 자유) |
| `*.port.ts`                   | 타입만, 이름은 `<Name>Port`                                                       |
| `*.contract.ts`               | 타입만 (보통 `<Name>Input` / `<Name>Output`)                                      |
| `*.usecase.ts`                | class `<Name>Usecase` 만                                                          |
| `*.hook.ts`, `shared/hooks/*` | `use<Name>` 만                                                                    |
| 컴포넌트 `.tsx`               | PascalCase 컴포넌트, `use<Name>` 훅, `create<Name>Columns` 만                     |

## 기타 관례

- 테이블 컬럼 파일: `<Name>TableColumn.tsx` 에 `create<Name>TableColumns()`.
- 컬럼 옵션 인자 타입 이름: `ColumnOptions`.
- 타입 별칭/인터페이스 이름은 PascalCase. 객체는 `interface`, 유니온·원시는 `type`.
- 같은 레이어 slice 간 중복 선언이 필요할 땐 slice 이름을 접두사로 붙여 충돌·혼동을 막는다(`<Slice><Thing>Dto`).
