"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sumResults = exports.getMatchedFiles = exports.getDiffFiles = exports.getGitDiff = exports.getFileDiff = void 0;
const path_1 = __importDefault(require("path"));
const core_1 = require("@actions/core");
const github_action_helper_1 = require("@technote-space/github-action-helper");
const misc_1 = require("./misc");
const constant_1 = require("../constant");
const command = new github_action_helper_1.Command(new github_action_helper_1.Logger());
const getRawInput = (name) => process.env[`INPUT_${name.replace(/ /g, '_').toUpperCase()}`] || '';
const getDot = () => core_1.getInput('DOT', { required: true });
const getFilter = () => core_1.getInput('DIFF_FILTER', { required: true });
const getSeparator = () => getRawInput('SEPARATOR');
const getPrefix = () => github_action_helper_1.Utils.getArrayInput('PREFIX_FILTER', undefined, '');
const getSuffix = () => github_action_helper_1.Utils.getArrayInput('SUFFIX_FILTER', undefined, '');
const getPrefixRegExpFlags = () => core_1.getInput('PREFIX_FILTER_FLAGS') || '';
const getSuffixRegExpFlags = () => core_1.getInput('SUFFIX_FILTER_FLAGS') || '';
const getFiles = () => github_action_helper_1.Utils.getArrayInput('FILES', undefined, '');
const getWorkspace = () => github_action_helper_1.Utils.getBoolValue(core_1.getInput('ABSOLUTE')) ? (github_action_helper_1.Utils.getWorkspace() + '/') : '';
const getSummaryIncludeFilesFlag = () => github_action_helper_1.Utils.getBoolValue(core_1.getInput('SUMMARY_INCLUDE_FILES'));
const isFilterIgnored = (item, files) => !!(files.length && files.includes(path_1.default.basename(item)));
const isPrefixMatched = (item, prefix) => !prefix.length || !prefix.every(prefix => !github_action_helper_1.Utils.getPrefixRegExp(prefix, getPrefixRegExpFlags()).test(item));
const isSuffixMatched = (item, suffix) => !suffix.length || !suffix.every(suffix => !github_action_helper_1.Utils.getSuffixRegExp(suffix, getSuffixRegExpFlags()).test(item));
const toAbsolute = (item, workspace) => workspace + item;
const getCompareRef = (ref) => github_action_helper_1.Utils.isRef(ref) ? github_action_helper_1.Utils.getLocalRefspec(ref, constant_1.REMOTE_NAME) : ref;
exports.getFileDiff = (file, diffInfo, dot) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const stdout = (yield command.execAsync({
        command: 'git diff',
        args: [
            `${getCompareRef(diffInfo.base)}${dot}${getCompareRef(diffInfo.head)}`,
            '--shortstat',
            '-w',
            file.file,
        ],
        cwd: github_action_helper_1.Utils.getWorkspace(),
    })).stdout;
    if ('' === stdout) {
        return { insertions: 0, deletions: 0, lines: 0 };
    }
    const insertions = Number.parseInt(((_a = stdout.match(/ (\d+) insertions?\(/)) !== null && _a !== void 0 ? _a : ['', '0'])[1]);
    const deletions = Number.parseInt(((_b = stdout.match(/ (\d+) deletions?\(/)) !== null && _b !== void 0 ? _b : ['', '0'])[1]);
    return { insertions, deletions, lines: insertions + deletions };
});
exports.getGitDiff = (logger, context) => __awaiter(void 0, void 0, void 0, function* () {
    if (!github_action_helper_1.Utils.isCloned(github_action_helper_1.Utils.getWorkspace())) {
        logger.warn('Please checkout before call this action.');
        return [];
    }
    const dot = getDot();
    const files = getFiles();
    const prefix = getPrefix();
    const suffix = getSuffix();
    const workspace = getWorkspace();
    const diffInfo = yield misc_1.getDiffInfo(github_action_helper_1.Utils.getOctokit(), context);
    if (diffInfo.base === diffInfo.head) {
        return [];
    }
    const helper = new github_action_helper_1.GitHelper(logger);
    helper.useOrigin(constant_1.REMOTE_NAME);
    const refs = [github_action_helper_1.Utils.normalizeRef(context.ref)];
    if (github_action_helper_1.Utils.isRef(diffInfo.base)) {
        refs.push(diffInfo.base);
    }
    if (github_action_helper_1.Utils.isRef(diffInfo.head)) {
        refs.push(diffInfo.head);
    }
    yield helper.fetchOrigin(github_action_helper_1.Utils.getWorkspace(), context, [
        '--no-tags',
        '--no-recurse-submodules',
        '--depth=10000',
    ], github_action_helper_1.Utils.uniqueArray(refs).map(ref => github_action_helper_1.Utils.getRefspec(ref, constant_1.REMOTE_NAME)));
    return (yield github_action_helper_1.Utils.split((yield command.execAsync({
        command: 'git diff',
        args: [
            `${getCompareRef(diffInfo.base)}${dot}${getCompareRef(diffInfo.head)}`,
            '--diff-filter=' + getFilter(),
            '--name-only',
        ],
        cwd: github_action_helper_1.Utils.getWorkspace(),
        suppressError: true,
    })).stdout)
        .map(item => ({
        file: item,
        filterIgnored: isFilterIgnored(item, files),
        prefixMatched: isPrefixMatched(item, prefix),
        suffixMatched: isSuffixMatched(item, suffix),
    }))
        .filter(item => item.filterIgnored || (item.prefixMatched && item.suffixMatched))
        .map((item) => __awaiter(void 0, void 0, void 0, function* () { return (Object.assign(Object.assign({}, item), yield exports.getFileDiff(item, diffInfo, dot))); }))
        .reduce((prev, item) => __awaiter(void 0, void 0, void 0, function* () {
        const acc = yield prev;
        return acc.concat(yield item);
    }), Promise.resolve([])))
        .map(item => (Object.assign(Object.assign({}, item), { file: toAbsolute(item.file, workspace) })));
});
exports.getDiffFiles = (diffs, filter) => misc_1.escape(diffs.filter(item => !filter || item.prefixMatched && item.suffixMatched).map(item => item.file)).join(getSeparator());
exports.getMatchedFiles = (diffs) => misc_1.escape(diffs.filter(item => item.filterIgnored).map(item => item.file)).join(getSeparator());
exports.sumResults = (diffs, map) => getSummaryIncludeFilesFlag() ?
    diffs.map(map).reduce((acc, val) => acc + val, 0) : // eslint-disable-line no-magic-numbers
    diffs.filter(item => !item.filterIgnored).map(map).reduce((acc, val) => acc + val, 0); // eslint-disable-line no-magic-numbers
