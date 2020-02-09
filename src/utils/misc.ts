import { Context } from '@actions/github/lib/context';
import { Octokit } from '@octokit/rest';
import { Utils } from '@technote-space/github-action-helper';
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

export const getDiffInfoForPR = (pull: PullRequestParams, context: Context): DiffInfo => ({
	base: Utils.normalizeRef(pull.base.ref),
	head: Utils.normalizeRef(context.ref),
});

export const getDiffInfoForPush = async(octokit: Octokit, context: Context): Promise<DiffInfo> => {
	if (/^0+$/.test(context.payload.before)) {
		// tag push
		return {
			base: '',
			head: '',
		};
	}

	return {
		base: context.payload.before,
		head: context.payload.after,
	};
};

export const getDiffInfo = async(octokit: Octokit, context: Context): Promise<DiffInfo> => context.payload.pull_request ? getDiffInfoForPR({base: context.payload.pull_request.base}, context) : await getDiffInfoForPush(octokit, context);
