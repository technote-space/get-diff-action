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
exports.escape = (items) => items.map(item => {
    // eslint-disable-next-line no-useless-escape
    if (!/^[A-Za-z0-9_\/-]+$/.test(item)) {
        item = '\'' + item.replace(/'/g, '\'\\\'\'') + '\'';
        item = item.replace(/^(?:'')+/g, '') // unduplicate single-quote at the beginning
            .replace(/\\'''/g, '\\\''); // remove non-escaped single-quote if there are enclosed between 2 escaped
    }
    return item;
});
exports.getRelatedPullRequest = (octokit, context) => __awaiter(void 0, void 0, void 0, function* () { return yield (new github_action_helper_1.ApiHelper(octokit, context)).findPullRequest(context.ref); });
exports.getDiffInfoForPR = (pull, context) => ({
    from: pull.base.ref,
    to: github_action_helper_1.Utils.getRefForUpdate(context.ref),
});
exports.isDefaultBranch = (octokit, context) => __awaiter(void 0, void 0, void 0, function* () { return (yield (new github_action_helper_1.ApiHelper(octokit, context)).getDefaultBranch()) === github_action_helper_1.Utils.getBranch(context); });
exports.getDiffInfoForPush = (octokit, context) => __awaiter(void 0, void 0, void 0, function* () {
    if (!(yield exports.isDefaultBranch(octokit, context))) {
        const pull = yield exports.getRelatedPullRequest(octokit, context);
        if (pull) {
            return {
                from: pull.base.ref,
                to: `pull/${pull.number}/merge`,
            };
        }
    }
    return {
        from: context.payload.before,
        to: context.payload.after,
        fromIsSha: true,
        toIsSha: true,
    };
});
exports.getDiffInfo = (octokit, context) => __awaiter(void 0, void 0, void 0, function* () { return context.payload.pull_request ? exports.getDiffInfoForPR({ base: context.payload.pull_request.base }, context) : yield exports.getDiffInfoForPush(octokit, context); });
