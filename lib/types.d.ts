export type FileDiffResult = Readonly<{
    insertions: number;
    deletions: number;
    lines: number;
}>;
export type FileResult = Readonly<{
    file: string;
    filterIgnored: boolean;
    isMatched: boolean;
}>;
export type DiffResult = FileResult | (FileDiffResult & FileResult);
export type PullRequestParams = Readonly<{
    base: {
        ref: string;
        sha: string;
    };
    head: {
        ref: string;
    };
}>;
export type DiffInfo = Readonly<{
    base: string;
    head: string;
}>;
