# Get Diff Action

[![CI Status](https://github.com/technote-space/get-diff-action/workflows/CI/badge.svg)](https://github.com/technote-space/get-diff-action/actions)
[![codecov](https://codecov.io/gh/technote-space/get-diff-action/branch/master/graph/badge.svg)](https://codecov.io/gh/technote-space/get-diff-action)
[![CodeFactor](https://www.codefactor.io/repository/github/technote-space/get-diff-action/badge)](https://www.codefactor.io/repository/github/technote-space/get-diff-action)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/technote-space/get-diff-action/blob/master/LICENSE)

*Read this in other languages: [English](README.md), [日本語](README.ja.md).*

GitHub actions to get git diff.

## Table of Contents

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
<details>
<summary>Details</summary>

- [Screenshots](#screenshots)
- [Usage](#usage)
- [Behavior](#behavior)
- [Outputs](#outputs)
  - [diff](#diff)
  - [count](#count)
  - [insertions](#insertions)
  - [deletions](#deletions)
  - [lines](#lines)
- [Action event details](#action-event-details)
  - [Target events](#target-events)
- [Addition](#addition)
  - [FROM, TO](#from-to)
- [Author](#author)

</details>
<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Screenshots
1. Example workflow  
   ![Example workflow](https://raw.githubusercontent.com/technote-space/get-diff-action/images/workflow.png)
1. Skip  
   ![Skip](https://raw.githubusercontent.com/technote-space/get-diff-action/images/skip.png)

## Usage
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
          PREFIX_FILTER: |
            src
            __tests__
          SUFFIX_FILTER: .ts
      - name: Install Package dependencies
        run: yarn install
        # if: steps.git-diff.outputs.diff
        if: env.GIT_DIFF
      - name: Check code style
        # Check only the source codes that have differences
        # run: yarn eslint ${{ steps.git-diff.outputs.diff }}
        run: yarn eslint ${{ env.GIT_DIFF }}
        # if: steps.git-diff.outputs.diff
        if: env.GIT_DIFF
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

1. Filtered by `PREFIX_FILTER` or `SUFFIX_FILTER` option

   e.g.
   ```yaml
   SUFFIX_FILTER: .ts
   PREFIX_FILTER: src/
   ```
   =>
   ```
   src/main.ts
   src/utils/command.ts
   ```

1. Mapped to absolute if `ABSOLUTE` option is true (default: false)

   e.g. 
   ```
   /home/runner/work/my-repo-name/my-repo-name/src/main.ts
   /home/runner/work/my-repo-name/my-repo-name/src/utils/command.ts
   ```

1. Combined by `SEPARATOR` option

   e.g. (default)
   ```yaml
   SEPARATOR: ' '
   ```
   =>
   ```
   /home/runner/work/my-repo-name/my-repo-name/src/main.ts /home/runner/work/my-repo-name/my-repo-name/src/utils/command.ts
   ```

## Outputs
### diff
The results of diff file names.  
if inputs `SET_ENV_NAME` is set, an environment variable is set with that name.  
default: `SET_ENV_NAME=GIT_DIFF`
### count
The number of diff files.  
if inputs `SET_ENV_NAME_COUNT` is set, an environment variable is set with that name.  
default: `SET_ENV_NAME_COUNT=`
### insertions
The number of insertions lines.  
if inputs `SET_ENV_NAME_INSERTIONS` is set, an environment variable is set with that name.  
default: `SET_ENV_NAME_INSERTIONS=`
### deletions
The number of deletions lines.  
if inputs `SET_ENV_NAME_DELETIONS` is set, an environment variable is set with that name.  
default: `SET_ENV_NAME_DELETIONS=`
### lines
The number of diff lines.  
if inputs `SET_ENV_NAME_LINES` is set, an environment variable is set with that name.  
default: `SET_ENV_NAME_LINES=`

## Action event details
### Target events
| eventName | action |
|:---:|:---:|
|pull_request|opened, reopened, synchronize|
|push|*|

If called on any other event, the result will be empty.

## Addition
### FROM, TO
| condition | FROM | TO |
|:---:|:---:|:---:|
| tag push |---|---|
| pull request | pull.base.ref (e.g. master) | context.ref (e.g. refs/pull/123/merge) |
| push (has related pull request) | pull.base.ref (e.g. master) | `refs/pull/${pull.number}/merge` (e.g. refs/pull/123/merge) |
| context.payload.before = '000...000' | default branch (e.g. master) | context.payload.after |
| else | context.payload.before | context.payload.after |

## Author
[GitHub (Technote)](https://github.com/technote-space)  
[Blog](https://technote.space)
