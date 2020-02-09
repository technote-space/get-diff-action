import { Context } from '@actions/github/lib/context';
import { Octokit } from '@octokit/rest';
import { Utils, ApiHelper } from '@technote-space/github-action-helper';
import { PullRequestParams, DiffInfo } from '../types';

export const escape = (items: string[]): string[] => items.map(item => {
	// eslint-disable-next-line no-useless-escape
	if (!/^[A-Za-z0-9_\/-]+$/.test(item)) {
		item = '\'' + item.replace(/'/g, '\'\\\'\'') + '\'';
		item = item.replace(/^(?:'')+/g, '') // unduplicate single-quote at the beginning
			.replace(/\\'''/g, '\\\''); // remove non-escaped single-quote if there are enclosed between 2 escaped
	}
	return item;
});

export const getRelatedPullRequest = async(octokit: Octokit, context: Context): Promise<Octokit.PullsListResponseItem | null> => await (new ApiHelper(octokit, context)).findPullRequest(context.ref);

export const getDiffInfoForPR = (pull: PullRequestParams, context: Context): DiffInfo => ({
	from: pull.base.ref,
	to: Utils.getRefForUpdate(context.ref),
});

export const isDefaultBranch = async(octokit: Octokit, context: Context): Promise<boolean> => await (new ApiHelper(octokit, context)).getDefaultBranch() === Utils.getBranch(context);

export const getDiffInfoForPush = async(octokit: Octokit, context: Context): Promise<DiffInfo> => {
	if (!await isDefaultBranch(octokit, context)) {
		const pull = await getRelatedPullRequest(octokit, context);
		if (pull) {
			return {
				from: pull.base.ref,
				to: `pull/${pull.number}/merge`,
			};
		}
	}

	return {
		from: context.payload.before,
		to: context.payload.after,
		fromIsSha: true,
		toIsSha: true,
	};
};

export const getDiffInfo = async(octokit: Octokit, context: Context): Promise<DiffInfo> => context.payload.pull_request ? getDiffInfoForPR({base: context.payload.pull_request.base}, context) : await getDiffInfoForPush(octokit, context);
