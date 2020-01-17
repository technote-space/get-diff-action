import path from 'path';
import { setFailed, setOutput } from '@actions/core';
import { context } from '@actions/github';
import { isTargetEvent } from '@technote-space/filter-github-action';
import { Logger, ContextHelper } from '@technote-space/github-action-helper';
import { getGitDiff, getGitDiffOutput } from './utils/command';
import { TARGET_EVENTS } from './constant';

/**
 * run
 */
async function run(): Promise<void> {
	const logger = new Logger();
	ContextHelper.showActionInfo(path.resolve(__dirname, '..'), logger, context);

	if (!isTargetEvent(TARGET_EVENTS, context)) {
		logger.info('This is not target event.');
		setOutput('diff', '');
		return;
	}

	const diff = await getGitDiff();
	logger.startProcess('Dump output');
	console.log(diff);
	logger.endProcess();

	setOutput('diff', getGitDiffOutput(diff));
}

run().catch(error => setFailed(error.message));
