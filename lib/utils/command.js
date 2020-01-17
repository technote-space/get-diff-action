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
Object.defineProperty(exports, "__esModule", { value: true });
const github_action_helper_1 = require("@technote-space/github-action-helper");
const core_1 = require("@actions/core");
const getRawInput = (name) => process.env[`INPUT_${name.replace(/ /g, '_').toUpperCase()}`] || '';
const getFrom = () => core_1.getInput('FROM', { required: true });
const getTo = () => core_1.getInput('TO', { required: true });
const getDot = () => core_1.getInput('DOT', { required: true });
const getFilter = () => core_1.getInput('DIFF_FILTER', { required: true });
const getSeparator = () => getRawInput('SEPARATOR');
const getPrefix = () => github_action_helper_1.Utils.getArrayInput('PREFIX_FILTER', undefined, '');
const getSuffix = () => github_action_helper_1.Utils.getArrayInput('SUFFIX_FILTER', undefined, '');
const getWorkspace = () => github_action_helper_1.Utils.getBoolValue(core_1.getInput('ABSOLUTE')) ? (github_action_helper_1.Utils.getWorkspace() + '/') : '';
const escape = (items) => items.map(item => {
    // eslint-disable-next-line no-useless-escape
    if (!/^[A-Za-z0-9_\/-]+$/.test(item)) {
        item = '\'' + item.replace(/'/g, '\'\\\'\'') + '\'';
        item = item.replace(/^(?:'')+/g, '') // unduplicate single-quote at the beginning
            .replace(/\\'''/g, '\\\''); // remove non-escaped single-quote if there are enclosed between 2 escaped
    }
    return item;
});
const prefixFilter = (item, prefix) => !prefix.length || !prefix.every(prefix => !github_action_helper_1.Utils.getPrefixRegExp(prefix).test(item));
const suffixFilter = (item, suffix) => !suffix.length || !suffix.every(suffix => !github_action_helper_1.Utils.getSuffixRegExp(suffix).test(item));
const toAbsolute = (item, workspace) => workspace + item;
exports.getGitDiff = () => __awaiter(void 0, void 0, void 0, function* () {
    const prefix = getPrefix();
    const suffix = getSuffix();
    const workspace = getWorkspace();
    const command = new github_action_helper_1.Command(new github_action_helper_1.Logger());
    yield command.execAsync({
        command: 'git fetch',
        args: ['--no-tags', 'origin', '+refs/pull/*/merge:refs/remotes/pull/*/merge'],
        stderrToStdout: true,
        cwd: github_action_helper_1.Utils.getWorkspace(),
    });
    yield command.execAsync({
        command: 'git fetch',
        args: ['--no-tags', 'origin', `+refs/heads/${process.env.GITHUB_BASE_REF}:refs/remotes/origin/${process.env.GITHUB_BASE_REF}`],
        stderrToStdout: true,
        cwd: github_action_helper_1.Utils.getWorkspace(),
    });
    return github_action_helper_1.Utils.split((yield command.execAsync({
        command: `git diff "${github_action_helper_1.Utils.replaceAll(getFrom(), /[^\\]"/g, '\\"')}"${getDot()}"${github_action_helper_1.Utils.replaceAll(getTo(), /[^\\]"/g, '\\"')}"`,
        args: [
            '--diff-filter=' + getFilter(),
            '--name-only',
        ],
        cwd: github_action_helper_1.Utils.getWorkspace(),
    })).stdout)
        .filter(item => prefixFilter(item, prefix) && suffixFilter(item, suffix))
        .map(item => toAbsolute(item, workspace));
});
exports.getGitDiffOutput = (diffs) => escape(diffs).join(getSeparator());
