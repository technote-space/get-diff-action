export type FileDiffResult = Readonly<{ insertions: number; deletions: number; lines: number }>;
export type FileResult = Readonly<{ file: string; filterIgnored: boolean; prefixMatched: boolean; suffixMatched: boolean }>;
export type DiffResult = FileDiffResult & FileResult;
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
