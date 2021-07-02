import path from 'path';
import {getInput} from '@actions/core' ;
import {Context} from '@actions/github/lib/context';
import multimatch, {Options} from 'multimatch';
import {Command, Utils, GitHelper} from '@technote-space/github-action-helper';
import {Logger} from '@technote-space/github-action-log-helper';
import {escape, getDiffInfo} from './misc';
import {FileDiffResult, FileResult, DiffResult, DiffInfo} from '../types';
import {REMOTE_NAME} from '../constant';

const command                    = new Command(new Logger());
const getRawInput                = (name: string): string => process.env[`INPUT_${name.replace(/ /g, '_').toUpperCase()}`] || '';
const getDot                     = (): string => getInput('DOT', {required: true});
const getFilter                  = (): string => getInput('DIFF_FILTER', {required: true});
const getRelativePath            = (): string => getInput('RELATIVE');
const getOutputFormatType        = (): string => getRawInput('FORMAT');
const escapeWhenJsonFormat       = (): boolean => Utils.getBoolValue(getRawInput('ESCAPE_JSON'));
const getSeparator               = (): string => getRawInput('SEPARATOR');
const getPatterns                = (): string[] => Utils.getArrayInput('PATTERNS', undefined, '');
const getFiles                   = (): string[] => Utils.getArrayInput('FILES', undefined, '');
const getWorkspace               = (): string => Utils.getBoolValue(getInput('ABSOLUTE')) ? (Utils.getWorkspace() + '/') : '';
const getSummaryIncludeFilesFlag = (): boolean => Utils.getBoolValue(getInput('SUMMARY_INCLUDE_FILES'));
const isFilterIgnored            = (item: string, files: string[]): boolean => !!(files.length && files.includes(path.basename(item)));
const isMatched                  = (item: string, patterns: string[], options: Options): boolean => !patterns.length || !!multimatch(item, patterns, options).length;
const toAbsolute                 = (item: string, workspace: string): string => workspace + item;
const getMatchOptions            = (): Options => ({
  nobrace: Utils.getBoolValue(getInput('MINIMATCH_OPTION_NOBRACE')),
  noglobstar: Utils.getBoolValue(getInput('MINIMATCH_OPTION_NOGLOBSTAR')),
  dot: Utils.getBoolValue(getInput('MINIMATCH_OPTION_DOT')),
  noext: Utils.getBoolValue(getInput('MINIMATCH_OPTION_NOEXT')),
  nocase: Utils.getBoolValue(getInput('MINIMATCH_OPTION_NOCASE')),
  matchBase: Utils.getBoolValue(getInput('MINIMATCH_OPTION_MATCH_BASE')),
  nonegate: Utils.getBoolValue(getInput('MINIMATCH_OPTION_NONEGATE')),
});

const getCompareRef = (ref: string): string => Utils.isRef(ref) ? Utils.getLocalRefspec(ref, REMOTE_NAME) : ref;

export const getFileDiff = async(file: FileResult, diffInfo: DiffInfo, dot: string): Promise<FileDiffResult> => {
  const stdout = (await command.execAsync({
    command: 'git diff',
    args: [
      `${getCompareRef(diffInfo.base)}${dot}${getCompareRef(diffInfo.head)}`,
      '--shortstat',
      '-w',
      '--',
      file.file,
    ],
    cwd: Utils.getWorkspace(),
  })).stdout;

  if ('' === stdout) {
    return {insertions: 0, deletions: 0, lines: 0};
  }

  const insertions = Number.parseInt((stdout.match(/ (\d+) insertions?\(/) ?? ['', '0'])[1]);
  const deletions  = Number.parseInt((stdout.match(/ (\d+) deletions?\(/) ?? ['', '0'])[1]);
  return {insertions, deletions, lines: insertions + deletions};
};

export const getGitDiff = async(logger: Logger, context: Context): Promise<Array<DiffResult>> => {
  if (!Utils.isCloned(Utils.getWorkspace())) {
    logger.warn('Please checkout before call this action.');
    return [];
  }

  const diffInfo = await getDiffInfo(Utils.getOctokit(), context);
  if (diffInfo.base === diffInfo.head) {
    return [];
  }

  const helper = new GitHelper(logger);
  helper.useOrigin(REMOTE_NAME);

  const refs = [Utils.normalizeRef(context.ref)];
  if (Utils.isRef(diffInfo.base)) {
    refs.push(diffInfo.base);
  }
  if (Utils.isRef(diffInfo.head)) {
    refs.push(diffInfo.head);
  }
  await helper.fetchOrigin(Utils.getWorkspace(), context, [
    '--no-tags',
    '--no-recurse-submodules',
    '--depth=10000',
  ], Utils.uniqueArray(refs).map(ref => Utils.getRefspec(ref, REMOTE_NAME)));

  const dot       = getDot();
  const files     = getFiles();
  const workspace = getWorkspace();
  const patterns  = getPatterns();
  const options   = getMatchOptions();
  const filter    = getFilter();
  const relative  = getRelativePath();

  return (await Utils.split((await command.execAsync({
    command: 'git diff',
    args: [
      `${getCompareRef(diffInfo.base)}${dot}${getCompareRef(diffInfo.head)}`,
      `--diff-filter=${filter}`,
      '--name-only',
      ...(relative ? [
        `--relative=${relative}`,
      ] : []),
    ],
    cwd: Utils.getWorkspace(),
    suppressError: true,
  })).stdout)
    .map(item => ({
      file: item,
      filterIgnored: isFilterIgnored(item, files),
      isMatched: isMatched(item, patterns, options),
    }))
    .filter(item => item.filterIgnored || item.isMatched)
    .map(async item => ({...item, ...await getFileDiff(item, diffInfo, dot)}))
    .reduce(async(prev, item) => {
      const acc = await prev;
      return acc.concat(await item);
    }, Promise.resolve([] as Array<DiffResult>)))
    .map(item => ({...item, file: toAbsolute(item.file, workspace)}));
};

const format                 = (items: string[]): string => getOutputFormatType() !== 'text' ? JSON.stringify(escapeWhenJsonFormat() ? escape(items) : items) : escape(items).join(getSeparator());
export const getDiffFiles    = (diffs: FileResult[], filter: boolean): string => format(diffs.filter(item => !filter || item.isMatched).map(item => item.file));
export const getMatchedFiles = (diffs: FileResult[]): string => format(diffs.filter(item => item.filterIgnored).map(item => item.file));
export const sumResults      = (diffs: DiffResult[], map: (item: DiffResult) => number): number => getSummaryIncludeFilesFlag() ?
  diffs.map(map).reduce((acc, val) => acc + val, 0) : // eslint-disable-line no-magic-numbers
  diffs.filter(item => !item.filterIgnored).map(map).reduce((acc, val) => acc + val, 0); // eslint-disable-line no-magic-numbers
