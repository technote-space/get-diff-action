import type { PullRequestParams, DiffInfo } from '../types';
import type { Context } from '@actions/github/lib/context';
import type { Octokit } from '@technote-space/github-action-helper/dist/types';
export declare const escape: (items: string[]) => string[];
export declare const getDiffInfoForPR: (pull: PullRequestParams, context: Context) => DiffInfo;
export declare const isDefaultBranch: (octokit: Octokit, context: Context) => Promise<boolean>;
export declare const getDiffInfoForPush: (octokit: Octokit, context: Context) => Promise<DiffInfo>;
export declare const getDiffInfo: (octokit: Octokit, context: Context) => Promise<DiffInfo>;
