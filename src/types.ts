export type FileDiffResult = { readonly insertions: number; readonly deletions: number; readonly lines: number };
export type FileResult = { readonly file: string; readonly filterIgnored: boolean; readonly prefixMatched: boolean; readonly suffixMatched: boolean };
export type DiffResult = FileDiffResult & FileResult;
export type PullRequestParams = {
	readonly base: {
		readonly ref: string;
	};
}
export type DiffInfo = {
	readonly base: string;
	readonly head: string;
}
