export declare type FileDiffResult = Readonly<{
    insertions: number;
    deletions: number;
    lines: number;
}>;
export declare type FileResult = Readonly<{
    file: string;
    filterIgnored: boolean;
    isMatched: boolean;
}>;
export declare type DiffResult = FileResult | (FileDiffResult & FileResult);
export declare type PullRequestParams = Readonly<{
    base: {
        ref: string;
        sha: string;
    };
    head: {
        ref: string;
    };
}>;
export declare type DiffInfo = Readonly<{
    base: string;
    head: string;
}>;
