/* eslint-disable no-magic-numbers */
import nock from 'nock';
import path, { resolve } from 'path';
import {
	generateContext,
	testEnv,
	spyOnExec,
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
const pullContext       = generateContext({
	owner: 'hello',
	repo: 'world',
	event: 'pull',
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

		const mockExec = spyOnExec();
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
			'git diff \'origin/master...pull/55/merge\' \'--diff-filter=AM\' --name-only',
			'git diff \'origin/master...pull/55/merge\' --shortstat -w \'package.json\'',
			'git diff \'origin/master...pull/55/merge\' --shortstat -w \'abc/composer.json\'',
			'git diff \'origin/master...pull/55/merge\' --shortstat -w \'README.md\'',
			'git diff \'origin/master...pull/55/merge\' --shortstat -w \'src/main.ts\'',
		]);
	});

	it('should get git diff (push)', async() => {
		process.env.GITHUB_WORKSPACE   = '/home/runner/work/my-repo-name/my-repo-name';
		process.env.INPUT_GITHUB_TOKEN = 'test token';

		const mockExec = spyOnExec();
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

		expect(await getGitDiff(logger, pullContext)).toEqual([
			{file: 'package.json', ...emptyDiff},
			{file: 'abc/composer.json', ...emptyDiff},
			{file: 'README.md', ...emptyDiff},
			{file: 'src/main.ts', ...emptyDiff},
		]);
		execCalledWith(mockExec, [
			'git fetch --no-tags origin \'+refs/pull/*/merge:refs/pull/*/merge\'',
			'git fetch --no-tags origin \'+refs/heads/*:refs/remotes/origin/*\'',
			'git diff \'before-sha...after-sha\' \'--diff-filter=AM\' --name-only',
			'git diff \'before-sha...after-sha\' --shortstat -w \'package.json\'',
			'git diff \'before-sha...after-sha\' --shortstat -w \'abc/composer.json\'',
			'git diff \'before-sha...after-sha\' --shortstat -w \'README.md\'',
			'git diff \'before-sha...after-sha\' --shortstat -w \'src/main.ts\'',
		]);
	});

	it('should get git diff (push, tag)', async() => {
		process.env.GITHUB_WORKSPACE   = '/home/runner/work/my-repo-name/my-repo-name';
		process.env.INPUT_GITHUB_TOKEN = 'test token';

		const mockExec = spyOnExec();
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
			.get('/repos/hello/world/commits/sha/pulls')
			.reply(200, () => getApiFixture(fixtureRootDir, 'pulls.list1'));

		expect(await getGitDiff(logger, Object.assign({}, pullContext, {
			payload: {
				before: '0000000000000000000000000000000000000000',
				after: 'after-sha',
				repository: {
					'default_branch': 'master',
				},
			},
		}))).toEqual([]);
		execCalledWith(mockExec, []);
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
		const mockExec                  = spyOnExec();
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
			'git diff \'origin/master..pull/55/merge\' \'--diff-filter=AMD\' --name-only',
			'git diff \'origin/master..pull/55/merge\' --shortstat -w \'package.json\'',
			'git diff \'origin/master..pull/55/merge\' --shortstat -w \'abc/composer.json\'',
			'git diff \'origin/master..pull/55/merge\' --shortstat -w \'src/main.ts\'',
			'git diff \'origin/master..pull/55/merge\' --shortstat -w \'src/test/test2.txt\'',
			'git diff \'origin/master..pull/55/merge\' --shortstat -w \'__tests__/main.test.ts\'',
		]);
	});
});

