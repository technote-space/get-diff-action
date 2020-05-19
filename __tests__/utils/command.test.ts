/* eslint-disable no-magic-numbers */
import nock from 'nock';
import path, { resolve } from 'path';
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
import { Logger } from '@technote-space/github-action-helper';
import { getGitDiff, getFileDiff, getDiffFiles, sumResults } from '../../src/utils/command';

const rootDir           = path.resolve(__dirname, '../..');
const fixtureRootDir    = resolve(__dirname, '..', 'fixtures');
const defaultFileResult = {filterIgnored: false, prefixMatched: true, suffixMatched: true};
const diffs             = [
	{file: 'test1', insertions: 1, deletions: 100, lines: 101, ...defaultFileResult},
	{file: 'test2', insertions: 2, deletions: 200, lines: 202, ...defaultFileResult},
	{file: 'test4', insertions: 4, deletions: 400, lines: 404, filterIgnored: true, prefixMatched: true, suffixMatched: false},
];
const emptyDiff         = {insertions: 0, deletions: 0, lines: 0, ...defaultFileResult};
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

		expect(await getGitDiff(logger, prContext)).toEqual([
			{file: 'package.json', ...emptyDiff},
			{file: 'abc/composer.json', ...emptyDiff},
			{file: 'README.md', ...emptyDiff},
			{file: 'src/main.ts', ...emptyDiff},
		]);
		execCalledWith(mockExec, [
			'git remote add get-diff-action \'https://octocat:test token@github.com/hello/world.git\' > /dev/null 2>&1 || :',
			'git fetch --no-tags --no-recurse-submodules get-diff-action \'refs/pull/55/merge:refs/pull/55/merge\' \'refs/heads/master:refs/remotes/get-diff-action/master\' || :',
			'git diff \'get-diff-action/master...pull/55/merge\' \'--diff-filter=AM\' --name-only || :',
			'git diff \'get-diff-action/master...pull/55/merge\' --shortstat -w \'package.json\'',
			'git diff \'get-diff-action/master...pull/55/merge\' --shortstat -w \'abc/composer.json\'',
			'git diff \'get-diff-action/master...pull/55/merge\' --shortstat -w \'README.md\'',
			'git diff \'get-diff-action/master...pull/55/merge\' --shortstat -w \'src/main.ts\'',
		]);
	});

	it('should get git diff (pull request closed)', async() => {
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
			{file: 'package.json', ...emptyDiff},
			{file: 'abc/composer.json', ...emptyDiff},
			{file: 'README.md', ...emptyDiff},
			{file: 'src/main.ts', ...emptyDiff},
		]);
		execCalledWith(mockExec, [
			'git remote add get-diff-action \'https://octocat:test token@github.com/hello/world.git\' > /dev/null 2>&1 || :',
			'git fetch --no-tags --no-recurse-submodules get-diff-action \'refs/heads/master:refs/remotes/get-diff-action/master\' || :',
			'git diff \'base-sha...sha\' \'--diff-filter=AM\' --name-only || :',
			'git diff \'base-sha...sha\' --shortstat -w \'package.json\'',
			'git diff \'base-sha...sha\' --shortstat -w \'abc/composer.json\'',
			'git diff \'base-sha...sha\' --shortstat -w \'README.md\'',
			'git diff \'base-sha...sha\' --shortstat -w \'src/main.ts\'',
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
			{file: 'package.json', ...emptyDiff},
			{file: 'abc/composer.json', ...emptyDiff},
			{file: 'README.md', ...emptyDiff},
			{file: 'src/main.ts', ...emptyDiff},
		]);
		execCalledWith(mockExec, [
			'git remote add get-diff-action \'https://octocat:test token@github.com/hello/world.git\' > /dev/null 2>&1 || :',
			'git fetch --no-tags --no-recurse-submodules get-diff-action \'refs/heads/master:refs/remotes/get-diff-action/master\' || :',
			'git diff \'before-sha...after-sha\' \'--diff-filter=AM\' --name-only || :',
			'git diff \'before-sha...after-sha\' --shortstat -w \'package.json\'',
			'git diff \'before-sha...after-sha\' --shortstat -w \'abc/composer.json\'',
			'git diff \'before-sha...after-sha\' --shortstat -w \'README.md\'',
			'git diff \'before-sha...after-sha\' --shortstat -w \'src/main.ts\'',
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
			{file: 'package.json', ...emptyDiff},
			{file: 'abc/composer.json', ...emptyDiff},
			{file: 'README.md', ...emptyDiff},
			{file: 'src/main.ts', ...emptyDiff},
		]);
		execCalledWith(mockExec, [
			'git remote add get-diff-action \'https://octocat:test token@github.com/hello/world.git\' > /dev/null 2>&1 || :',
			'git fetch --no-tags --no-recurse-submodules get-diff-action \'refs/heads/test:refs/remotes/get-diff-action/test\' \'refs/heads/master:refs/remotes/get-diff-action/master\' \'refs/pull/1347/merge:refs/pull/1347/merge\' || :',
			'git diff \'get-diff-action/master...pull/1347/merge\' \'--diff-filter=AM\' --name-only || :',
			'git diff \'get-diff-action/master...pull/1347/merge\' --shortstat -w \'package.json\'',
			'git diff \'get-diff-action/master...pull/1347/merge\' --shortstat -w \'abc/composer.json\'',
			'git diff \'get-diff-action/master...pull/1347/merge\' --shortstat -w \'README.md\'',
			'git diff \'get-diff-action/master...pull/1347/merge\' --shortstat -w \'src/main.ts\'',
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
			{file: 'package.json', ...emptyDiff},
			{file: 'abc/composer.json', ...emptyDiff},
			{file: 'README.md', ...emptyDiff},
			{file: 'src/main.ts', ...emptyDiff},
		]);
		execCalledWith(mockExec, [
			'git remote add get-diff-action \'https://octocat:test token@github.com/hello/world.git\' > /dev/null 2>&1 || :',
			'git fetch --no-tags --no-recurse-submodules get-diff-action \'refs/heads/test:refs/remotes/get-diff-action/test\' || :',
			'git diff \'before-sha...after-sha\' \'--diff-filter=AM\' --name-only || :',
			'git diff \'before-sha...after-sha\' --shortstat -w \'package.json\'',
			'git diff \'before-sha...after-sha\' --shortstat -w \'abc/composer.json\'',
			'git diff \'before-sha...after-sha\' --shortstat -w \'README.md\'',
			'git diff \'before-sha...after-sha\' --shortstat -w \'src/main.ts\'',
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
			{file: 'package.json', ...emptyDiff},
			{file: 'abc/composer.json', ...emptyDiff},
			{file: 'README.md', ...emptyDiff},
			{file: 'src/main.ts', ...emptyDiff},
		]);
		execCalledWith(mockExec, [
			'git remote add get-diff-action \'https://octocat:test token@github.com/hello/world.git\' > /dev/null 2>&1 || :',
			'git fetch --no-tags --no-recurse-submodules get-diff-action \'refs/heads/test:refs/remotes/get-diff-action/test\' \'refs/heads/master:refs/remotes/get-diff-action/master\' || :',
			'git diff \'get-diff-action/master...after-sha\' \'--diff-filter=AM\' --name-only || :',
			'git diff \'get-diff-action/master...after-sha\' --shortstat -w \'package.json\'',
			'git diff \'get-diff-action/master...after-sha\' --shortstat -w \'abc/composer.json\'',
			'git diff \'get-diff-action/master...after-sha\' --shortstat -w \'README.md\'',
			'git diff \'get-diff-action/master...after-sha\' --shortstat -w \'src/main.ts\'',
		]);
	});

	it('should get git diff (env)', async() => {
		process.env.GITHUB_WORKSPACE    = '/home/runner/work/my-repo-name/my-repo-name';
		process.env.INPUT_GITHUB_TOKEN  = 'test token';
		process.env.INPUT_DOT           = '..';
		process.env.INPUT_DIFF_FILTER   = 'AMD';
		process.env.INPUT_FILES         = 'package.json\ncomposer.json\nREADME2.md';
		process.env.INPUT_PREFIX_FILTER = 'src/\n__tests__';
		process.env.INPUT_SUFFIX_FILTER = '.ts\n.txt';
		process.env.INPUT_ABSOLUTE      = 'true';
		process.env.INPUT_SET_ENV_NAME  = '';
		const mockExec                  = spyOnSpawn();
		setChildProcessParams({
			stdout: (command: string): string => {
				if (command.startsWith('git diff')) {
					return 'package.json\nabc/composer.json\nREADME.md\nsrc/main.ts\nsrc/test1.tts\nsrc/test/test2.txt\n__tests__/main.test.ts';
				}
				return '';
			},
		});

		expect(await getGitDiff(logger, prContext)).toEqual([
			{file: process.env.GITHUB_WORKSPACE + '/package.json', ...emptyDiff, filterIgnored: true, prefixMatched: false, suffixMatched: false},
			{file: process.env.GITHUB_WORKSPACE + '/abc/composer.json', ...emptyDiff, filterIgnored: true, prefixMatched: false, suffixMatched: false},
			{file: process.env.GITHUB_WORKSPACE + '/src/main.ts', ...emptyDiff},
			{file: process.env.GITHUB_WORKSPACE + '/src/test/test2.txt', ...emptyDiff},
			{file: process.env.GITHUB_WORKSPACE + '/__tests__/main.test.ts', ...emptyDiff},
		]);
		execCalledWith(mockExec, [
			'git remote add get-diff-action \'https://octocat:test token@github.com/hello/world.git\' > /dev/null 2>&1 || :',
			'git fetch --no-tags --no-recurse-submodules get-diff-action \'refs/pull/55/merge:refs/pull/55/merge\' \'refs/heads/master:refs/remotes/get-diff-action/master\' || :',
			'git diff \'get-diff-action/master..pull/55/merge\' \'--diff-filter=AMD\' --name-only || :',
			'git diff \'get-diff-action/master..pull/55/merge\' --shortstat -w \'package.json\'',
			'git diff \'get-diff-action/master..pull/55/merge\' --shortstat -w \'abc/composer.json\'',
			'git diff \'get-diff-action/master..pull/55/merge\' --shortstat -w \'src/main.ts\'',
			'git diff \'get-diff-action/master..pull/55/merge\' --shortstat -w \'src/test/test2.txt\'',
			'git diff \'get-diff-action/master..pull/55/merge\' --shortstat -w \'__tests__/main.test.ts\'',
		]);
	});
});

