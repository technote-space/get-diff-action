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
exports.execute = exports.setResult = exports.dumpDiffs = void 0;
const core_1 = require("@actions/core");
const command_1 = require("./utils/command");
const dumpDiffs = (diffs, logger) => {
    logger.startProcess('Dump diffs');
    console.log(diffs);
    logger.endProcess();
};
exports.dumpDiffs = dumpDiffs;
const setResult = (diffs, skipped, logger) => {
    const insertions = (0, command_1.sumResults)(diffs, item => item.insertions);
    const deletions = (0, command_1.sumResults)(diffs, item => item.deletions);
    const getValue = (setting) => skipped ? (0, core_1.getInput)(`${setting.name.toUpperCase()}_DEFAULT`) : `${setting.value()}`;
    const settings = [
        { name: 'diff', value: () => (0, command_1.getDiffFiles)(diffs, false), envNameSuffix: '' },
        { name: 'filtered_diff', value: () => (0, command_1.getDiffFiles)(diffs, true) },
        { name: 'matched_files', value: () => (0, command_1.getMatchedFiles)(diffs) },
        { name: 'count', value: () => diffs.length },
        { name: 'insertions', value: () => insertions },
        { name: 'deletions', value: () => deletions },
        { name: 'lines', value: () => insertions + deletions },
    ];
    logger.startProcess('Dump output');
    settings.forEach(setting => {
        var _a;
        const result = String(getValue(setting));
        (0, core_1.setOutput)(setting.name, result);
        const envName = (0, core_1.getInput)('SET_ENV_NAME' + ((_a = setting.envNameSuffix) !== null && _a !== void 0 ? _a : `_${setting.name.toUpperCase()}`));
        if (envName) {
            (0, core_1.exportVariable)(envName, result);
        }
        console.log(`${setting.name}: ${result}`);
    });
    logger.endProcess();
};
exports.setResult = setResult;
const execute = (logger, context, skipped = false) => __awaiter(void 0, void 0, void 0, function* () {
    const _diff = skipped ? [] : yield (0, command_1.getGitDiff)(logger, context);
    (0, exports.dumpDiffs)(_diff, logger);
    (0, exports.setResult)(_diff, skipped, logger);
});
exports.execute = execute;
