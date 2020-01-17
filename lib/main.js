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
const path_1 = __importDefault(require("path"));
const core_1 = require("@actions/core");
const github_1 = require("@actions/github");
const filter_github_action_1 = require("@technote-space/filter-github-action");
const github_action_helper_1 = require("@technote-space/github-action-helper");
const command_1 = require("./utils/command");
const constant_1 = require("./constant");
/**
 * run
 */
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        const logger = new github_action_helper_1.Logger();
        github_action_helper_1.ContextHelper.showActionInfo(path_1.default.resolve(__dirname, '..'), logger, github_1.context);
        if (!filter_github_action_1.isTargetEvent(constant_1.TARGET_EVENTS, github_1.context)) {
            logger.info('This is not target event.');
            core_1.setOutput('diff', '*');
            return;
        }
        const output = command_1.getGitDiffOutput(yield command_1.getGitDiff());
        logger.startProcess('Dump output');
        console.log(output);
        logger.endProcess();
        core_1.setOutput('diff', output);
    });
}
run().catch(error => core_1.setFailed(error.message));
