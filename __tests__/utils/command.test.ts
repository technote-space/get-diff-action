/* eslint-disable no-magic-numbers */
import nock from 'nock';
import path, {resolve, join} from 'path';
import {
  generateContext,
  testEnv,
  spyOnSpawn,
  testChildProcess,
  execCalledWith,
  setChildProcessParams,
  testFs,
  disableNetConnect,
  getApiFixture,
} from '@technote-space/github-action-test-helper';
import {Logger} from '@technote-space/github-action-log-helper';
import {FileDiffResult} from '../../src/types';
import {getGitDiff, getFileDiff, getDiffFiles, sumResults} from '../../src/utils/command';

const rootDir           = path.resolve(__dirname, '../..');
const fixtureRootDir    = resolve(__dirname, '..', 'fixtures');
const defaultFileResult = {filterIgnored: false, isMatched: true};
const diffs             = [
  {file: 'test1', insertions: 1, deletions: 100, lines: 101, ...defaultFileResult},
  {file: 'test2', insertions: 2, deletions: 200, lines: 202, ...defaultFileResult},
  {
    file: 'test4',
    insertions: 4,
    deletions: 400,
    lines: 404,
    filterIgnored: true,
    isMatched: false,
  },
];
const logger            = new Logger();
const prContext         = generateContext({
  owner: 'hello',
  repo: 'world',
  event: 'pull_request',
  ref: 'refs/pull/55/merge',
  action: 'synchronize',
}, {
  payload: {
    number: 11,
    'pull_request': {
      number: 11,
      id: 21031067,
      head: {
        ref: 'feature/new-feature',
        sha: 'head-sha',
      },
      base: {
        ref: 'master',
        sha: 'base-sha',
      },
      title: 'title',
      'html_url': 'test url',
    },
  },
});
const draftPrContext    = generateContext({
  owner: 'hello',
  repo: 'world',
  event: 'pull_request',
  ref: 'refs/pull/55/merge',
  action: 'synchronize',
}, {
  payload: {
    number: 11,
    before: 'before-sha',
    after: 'after-sha',
    'pull_request': {
      number: 11,
      id: 21031067,
      head: {
        ref: 'feature/new-feature',
        sha: 'head-sha',
      },
      base: {
        ref: 'master',
        sha: 'base-sha',
      },
      title: 'title',
      'html_url': 'test url',
      draft: true,
    },
  },
});
const pushContext       = generateContext({
  owner: 'hello',
  repo: 'world',
  event: 'push',
  ref: 'refs/heads/master',
  sha: 'sha',
}, {
  payload: {
    before: 'before-sha',
    after: 'after-sha',
    repository: {
      'default_branch': 'master',
    },
  },
});
testFs(true);

