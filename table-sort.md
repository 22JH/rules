# 테이블 정렬

## URL (searchParams)

- 정렬은 **단일 `sort` 파라미터** `?sort=<field>,<asc|desc>`. `sortField`/`sortDirection` 로 쪼개지 않는다.
- 정렬 없음 = `sort` 파라미터 자체가 없음. **기본 정렬값을 두지 않는다.**
- 정렬을 바꾸면 `page` 를 `1` 로 되돌린다.
- 한 화면에 정렬 테이블이 둘 이상이면 키를 나눈다(예: `subSort` / `subPage`).

## 값의 형태

- 화면·api 입력 사이에서는 객체 하나로 묶는다: `sort: { sortField, sortDirection } | undefined`.
  정렬이 없으면 **객체 전체가 `undefined`**.
- 타입은 추상화(`SortModel`)하지 말고 인라인. 정렬 가능한 필드 목록도 상수로 빼지 말고 인라인으로 넘긴다.
- 파싱은 shared 의 `toSort(value: string | undefined, fields)` — undefined 처리도 함수 안에서 한다.
  ```ts
  sort={toSort(query.sort, ['status', 'createdAt'])}
  ```
- `'field,direction'` 문자열로 바꾸는 건 **api 파일 안에서**(architecture.md 참고).
- URL 에 쓸 때 `direction && \`${field},${direction}\``처럼 direction 확인이 필요하다 — 없으면`'field,undefined'` 가 된다.

## 헤더 토글

- 헤더 클릭: **desc → asc → 해제** 순환.

## TanStack Table 연동 (정렬 상태는 TanStack 이 관리)

- 수동으로 `sort`/`onSortChange` 를 컬럼 팩토리에 넘기지 않는다. TanStack 의 `state.sorting` / `onSortingChange` 를 쓴다.
- 공통 `Table` 래퍼는 고치지 않고 `features.tableOptions` 로 넘긴다.
- **컬럼 id = 정렬 필드 이름** (`createdAtLabel` 같은 표시용 accessor 라도 id 는 `createdAt`).
- 컬럼 팩토리 `create<Name>Columns()` 는 정렬 관련 인자를 받지 않는다.
- 헤더 컴포넌트는 `column` 을 받는다.
  ```tsx
  header: ({ column }) => <SortableColumnHeader column={column} label="생성일시" />;
  // 내부: direction = column.getIsSorted(), onClick = () => column.toggleSorting()
  // 순환 순서는 테이블 옵션 sortDescFirst: true 가 정한다.
  ```
- shared 유틸: `toSortingState(sort)` (sort 객체 → SortingState), `toSortParam(sorting)` (SortingState → `'field,dir'` | undefined).

### 서버 정렬 (페이지네이션 있는 목록)

```ts
const sortingOptions = useSortingQueryParams(sort);          // sort 는 page.tsx 가 toSort 로 파싱해 내려준 값
<Table features={{ tableOptions: sortingOptions }} ... />
// = { manualSorting: true, sortDescFirst: true, enableMultiSort: false, state: { sorting }, onSortingChange }
// onSortingChange → router.push(?sort=…&page=1) → 서버 컴포넌트가 다시 조회
```

### 클라이언트 정렬 (페이지네이션 없는 작은 테이블)

- 서버가 전체를 주므로 api·page.tsx 에서 `sort`/`page`/`size` 를 뺀다.
- 테이블(client)이 `useSearchParams()` 로 `sort` 를 읽고, 바꿀 때는 `window.history.replaceState` 로 **URL 만** 바꾼다
  (`router.push` 를 쓰면 서버 컴포넌트가 다시 렌더되어 API 를 또 부른다).
- `getSortedRowModel()` + `sortDescFirst: true` + `enableMultiSort: false`.
- 한 화면에 같은 테이블이 여러 개(예: 항목별로 하나씩)면 URL 대신 `useState<SortingState>` 로 테이블마다 따로 든다.
- 숫자 문자열(콤마 라벨) 컬럼은 `sortingFn` 으로 원본 값을 숫자 비교한다. `YYYY-MM-DD HH:mm` 라벨은 문자열 정렬로 충분하다.

## 주의

- `tableOptions.state` 는 래퍼의 `rowSelection` state 를 덮어쓴다. 행 선택과 정렬을 같이 쓰면 래퍼에서 state 를 합치도록 고쳐야 한다.
