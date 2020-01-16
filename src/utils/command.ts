import { Logger, Command, Utils } from '@technote-space/github-action-helper';
import { getInput } from '@actions/core' ;

const getRawInput  = (name: string): string => process.env[`INPUT_${name.replace(/ /g, '_').toUpperCase()}`] || '';
const getFrom      = (): string => getInput('FROM', {required: true});
const getTo        = (): string => getInput('TO', {required: true});
const getDot       = (): string => getInput('DOT', {required: true});
const getFilter    = (): string => getInput('DIFF_FILTER', {required: true});
const getSeparator = (): string => getRawInput('SEPARATOR');
const getPrefix    = (): string[] => Utils.getArrayInput('PREFIX_FILTER', undefined, '');
const getSuffix    = (): string[] => Utils.getArrayInput('SUFFIX_FILTER', undefined, '');
const getWorkspace = (): string => Utils.getBoolValue(getInput('ABSOLUTE')) ? (Utils.getWorkspace() + '/') : '';

const escape       = (items: string[]): string[] => items.map(item => {
	// eslint-disable-next-line no-useless-escape
	if (!/^[A-Za-z0-9_\/-]+$/.test(item)) {
		item = '\'' + item.replace(/'/g, '\'\\\'\'') + '\'';
		item = item.replace(/^(?:'')+/g, '') // unduplicate single-quote at the beginning
			.replace(/\\'''/g, '\\\''); // remove non-escaped single-quote if there are enclosed between 2 escaped
	}
	return item;
});
const prefixFilter = (item: string, prefix: string[]): boolean => !prefix.length || !prefix.every(prefix => !Utils.getPrefixRegExp(prefix).test(item));
const suffixFilter = (item: string, suffix: string[]): boolean => !suffix.length || !suffix.every(suffix => !Utils.getSuffixRegExp(suffix).test(item));
const toAbsolute   = (item: string, workspace: string): string => workspace + item;

export const getGitDiff = async(): Promise<string[]> => {
	const prefix    = getPrefix();
	const suffix    = getSuffix();
	const workspace = getWorkspace();
	return Utils.split((await (new Command(new Logger())).execAsync({
		command: `git diff "${Utils.replaceAll(getFrom(), /[^\\]"/g, '\\"')}"${getDot()}"${Utils.replaceAll(getTo(), /[^\\]"/g, '\\"')}"`,
		args: [
			'--diff-filter=' + getFilter(),
			'--name-only',
		],
	})).stdout)
		.filter(item => prefixFilter(item, prefix) && suffixFilter(item, suffix))
		.map(item => toAbsolute(item, workspace));
};

export const getGitDiffOutput = (diffs: string[]): string => escape(diffs).join(getSeparator());
