import type { FileDiffResult, FileResult, DiffResult, DiffInfo } from '../types';
import type { Context } from '@actions/github/lib/context';
import { Logger } from '@technote-space/github-action-log-helper';
export declare const getFileDiffFlag: () => boolean;
export declare const getFileDiff: (file: FileResult, diffInfo: DiffInfo, dot: string, skip?: boolean) => Promise<FileDiffResult | undefined>;
export declare const getGitDiff: (logger: Logger, context: Context) => Promise<Array<DiffResult>>;
export declare const getDiffFiles: (diffs: FileResult[], filter: boolean) => string;
export declare const getMatchedFiles: (diffs: FileResult[]) => string;
export declare const sumResults: (diffs: DiffResult[], map: (item: DiffResult) => number) => number;
