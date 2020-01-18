/* eslint-disable no-magic-numbers */
import path from 'path';
import { testEnv, spyOnExec, testChildProcess, execCalledWith, setChildProcessParams } from '@technote-space/github-action-test-helper';
import { getGitDiff, getGitDiffOutput } from '../../src/utils/command';

const rootDir = path.resolve(__dirname, '..', '..');

describe('getGitDiff', () => {
	testEnv(rootDir);
	testChildProcess();

	it('should get git diff 1', async() => {
		process.env.GITHUB_WORKSPACE = '/home/runner/work/my-repo-name/my-repo-name';
		process.env.GITHUB_REF       = 'refs/pull/123/merge';
		process.env.GITHUB_SHA       = 'f01e53bb1f41af4e132326dad21e82c77ee1ff48';
		process.env.GITHUB_HEAD_REF  = 'release/v0.3.13';
		process.env.GITHUB_BASE_REF  = 'master';

		const mockExec = spyOnExec();
		setChildProcessParams({
			stdout: (command: string): string => {
				if (command.startsWith('git diff')) {
					return 'package.json\nabc/composer.json\nREADME.md\nsrc/main.ts';
				}
				return '';
			},
		});

		expect(await getGitDiff()).toEqual([
			'/home/runner/work/my-repo-name/my-repo-name/package.json',
			'/home/runner/work/my-repo-name/my-repo-name/abc/composer.json',
			'/home/runner/work/my-repo-name/my-repo-name/README.md',
			'/home/runner/work/my-repo-name/my-repo-name/src/main.ts',
		]);
		execCalledWith(mockExec, [
			'git fetch --no-tags origin \'+refs/pull/*/merge:refs/remotes/pull/*/merge\'',
			'git fetch --no-tags origin \'+refs/heads/master:refs/remotes/origin/master\'',
			'git diff "origin/${GITHUB_BASE_REF}"..."${GITHUB_REF#refs/}" \'--diff-filter=AM\' --name-only',
		]);
	});

	it('should get git diff 2', async() => {
		process.env.GITHUB_WORKSPACE = '/home/runner/work/my-repo-name/my-repo-name';
		process.env.GITHUB_REF       = 'refs/pull/123/merge';
		process.env.GITHUB_SHA       = 'f01e53bb1f41af4e132326dad21e82c77ee1ff48';
		process.env.GITHUB_HEAD_REF  = 'release/v0.3.13';
		process.env.GITHUB_BASE_REF  = 'master';

		process.env.INPUT_FROM          = '!"#$%&\'()-=~^|\\[];+*,./';
		process.env.INPUT_TO            = 'test';
		process.env.INPUT_DOT           = '..';
		process.env.INPUT_DIFF_FILTER   = 'AMD';
		process.env.INPUT_FILES         = 'package.json\ncomposer.json\nREADME2.md';
		process.env.INPUT_PREFIX_FILTER = 'src/\n__tests__';
		process.env.INPUT_SUFFIX_FILTER = '.ts\n.txt';
		process.env.INPUT_ABSOLUTE      = 'false';
		const mockExec                  = spyOnExec();
		setChildProcessParams({
			stdout: (command: string): string => {
				if (command.startsWith('git diff')) {
					return 'package.json\nabc/composer.json\nREADME.md\nsrc/main.ts\nsrc/test1.tts\nsrc/test/test2.txt\n__tests__/main.test.ts';
				}
				return '';
			},
		});

		expect(await getGitDiff()).toEqual([
			'package.json',
			'abc/composer.json',
			'src/main.ts',
			'src/test/test2.txt',
			'__tests__/main.test.ts',
		]);
		execCalledWith(mockExec, [
			'git fetch --no-tags origin \'+refs/pull/*/merge:refs/remotes/pull/*/merge\'',
			'git fetch --no-tags origin \'+refs/heads/master:refs/remotes/origin/master\'',
			'git diff "\\"#$%&\'()-=~^|\\[];+*,./".."test" \'--diff-filter=AMD\' --name-only',
		]);
	});
});

describe('getGitDiffOutput', () => {
	testEnv(rootDir);

	it('get git diff output 1', () => {
		expect(getGitDiffOutput([])).toEqual('');
		expect(getGitDiffOutput(['test1'])).toEqual('test1');
		expect(getGitDiffOutput(['test1', 'test2'])).toEqual('test1 test2');
		expect(getGitDiffOutput(['test1', 'test2 test3'])).toEqual('test1 \'test2 test3\'');
		expect(getGitDiffOutput(['test1/test2.txt'])).toEqual('\'test1/test2.txt\'');
	});

	it('get git diff output 2', () => {
		process.env.INPUT_SEPARATOR = '\n';

		expect(getGitDiffOutput([])).toEqual('');
		expect(getGitDiffOutput(['test1'])).toEqual('test1');
		expect(getGitDiffOutput(['test1', 'test2'])).toEqual('test1\ntest2');
		expect(getGitDiffOutput(['test1', 'test2 test3'])).toEqual('test1\n\'test2 test3\'');
		expect(getGitDiffOutput(['test1/test2.txt'])).toEqual('\'test1/test2.txt\'');
	});

	it('get git diff output 3', () => {
		delete process.env.INPUT_SEPARATOR;
		process.env.INPUT_TEST = '';

		expect(getGitDiffOutput([])).toEqual('');
	});
});