describe('getGitDiff', () => {
  testEnv(rootDir);
  testChildProcess();
  disableNetConnect(nock);

  it('should get git diff (pull request)', async() => {
    process.env.GITHUB_WORKSPACE              = '/home/runner/work/my-repo-name/my-repo-name';
    process.env.INPUT_GITHUB_TOKEN            = 'test token';
    process.env.INPUT_PATTERNS                = '**/*.json\n**/*.md\n**/*.ts\n!src/index.ts';
    process.env.INPUT_MINIMATCH_OPTION_NOCASE = '1';

    const mockExec = spyOnSpawn();
    setChildProcessParams({
      stdout: (command: string): string => {
        if (command.startsWith('git diff')) {
          return 'package.json\nabc/composer.JSON\nREADME.md\nsrc/main.ts\nsrc/index.ts';
        }
        return '';
      },
    });

    expect(await getGitDiff(logger, prContext)).toEqual([
      {file: 'package.json', ...defaultFileResult},
      {file: 'abc/composer.JSON', ...defaultFileResult},
      {file: 'README.md', ...defaultFileResult},
      {file: 'src/main.ts', ...defaultFileResult},
    ]);
    execCalledWith(mockExec, [
      'git remote add get-diff-action \'https://octocat:test token@github.com/hello/world.git\' || :',
      'git fetch --no-tags --no-recurse-submodules \'--depth=10000\' get-diff-action \'refs/pull/55/merge:refs/remotes/get-diff-action/pull/55/merge\' \'refs/heads/master:refs/remotes/get-diff-action/master\' || :',
      'git diff \'get-diff-action/master...get-diff-action/pull/55/merge\' \'--diff-filter=AMRC\' --name-only',
    ]);
  });

  it('should get git diff (pull request closed)', async() => {
    process.env.GITHUB_WORKSPACE   = '/home/runner/work/my-repo-name/my-repo-name';
    process.env.INPUT_GITHUB_TOKEN = 'test token';
    process.env.INPUT_PATTERNS     = '**/*.json\n**/*.md\n**/*.ts\n!src/index.ts';

    const mockExec = spyOnSpawn();
    setChildProcessParams({
      stdout: (command: string): string => {
        if (command.startsWith('git diff')) {
          return 'package.json\nabc/composer.JSON\nREADME.md\nsrc/main.ts\nsrc/index.ts';
        }
        return '';
      },
    });

    expect(await getGitDiff(logger, generateContext({
      owner: 'hello',
      repo: 'world',
      event: 'pull_request',
      ref: 'master',
      sha: 'sha',
      action: 'closed',
    }, {
      payload: {
        number: 11,
        'pull_request': {
          number: 11,
          id: 21031067,
          head: {
            ref: 'feature/new-feature',
            sha: 'head-sha',
          },
          base: {
            ref: 'master',
            sha: 'base-sha',
          },
          title: 'title',
          'html_url': 'test url',
        },
      },
    }))).toEqual([
      {file: 'package.json', ...defaultFileResult},
      {file: 'README.md', ...defaultFileResult},
      {file: 'src/main.ts', ...defaultFileResult},
    ]);
    execCalledWith(mockExec, [
      'git remote add get-diff-action \'https://octocat:test token@github.com/hello/world.git\' || :',
      'git fetch --no-tags --no-recurse-submodules \'--depth=10000\' get-diff-action \'refs/heads/master:refs/remotes/get-diff-action/master\' || :',
      'git diff \'base-sha...sha\' \'--diff-filter=AMRC\' --name-only',
    ]);
  });

  it('should get git diff (pull request draft1)', async() => {
    process.env.GITHUB_WORKSPACE                  = '/home/runner/work/my-repo-name/my-repo-name';
    process.env.INPUT_GITHUB_TOKEN                = 'test token';
    process.env.INPUT_PATTERNS                    = '*.json\n*.md\n*.ts';
    process.env.INPUT_MINIMATCH_OPTION_NOCASE     = '1';
    process.env.INPUT_MINIMATCH_OPTION_MATCH_BASE = '1';

    const mockExec = spyOnSpawn();
    setChildProcessParams({
      stdout: (command: string): string => {
        if (command.startsWith('git diff')) {
          return 'package.json\nabc/composer.JSON\nREADME.md\nsrc/main.ts';
        }
        return '';
      },
    });

    expect(await getGitDiff(logger, draftPrContext)).toEqual([
      {file: 'package.json', ...defaultFileResult},
      {file: 'abc/composer.JSON', ...defaultFileResult},
      {file: 'README.md', ...defaultFileResult},
      {file: 'src/main.ts', ...defaultFileResult},
    ]);
    execCalledWith(mockExec, [
      'git remote add get-diff-action \'https://octocat:test token@github.com/hello/world.git\' || :',
      'git fetch --no-tags --no-recurse-submodules \'--depth=10000\' get-diff-action \'refs/pull/55/merge:refs/remotes/get-diff-action/pull/55/merge\' \'refs/heads/master:refs/remotes/get-diff-action/master\' || :',
      'git diff \'get-diff-action/master...get-diff-action/pull/55/merge\' \'--diff-filter=AMRC\' --name-only',
    ]);
  });

  it('should get git diff (pull request draft2)', async() => {
    process.env.GITHUB_WORKSPACE                   = '/home/runner/work/my-repo-name/my-repo-name';
    process.env.INPUT_GITHUB_TOKEN                 = 'test token';
    process.env.INPUT_PATTERNS                     = '*.json\n*.md\n*.ts';
    process.env.INPUT_MINIMATCH_OPTION_NOCASE      = '1';
    process.env.INPUT_MINIMATCH_OPTION_MATCH_BASE  = '1';
    process.env.INPUT_CHECK_ONLY_COMMIT_WHEN_DRAFT = 'true';

    const mockExec = spyOnSpawn();
    setChildProcessParams({
      stdout: (command: string): string => {
        if (command.startsWith('git diff')) {
          return 'package.json\nabc/composer.JSON\nREADME.md\nsrc/main.ts';
        }
        return '';
      },
    });

    expect(await getGitDiff(logger, draftPrContext)).toEqual([
      {file: 'package.json', ...defaultFileResult},
      {file: 'abc/composer.JSON', ...defaultFileResult},
      {file: 'README.md', ...defaultFileResult},
      {file: 'src/main.ts', ...defaultFileResult},
    ]);
    execCalledWith(mockExec, [
      'git remote add get-diff-action \'https://octocat:test token@github.com/hello/world.git\' || :',
      'git fetch --no-tags --no-recurse-submodules \'--depth=10000\' get-diff-action \'refs/pull/55/merge:refs/remotes/get-diff-action/pull/55/merge\' || :',
      'git diff \'before-sha...after-sha\' \'--diff-filter=AMRC\' --name-only',
    ]);
  });

  it('should get git diff (push, default branch)', async() => {
    process.env.GITHUB_WORKSPACE   = '/home/runner/work/my-repo-name/my-repo-name';
    process.env.INPUT_GITHUB_TOKEN = 'test token';

    const mockExec = spyOnSpawn();
    setChildProcessParams({
      stdout: (command: string): string => {
        if (command.startsWith('git diff')) {
          return 'package.json\nabc/composer.json\nREADME.md\nsrc/main.ts';
        }
        return '';
      },
    });

    nock('https://api.github.com')
      .persist()
      .get('/repos/hello/world/commits/before-sha/pulls')
      .reply(200, () => getApiFixture(fixtureRootDir, 'pulls.list1'));

    expect(await getGitDiff(logger, pushContext)).toEqual([
      {file: 'package.json', ...defaultFileResult},
      {file: 'abc/composer.json', ...defaultFileResult},
      {file: 'README.md', ...defaultFileResult},
      {file: 'src/main.ts', ...defaultFileResult},
    ]);
    execCalledWith(mockExec, [
      'git remote add get-diff-action \'https://octocat:test token@github.com/hello/world.git\' || :',
      'git fetch --no-tags --no-recurse-submodules \'--depth=10000\' get-diff-action \'refs/heads/master:refs/remotes/get-diff-action/master\' || :',
      'git diff \'before-sha...after-sha\' \'--diff-filter=AMRC\' --name-only',
    ]);
  });

  it('should get git diff (push, found pr)', async() => {
    process.env.GITHUB_WORKSPACE   = '/home/runner/work/my-repo-name/my-repo-name';
    process.env.INPUT_GITHUB_TOKEN = 'test token';

    const mockExec = spyOnSpawn();
    setChildProcessParams({
      stdout: (command: string): string => {
        if (command.startsWith('git diff')) {
          return 'package.json\nabc/composer.json\nREADME.md\nsrc/main.ts';
        }
        return '';
      },
    });

    nock('https://api.github.com')
      .persist()
      .get('/repos/hello/world/pulls?head=hello%3Atest')
      .reply(200, () => getApiFixture(fixtureRootDir, 'pulls.list1'));

    expect(await getGitDiff(logger, Object.assign({}, pushContext, {
      ref: 'refs/heads/test',
    }))).toEqual([
      {file: 'package.json', ...defaultFileResult},
      {file: 'abc/composer.json', ...defaultFileResult},
      {file: 'README.md', ...defaultFileResult},
      {file: 'src/main.ts', ...defaultFileResult},
    ]);
    execCalledWith(mockExec, [
      'git remote add get-diff-action \'https://octocat:test token@github.com/hello/world.git\' || :',
      'git fetch --no-tags --no-recurse-submodules \'--depth=10000\' get-diff-action \'refs/heads/test:refs/remotes/get-diff-action/test\' \'refs/heads/master:refs/remotes/get-diff-action/master\' \'refs/pull/1347/merge:refs/remotes/get-diff-action/pull/1347/merge\' || :',
      'git diff \'get-diff-action/master...get-diff-action/pull/1347/merge\' \'--diff-filter=AMRC\' --name-only',
    ]);
  });

  it('should get git diff (push, found draft pr)', async() => {
    process.env.GITHUB_WORKSPACE                   = '/home/runner/work/my-repo-name/my-repo-name';
    process.env.INPUT_GITHUB_TOKEN                 = 'test token';
    process.env.INPUT_CHECK_ONLY_COMMIT_WHEN_DRAFT = 'true';

    const mockExec = spyOnSpawn();
    setChildProcessParams({
      stdout: (command: string): string => {
        if (command.startsWith('git diff')) {
          return 'package.json\nabc/composer.json\nREADME.md\nsrc/main.ts';
        }
        return '';
      },
    });

    nock('https://api.github.com')
      .persist()
      .get('/repos/hello/world/pulls?head=hello%3Atest')
      .reply(200, () => getApiFixture(fixtureRootDir, 'pulls.list3'));

    expect(await getGitDiff(logger, Object.assign({}, pushContext, {
      ref: 'refs/heads/test',
    }))).toEqual([
      {file: 'package.json', ...defaultFileResult},
      {file: 'abc/composer.json', ...defaultFileResult},
      {file: 'README.md', ...defaultFileResult},
      {file: 'src/main.ts', ...defaultFileResult},
    ]);
    execCalledWith(mockExec, [
      'git remote add get-diff-action \'https://octocat:test token@github.com/hello/world.git\' || :',
      'git fetch --no-tags --no-recurse-submodules \'--depth=10000\' get-diff-action \'refs/heads/test:refs/remotes/get-diff-action/test\' || :',
      'git diff \'before-sha...after-sha\' \'--diff-filter=AMRC\' --name-only',
    ]);
  });

  it('should get git diff (push, not found pr)', async() => {
    process.env.GITHUB_WORKSPACE   = '/home/runner/work/my-repo-name/my-repo-name';
    process.env.INPUT_GITHUB_TOKEN = 'test token';

    const mockExec = spyOnSpawn();
    setChildProcessParams({
      stdout: (command: string): string => {
        if (command.startsWith('git diff')) {
          return 'package.json\nabc/composer.json\nREADME.md\nsrc/main.ts';
        }
        return '';
      },
    });

    nock('https://api.github.com')
      .persist()
      .get('/repos/hello/world/pulls?head=hello%3Atest')
      .reply(200, () => []);

    expect(await getGitDiff(logger, Object.assign({}, pushContext, {
      ref: 'refs/heads/test',
    }))).toEqual([
      {file: 'package.json', ...defaultFileResult},
      {file: 'abc/composer.json', ...defaultFileResult},
      {file: 'README.md', ...defaultFileResult},
      {file: 'src/main.ts', ...defaultFileResult},
    ]);
    execCalledWith(mockExec, [
      'git remote add get-diff-action \'https://octocat:test token@github.com/hello/world.git\' || :',
      'git fetch --no-tags --no-recurse-submodules \'--depth=10000\' get-diff-action \'refs/heads/test:refs/remotes/get-diff-action/test\' || :',
      'git diff \'before-sha...after-sha\' \'--diff-filter=AMRC\' --name-only',
    ]);
  });

  it('should get git diff (push, not found pr with base setting)', async() => {
    process.env.GITHUB_WORKSPACE   = '/home/runner/work/my-repo-name/my-repo-name';
    process.env.INPUT_GITHUB_TOKEN = 'test token';
    process.env.INPUT_BASE         = 'refs/heads/main';

    const mockExec = spyOnSpawn();
    setChildProcessParams({
      stdout: (command: string): string => {
        if (command.startsWith('git diff')) {
          return 'package.json\nabc/composer.json\nREADME.md\nsrc/main.ts';
        }
        return '';
      },
    });

    nock('https://api.github.com')
      .persist()
      .get('/repos/hello/world/pulls?head=hello%3Atest')
      .reply(200, () => []);

    expect(await getGitDiff(logger, Object.assign({}, pushContext, {
      ref: 'refs/heads/test',
    }))).toEqual([
      {file: 'package.json', ...defaultFileResult},
      {file: 'abc/composer.json', ...defaultFileResult},
      {file: 'README.md', ...defaultFileResult},
      {file: 'src/main.ts', ...defaultFileResult},
    ]);
    execCalledWith(mockExec, [
      'git remote add get-diff-action \'https://octocat:test token@github.com/hello/world.git\' || :',
      'git fetch --no-tags --no-recurse-submodules \'--depth=10000\' get-diff-action \'refs/heads/test:refs/remotes/get-diff-action/test\' \'refs/heads/main:refs/remotes/get-diff-action/main\' || :',
      'git diff \'get-diff-action/main...after-sha\' \'--diff-filter=AMRC\' --name-only',
    ]);
  });

  it('should get git diff (push tag)', async() => {
    process.env.GITHUB_WORKSPACE   = '/home/runner/work/my-repo-name/my-repo-name';
    process.env.INPUT_GITHUB_TOKEN = 'test token';

    const mockExec = spyOnSpawn();
    setChildProcessParams({
      stdout: (command: string): string => {
        if (command.startsWith('git diff')) {
          return 'package.json\nabc/composer.json\nREADME.md\nsrc/main.ts';
        }
        return '';
      },
    });

    expect(await getGitDiff(logger, Object.assign({}, pushContext, {
      ref: 'refs/tags/v1.2.3',
    }))).toEqual([]);
    execCalledWith(mockExec, []);
  });

  it('should get git diff (push, create new branch)', async() => {
    process.env.GITHUB_WORKSPACE   = '/home/runner/work/my-repo-name/my-repo-name';
    process.env.INPUT_GITHUB_TOKEN = 'test token';

    const mockExec = spyOnSpawn();
    setChildProcessParams({
      stdout: (command: string): string => {
        if (command.startsWith('git diff')) {
          return 'package.json\nabc/composer.json\nREADME.md\nsrc/main.ts';
        }
        return '';
      },
    });

    nock('https://api.github.com')
      .persist()
      .get('/repos/hello/world/pulls?head=hello%3Atest')
      .reply(200, () => []);

    expect(await getGitDiff(logger, Object.assign({}, pushContext, {
      ref: 'refs/heads/test',
      payload: {
        before: '0000000000000000000000000000000000000000',
        after: 'after-sha',
        repository: {
          'default_branch': 'master',
        },
      },
    }))).toEqual([
      {file: 'package.json', ...defaultFileResult},
      {file: 'abc/composer.json', ...defaultFileResult},
      {file: 'README.md', ...defaultFileResult},
      {file: 'src/main.ts', ...defaultFileResult},
    ]);
    execCalledWith(mockExec, [
      'git remote add get-diff-action \'https://octocat:test token@github.com/hello/world.git\' || :',
      'git fetch --no-tags --no-recurse-submodules \'--depth=10000\' get-diff-action \'refs/heads/test:refs/remotes/get-diff-action/test\' \'refs/heads/master:refs/remotes/get-diff-action/master\' || :',
      'git diff \'get-diff-action/master...after-sha\' \'--diff-filter=AMRC\' --name-only',
    ]);
  });

  it('should get git diff (env)', async() => {
    process.env.GITHUB_WORKSPACE   = '/home/runner/work/my-repo-name/my-repo-name';
    process.env.INPUT_GITHUB_TOKEN = 'test token';
    process.env.INPUT_DOT          = '..';
    process.env.INPUT_DIFF_FILTER  = 'AMD';
    process.env.INPUT_FILES        = 'package.json\ncomposer.json\nREADME2.md';
    process.env.INPUT_PATTERNS     = 'src/**/*.+(ts|txt)\n__tests__/**/*.+(ts|txt)';
    process.env.INPUT_ABSOLUTE     = 'true';
    process.env.INPUT_SET_ENV_NAME = '';
    const mockExec                 = spyOnSpawn();
    setChildProcessParams({
      stdout: (command: string): string => {
        if (command.startsWith('git diff')) {
          return 'package.json\nabc/composer.json\nREADME.md\nsrc/main.ts\nsrc/test1.tts\nsrc/test/test2.txt\n__tests__/main.test.ts';
        }
        return '';
      },
    });

    expect(await getGitDiff(logger, prContext)).toEqual([
      {
        file: process.env.GITHUB_WORKSPACE + '/package.json', ...defaultFileResult,
        filterIgnored: true,
        isMatched: false,
      },
      {
        file: process.env.GITHUB_WORKSPACE + '/abc/composer.json', ...defaultFileResult,
        filterIgnored: true,
        isMatched: false,
      },
      {file: process.env.GITHUB_WORKSPACE + '/src/main.ts', ...defaultFileResult},
      {file: process.env.GITHUB_WORKSPACE + '/src/test/test2.txt', ...defaultFileResult},
      {file: process.env.GITHUB_WORKSPACE + '/__tests__/main.test.ts', ...defaultFileResult},
    ]);
    execCalledWith(mockExec, [
      'git remote add get-diff-action \'https://octocat:test token@github.com/hello/world.git\' || :',
      'git fetch --no-tags --no-recurse-submodules \'--depth=10000\' get-diff-action \'refs/pull/55/merge:refs/remotes/get-diff-action/pull/55/merge\' \'refs/heads/master:refs/remotes/get-diff-action/master\' || :',
      'git diff \'get-diff-action/master..get-diff-action/pull/55/merge\' \'--diff-filter=AMD\' --name-only',
    ]);
  });

  it('should get git diff (relative)', async() => {
    process.env.GITHUB_WORKSPACE   = '/home/runner/work/my-repo-name/my-repo-name';
    process.env.INPUT_GITHUB_TOKEN = 'test token';
    process.env.INPUT_RELATIVE     = 'src/test';
    const mockExec                 = spyOnSpawn();
    setChildProcessParams({
      stdout: (command: string): string => {
        if (command.startsWith('git diff')) {
          return 'test.txt';
        }
        return '';
      },
    });

    expect(await getGitDiff(logger, prContext)).toEqual([
      {file: 'test.txt', ...defaultFileResult},
    ]);
    execCalledWith(mockExec, [
      'git remote add get-diff-action \'https://octocat:test token@github.com/hello/world.git\' || :',
      'git fetch --no-tags --no-recurse-submodules \'--depth=10000\' get-diff-action \'refs/pull/55/merge:refs/remotes/get-diff-action/pull/55/merge\' \'refs/heads/master:refs/remotes/get-diff-action/master\' || :',
      'git diff \'get-diff-action/master...get-diff-action/pull/55/merge\' \'--diff-filter=AMRC\' --name-only \'--relative=src/test\'',
    ]);
  });

  it('should get git diff (relative, absolute)', async() => {
    process.env.GITHUB_WORKSPACE   = '/home/runner/work/my-repo-name/my-repo-name';
    process.env.INPUT_GITHUB_TOKEN = 'test token';
    process.env.INPUT_RELATIVE     = 'src/test';
    process.env.INPUT_ABSOLUTE     = 'true';
    const mockExec                 = spyOnSpawn();
    setChildProcessParams({
      stdout: (command: string): string => {
        if (command.startsWith('git diff')) {
          return 'test.txt';
        }
        return '';
      },
    });

    expect(await getGitDiff(logger, prContext)).toEqual([
      {file: join(process.env.GITHUB_WORKSPACE, process.env.INPUT_RELATIVE, 'test.txt'), ...defaultFileResult},
    ]);
    execCalledWith(mockExec, [
      'git remote add get-diff-action \'https://octocat:test token@github.com/hello/world.git\' || :',
      'git fetch --no-tags --no-recurse-submodules \'--depth=10000\' get-diff-action \'refs/pull/55/merge:refs/remotes/get-diff-action/pull/55/merge\' \'refs/heads/master:refs/remotes/get-diff-action/master\' || :',
      'git diff \'get-diff-action/master...get-diff-action/pull/55/merge\' \'--diff-filter=AMRC\' --name-only \'--relative=src/test\'',
    ]);
  });

  it('should get git diff (suppress git diff error)', async() => {
    process.env.GITHUB_WORKSPACE              = '/home/runner/work/my-repo-name/my-repo-name';
    process.env.INPUT_GITHUB_TOKEN            = 'test token';
    process.env.INPUT_PATTERNS                = '**/*.json\n**/*.md\n**/*.ts\n!src/index.ts';
    process.env.INPUT_MINIMATCH_OPTION_NOCASE = '1';
    process.env.INPUT_SUPPRESS_ERROR          = '1';

    const mockExec = spyOnSpawn();
    setChildProcessParams({
      stdout: (): string => {
        return '';
      },
    });

    expect(await getGitDiff(logger, prContext)).toEqual([]);
    execCalledWith(mockExec, [
      'git remote add get-diff-action \'https://octocat:test token@github.com/hello/world.git\' || :',
      'git fetch --no-tags --no-recurse-submodules \'--depth=10000\' get-diff-action \'refs/pull/55/merge:refs/remotes/get-diff-action/pull/55/merge\' \'refs/heads/master:refs/remotes/get-diff-action/master\' || :',
      'git diff \'get-diff-action/master...get-diff-action/pull/55/merge\' \'--diff-filter=AMRC\' --name-only || :',
    ]);
  });

  it('should get git diff (not suppress git diff error)', async() => {
    process.env.GITHUB_WORKSPACE              = '/home/runner/work/my-repo-name/my-repo-name';
    process.env.INPUT_GITHUB_TOKEN            = 'test token';
    process.env.INPUT_PATTERNS                = '**/*.json\n**/*.md\n**/*.ts\n!src/index.ts';
    process.env.INPUT_MINIMATCH_OPTION_NOCASE = '1';

    const mockExec = spyOnSpawn();
    setChildProcessParams({
      stdout: (command: string): string => {
        if (command.startsWith('git diff')) {
          throw new Error('command [git diff] exited with code 128. message: fatal: ambiguous argument \'get-diff-action/master...get-diff-action/pull/271/merge\': unknown revision or path not in the working tree.');
        }
        return '';
      },
    });

    await expect(getGitDiff(logger, prContext)).rejects.toThrow('command [git diff] exited with code 128. message: fatal: ambiguous argument \'get-diff-action/master...get-diff-action/pull/271/merge\': unknown revision or path not in the working tree.');
    execCalledWith(mockExec, [
      'git remote add get-diff-action \'https://octocat:test token@github.com/hello/world.git\' || :',
      'git fetch --no-tags --no-recurse-submodules \'--depth=10000\' get-diff-action \'refs/pull/55/merge:refs/remotes/get-diff-action/pull/55/merge\' \'refs/heads/master:refs/remotes/get-diff-action/master\' || :',
      'git diff \'get-diff-action/master...get-diff-action/pull/55/merge\' \'--diff-filter=AMRC\' --name-only',
    ]);
  });

  it('should get git diff (with file diff)', async() => {
    process.env.GITHUB_WORKSPACE              = '/home/runner/work/my-repo-name/my-repo-name';
    process.env.INPUT_GITHUB_TOKEN            = 'test token';
    process.env.INPUT_PATTERNS                = '**/*.json\n**/*.md\n**/*.ts\n!src/index.ts';
    process.env.INPUT_MINIMATCH_OPTION_NOCASE = '1';
    process.env.INPUT_GET_FILE_DIFF           = '1';

    const mockExec = spyOnSpawn();
    setChildProcessParams({
      stdout: (command: string): string => {
        if (command.startsWith('git diff')) {
          return 'package.json\nabc/composer.JSON\nREADME.md\nsrc/main.ts\nsrc/index.ts';
        }
        return '';
      },
    });

    const emptyDiff = {insertions: 0, deletions: 0, lines: 0, ...defaultFileResult};
    expect(await getGitDiff(logger, prContext)).toEqual([
      {file: 'package.json', ...emptyDiff},
      {file: 'abc/composer.JSON', ...emptyDiff},
      {file: 'README.md', ...emptyDiff},
      {file: 'src/main.ts', ...emptyDiff},
    ]);
    execCalledWith(mockExec, [
      'git remote add get-diff-action \'https://octocat:test token@github.com/hello/world.git\' || :',
      'git fetch --no-tags --no-recurse-submodules \'--depth=10000\' get-diff-action \'refs/pull/55/merge:refs/remotes/get-diff-action/pull/55/merge\' \'refs/heads/master:refs/remotes/get-diff-action/master\' || :',
      'git diff \'get-diff-action/master...get-diff-action/pull/55/merge\' \'--diff-filter=AMRC\' --name-only',
      'git diff \'get-diff-action/master...get-diff-action/pull/55/merge\' --shortstat -w -- \'package.json\'',
      'git diff \'get-diff-action/master...get-diff-action/pull/55/merge\' --shortstat -w -- \'abc/composer.JSON\'',
      'git diff \'get-diff-action/master...get-diff-action/pull/55/merge\' --shortstat -w -- \'README.md\'',
      'git diff \'get-diff-action/master...get-diff-action/pull/55/merge\' --shortstat -w -- \'src/main.ts\'',
    ]);
  });
});

