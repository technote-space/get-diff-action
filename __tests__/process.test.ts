/* eslint-disable no-magic-numbers */
import path from 'path';
import {
  testEnv,
  spyOnStdout,
  stdoutCalledWith,
  spyOnSpawn,
  execCalledWith,
  spyOnExportVariable,
  exportVariableCalledWith,
  testChildProcess,
  setChildProcessParams,
  testFs,
  generateContext,
  getLogStdout,
} from '@technote-space/github-action-test-helper';
import {Logger} from '@technote-space/github-action-log-helper';
import {dumpDiffs, setResult, execute} from '../src/process';

const rootDir   = path.resolve(__dirname, '..');
const diffs     = [
  {
    file: 'test1',
    insertions: 1,
    deletions: 100,
    lines: 101,
    filterIgnored: false,
    isMatched: true,
  },
  {
    file: 'test2',
    insertions: 2,
    deletions: 200,
    lines: 202,
    filterIgnored: false,
    isMatched: true,
  },
  {
    file: 'test4',
    insertions: 4,
    deletions: 400,
    lines: 404,
    filterIgnored: true,
    isMatched: false,
  },
];
const setExists = testFs(true);
const logger    = new Logger();
const prContext = generateContext({
  owner: 'hello',
  repo: 'world',
  event: 'pull_request',
  ref: 'refs/pull/55/merge',
}, {
  payload: {
    number: 11,
    'pull_request': {
      number: 11,
      id: 21031067,
      head: {
        ref: 'feature/new-feature',
      },
      base: {
        ref: 'master',
      },
      title: 'title',
      'html_url': 'test url',
    },
  },
});

describe('dumpDiffs', () => {
  testEnv(rootDir);

  it('should dump output', () => {
    const mockStdout = spyOnStdout();

    dumpDiffs(diffs, logger);

    stdoutCalledWith(mockStdout, [
      '::group::Dump diffs',
      getLogStdout([
        {
          'file': 'test1',
          'insertions': 1,
          'deletions': 100,
          'lines': 101,
          'filterIgnored': false,
          'isMatched': true,
        },
        {
          'file': 'test2',
          'insertions': 2,
          'deletions': 200,
          'lines': 202,
          'filterIgnored': false,
          'isMatched': true,
        },
        {
          'file': 'test4',
          'insertions': 4,
          'deletions': 400,
          'lines': 404,
          'filterIgnored': true,
          'isMatched': false,
        },
      ]),
      '::endgroup::',
    ]);
  });
});