describe('getFileDiff', () => {
	it('should get file diff 1', async() => {
		const mockExec = spyOnSpawn();
		setChildProcessParams({
			stdout: '1 file changed, 25 insertions(+), 4 deletions(-)',
		});

		const diff = await getFileDiff({file: 'test.js', ...defaultFileResult}, {base: 'refs/heads/master', head: 'refs/pull/123/merge'}, '...');

		expect(diff.insertions).toBe(25);
		expect(diff.deletions).toBe(4);
		expect(diff.lines).toBe(29);

		execCalledWith(mockExec, [
			'git diff \'get-diff-action/master...pull/123/merge\' --shortstat -w \'test.js\'',
		]);
	});

	it('should get file diff 2', async() => {
		const mockExec = spyOnSpawn();
		setChildProcessParams({
			stdout: '1 file changed, 1 insertion(+), 3 deletions(-)',
		});

		const diff = await getFileDiff({file: 'test.js', ...defaultFileResult}, {base: 'refs/heads/master', head: 'refs/pull/123/merge'}, '...');

		expect(diff.insertions).toBe(1);
		expect(diff.deletions).toBe(3);
		expect(diff.lines).toBe(4);

		execCalledWith(mockExec, [
			'git diff \'get-diff-action/master...pull/123/merge\' --shortstat -w \'test.js\'',
		]);
	});

	it('should get file diff 3', async() => {
		const mockExec = spyOnSpawn();
		setChildProcessParams({
			stdout: '1 file changed, 3 insertions(+)',
		});

		const diff = await getFileDiff({file: 'test.js', ...defaultFileResult}, {base: 'refs/heads/master', head: 'refs/pull/123/merge'}, '...');

		expect(diff.insertions).toBe(3);
		expect(diff.deletions).toBe(0);
		expect(diff.lines).toBe(3);

		execCalledWith(mockExec, [
			'git diff \'get-diff-action/master...pull/123/merge\' --shortstat -w \'test.js\'',
		]);
	});

	it('should return empty', async() => {
		const mockExec = spyOnSpawn();
		setChildProcessParams({
			stdout: '',
		});

		const diff = await getFileDiff({file: 'test.js', ...defaultFileResult}, {base: 'refs/heads/master', head: 'refs/pull/123/merge'}, '...');

		expect(diff.insertions).toBe(0);
		expect(diff.deletions).toBe(0);
		expect(diff.lines).toBe(0);

		execCalledWith(mockExec, [
			'git diff \'get-diff-action/master...pull/123/merge\' --shortstat -w \'test.js\'',
		]);
	});
});

