"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REMOTE_NAME = exports.TARGET_EVENTS = void 0;
exports.TARGET_EVENTS = {
    'pull_request': [
        'opened',
        'reopened',
        'synchronize',
        'closed',
    ],
    'push': '*',
};
exports.REMOTE_NAME = 'get-diff-action';
