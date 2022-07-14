# Get Diff Action

[![CI Status](https://github.com/technote-space/get-diff-action/workflows/CI/badge.svg)](https://github.com/technote-space/get-diff-action/actions)
[![codecov](https://codecov.io/gh/technote-space/get-diff-action/branch/main/graph/badge.svg)](https://codecov.io/gh/technote-space/get-diff-action)
[![CodeFactor](https://www.codefactor.io/repository/github/technote-space/get-diff-action/badge)](https://www.codefactor.io/repository/github/technote-space/get-diff-action)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/technote-space/get-diff-action/blob/main/LICENSE)

*Read this in other languages: [English](README.md), [日本語](README.ja.md).*

これは `git diff` を取得するための GitHub Actions です。  
env または actionsの出力 から差分を得ることができます。

## Table of Contents

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
<details>
<summary>Details</summary>

- [スクリーンショット](#%E3%82%B9%E3%82%AF%E3%83%AA%E3%83%BC%E3%83%B3%E3%82%B7%E3%83%A7%E3%83%83%E3%83%88)
- [使用方法](#%E4%BD%BF%E7%94%A8%E6%96%B9%E6%B3%95)
  - [マッチするファイルの例](#%E3%83%9E%E3%83%83%E3%83%81%E3%81%99%E3%82%8B%E3%83%95%E3%82%A1%E3%82%A4%E3%83%AB%E3%81%AE%E4%BE%8B)
  - [マッチしないファイルの例](#%E3%83%9E%E3%83%83%E3%83%81%E3%81%97%E3%81%AA%E3%81%84%E3%83%95%E3%82%A1%E3%82%A4%E3%83%AB%E3%81%AE%E4%BE%8B)
  - [envの例](#env%E3%81%AE%E4%BE%8B)
- [動作](#%E5%8B%95%E4%BD%9C)
- [出力](#%E5%87%BA%E5%8A%9B)
- [Action イベント詳細](#action-%E3%82%A4%E3%83%99%E3%83%B3%E3%83%88%E8%A9%B3%E7%B4%B0)
  - [対象イベント](#%E5%AF%BE%E8%B1%A1%E3%82%A4%E3%83%99%E3%83%B3%E3%83%88)
- [補足](#%E8%A3%9C%E8%B6%B3)
  - [FROM, TO](#from-to)
  - [下書きのプルリクエストで最新コミット差分のみをチェックする場合](#%E4%B8%8B%E6%9B%B8%E3%81%8D%E3%81%AE%E3%83%97%E3%83%AB%E3%83%AA%E3%82%AF%E3%82%A8%E3%82%B9%E3%83%88%E3%81%A7%E6%9C%80%E6%96%B0%E3%82%B3%E3%83%9F%E3%83%83%E3%83%88%E5%B7%AE%E5%88%86%E3%81%AE%E3%81%BF%E3%82%92%E3%83%81%E3%82%A7%E3%83%83%E3%82%AF%E3%81%99%E3%82%8B%E5%A0%B4%E5%90%88)
  - [Json形式で結果を取得する場合](#json%E5%BD%A2%E5%BC%8F%E3%81%A7%E7%B5%90%E6%9E%9C%E3%82%92%E5%8F%96%E5%BE%97%E3%81%99%E3%82%8B%E5%A0%B4%E5%90%88)
  - [相対パスを指定](#%E7%9B%B8%E5%AF%BE%E3%83%91%E3%82%B9%E3%82%92%E6%8C%87%E5%AE%9A)
- [Author](#author)

*generated with [TOC Generator](https://github.com/technote-space/toc-generator)*

</details>
<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## スクリーンショット
1. Workflow の例

   ![Example workflow](https://raw.githubusercontent.com/technote-space/get-diff-action/images/workflow.png)
1. スキップ

   ![Skip](https://raw.githubusercontent.com/technote-space/get-diff-action/images/skip.png)

## 使用方法
基本的な使い方
```yaml
on: pull_request
name: CI
jobs:
  eslint:
    name: ESLint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: technote-space/get-diff-action@v6
        with:
          PATTERNS: |
            +(src|__tests__)/**/*.ts
            !src/exclude.ts
          FILES: |
            yarn.lock
            .eslintrc
      - name: Install Package dependencies
        run: yarn install
        if: env.GIT_DIFF
      - name: Check code style
        # 差分がある場合だけチェック
        run: yarn eslint ${{ env.GIT_DIFF }}
        if: env.GIT_DIFF
```

[指定可能なパターンの詳細](https://github.com/isaacs/minimatch#minimatch)

### マッチするファイルの例
- `src/main.ts`
- `src/utils/abc.ts`
- `__tests__/test.ts`
- `yarn.lock`
- `.eslintrc`
- `anywhere/yarn.lock`

### マッチしないファイルの例
- `main.ts`
- `src/xyz.txt`
- `src/exclude.ts`

### envの例
| name | value |
|:---|:---|
| `GIT_DIFF` |`'src/main.ts' 'src/utils/abc.ts' '__tests__/test.ts' 'yarn.lock' '.eslintrc' 'anywhere/yarn.lock'` |
| `GIT_DIFF_FILTERED` | `'src/main.ts' 'src/utils/abc.ts' '__tests__/test.ts'` |
| `MATCHED_FILES` | `'yarn.lock' '.eslintrc' 'anywhere/yarn.lock'` |

もう少し細かく動作を指定
```yaml
on: pull_request
name: CI
jobs:
  eslint:
    name: ESLint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: technote-space/get-diff-action@v6
        with:
          PATTERNS: |
            +(src|__tests__)/**/*.ts
          FILES: |
            yarn.lock
            .eslintrc
      - name: Install Package dependencies
        run: yarn install
        if: env.GIT_DIFF
      - name: Check code style
        # 差分があるソースファイルだけチェック
        run: yarn eslint ${{ env.GIT_DIFF_FILTERED }}  # e.g. yarn eslint 'src/main.ts' '__tests__/test.ts'
        if: env.GIT_DIFF && !env.MATCHED_FILES
      - name: Check code style
        # 差分がある場合だけチェック (yarn.lock か .eslintrc に変更があった場合はすべてでlintを実行)
        run: yarn lint
        if: env.GIT_DIFF && env.MATCHED_FILES
```

以下のソースコードに差分がない場合、この Workflow はコードのスタイルチェックをスキップします。
- `src/**/*.ts`
- `__tests__/**/*.ts`

## 動作
1. `git diff` を取得

   ```shell script
   git diff ${FROM}${DOT}${TO} '--diff-filter=${DIFF_FILTER}' --name-only
   ```

   例：(default)
   ```yaml
   DOT: '...'
   DIFF_FILTER: 'AMRC'
   ```
   =>
   ```shell script
   git diff ${FROM}...${TO} '--diff-filter=AMRC' --name-only
   ```
   =>
   ```
   .github/workflows/ci.yml
   __tests__/utils/command.test.ts
   package.json
   src/main.ts
   src/utils/command.ts
   src/docs.md
   yarn.lock
   ```
   
   [${FROM}, ${TO}](#from-to)

1. `PATTERNS` オプションによるフィルタ

   例：
   ```yaml
   PATTERNS: |
     src/**/*.+(ts|md)
     !src/utils/*
   ```
   =>
   ```
   src/main.ts
   src/docs.md
   ```

1. `FILES` オプションによるフィルタ

   e.g.
   ```yaml
   FILES: package.json
   ```
   =>
   ```
   package.json
   anywhere/package.json
   ```

1. `ABSOLUTE` オプションがtrue場合に絶対パスに変換 (default: false)

   例：
   ```
   /home/runner/work/my-repo-name/my-repo-name/src/main.ts
   /home/runner/work/my-repo-name/my-repo-name/src/docs.md
   ```

1. `SEPARATOR` オプションの値で結合

   例：(default: false)
   ```yaml
   SEPARATOR: ' '
   ```
   =>
   ```
   /home/runner/work/my-repo-name/my-repo-name/src/main.ts /home/runner/work/my-repo-name/my-repo-name/src/docs.md
   ```

## 出力
| name | description | e.g. |
|:---|:---|:---|
| diff | 差分のあるファイルの結果<br>`SET_ENV_NAME`(default: `GIT_DIFF`) が設定されている場合、その名前で環境変数が設定されます | `src/main.ts src/docs.md` |
| count | 差分のあるファイル数<br>`SET_ENV_NAME_COUNT`(default: `''`) が設定されている場合、その名前で環境変数が設定されます | `100` |
| insertions | 追加された行数 (`GET_FILE_DIFF` が `true` の場合のみ利用可能)<br>`SET_ENV_NAME_INSERTIONS`(default: `''`) が設定されている場合、その名前で環境変数が設定されます | `100` |
| deletions | 削除された行数 (`GET_FILE_DIFF` が `true` の場合のみ利用可能)<br>`SET_ENV_NAME_DELETIONS`(default: `''`) が設定されている場合、その名前で環境変数が設定されます | `100` |
| lines | 追加された行数と削除された行数の和 (`GET_FILE_DIFF` が `true` の場合のみ利用可能)<br>`SET_ENV_NAME_LINES`(default: `''`) が設定されている場合、その名前で環境変数が設定されます | `200` |

## Action イベント詳細
### 対象イベント
| eventName | action |
|:---|:---|
| pull_request | opened, reopened, synchronize, closed, ready_for_review, auto_merge_enabled |
| push | * |

もしこれ以外のイベントで呼ばれた場合、結果は空になります。

## 補足
### FROM, TO
| condition | FROM | TO |
|:---|:---|:---|
| tag push | --- | --- |
| pull request | pull.base.ref (e.g. main) | context.ref (e.g. refs/pull/123/merge) |
| push (has related pull request) | pull.base.ref (e.g. main) | `refs/pull/${pull.number}/merge` (e.g. refs/pull/123/merge) |
| context.payload.before = '000...000' | default branch (e.g. main) | context.payload.after |
| else | context.payload.before | context.payload.after |

### 下書きのプルリクエストで最新コミット差分のみをチェックする場合
```yaml
on:
  pull_request:
    types: [opened, reopened, synchronize, closed, ready_for_review, auto_merge_enabled]

jobs:
  eslint:
    name: ESLint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: technote-space/get-diff-action@v6
        with:
          CHECK_ONLY_COMMIT_WHEN_DRAFT: true
      # ...
```

### Json形式で結果を取得する場合
```yaml
on: pull_request
name: CI
jobs:
  dump:
    name: Dump
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: technote-space/get-diff-action@v6
        with:
          PATTERNS: |
            +(src|__tests__)/**/*.ts
            !src/exclude.ts
          FORMAT: json
      - run: echo '${{ env.GIT_DIFF }}' | jq .
```

Result:
```shell
> Run echo '["yarn.lock"]' | jq .
[
  "yarn.lock"
]
```

### 相対パスを指定

GitHub Actions は `uses` に `working-directory` を指定できないため、モノレポ構成などで個別に実行したい場合に対応できませんが、`RELATIVE` オプションを指定すると `git diff` の `--relative=<RELATIVE>` として使用されます。

https://git-scm.com/docs/git-diff#Documentation/git-diff.txt---relativeltpathgt

```yaml
on: pull_request
name: CI
jobs:
  dump:
    name: Dump
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: technote-space/get-diff-action@v6
        with:
          PATTERNS: '*.ts'
          RELATIVE: 'src/abc'
      - run: echo ${{ env.GIT_DIFF }}
```

`src/abc/test1.ts`, `src/abc/test2.ts`, `src/abc/test3.txt`, `src/test4.ts` のファイルがある場合、結果は以下のようになります。

```shell
> Run echo 'test1.ts' 'test2.ts'
test1.ts test2.ts
```

## Author
[GitHub (Technote)](https://github.com/technote-space)

[Blog](https://technote.space)
