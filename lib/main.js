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
const path_1 = require("path");
const core_1 = require("@actions/core");
const context_1 = require("@actions/github/lib/context");
const filter_github_action_1 = require("@technote-space/filter-github-action");
const github_action_helper_1 = require("@technote-space/github-action-helper");
const github_action_log_helper_1 = require("@technote-space/github-action-log-helper");
const process_1 = require("./process");
const constant_1 = require("./constant");
const run = () => __awaiter(void 0, void 0, void 0, function* () {
    const logger = new github_action_log_helper_1.Logger();
    const context = new context_1.Context();
    github_action_helper_1.ContextHelper.showActionInfo((0, path_1.resolve)(__dirname, '..'), logger, context);
    if (!(0, filter_github_action_1.isTargetEvent)(constant_1.TARGET_EVENTS, context)) {
        logger.info('This is not target event.');
        yield (0, process_1.execute)(logger, context, true);
        return;
    }
    yield (0, process_1.execute)(logger, context);
});
run().catch(error => {
    console.log(error);
    (0, core_1.setFailed)(error.message);
});
