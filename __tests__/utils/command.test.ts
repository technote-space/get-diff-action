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
		const mockExec               = spyOnExec();
		setChildProcessParams({
			stdout: (command: string): string => {
				if (command.startsWith('git diff')) {
					return 'README.md\nsrc/main.ts';
				}
				return '';
			},
		});

		expect(await getGitDiff()).toEqual([
			'/home/runner/work/my-repo-name/my-repo-name/README.md',
			'/home/runner/work/my-repo-name/my-repo-name/src/main.ts',
		]);
		execCalledWith(mockExec, ['git diff "origin/${GITHUB_BASE_REF}"..."${GITHUB_REF#refs/}" -C /home/runner/work/my-repo-name/my-repo-name \'--diff-filter=AM\' --name-only']);
	});

	it('should get git diff 2', async() => {
		process.env.GITHUB_WORKSPACE    = '/home/runner/work/my-repo-name/my-repo-name';
		process.env.INPUT_FROM          = '!"#$%&\'()-=~^|\\[];+*,./';
		process.env.INPUT_TO            = 'test';
		process.env.INPUT_DOT           = '..';
		process.env.INPUT_DIFF_FILTER   = 'AMD';
		process.env.INPUT_PREFIX_FILTER = 'src/\n__tests__';
		process.env.INPUT_SUFFIX_FILTER = '.ts\n.txt';
		process.env.INPUT_ABSOLUTE      = 'false';
		const mockExec                  = spyOnExec();
		setChildProcessParams({
			stdout: (command: string): string => {
				if (command.startsWith('git diff')) {
					return 'README.md\nsrc/main.ts\nsrc/test1.tts\nsrc/test/test2.txt\n__tests__/main.test.ts';
				}
				return '';
			},
		});

		expect(await getGitDiff()).toEqual([
			'src/main.ts',
			'src/test/test2.txt',
			'__tests__/main.test.ts',
		]);
		execCalledWith(mockExec, ['git diff "\\"#$%&\'()-=~^|\\[];+*,./".."test" -C /home/runner/work/my-repo-name/my-repo-name \'--diff-filter=AMD\' --name-only']);
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
