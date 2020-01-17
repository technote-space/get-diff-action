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

- [スクリーンショット](#%E3%82%B9%E3%82%AF%E3%83%AA%E3%83%BC%E3%83%B3%E3%82%B7%E3%83%A7%E3%83%83%E3%83%88)
- [使用方法](#%E4%BD%BF%E7%94%A8%E6%96%B9%E6%B3%95)
- [動作](#%E5%8B%95%E4%BD%9C)
- [Action イベント詳細](#action-%E3%82%A4%E3%83%99%E3%83%B3%E3%83%88%E8%A9%B3%E7%B4%B0)
  - [対象イベント](#%E5%AF%BE%E8%B1%A1%E3%82%A4%E3%83%99%E3%83%B3%E3%83%88)
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
