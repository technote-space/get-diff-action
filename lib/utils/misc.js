"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@actions/core");
const command_1 = require("./command");
exports.dumpOutput = (diff, logger) => {
    logger.startProcess('Dump output');
    console.log(diff);
    logger.endProcess();
};
exports.setResult = (diff) => {
    const result = command_1.getGitDiffOutput(diff);
    core_1.setOutput('diff', result);
    const envName = core_1.getInput('SET_ENV_NAME');
    if (envName) {
        core_1.exportVariable(envName, result);
    }
};