describe('getFileDiff', () => {
  it('should get file diff 1', async() => {
    const mockExec = spyOnSpawn();
    setChildProcessParams({
      stdout: '1 file changed, 25 insertions(+), 4 deletions(-)',
    });

    const diff = await getFileDiff({file: 'test.js', ...defaultFileResult}, {
      base: 'refs/heads/master',
      head: 'refs/pull/123/merge',
    }, '...');

    expect((diff as FileDiffResult).insertions).toBe(25);
    expect((diff as FileDiffResult).deletions).toBe(4);
    expect((diff as FileDiffResult).lines).toBe(29);

    execCalledWith(mockExec, [
      'git diff \'get-diff-action/master...get-diff-action/pull/123/merge\' --shortstat -w -- \'test.js\'',
    ]);
  });

  it('should get file diff 2', async() => {
    const mockExec = spyOnSpawn();
    setChildProcessParams({
      stdout: '1 file changed, 1 insertion(+), 3 deletions(-)',
    });

    const diff = await getFileDiff({file: 'test.js', ...defaultFileResult}, {
      base: 'refs/heads/master',
      head: 'refs/pull/123/merge',
    }, '...');

    expect((diff as FileDiffResult).insertions).toBe(1);
    expect((diff as FileDiffResult).deletions).toBe(3);
    expect((diff as FileDiffResult).lines).toBe(4);

    execCalledWith(mockExec, [
      'git diff \'get-diff-action/master...get-diff-action/pull/123/merge\' --shortstat -w -- \'test.js\'',
    ]);
  });

  it('should get file diff 3', async() => {
    const mockExec = spyOnSpawn();
    setChildProcessParams({
      stdout: '1 file changed, 3 insertions(+)',
    });

    const diff = await getFileDiff({file: 'test.js', ...defaultFileResult}, {
      base: 'refs/heads/master',
      head: 'refs/pull/123/merge',
    }, '...');

    expect((diff as FileDiffResult).insertions).toBe(3);
    expect((diff as FileDiffResult).deletions).toBe(0);
    expect((diff as FileDiffResult).lines).toBe(3);

    execCalledWith(mockExec, [
      'git diff \'get-diff-action/master...get-diff-action/pull/123/merge\' --shortstat -w -- \'test.js\'',
    ]);
  });

  it('should get file diff 4', async() => {
    const mockExec = spyOnSpawn();
    setChildProcessParams({
      stdout: '1 file changed',
    });

    const diff = await getFileDiff({file: 'test.js', ...defaultFileResult}, {
      base: 'refs/heads/master',
      head: 'refs/pull/123/merge',
    }, '...');

    expect((diff as FileDiffResult).insertions).toBe(0);
    expect((diff as FileDiffResult).deletions).toBe(0);
    expect((diff as FileDiffResult).lines).toBe(0);

    execCalledWith(mockExec, [
      'git diff \'get-diff-action/master...get-diff-action/pull/123/merge\' --shortstat -w -- \'test.js\'',
    ]);
  });

  it('should return empty', async() => {
    const mockExec = spyOnSpawn();
    setChildProcessParams({
      stdout: '',
    });

    const diff = await getFileDiff({file: 'test.js', ...defaultFileResult}, {
      base: 'refs/heads/master',
      head: 'refs/pull/123/merge',
    }, '...');

    expect((diff as FileDiffResult).insertions).toBe(0);
    expect((diff as FileDiffResult).deletions).toBe(0);
    expect((diff as FileDiffResult).lines).toBe(0);

    execCalledWith(mockExec, [
      'git diff \'get-diff-action/master...get-diff-action/pull/123/merge\' --shortstat -w -- \'test.js\'',
    ]);
  });

  it('should return undefined', async() => {
    const mockExec = spyOnSpawn();
    setChildProcessParams({
      stdout: '',
    });

    expect(await getFileDiff({file: 'test.js', ...defaultFileResult}, {
      base: 'refs/heads/master',
      head: 'refs/pull/123/merge',
    }, '...', true)).toBeUndefined();

    expect(mockExec).not.toBeCalled();
  });
});

