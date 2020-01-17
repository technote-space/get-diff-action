# Get Diff Action

[![CI Status](https://github.com/technote-space/get-diff-action/workflows/CI/badge.svg)](https://github.com/technote-space/get-diff-action/actions)
[![codecov](https://codecov.io/gh/technote-space/get-diff-action/branch/master/graph/badge.svg)](https://codecov.io/gh/technote-space/get-diff-action)
[![CodeFactor](https://www.codefactor.io/repository/github/technote-space/get-diff-action/badge)](https://www.codefactor.io/repository/github/technote-space/get-diff-action)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/technote-space/get-diff-action/blob/master/LICENSE)

GitHub actions to get git diff.

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**

- [Setup](#setup)
  - [yarn](#yarn)
  - [npm](#npm)
- [Author](#author)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

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
        # Check only the source codes that have differences
        run: yarn eslint ${{ steps.git-diff.outputs.diff }}
        if: steps.git-diff.outputs.diff
```

If there is no difference in the source code below, this workflow will skip the code style check
- `src/**/*.ts`
- `__tests__/**/*.ts`

## Behavior
1. Get git diff

   ```shell script
   git diff "${FROM}"${DOT}"${TO}" '--diff-filter=${DIFF_FILTER}' --name-only
   ```

   e.g. (default)
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

1. Mapped to absolute if `ABSOLUTE` option is true(default)

   e.g. (default)
   ```
   /home/runner/work/my-repo-name/my-repo-name/src/main.ts
   /home/runner/work/my-repo-name/my-repo-name/src/utils/command.ts
   ```

1. Combined by `SEPARATOR` option

   e.g.
   ```yaml
   SEPARATOR: ' '
   ```
   =>
   ```
   /home/runner/work/my-repo-name/my-repo-name/src/main.ts /home/runner/work/my-repo-name/my-repo-name/src/utils/command.ts
   ```

## Author
[GitHub (Technote)](https://github.com/technote-space)  
[Blog](https://technote.space)