describe('getDiffFiles', () => {
	testEnv(rootDir);

	it('get git diff output 1', () => {
		expect(getDiffFiles([], false)).toEqual('');
		expect(getDiffFiles([{file: 'test1', ...defaultFileResult}], false)).toEqual('test1');
		expect(getDiffFiles([{file: 'test1', ...defaultFileResult}, {file: 'test2', ...defaultFileResult}], false)).toEqual('test1 test2');
		expect(getDiffFiles([{file: 'test1', ...defaultFileResult}, {file: 'test2 test3', ...defaultFileResult}], false)).toEqual('test1 \'test2 test3\'');
		expect(getDiffFiles([{file: 'test1/test2.txt', ...defaultFileResult}], false)).toEqual('\'test1/test2.txt\'');
	});

	it('get git diff output 2', () => {
		process.env.INPUT_SEPARATOR = '\n';

		expect(getDiffFiles([], false)).toEqual('');
		expect(getDiffFiles([{file: 'test1', ...defaultFileResult}], false)).toEqual('test1');
		expect(getDiffFiles([{file: 'test1', ...defaultFileResult}, {file: 'test2', ...defaultFileResult}], false)).toEqual('test1\ntest2');
		expect(getDiffFiles([{file: 'test1', ...defaultFileResult}, {file: 'test2 test3', ...defaultFileResult}], false)).toEqual('test1\n\'test2 test3\'');
		expect(getDiffFiles([{file: 'test1/test2.txt', ...defaultFileResult}], false)).toEqual('\'test1/test2.txt\'');
	});

	it('get git diff output 3', () => {
		delete process.env.INPUT_SEPARATOR;
		process.env.INPUT_TEST = '';

		expect(getDiffFiles([], false)).toEqual('');
	});

	it('get git diff output 4', () => {
		expect(getDiffFiles([], true)).toEqual('');
		expect(getDiffFiles([{file: 'test1', ...defaultFileResult, prefixMatched: false}], true)).toEqual('');
		expect(getDiffFiles([{file: 'test1', ...defaultFileResult, prefixMatched: false}, {file: 'test2', ...defaultFileResult}], true)).toEqual('test2');
		expect(getDiffFiles([{file: 'test1', ...defaultFileResult, prefixMatched: false}, {file: 'test2 test3', ...defaultFileResult}], true)).toEqual('\'test2 test3\'');
	});
});

describe('sumResults', () => {
	testEnv(rootDir);

	it('should sum results', () => {
		expect(sumResults([], item => item.lines)).toBe(0);

		expect(sumResults(diffs, item => item.insertions)).toBe(3);
		expect(sumResults(diffs, item => item.deletions)).toBe(300);
		expect(sumResults(diffs, item => item.lines)).toBe(303);
	});

	it('should sum results includes specific files', () => {
		process.env.INPUT_SUMMARY_INCLUDE_FILES = 'true';
		expect(sumResults([], item => item.lines)).toBe(0);

		expect(sumResults(diffs, item => item.insertions)).toBe(7);
		expect(sumResults(diffs, item => item.deletions)).toBe(700);
		expect(sumResults(diffs, item => item.lines)).toBe(707);
	});
});
