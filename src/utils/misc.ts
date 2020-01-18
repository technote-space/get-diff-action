import { Logger } from '@technote-space/github-action-helper';
import { exportVariable, getInput, setOutput } from '@actions/core' ;
import { getGitDiffOutput } from './command';

export const dumpOutput = (diff: string[], logger: Logger): void => {
	logger.startProcess('Dump output');
	console.log(diff);
	logger.endProcess();
};

export const setResult = (diff: string[]): void => {
	const result = getGitDiffOutput(diff);
	setOutput('diff', result);

	const envName = getInput('SET_ENV_NAME');
	if (envName) {
		exportVariable(envName, result);
	}
};
