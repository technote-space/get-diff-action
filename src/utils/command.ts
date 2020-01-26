import path from 'path';
import { Logger, Command, Utils } from '@technote-space/github-action-helper';
import { getInput } from '@actions/core' ;
import { FileDiffResult, FileResult, DiffResult } from '../types';

const getRawInput  = (name: string): string => process.env[`INPUT_${name.replace(/ /g, '_').toUpperCase()}`] || '';
const getFrom      = (): string => getInput('FROM', {required: true});
const getTo        = (): string => getInput('TO', {required: true});
const getDot       = (): string => getInput('DOT', {required: true});
const getFilter    = (): string => getInput('DIFF_FILTER', {required: true});
const getSeparator = (): string => getRawInput('SEPARATOR');
const getPrefix    = (): string[] => Utils.getArrayInput('PREFIX_FILTER', undefined, '');
const getSuffix    = (): string[] => Utils.getArrayInput('SUFFIX_FILTER', undefined, '');
const getFiles     = (): string[] => Utils.getArrayInput('FILES', undefined, '');
const getWorkspace = (): string => Utils.getBoolValue(getInput('ABSOLUTE')) ? (Utils.getWorkspace() + '/') : '';

const escape          = (items: string[]): string[] => items.map(item => {
	// eslint-disable-next-line no-useless-escape
	if (!/^[A-Za-z0-9_\/-]+$/.test(item)) {
		item = '\'' + item.replace(/'/g, '\'\\\'\'') + '\'';
		item = item.replace(/^(?:'')+/g, '') // unduplicate single-quote at the beginning
			.replace(/\\'''/g, '\\\''); // remove non-escaped single-quote if there are enclosed between 2 escaped
	}
	return item;
});
const isIgnore        = (item: string, files: string[]): boolean => !!(files.length && files.includes(path.basename(item)));
const isPrefixMatched = (item: string, prefix: string[]): boolean => !prefix.length || !prefix.every(prefix => !Utils.getPrefixRegExp(prefix).test(item));
const isSuffixMatched = (item: string, suffix: string[]): boolean => !suffix.length || !suffix.every(suffix => !Utils.getSuffixRegExp(suffix).test(item));
const toAbsolute      = (item: string, workspace: string): string => workspace + item;

export const getFileDiff = async(path: string, between: string): Promise<FileDiffResult> => {
	const command = new Command(new Logger());
	const stdout  = (await command.execAsync({
		command: `git diff ${between}`,
		args: ['--shortstat', path],
		cwd: Utils.getWorkspace(),
	})).stdout;

	if ('' === stdout) {
		return {insertions: 0, deletions: 0, lines: 0};
	}

	const insertions = Number.parseInt((stdout.match(/ (\d+) insertions/) ?? ['', '0'])[1]);
	const deletions  = Number.parseInt((stdout.match(/ (\d+) deletions/) ?? ['', '0'])[1]);
	return {insertions, deletions, lines: insertions + deletions};
};

export const getGitDiff = async(): Promise<DiffResult[]> => {
	const files     = getFiles();
	const prefix    = getPrefix();
	const suffix    = getSuffix();
	const workspace = getWorkspace();
	const command   = new Command(new Logger());
	const between   = `"${Utils.replaceAll(getFrom(), /[^\\]"/g, '\\"')}"${getDot()}"${Utils.replaceAll(getTo(), /[^\\]"/g, '\\"')}"`;

	await command.execAsync({
		command: 'git fetch',
		args: ['--no-tags', 'origin', '+refs/pull/*/merge:refs/remotes/pull/*/merge'],
		stderrToStdout: true,
		cwd: Utils.getWorkspace(),
	});
	await command.execAsync({
		command: 'git fetch',
		args: ['--no-tags', 'origin', `+refs/heads/${process.env.GITHUB_BASE_REF}:refs/remotes/origin/${process.env.GITHUB_BASE_REF}`],
		stderrToStdout: true,
		cwd: Utils.getWorkspace(),
	});

	return (await Promise.all(Utils.split((await command.execAsync({
		command: `git diff ${between}`,
		args: [
			'--diff-filter=' + getFilter(),
			'--name-only',
		],
		cwd: Utils.getWorkspace(),
	})).stdout)
		.filter(item => isIgnore(item, files) || (isPrefixMatched(item, prefix) && isSuffixMatched(item, suffix)))
		.map(async item => ({file: item, ...await getFileDiff(item, between)}))))
		.map(item => ({...item, file: toAbsolute(item.file, workspace)}));
};

export const getDiffFiles = (diffs: FileResult[]): string => escape(diffs.map(item => item.file)).join(getSeparator());
export const sumResults   = (diffs: DiffResult[], map: (item: DiffResult) => number): number => diffs.map(map).reduce((acc, val) => acc + val, 0); // eslint-disable-line no-magic-numbers
