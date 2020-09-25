import {exportVariable, getInput, setOutput} from '@actions/core' ;
import {Context} from '@actions/github/lib/context';
import {Logger} from '@technote-space/github-action-log-helper';
import {getGitDiff, getDiffFiles, getMatchedFiles, sumResults} from './utils/command';
import {DiffResult} from './types';

export const dumpDiffs = (diffs: DiffResult[], logger: Logger): void => {
  logger.startProcess('Dump diffs');
  console.log(diffs);
  logger.endProcess();
};

export const setResult = (diffs: DiffResult[], skipped: boolean, logger: Logger): void => {
  const insertions = sumResults(diffs, item => item.insertions);
  const deletions  = sumResults(diffs, item => item.deletions);
  const getValue   = (setting: { name: string, value: () => number | string }): string => skipped ? getInput(`${setting.name.toUpperCase()}_DEFAULT`) : `${setting.value()}`;
  const settings   = [
    {name: 'diff', value: () => getDiffFiles(diffs, false), envNameSuffix: ''},
    {name: 'filtered_diff', value: () => getDiffFiles(diffs, true)},
    {name: 'matched_files', value: () => getMatchedFiles(diffs)},
    {name: 'count', value: () => diffs.length},
    {name: 'insertions', value: () => insertions},
    {name: 'deletions', value: () => deletions},
    {name: 'lines', value: () => insertions + deletions},
  ];

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
