export type FileDiffResult = { readonly insertions: number; readonly deletions: number; readonly lines: number };
export type FileResult = { readonly file: string };
export type DiffResult = FileDiffResult & FileResult;
