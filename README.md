# Get Diff Action

[![CI Status](https://github.com/technote-space/get-diff-action/workflows/CI/badge.svg)](https://github.com/technote-space/get-diff-action/actions)
[![codecov](https://codecov.io/gh/technote-space/get-diff-action/branch/main/graph/badge.svg)](https://codecov.io/gh/technote-space/get-diff-action)
[![CodeFactor](https://www.codefactor.io/repository/github/technote-space/get-diff-action/badge)](https://www.codefactor.io/repository/github/technote-space/get-diff-action)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/technote-space/get-diff-action/blob/main/LICENSE)

*Read this in other languages: [English](README.md), [日本語](README.ja.md).*

GitHub actions to get git diff.  
You can get the differences via env or action output.

## Table of Contents

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
<details>
<summary>Details</summary>

- [Screenshots](#screenshots)
- [Usage](#usage)
  - [Example of matching files](#example-of-matching-files)
  - [Examples of non-matching files](#examples-of-non-matching-files)
  - [Examples of env](#examples-of-env)
- [Behavior](#behavior)
- [Outputs](#outputs)
- [Action event details](#action-event-details)
  - [Target events](#target-events)
- [Addition](#addition)
  - [FROM, TO](#from-to)
  - [Check only the latest commit differences in a draft Pull Request](#check-only-the-latest-commit-differences-in-a-draft-pull-request)
  - [To get the result in Json format](#to-get-the-result-in-json-format)
  - [Specify a relative path](#specify-a-relative-path)
- [Author](#author)

*generated with [TOC Generator](https://github.com/technote-space/toc-generator)*

</details>
<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Screenshots
1. Example workflow

   ![Example workflow](https://raw.githubusercontent.com/technote-space/get-diff-action/images/workflow.png)
1. Skip

   ![Skip](https://raw.githubusercontent.com/technote-space/get-diff-action/images/skip.png)

## Usage
Basic Usage
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
        # Check only if there are differences in the source code
        run: yarn lint
        if: env.GIT_DIFF
```

[Details of the patterns that can be specified](https://github.com/isaacs/minimatch#minimatch)

### Example of matching files
- `src/main.ts`
- `src/utils/abc.ts`
- `__tests__/test.ts`
- `yarn.lock`
- `.eslintrc`
- `anywhere/yarn.lock`

### Examples of non-matching files
- `main.ts`
- `src/xyz.txt`
- `src/exclude.ts`

### Examples of env
| name | value |
|:---|:---|
| `GIT_DIFF` |`'src/main.ts' 'src/utils/abc.ts' '__tests__/test.ts' 'yarn.lock' '.eslintrc' 'anywhere/yarn.lock'` |
| `GIT_DIFF_FILTERED` | `'src/main.ts' 'src/utils/abc.ts' '__tests__/test.ts'` |
| `MATCHED_FILES` | `'yarn.lock' '.eslintrc' 'anywhere/yarn.lock'` |

Specify a little more detail
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
        # Check only source files with differences
        run: yarn eslint ${{ env.GIT_DIFF_FILTERED }}  # e.g. yarn eslint 'src/main.ts' '__tests__/test.ts'
        if: env.GIT_DIFF && !env.MATCHED_FILES
      - name: Check code style
        # Check only if there are differences in the source code (Run a lint on all files if there are changes to yarn.lock or .eslintrc)
        run: yarn lint
        if: env.GIT_DIFF && env.MATCHED_FILES
```

If there is no difference in the source code below, this workflow will skip the code style check
- `src/**/*.ts`
- `__tests__/**/*.ts`

## Behavior
1. Get git diff

   ```shell script
   git diff ${FROM}${DOT}${TO} '--diff-filter=${DIFF_FILTER}' --name-only
   ```

   e.g. (default)
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

1. Filtered by `PATTERNS` option

   e.g.
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

1. Filtered by `FILES` option

   e.g.
   ```yaml
   FILES: package.json
   ```
   =>
   ```
   package.json
   anywhere/package.json
   ```

1. Mapped to absolute if `ABSOLUTE` option is true (default: false)

   e.g.
   ```
   /home/runner/work/my-repo-name/my-repo-name/src/main.ts
   /home/runner/work/my-repo-name/my-repo-name/src/docs.md
   ```

1. Combined by `SEPARATOR` option

   e.g. (default)
   ```yaml
   SEPARATOR: ' '
   ```
   =>
   ```
   /home/runner/work/my-repo-name/my-repo-name/src/main.ts /home/runner/work/my-repo-name/my-repo-name/src/docs.md
   ```

## Outputs
| name | description | e.g. |
|:---|:---|:---|
| diff | The results of diff file names.<br>If inputs `SET_ENV_NAME`(default: `GIT_DIFF`) is set, an environment variable is set with that name. | `src/main.ts src/docs.md` |
| count | The number of diff files.<br>If inputs `SET_ENV_NAME_COUNT`(default: `''`) is set, an environment variable is set with that name. | `100` |
| insertions | The number of insertions lines. (Available only if `GET_FILE_DIFF` is `true`)<br>If inputs `SET_ENV_NAME_INSERTIONS`(default: `''`) is set, an environment variable is set with that name. | `100` |
| deletions | The number of deletions lines. (Available only if `GET_FILE_DIFF` is `true`)<br>If inputs `SET_ENV_NAME_DELETIONS`(default: `''`) is set, an environment variable is set with that name. | `100` |
| lines | The number of diff lines. (Available only if `GET_FILE_DIFF` is `true`)<br>If inputs `SET_ENV_NAME_LINES`(default: `''`) is set, an environment variable is set with that name. | `200` |

## Action event details
### Target events
| eventName | action |
|:---|:---|
| pull_request | opened, reopened, synchronize, closed, ready_for_review |
| push         | * |
| merge_group  | * |

If called on any other event, the result will be empty.

## Addition
### FROM, TO
| condition | FROM | TO |
|:---|:---|:---|
| tag push | --- | --- |
| pull request | pull.base.ref (e.g. main) | context.ref (e.g. refs/pull/123/merge) |
| push (which has related pull request) | pull.base.ref (e.g. main) | `refs/pull/${pull.number}/merge` (e.g. refs/pull/123/merge) |
| context.payload.before = '000...000' | default branch (e.g. main) | context.payload.after |
| else | context.payload.before | context.payload.after |

### Check only the latest commit differences in a draft Pull Request
```yaml
on:
  pull_request:
    types: [opened, reopened, synchronize, closed, ready_for_review]

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

### To get the result in Json format
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

### Specify a relative path

GitHub Actions doesn't support `working-directory` for `uses`, so you can't run this action separately for monorepo configuration, etc. However, if you specify the `RELATIVE` option, it will be used as `--relative=<RELATIVE>` for `git diff`.

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

If the files `src/abc/test1.ts`, `src/abc/test2.ts`, `src/abc/test3.txt`, and `src/test4.ts` exist, the result will be as follows:

```shell
> Run echo 'test1.ts' 'test2.ts'
test1.ts test2.ts
```

## Author
[GitHub (Technote)](https://github.com/technote-space)

[Blog](https://technote.space)