describe('getDiffFiles', () => {
  testEnv(rootDir);

  it('should get git diff output 1', () => {
    expect(getDiffFiles([], false)).toBe('');
    expect(getDiffFiles([{file: 'test1', ...defaultFileResult}], false)).toBe('test1');
    expect(getDiffFiles([{file: 'test1', ...defaultFileResult}, {file: 'test2', ...defaultFileResult}], false)).toBe('test1 test2');
    expect(getDiffFiles([{file: 'test1', ...defaultFileResult}, {file: 'test2 test3', ...defaultFileResult}], false)).toBe('test1 \'test2 test3\'');
    expect(getDiffFiles([{file: 'test1/test2.txt', ...defaultFileResult}], false)).toBe('\'test1/test2.txt\'');
  });

  it('should get git diff output 2', () => {
    process.env.INPUT_SEPARATOR = '\n';

    expect(getDiffFiles([], false)).toBe('');
    expect(getDiffFiles([{file: 'test1', ...defaultFileResult}], false)).toBe('test1');
    expect(getDiffFiles([{file: 'test1', ...defaultFileResult}, {file: 'test2', ...defaultFileResult}], false)).toBe('test1\ntest2');
    expect(getDiffFiles([{file: 'test1', ...defaultFileResult}, {file: 'test2 test3', ...defaultFileResult}], false)).toBe('test1\n\'test2 test3\'');
    expect(getDiffFiles([{file: 'test1/test2.txt', ...defaultFileResult}], false)).toBe('\'test1/test2.txt\'');
  });

  it('should get git diff output 3', () => {
    delete process.env.INPUT_SEPARATOR;
    process.env.INPUT_TEST = '';

    expect(getDiffFiles([], false)).toBe('');
  });

  it('should get git diff output 4', () => {
    expect(getDiffFiles([], true)).toBe('');
    expect(getDiffFiles([{file: 'test1', ...defaultFileResult, isMatched: false}], true)).toBe('');
    expect(getDiffFiles([
      {
        file: 'test1', ...defaultFileResult,
        isMatched: false,
      },
      {file: 'test2', ...defaultFileResult},
    ], true)).toBe('test2');
    expect(getDiffFiles([
      {
        file: 'test1', ...defaultFileResult,
        isMatched: false,
      },
      {file: 'test2 test3', ...defaultFileResult},
    ], true)).toBe('\'test2 test3\'');
  });

  it('should get git diff output (json format)', () => {
    process.env.INPUT_FORMAT = 'json';

    expect(getDiffFiles([], true)).toBe('[]');
    expect(getDiffFiles([{file: 'test1', ...defaultFileResult}], false)).toBe('["test1"]');
    expect(getDiffFiles([{file: 'test1', ...defaultFileResult}, {file: 'test2', ...defaultFileResult}], false)).toBe('["test1","test2"]');
    expect(getDiffFiles([{file: 'test1', ...defaultFileResult}, {file: 'test2 test3', ...defaultFileResult}], false)).toBe('["test1","test2 test3"]');
    expect(getDiffFiles([{file: 'test1/test2.txt', ...defaultFileResult}], false)).toBe('["test1/test2.txt"]');
  });

  it('should get git diff output (escaped json format)', () => {
    process.env.INPUT_FORMAT      = 'json';
    process.env.INPUT_ESCAPE_JSON = '1';

    expect(getDiffFiles([], true)).toBe('[]');
    expect(getDiffFiles([{file: 'test1', ...defaultFileResult}], false)).toBe('["test1"]');
    expect(getDiffFiles([{file: 'test1', ...defaultFileResult}, {file: 'test2', ...defaultFileResult}], false)).toBe('["test1","test2"]');
    expect(getDiffFiles([{file: 'test1', ...defaultFileResult}, {file: 'test2 test3', ...defaultFileResult}], false)).toBe('["test1","\'test2 test3\'"]');
    expect(getDiffFiles([{file: 'test1/test2.txt', ...defaultFileResult}], false)).toBe('["\'test1/test2.txt\'"]');
  });
});

describe('sumResults', () => {
  testEnv(rootDir);

  it('should sum results', () => {
    expect(sumResults([], item => (item as FileDiffResult).lines)).toBe(0);

    expect(sumResults(diffs, item => (item as FileDiffResult).insertions)).toBe(3);
    expect(sumResults(diffs, item => (item as FileDiffResult).deletions)).toBe(300);
    expect(sumResults(diffs, item => (item as FileDiffResult).lines)).toBe(303);
  });

  it('should sum results includes specific files', () => {
    process.env.INPUT_SUMMARY_INCLUDE_FILES = 'true';
    expect(sumResults([], item => (item as FileDiffResult).lines)).toBe(0);

    expect(sumResults(diffs, item => (item as FileDiffResult).insertions)).toBe(7);
    expect(sumResults(diffs, item => (item as FileDiffResult).deletions)).toBe(700);
    expect(sumResults(diffs, item => (item as FileDiffResult).lines)).toBe(707);
  });
});