describe('setResult', () => {
  testEnv(rootDir);

  it('should set result', () => {
    const mockStdout = spyOnStdout();
    const mockEnv    = spyOnExportVariable();

    setResult(diffs, false, logger);

    stdoutCalledWith(mockStdout, [
      '::group::Dump output',
      '',
      '::set-output name=diff::test1 test2 test4',
      '"diff: test1 test2 test4"',
      '',
      '::set-output name=filtered_diff::test1 test2',
      '"filtered_diff: test1 test2"',
      '',
      '::set-output name=matched_files::test4',
      '"matched_files: test4"',
      '',
      '::set-output name=count::3',
      '"count: 3"',
      '::endgroup::',
    ]);
    exportVariableCalledWith(mockEnv, [
      {name: 'GIT_DIFF', val: 'test1 test2 test4'},
      {name: 'GIT_DIFF_FILTERED', val: 'test1 test2'},
      {name: 'MATCHED_FILES', val: 'test4'},
    ]);
  });

  it('should set result with file diff', () => {
    process.env.INPUT_GET_FILE_DIFF = '1';
    const mockStdout                = spyOnStdout();
    const mockEnv                   = spyOnExportVariable();

    setResult(diffs, false, logger);

    stdoutCalledWith(mockStdout, [
      '::group::Dump output',
      '',
      '::set-output name=diff::test1 test2 test4',
      '"diff: test1 test2 test4"',
      '',
      '::set-output name=filtered_diff::test1 test2',
      '"filtered_diff: test1 test2"',
      '',
      '::set-output name=matched_files::test4',
      '"matched_files: test4"',
      '',
      '::set-output name=count::3',
      '"count: 3"',
      '',
      '::set-output name=insertions::3',
      '"insertions: 3"',
      '',
      '::set-output name=deletions::300',
      '"deletions: 300"',
      '',
      '::set-output name=lines::303',
      '"lines: 303"',
      '::endgroup::',
    ]);
    exportVariableCalledWith(mockEnv, [
      {name: 'GIT_DIFF', val: 'test1 test2 test4'},
      {name: 'GIT_DIFF_FILTERED', val: 'test1 test2'},
      {name: 'MATCHED_FILES', val: 'test4'},
    ]);
  });

  it('should set result without env', () => {
    process.env.INPUT_SET_ENV_NAME            = '';
    process.env.INPUT_SET_ENV_NAME_COUNT      = 'FILE_COUNT';
    process.env.INPUT_SET_ENV_NAME_INSERTIONS = 'INSERTIONS';
    process.env.INPUT_SET_ENV_NAME_DELETIONS  = 'DELETIONS';
    process.env.INPUT_SET_ENV_NAME_LINES      = 'LINES';
    process.env.INPUT_GET_FILE_DIFF           = '1';
    const mockStdout                          = spyOnStdout();
    const mockEnv                             = spyOnExportVariable();

    setResult(diffs, false, logger);

    stdoutCalledWith(mockStdout, [
      '::group::Dump output',
      '',
      '::set-output name=diff::test1 test2 test4',
      '"diff: test1 test2 test4"',
      '',
      '::set-output name=filtered_diff::test1 test2',
      '"filtered_diff: test1 test2"',
      '',
      '::set-output name=matched_files::test4',
      '"matched_files: test4"',
      '',
      '::set-output name=count::3',
      '"count: 3"',
      '',
      '::set-output name=insertions::3',
      '"insertions: 3"',
      '',
      '::set-output name=deletions::300',
      '"deletions: 300"',
      '',
      '::set-output name=lines::303',
      '"lines: 303"',
      '::endgroup::',
    ]);
    exportVariableCalledWith(mockEnv, [
      {name: 'GIT_DIFF_FILTERED', val: 'test1 test2'},
      {name: 'MATCHED_FILES', val: 'test4'},
      {name: 'FILE_COUNT', val: '3'},
      {name: 'INSERTIONS', val: '3'},
      {name: 'DELETIONS', val: '300'},
      {name: 'LINES', val: '303'},
    ]);
  });
});

