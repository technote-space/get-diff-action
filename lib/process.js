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
const core_1 = require("@actions/core");
const command_1 = require("./utils/command");
const command_2 = require("./utils/command");
exports.dumpOutput = (diff, logger) => {
    logger.startProcess('Dump output');
    console.log(diff);
};
exports.setResult = (diff) => {
    const result = command_2.getDiffFiles(diff);
    const insertions = command_2.sumResults(diff, item => item.insertions);
    const deletions = command_2.sumResults(diff, item => item.deletions);
    [
        { name: 'diff', value: result, envNameSuffix: '' },
        { name: 'count', value: diff.length },
        { name: 'insertions', value: insertions },
        { name: 'deletions', value: deletions },
        { name: 'lines', value: insertions + deletions },
    ].forEach(setting => {
        var _a;
        const result = String(setting.value);
        core_1.setOutput(setting.name, result);
        const envName = core_1.getInput('SET_ENV_NAME' + (_a = setting.envNameSuffix, (_a !== null && _a !== void 0 ? _a : `_${setting.name.toUpperCase()}`)));
        if (envName) {
            core_1.exportVariable(envName, result);
        }
        console.log(`${setting.name}: ${result}`);
    });
};
exports.execute = (logger, diff) => __awaiter(void 0, void 0, void 0, function* () {
    const _diff = (diff !== null && diff !== void 0 ? diff : yield command_1.getGitDiff());
    exports.dumpOutput(_diff, logger);
    exports.setResult(_diff);
    logger.endProcess();
});
