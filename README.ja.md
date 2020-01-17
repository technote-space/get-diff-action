# Get Diff Action

[![CI Status](https://github.com/technote-space/get-diff-action/workflows/CI/badge.svg)](https://github.com/technote-space/get-diff-action/actions)
[![codecov](https://codecov.io/gh/technote-space/get-diff-action/branch/master/graph/badge.svg)](https://codecov.io/gh/technote-space/get-diff-action)
[![CodeFactor](https://www.codefactor.io/repository/github/technote-space/get-diff-action/badge)](https://www.codefactor.io/repository/github/technote-space/get-diff-action)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/technote-space/get-diff-action/blob/master/LICENSE)

*Read this in other languages: [English](README.md), [日本語](README.ja.md).*

これは `git diff` を取得するための GitHub Actions です。

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**

- [Screenshots](#screenshots)
- [Usage](#usage)
- [Behavior](#behavior)
- [Action event details](#action-event-details)
  - [Target events](#target-events)
- [Author](#author)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## スクリーンショット
1. Workflow の例  
   ![Example workflow](https://raw.githubusercontent.com/technote-space/get-diff-action/images/workflow.png)
1. スキップ  
   ![Skip](https://raw.githubusercontent.com/technote-space/get-diff-action/images/skip.png)

## 使用方法
```yaml
on: pull_request
name: CI
jobs:
  eslint:
    name: ESLint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
        with:
          fetch-depth: 3
      - uses: technote-space/get-diff-action@v1
        id: git-diff
        with:
          PREFIX_FILTER: |
            src
            __tests__
          SUFFIX_FILTER: .ts
      - name: Install Package dependencies
        run: yarn install
        if: steps.git-diff.outputs.diff
      - name: Check code style
        # 差分があるソースコードだけチェック
        run: yarn eslint ${{ steps.git-diff.outputs.diff }}
        if: steps.git-diff.outputs.diff
```

以下のソースコードに差分がない場合、この Workflow はコードのスタイルチェックをスキップします。
- `src/**/*.ts`
- `__tests__/**/*.ts`

## 動作
1. `git diff` を取得

   ```shell script
   git diff "${FROM}"${DOT}"${TO}" '--diff-filter=${DIFF_FILTER}' --name-only
   ```

   例：(default)
   ```yaml
   FROM: 'origin/${GITHUB_BASE_REF}'
   TO: '${GITHUB_REF#refs/}'
   DOT: '...'
   DIFF_FILTER: 'AM'
   ```
   =>
   ```shell script
   git diff "origin/${GITHUB_BASE_REF}"..."${GITHUB_REF#refs/}" '--diff-filter=AM' --name-only
   ```
   =>
   ```
   .github/workflows/ci.yml
   __tests__/utils/command.test.ts
   package.json
   src/main.ts
   src/utils/command.ts
   yarn.lock
   ```

1. `PREFIX_FILTER` や `SUFFIX_FILTER` オプションによるフィルタ

   例：
   ```yaml
   SUFFIX_FILTER: .ts
   PREFIX_FILTER: src/
   ```
   =>
   ```
   src/main.ts
   src/utils/command.ts
   ```

1. `ABSOLUTE` オプションがtrue(default)の場合に絶対パスに変換

   例：(default)
   ```
   /home/runner/work/my-repo-name/my-repo-name/src/main.ts
   /home/runner/work/my-repo-name/my-repo-name/src/utils/command.ts
   ```

1. `SEPARATOR` オプションの値で結合

   例：
   ```yaml
   SEPARATOR: ' '
   ```
   =>
   ```
   /home/runner/work/my-repo-name/my-repo-name/src/main.ts /home/runner/work/my-repo-name/my-repo-name/src/utils/command.ts
   ```

## Action イベント詳細
### 対象イベント
| eventName | action |
|:---:|:---:|
|pull_request|opened, reopened, rerequested, synchronize|

もしこれ以外のイベントで呼ばれた場合、結果は空になります。

## Author
[GitHub (Technote)](https://github.com/technote-space)  
[Blog](https://technote.space)
