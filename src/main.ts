import path from 'path';
import { setFailed } from '@actions/core';
import { Context } from '@actions/github/lib/context';
import { isTargetEvent } from '@technote-space/filter-github-action';
import { Logger, ContextHelper } from '@technote-space/github-action-helper';
import { execute } from './process';
import { TARGET_EVENTS } from './constant';

/**
 * run
 */
async function run(): Promise<void> {
	const logger  = new Logger();
	const context = new Context();
	ContextHelper.showActionInfo(path.resolve(__dirname, '..'), logger, context);

	if (!isTargetEvent(TARGET_EVENTS, context)) {
		logger.info('This is not target event.');
		await execute(logger, context, []);
		return;
	}

	await execute(logger, context);
}

run().catch(error => setFailed(error.message));
