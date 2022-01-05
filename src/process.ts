import type {DiffResult} from './types';
import type {Context} from '@actions/github/lib/context';
import type {Logger} from '@technote-space/github-action-log-helper';
import {exportVariable, getInput, setOutput} from '@actions/core' ;
import {getGitDiff, getDiffFiles, getMatchedFiles, sumResults, getFileDiffFlag} from './utils/command';

export const dumpDiffs = (diffs: DiffResult[], logger: Logger): void => {
  logger.startProcess('Dump diffs');
  console.log(diffs);
  logger.endProcess();
};

export const setResult = (diffs: DiffResult[], skipped: boolean, logger: Logger): void => {
  // eslint-disable-next-line no-magic-numbers
  const insertions = sumResults(diffs, item => 'insertions' in item ? item.insertions : 0);
  // eslint-disable-next-line no-magic-numbers
  const deletions  = sumResults(diffs, item => 'deletions' in item ? item.deletions : 0);
  const getValue   = (setting: {name: string, value: () => number | string}): string => skipped ? getInput(`${setting.name.toUpperCase()}_DEFAULT`) : `${setting.value()}`;
  const settings   = [
    {name: 'diff', value: () => getDiffFiles(diffs, false), envNameSuffix: ''},
    {name: 'filtered_diff', value: () => getDiffFiles(diffs, true)},
    {name: 'matched_files', value: () => getMatchedFiles(diffs)},
    {name: 'count', value: () => diffs.length},
  ];
  if (getFileDiffFlag()) {
    settings.push(...[
      {name: 'insertions', value: () => insertions},
      {name: 'deletions', value: () => deletions},
      {name: 'lines', value: () => insertions + deletions},
    ]);
  }

  logger.startProcess('Dump output');
  settings.forEach(setting => {
    const result = String(getValue(setting));
    setOutput(setting.name, result);
    const envName = getInput('SET_ENV_NAME' + (setting.envNameSuffix ?? `_${setting.name.toUpperCase()}`));
    if (envName) {
      exportVariable(envName, result);
    }
    console.log(`${setting.name}: ${result}`);
  });
  logger.endProcess();
};

export const execute = async(logger: Logger, context: Context, skipped = false): Promise<void> => {
  const _diff = skipped ? [] : await getGitDiff(logger, context);
  dumpDiffs(_diff, logger);
  setResult(_diff, skipped, logger);
};
