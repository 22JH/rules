# 아키텍처 (FSD)

## 레이어와 의존 방향
```
app → page → widgets → features → entities → shared
```
- 위 레이어는 아래를 import 할 수 있고, 아래 레이어는 위를 import 할 수 없다.
- **같은 레이어의 다른 slice 끼리 import 금지** (예: `entities/a` ↔ `entities/b`, `widgets/A` ↔ `widgets/B`).
  - 다른 entity 의 타입이 필요하면 **각 entity 가 자기 이름을 붙여 따로 선언**한다(예: `<Slice>StatusDto`, `<Slice>StatusModel`).
    공통으로 올리지 않는다.
  - widget 이 다른 widget 을 쓰고 있었는데 그 widget 을 한 곳에서만 쓰면, **쓰는 widget 안으로 옮긴다**.
  - 여러 곳에서 쓰는 widget(A)을 다른 widget(B)이 써야 하면, B 가 슬롯(prop)으로 받고 page 가 A 를 만들어 넘긴다.
    서버 컴포넌트 → client 컴포넌트로는 함수(render prop)를 못 넘기므로 **미리 그린 JSX 를 키별로 묶어** 넘긴다
    (`cells: Record<id, ReactNode>`).
- 판단 함수의 위치: 레이어 규칙만이 아니라 **쓰임새**로 정한다. 특정 widget 과 함께 쓰이는 판단 함수(예: 메뉴 권한 확인)는
  그 widget 에 두고, app 레이아웃 등은 그 widget 의 배럴에서 import 한다.
- 한 곳에서만 쓰는 헬퍼는 **쓰는 파일로 옮긴다**(컴포넌트 파일에서 일반 함수를 export 하지 않는다).

## entities
```
entities/<slice>/
  infra/api/<slice>.api.ts   어댑터 class(<Name>ApiAdapter) + 인스턴스(<name>Api)
  infra/dto/<slice>.dto.ts   BE 계약 타입만 (<Name>Dto)
  models/<slice>.model.ts    화면이 쓰는 도메인 타입만 (<Name>Model)
  models/<slice>.mapper.ts   <Name>Mapper — static to<Name>() 로 DTO → model
  hooks/<name>.hook.ts       (필요할 때) use<Name>
```
### DTO
- **DTO 는 entities 레이어 밖으로 나가지 않는다.** page·widgets·features·app·shared 어디서도 `entities/*/infra/dto` 를 import 금지.
  features 의 infra 도 예외 없음 — feature 에 DTO 가 필요하면 자기 `infra/dto` 에 따로 선언한다.
- **Why:** DTO 는 서버 와이어 규약이라 BE 가 바꾸면 같이 흔들린다. 화면이 DTO 를 보면 BE 변경이 page 까지 번진다.

### api 입력 = 비공개 `GetXxxParams`
- api 메서드 입력 타입은 **그 api 파일 안에 export 하지 않는 `interface GetXxxParams`** 로 선언한다. model 로 올리지 않는다.
- 화면은 자기 화면 타입/model 로 값을 들고 있다가 구조적 타이핑으로 Params 에 그대로 넘긴다.
- **FE 용 형태 → DTO 형태 변환은 api 파일 안에서** 한다(예: `sort` 객체 → `'field,direction'` 문자열).
  ```ts
  interface GetItemsParams {
    sort?: { sortField: 'status' | 'createdAt'; sortDirection: 'asc' | 'desc' };
    page?: number;
    size?: number;
  }
  async getItems(request: GetItemsParams = {}) {
    const params = {
      sort: request.sort && `${request.sort.sortField},${request.sort.sortDirection}`,
      page: request.page,
      size: request.size,
    } satisfies GetItemsRequestDto;
  }
  ```
- 조회 조건 묶음을 `XxxQueryModel` / `XxxSortModel` 로 model 에 두는 것은 **틀린 방향**(한 번 했다가 전부 되돌렸다).
  정렬 객체 타입은 추상화하지 말고 인라인으로 쓴다.

