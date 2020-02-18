# Get Diff Action

[![CI Status](https://github.com/technote-space/get-diff-action/workflows/CI/badge.svg)](https://github.com/technote-space/get-diff-action/actions)
[![codecov](https://codecov.io/gh/technote-space/get-diff-action/branch/master/graph/badge.svg)](https://codecov.io/gh/technote-space/get-diff-action)
[![CodeFactor](https://www.codefactor.io/repository/github/technote-space/get-diff-action/badge)](https://www.codefactor.io/repository/github/technote-space/get-diff-action)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/technote-space/get-diff-action/blob/master/LICENSE)

*Read this in other languages: [English](README.md), [日本語](README.ja.md).*

これは `git diff` を取得するための GitHub Actions です。

## Table of Contents

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
<details>
<summary>Details</summary>

- [スクリーンショット](#%E3%82%B9%E3%82%AF%E3%83%AA%E3%83%BC%E3%83%B3%E3%82%B7%E3%83%A7%E3%83%83%E3%83%88)
- [使用方法](#%E4%BD%BF%E7%94%A8%E6%96%B9%E6%B3%95)
- [動作](#%E5%8B%95%E4%BD%9C)
- [出力](#%E5%87%BA%E5%8A%9B)
  - [diff](#diff)
  - [count](#count)
  - [insertions](#insertions)
  - [deletions](#deletions)
  - [lines](#lines)
- [Action イベント詳細](#action-%E3%82%A4%E3%83%99%E3%83%B3%E3%83%88%E8%A9%B3%E7%B4%B0)
  - [対象イベント](#%E5%AF%BE%E8%B1%A1%E3%82%A4%E3%83%99%E3%83%B3%E3%83%88)
- [補足](#%E8%A3%9C%E8%B6%B3)
  - [FROM, TO](#from-to)
- [Author](#author)

</details>
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
      - uses: technote-space/get-diff-action@v1
        # id: git-diff
        with:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          PREFIX_FILTER: |
            src
            __tests__
          SUFFIX_FILTER: .ts
      - name: Install Package dependencies
        run: yarn install
        # if: steps.git-diff.outputs.diff
        if: env.GIT_DIFF
      - name: Check code style
        # 差分があるソースコードだけチェック
        # run: yarn eslint ${{ steps.git-diff.outputs.diff }}
        run: yarn eslint ${{ env.GIT_DIFF }}
        # if: steps.git-diff.outputs.diff
        if: env.GIT_DIFF
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
   DIFF_FILTER: 'AM'
   ```
   =>
   ```shell script
   git diff ${FROM}...${TO} '--diff-filter=AM' --name-only
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
   
   [${FROM}, ${TO}](#from-to)

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

1. `ABSOLUTE` オプションがtrue場合に絶対パスに変換 (default: false)

   例：
   ```
   /home/runner/work/my-repo-name/my-repo-name/src/main.ts
   /home/runner/work/my-repo-name/my-repo-name/src/utils/command.ts
   ```

1. `SEPARATOR` オプションの値で結合

   例：(default: false)
   ```yaml
   SEPARATOR: ' '
   ```
   =>
   ```
   /home/runner/work/my-repo-name/my-repo-name/src/main.ts /home/runner/work/my-repo-name/my-repo-name/src/utils/command.ts
   ```

## 出力
### diff
差分のあるファイルの結果  
もし `SET_ENV_NAME` が設定されている場合、その名前で環境変数が設定されます。  
default: `SET_ENV_NAME=GIT_DIFF`
### count
差分のあるファイル数  
もし `SET_ENV_NAME_COUNT` が設定されている場合、その名前で環境変数が設定されます。  
default: `SET_ENV_NAME_COUNT=`
### insertions
追加された行数  
もし `SET_ENV_NAME_INSERTIONS` が設定されている場合、その名前で環境変数が設定されます。  
default: `SET_ENV_NAME_INSERTIONS=`
### deletions
削除された行数  
もし `SET_ENV_NAME_DELETIONS` が設定されている場合、その名前で環境変数が設定されます。  
default: `SET_ENV_NAME_DELETIONS=`
### lines
追加された行数と削除された行数の和  
もし `SET_ENV_NAME_LINES` が設定されている場合、その名前で環境変数が設定されます。  
default: `SET_ENV_NAME_LINES=`

## Action イベント詳細
### 対象イベント
| eventName | action |
|:---:|:---:|
|pull_request|opened, reopened, rerequested, synchronize|
|push|*|

もしこれ以外のイベントで呼ばれた場合、結果は空になります。

## 補足
### FROM, TO
| condition | FROM | TO |
|:---:|:---:|:---:|
| tag push |x|x|
| pull request (not default branch) | base ref (e.g. master) | merge ref (e.g. refs/pull/123/merge) |
| payload.before = '000...000' | default branch (e.g. master) | payload.after |
| else | payload.before | payload.after |

## Author
[GitHub (Technote)](https://github.com/technote-space)  
[Blog](https://technote.space)
