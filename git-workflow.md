# Git 작업 흐름

## 이슈 → 브랜치 → PR
1. 작업 전에 GitHub 이슈를 만든다. 이슈 번호가 브랜치·커밋·PR 에 쓰인다.
2. 브랜치 이름: `feat/#<이슈번호>`. base 는 `develop`.
3. 커밋 메시지: `<한국어 요약> Fixes #<이슈번호>` (예: `테이블 정렬을 클라이언트 정렬로 변경 Fixes #12`).
4. PR
   - 제목 = **이슈 제목과 똑같이**
   - 본문 = `Fixes: #<이슈번호>` 한 줄
   - base = `develop`
5. **커밋·PR 에 Claude 태그(Co-Authored-By, "Generated with Claude Code" 등)를 넣지 않는다.**

## 브랜치 만들 때 — `--no-track` 필수
```bash
git switch --no-track -c 'feat/#N' origin/develop
git rev-parse --abbrev-ref '@{upstream}'   # → "no upstream" 이어야 정상
git push -u origin 'feat/#N'               # 첫 푸시
```
**Why:** `origin/develop` 에서 `--no-track` 없이 따면 upstream 이 `origin/develop` 이 되어, 그 브랜치에서 `git push` 한 커밋이
원격 develop 에 바로 들어간 사고가 있었다(PR 도 "변경 없음"이 됨). 사용자는 "다음부터 그러지마"라고 했다.

## 워크트리
- 기본은 **원래 저장소에서 새 브랜치를 따서** 작업한다(사용자가 "워크트리에서 할 필요 없다"고 한 적 있음).
- 원래 저장소에 다른 진행 중인 작업(커밋 안 된 변경)이 있을 때만 워크트리를 쓴다. 또는 사용자가 워크트리를 요청할 때.
- 위치는 저장소 **안** `.worktrees/<이슈번호>` (저장소 밖 형제 폴더 금지 — "작업한 게 사라졌다"는 혼란을 줬다).
- `.worktrees/` 는 `.gitignore` 가 아니라 `.git/info/exclude` 에 넣는다(진행 중 PR 을 오염시키지 않게).
```bash
git worktree add --no-track -b 'feat/#N' .worktrees/N origin/develop
pnpm install --frozen-lockfile --prefer-offline   # 워크트리엔 node_modules 가 없다
```
- 같은 브랜치는 두 곳에서 동시에 checkout 할 수 없다. 사용자가 그 브랜치를 checkout 하려 하면 워크트리를 지워야 한다.
  지우기 전에 `git status --short` 가 비었는지, `git log origin/<branch>..HEAD` 가 비었는지(안 푸시한 커밋 없음) 확인한다.
- 워크트리 작업을 원래 저장소로 가져올 때: 커밋 전이면 `git diff --cached --binary -M` 패치로 옮기거나,
  `git stash push -u -m <고유태그>` 후 SHA 로 `apply` (stash 는 워크트리끼리 공유되므로 bare `stash pop` 금지).

## 충돌 / develop 이 앞서 나갔을 때
- PR 이 develop 과 충돌하면 브랜치를 `git rebase origin/develop` 하고 `git push --force-with-lease origin '<branch>'`.
  force 는 **PR 브랜치에만**, develop/main 에는 절대 안 한다.
- CI 는 PR 을 develop 과 합친 상태로 검사한다. 내 브랜치 이후 develop 에 들어온 코드가 새 규칙에 걸려 실패할 수 있으니
  rebase 후 다시 lint·타입검사를 돌린다.
- git 이 이름 변경(rename)을 감지해 수정이 새 파일로 옮겨 적용될 수 있다. rebase 후 바뀐 파일 이름에 맞게 타입 이름 등을 정리한다.

## 기타
- zsh 에서 `F="a b"; cmd $F` 는 단어 분리가 안 된다. 여러 파일은 배열 `F=(a b); cmd "${F[@]}"` 로 넘긴다.
- prettier/eslint `--fix` 를 `src` 전체에 돌린 뒤엔 `git status` 로 관련 없는 파일이 바뀌지 않았는지 확인한다.