### model
- 화면이 쓰는 도메인 값만: row / list / detail 모델, 라벨·필터에 쓰는 코드 enum.
- **정렬 기준·검색 대상 타입은 화면(테이블/검색 폼) 파일에서 선언**한다 — 정렬 가능한 컬럼은 테이블이 정하는 것이지 도메인 규약이 아니다.

### api 어댑터 안의 공용 함수
- 요청 단위 캐시가 필요한 조회(쿠키에서 사용자 읽기 등)도 별도 export 함수로 두지 않고 어댑터 메서드로 둔다.
  ```ts
  readonly getUser = cache(async () => { ... });   // 호출: <name>Api.getUser()
  ```

## features
```
features/<slice>/
  port/<name>.port.ts          <Name>Port interface (타입만)
  port/<name>.contract.ts      Input/Output 타입 (타입만)
  application/usecase/<name>.usecase.ts   <Name>Usecase class — port 에 위임
  application/store/           <name>.store.ts, <name>.provider.tsx
  infra/api/<name>.api.ts      <Name>ApiAdapter implements <Name>Port
  infra/dto/<name>.dto.ts      이 feature 의 요청/응답 DTO (entities DTO import 금지)
  presentation/container/<name>.container.ts   new Usecase(new ApiAdapter(apiClientInstance))
  presentation/hooks/<name>.hook.ts            use<Name> — container 의 usecase 만 호출
  presentation/schema/<name>.schema.ts         zod 스키마
```
- **Input(contract)은 FE 가 쓰기 쉬운 형태, DTO 는 계약대로.** 둘 사이 변환은 **api 파일 안에서만** 한다.
  hook·화면·usecase 에서 DTO 모양으로 바꾸지 않는다.
  - 예: 권한 Input 은 `역할 → 권한 목록` 맵 그대로 받고, `{ menu, action }[]` 로 바꾸는 매핑 테이블과 변환 함수는 api 파일에 둔다.
- **hook 은 usecase 없이 API 를 부르지 않는다.** hook 에서 `features/*/infra`(어댑터), `entities/*/infra/api` import 금지.
  필요한 조회가 있으면 port 에 메서드를 추가 → 어댑터가 구현 → usecase 가 위임 → hook 은 usecase 를 호출.
- `apiClientInstance` 는 어댑터를 만드는 곳(entities `infra/api`, features `presentation/container`)에서만 쓴다.

## shared
- 어떤 레이어도 import 하지 않는다(entities 포함). entity 타입이 필요한 함수는 shared 에 두지 말거나, 구조적 타입으로 받는다.
- HTTP 는 `@repo/api-client` 만. `fetch`/`axios` 직접 호출 금지(`shared/api` 제외).

## mock 우선 개발 (BE 미완성일 때)
- api 메서드에서 `// TODO: 서버 API 개발 후 mock return 제거` 주석과 함께 mock 을 먼저 return 하고, 그 아래에 실제 호출 코드를 둔다.
- 요청 파라미터 변환(sort 매핑 등)은 mock return **위로** 올려서 타입 검사가 되게 한다.
- 엔드포인트·필드명을 디자인 명세로 추정했으면 보고할 때 "가정"이라고 밝힌다. BE 스펙 문서(openapi)가 구현보다 앞설 수 있으니
  DTO 를 맞출 땐 구현 코드와 스펙을 둘 다 본다.

## 데이터 조회
- 첫 진입에도 API 를 바로 호출한다(검색 조건이 없다고 빈 테이블을 보여주며 호출을 건너뛰지 않는다).
- 자주 안 바뀌는 목록(셀렉트 옵션 등)은 Next.js fetch 캐시 옵션(`next: { revalidate: 300 }`)을 쓴다 — api-client 가 `next` 옵션을 넘기도록 되어 있어야 한다.