describe('getFileDiff', () => {
	it('should get file diff 1', async() => {
		const mockExec = spyOnExec();
		setChildProcessParams({
			stdout: '1 file changed, 25 insertions(+), 4 deletions(-)',
		});

		const diff = await getFileDiff({file: 'test.js', ...defaultFileResult}, {base: 'refs/heads/master', head: 'refs/pull/123/merge'}, '...');

		expect(diff.insertions).toBe(25);
		expect(diff.deletions).toBe(4);
		expect(diff.lines).toBe(29);

		execCalledWith(mockExec, [
			'git diff \'origin/master...pull/123/merge\' --shortstat -w \'test.js\'',
		]);
	});

	it('should get file diff 2', async() => {
		const mockExec = spyOnExec();
		setChildProcessParams({
			stdout: '1 file changed, 1 insertion(+), 3 deletions(-)',
		});

		const diff = await getFileDiff({file: 'test.js', ...defaultFileResult}, {base: 'refs/heads/master', head: 'refs/pull/123/merge'}, '...');

		expect(diff.insertions).toBe(1);
		expect(diff.deletions).toBe(3);
		expect(diff.lines).toBe(4);

		execCalledWith(mockExec, [
			'git diff \'origin/master...pull/123/merge\' --shortstat -w \'test.js\'',
		]);
	});

	it('should get file diff 3', async() => {
		const mockExec = spyOnExec();
		setChildProcessParams({
			stdout: '1 file changed, 3 insertions(+)',
		});

		const diff = await getFileDiff({file: 'test.js', ...defaultFileResult}, {base: 'refs/heads/master', head: 'refs/pull/123/merge'}, '...');

		expect(diff.insertions).toBe(3);
		expect(diff.deletions).toBe(0);
		expect(diff.lines).toBe(3);

		execCalledWith(mockExec, [
			'git diff \'origin/master...pull/123/merge\' --shortstat -w \'test.js\'',
		]);
	});

	it('should return empty', async() => {
		const mockExec = spyOnExec();
		setChildProcessParams({
			stdout: '',
		});

		const diff = await getFileDiff({file: 'test.js', ...defaultFileResult}, {base: 'refs/heads/master', head: 'refs/pull/123/merge'}, '...');

		expect(diff.insertions).toBe(0);
		expect(diff.deletions).toBe(0);
		expect(diff.lines).toBe(0);

		execCalledWith(mockExec, [
			'git diff \'origin/master...pull/123/merge\' --shortstat -w \'test.js\'',
		]);
	});
});

describe('getDiffFiles', () => {
	testEnv(rootDir);

	it('get git diff output 1', () => {
		expect(getDiffFiles([])).toEqual('');
		expect(getDiffFiles([{file: 'test1', ...defaultFileResult}])).toEqual('test1');
		expect(getDiffFiles([{file: 'test1', ...defaultFileResult}, {file: 'test2', ...defaultFileResult}])).toEqual('test1 test2');
		expect(getDiffFiles([{file: 'test1', ...defaultFileResult}, {file: 'test2 test3', ...defaultFileResult}])).toEqual('test1 \'test2 test3\'');
		expect(getDiffFiles([{file: 'test1/test2.txt', ...defaultFileResult}])).toEqual('\'test1/test2.txt\'');
	});

	it('get git diff output 2', () => {
		process.env.INPUT_SEPARATOR = '\n';

		expect(getDiffFiles([])).toEqual('');
		expect(getDiffFiles([{file: 'test1', ...defaultFileResult}])).toEqual('test1');
		expect(getDiffFiles([{file: 'test1', ...defaultFileResult}, {file: 'test2', ...defaultFileResult}])).toEqual('test1\ntest2');
		expect(getDiffFiles([{file: 'test1', ...defaultFileResult}, {file: 'test2 test3', ...defaultFileResult}])).toEqual('test1\n\'test2 test3\'');
		expect(getDiffFiles([{file: 'test1/test2.txt', ...defaultFileResult}])).toEqual('\'test1/test2.txt\'');
	});

	it('get git diff output 3', () => {
		delete process.env.INPUT_SEPARATOR;
		process.env.INPUT_TEST = '';

		expect(getDiffFiles([])).toEqual('');
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