describe('execute', () => {
  testEnv(rootDir);
  testChildProcess();

  it('should execute', async() => {
    process.env.GITHUB_WORKSPACE   = '/home/runner/work/my-repo-name/my-repo-name';
    process.env.INPUT_GITHUB_TOKEN = 'test token';
    process.env.INPUT_FILES        = 'package.json\ncomposer.json';
    process.env.INPUT_PATTERNS     = 'src/**/*.+(ts|txt)\n__tests__/**/*.+(ts|txt)';

    const mockExec   = spyOnSpawn();
    const mockStdout = spyOnStdout();
    const mockEnv    = spyOnExportVariable();
    setChildProcessParams({
      stdout: (command: string): string => {
        if (command.startsWith('git diff')) {
          return 'package.json\nabc/package.json\nREADME.md\nsrc/main.ts';
        }
        return '';
      },
    });

    await execute(logger, prContext);

    execCalledWith(mockExec, [
      'git remote add get-diff-action \'https://octocat:test token@github.com/hello/world.git\' || :',
      'git fetch --no-tags --no-recurse-submodules \'--depth=10000\' get-diff-action \'refs/pull/55/merge:refs/remotes/get-diff-action/pull/55/merge\' \'refs/heads/master:refs/remotes/get-diff-action/master\' || :',
      'git diff \'get-diff-action/master...get-diff-action/pull/55/merge\' \'--diff-filter=AMRC\' --name-only',
    ]);
    stdoutCalledWith(mockStdout, [
      '[command]git remote add get-diff-action',
      '[command]git fetch --no-tags --no-recurse-submodules \'--depth=10000\' get-diff-action \'refs/pull/55/merge:refs/remotes/get-diff-action/pull/55/merge\' \'refs/heads/master:refs/remotes/get-diff-action/master\'',
      '[command]git diff \'get-diff-action/master...get-diff-action/pull/55/merge\' \'--diff-filter=AMRC\' --name-only',
      '  >> package.json',
      '  >> abc/package.json',
      '  >> README.md',
      '  >> src/main.ts',
      '::group::Dump diffs',
      getLogStdout([
        {
          'file': 'package.json',
          'filterIgnored': true,
          'isMatched': false,
        },
        {
          'file': 'abc/package.json',
          'filterIgnored': true,
          'isMatched': false,
        },
        {
          'file': 'src/main.ts',
          'filterIgnored': false,
          'isMatched': true,
        },
      ]),
      '::endgroup::',
      '::group::Dump output',
      '',
      '::set-output name=diff::\'package.json\' \'abc/package.json\' \'src/main.ts\'',
      '"diff: \'package.json\' \'abc/package.json\' \'src/main.ts\'"',
      '',
      '::set-output name=filtered_diff::\'src/main.ts\'',
      '"filtered_diff: \'src/main.ts\'"',
      '',
      '::set-output name=matched_files::\'package.json\' \'abc/package.json\'',
      '"matched_files: \'package.json\' \'abc/package.json\'"',
      '',
      '::set-output name=count::3',
      '"count: 3"',
      '::endgroup::',
    ]);
    exportVariableCalledWith(mockEnv, [
      {name: 'GIT_DIFF', val: '\'package.json\' \'abc/package.json\' \'src/main.ts\''},
      {name: 'GIT_DIFF_FILTERED', val: '\'src/main.ts\''},
      {name: 'MATCHED_FILES', val: '\'package.json\' \'abc/package.json\''},
    ]);
  });

  it('should execute with file diff', async() => {
    process.env.GITHUB_WORKSPACE    = '/home/runner/work/my-repo-name/my-repo-name';
    process.env.INPUT_GITHUB_TOKEN  = 'test token';
    process.env.INPUT_FILES         = 'package.json\ncomposer.json';
    process.env.INPUT_PATTERNS      = 'src/**/*.+(ts|txt)\n__tests__/**/*.+(ts|txt)';
    process.env.INPUT_GET_FILE_DIFF = '1';

    const mockExec   = spyOnSpawn();
    const mockStdout = spyOnStdout();
    const mockEnv    = spyOnExportVariable();
    setChildProcessParams({
      stdout: (command: string): string => {
        if (command.startsWith('git diff')) {
          if (command.includes('shortstat')) {
            return '1 file changed, 25 insertions(+), 4 deletions(-)';
          }
          return 'package.json\nabc/package.json\nREADME.md\nsrc/main.ts';
        }
        return '';
      },
    });

    await execute(logger, prContext);

    execCalledWith(mockExec, [
      'git remote add get-diff-action \'https://octocat:test token@github.com/hello/world.git\' || :',
      'git fetch --no-tags --no-recurse-submodules \'--depth=10000\' get-diff-action \'refs/pull/55/merge:refs/remotes/get-diff-action/pull/55/merge\' \'refs/heads/master:refs/remotes/get-diff-action/master\' || :',
      'git diff \'get-diff-action/master...get-diff-action/pull/55/merge\' \'--diff-filter=AMRC\' --name-only',
      'git diff \'get-diff-action/master...get-diff-action/pull/55/merge\' --shortstat -w -- \'package.json\'',
      'git diff \'get-diff-action/master...get-diff-action/pull/55/merge\' --shortstat -w -- \'abc/package.json\'',
      'git diff \'get-diff-action/master...get-diff-action/pull/55/merge\' --shortstat -w -- \'src/main.ts\'',
    ]);
    stdoutCalledWith(mockStdout, [
      '[command]git remote add get-diff-action',
      '[command]git fetch --no-tags --no-recurse-submodules \'--depth=10000\' get-diff-action \'refs/pull/55/merge:refs/remotes/get-diff-action/pull/55/merge\' \'refs/heads/master:refs/remotes/get-diff-action/master\'',
      '[command]git diff \'get-diff-action/master...get-diff-action/pull/55/merge\' \'--diff-filter=AMRC\' --name-only',
      '  >> package.json',
      '  >> abc/package.json',
      '  >> README.md',
      '  >> src/main.ts',
      '[command]git diff \'get-diff-action/master...get-diff-action/pull/55/merge\' --shortstat -w -- \'package.json\'',
      '  >> 1 file changed, 25 insertions(+), 4 deletions(-)',
      '[command]git diff \'get-diff-action/master...get-diff-action/pull/55/merge\' --shortstat -w -- \'abc/package.json\'',
      '  >> 1 file changed, 25 insertions(+), 4 deletions(-)',
      '[command]git diff \'get-diff-action/master...get-diff-action/pull/55/merge\' --shortstat -w -- \'src/main.ts\'',
      '  >> 1 file changed, 25 insertions(+), 4 deletions(-)',
      '::group::Dump diffs',
      getLogStdout([
        {
          'file': 'package.json',
          'filterIgnored': true,
          'isMatched': false,
          'insertions': 25,
          'deletions': 4,
          'lines': 29,
        },
        {
          'file': 'abc/package.json',
          'filterIgnored': true,
          'isMatched': false,
          'insertions': 25,
          'deletions': 4,
          'lines': 29,
        },
        {
          'file': 'src/main.ts',
          'filterIgnored': false,
          'isMatched': true,
          'insertions': 25,
          'deletions': 4,
          'lines': 29,
        },
      ]),
      '::endgroup::',
      '::group::Dump output',
      '',
      '::set-output name=diff::\'package.json\' \'abc/package.json\' \'src/main.ts\'',
      '"diff: \'package.json\' \'abc/package.json\' \'src/main.ts\'"',
      '',
      '::set-output name=filtered_diff::\'src/main.ts\'',
      '"filtered_diff: \'src/main.ts\'"',
      '',
      '::set-output name=matched_files::\'package.json\' \'abc/package.json\'',
      '"matched_files: \'package.json\' \'abc/package.json\'"',
      '',
      '::set-output name=count::3',
      '"count: 3"',
      '',
      '::set-output name=insertions::25',
      '"insertions: 25"',
      '',
      '::set-output name=deletions::4',
      '"deletions: 4"',
      '',
      '::set-output name=lines::29',
      '"lines: 29"',
      '::endgroup::',
    ]);
    exportVariableCalledWith(mockEnv, [
      {name: 'GIT_DIFF', val: '\'package.json\' \'abc/package.json\' \'src/main.ts\''},
      {name: 'GIT_DIFF_FILTERED', val: '\'src/main.ts\''},
      {name: 'MATCHED_FILES', val: '\'package.json\' \'abc/package.json\''},
    ]);
  });

  it('should execute (no diff)', async() => {
    process.env.GITHUB_WORKSPACE   = '/home/runner/work/my-repo-name/my-repo-name';
    process.env.INPUT_GITHUB_TOKEN = 'test token';
    process.env.INPUT_PATTERNS     = 'test/**';

    const mockExec   = spyOnSpawn();
    const mockStdout = spyOnStdout();
    const mockEnv    = spyOnExportVariable();
    setChildProcessParams({
      stdout: (command: string): string => {
        if (command.startsWith('git diff')) {
          if (command.includes('shortstat')) {
            return '1 file changed, 25 insertions(+), 4 deletions(-)';
          }
          return 'package.json\nabc/composer.json\nREADME.md\nsrc/main.ts';
        }
        return '';
      },
    });

    await execute(logger, prContext);

    execCalledWith(mockExec, [
      'git remote add get-diff-action \'https://octocat:test token@github.com/hello/world.git\' || :',
      'git fetch --no-tags --no-recurse-submodules \'--depth=10000\' get-diff-action \'refs/pull/55/merge:refs/remotes/get-diff-action/pull/55/merge\' \'refs/heads/master:refs/remotes/get-diff-action/master\' || :',
      'git diff \'get-diff-action/master...get-diff-action/pull/55/merge\' \'--diff-filter=AMRC\' --name-only',
    ]);
    stdoutCalledWith(mockStdout, [
      '[command]git remote add get-diff-action',
      '[command]git fetch --no-tags --no-recurse-submodules \'--depth=10000\' get-diff-action \'refs/pull/55/merge:refs/remotes/get-diff-action/pull/55/merge\' \'refs/heads/master:refs/remotes/get-diff-action/master\'',
      '[command]git diff \'get-diff-action/master...get-diff-action/pull/55/merge\' \'--diff-filter=AMRC\' --name-only',
      '  >> package.json',
      '  >> abc/composer.json',
      '  >> README.md',
      '  >> src/main.ts',
      '::group::Dump diffs',
      '[]',
      '::endgroup::',
      '::group::Dump output',
      '',
      '::set-output name=diff::',
      '"diff: "',
      '',
      '::set-output name=filtered_diff::',
      '"filtered_diff: "',
      '',
      '::set-output name=matched_files::',
      '"matched_files: "',
      '',
      '::set-output name=count::0',
      '"count: 0"',
      '::endgroup::',
    ]);
    exportVariableCalledWith(mockEnv, [
      {name: 'GIT_DIFF', val: ''},
      {name: 'GIT_DIFF_FILTERED', val: ''},
      {name: 'MATCHED_FILES', val: ''},
    ]);
  });

  it('should execute empty', async() => {
    process.env.GITHUB_WORKSPACE = '/home/runner/work/my-repo-name/my-repo-name';

    const mockExec   = spyOnSpawn();
    const mockStdout = spyOnStdout();
    const mockEnv    = spyOnExportVariable();

    await execute(logger, prContext, true);

    execCalledWith(mockExec, []);
    stdoutCalledWith(mockStdout, [
      '::group::Dump diffs',
      '[]',
      '::endgroup::',
      '::group::Dump output',
      '',
      '::set-output name=diff::',
      '"diff: "',
      '',
      '::set-output name=filtered_diff::',
      '"filtered_diff: "',
      '',
      '::set-output name=matched_files::',
      '"matched_files: "',
      '',
      '::set-output name=count::0',
      '"count: 0"',
      '::endgroup::',
    ]);
    exportVariableCalledWith(mockEnv, [
      {name: 'GIT_DIFF', val: ''},
      {name: 'GIT_DIFF_FILTERED', val: ''},
      {name: 'MATCHED_FILES', val: ''},
    ]);
  });

  it('should execute empty with default value', async() => {
    process.env.GITHUB_WORKSPACE            = '/home/runner/work/my-repo-name/my-repo-name';
    process.env.INPUT_GET_FILE_DIFF         = '1';
    process.env.INPUT_DIFF_DEFAULT          = '1';
    process.env.INPUT_FILTERED_DIFF_DEFAULT = '2';
    process.env.INPUT_MATCHED_FILES_DEFAULT = '3';
    process.env.INPUT_COUNT_DEFAULT         = '4';
    process.env.INPUT_INSERTIONS_DEFAULT    = '5';
    process.env.INPUT_DELETIONS_DEFAULT     = '6';
    process.env.INPUT_LINES_DEFAULT         = '7';

    const mockExec   = spyOnSpawn();
    const mockStdout = spyOnStdout();
    const mockEnv    = spyOnExportVariable();

    await execute(logger, prContext, true);

    execCalledWith(mockExec, []);
    stdoutCalledWith(mockStdout, [
      '::group::Dump diffs',
      '[]',
      '::endgroup::',
      '::group::Dump output',
      '',
      '::set-output name=diff::1',
      '"diff: 1"',
      '',
      '::set-output name=filtered_diff::2',
      '"filtered_diff: 2"',
      '',
      '::set-output name=matched_files::3',
      '"matched_files: 3"',
      '',
      '::set-output name=count::4',
      '"count: 4"',
      '',
      '::set-output name=insertions::5',
      '"insertions: 5"',
      '',
      '::set-output name=deletions::6',
      '"deletions: 6"',
      '',
      '::set-output name=lines::7',
      '"lines: 7"',
      '::endgroup::',
    ]);
    exportVariableCalledWith(mockEnv, [
      {name: 'GIT_DIFF', val: '1'},
      {name: 'GIT_DIFF_FILTERED', val: '2'},
      {name: 'MATCHED_FILES', val: '3'},
    ]);
  });

  it('should not execute if not cloned', async() => {
    process.env.GITHUB_WORKSPACE = '/home/runner/work/my-repo-name/my-repo-name';

    const mockExec   = spyOnSpawn();
    const mockStdout = spyOnStdout();
    const mockEnv    = spyOnExportVariable();
    setChildProcessParams({
      stdout: (command: string): string => {
        if (command.startsWith('git diff')) {
          if (command.includes('shortstat')) {
            return '1 file changed, 25 insertions(+), 4 deletions(-)';
          }
          return 'package.json\nabc/composer.json\nREADME.md\nsrc/main.ts';
        }
        return '';
      },
    });
    setExists(false);

    await execute(logger, prContext);

    execCalledWith(mockExec, []);
    stdoutCalledWith(mockStdout, [
      '::warning::Please checkout before call this action.',
      '::group::Dump diffs',
      '[]',
      '::endgroup::',
      '::group::Dump output',
      '',
      '::set-output name=diff::',
      '"diff: "',
      '',
      '::set-output name=filtered_diff::',
      '"filtered_diff: "',
      '',
      '::set-output name=matched_files::',
      '"matched_files: "',
      '',
      '::set-output name=count::0',
      '"count: 0"',
      '::endgroup::',
    ]);
    exportVariableCalledWith(mockEnv, [
      {name: 'GIT_DIFF', val: ''},
      {name: 'GIT_DIFF_FILTERED', val: ''},
      {name: 'MATCHED_FILES', val: ''},
    ]);
  });
});
