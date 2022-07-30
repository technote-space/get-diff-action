import type { DiffResult } from './types';
import type { Context } from '@actions/github/lib/context';
import type { Logger } from '@technote-space/github-action-log-helper';
export declare const dumpDiffs: (diffs: DiffResult[], logger: Logger) => void;
export declare const setResult: (diffs: DiffResult[], skipped: boolean, logger: Logger) => void;
export declare const execute: (logger: Logger, context: Context, skipped?: boolean) => Promise<void>;
