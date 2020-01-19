/* eslint-disable no-magic-numbers */
import path from 'path';
import { isTargetEvent } from '@technote-space/filter-github-action';
import { testEnv, getContext, spyOnStdout, stdoutCalledWith } from '@technote-space/github-action-test-helper';
import { Logger } from '@technote-space/github-action-helper';
import { dumpOutput, setResult } from '../../src/utils/misc';
import { TARGET_EVENTS } from '../../src/constant';

const rootDir = path.resolve(__dirname, '..', '..');

describe('isTargetEvent', () => {
	it('should return true', () => {
		expect(isTargetEvent(TARGET_EVENTS, getContext({
			payload: {
				action: 'opened',
			},
			eventName: 'pull_request',
		}))).toBe(true);
	});

	it('should return false 1', () => {
		expect(isTargetEvent(TARGET_EVENTS, getContext({
			payload: {},
			eventName: 'push',
		}))).toBe(false);
	});

	it('should return false 2', () => {
		expect(isTargetEvent(TARGET_EVENTS, getContext({
			payload: {
				action: 'closed',
			},
			eventName: 'pull_request',
		}))).toBe(false);
	});
});

describe('dumpOutput', () => {
	testEnv(rootDir);

	it('should dump output', () => {
		const mockStdout = spyOnStdout();

		dumpOutput(['test1', 'test2'], new Logger());

		stdoutCalledWith(mockStdout, [
			'::group::Dump output',
			'[\n' +
			'\t"test1",\n' +
			'\t"test2"\n' +
			']',
			'::endgroup::',
		]);
	});
});

describe('setResult', () => {
	testEnv(rootDir);

	it('should set result', () => {
		const mockStdout = spyOnStdout();

		setResult(['test1', 'test2']);

		stdoutCalledWith(mockStdout, [
			'::set-output name=diff::test1 test2',
			'::set-env name=GIT_DIFF::test1 test2',
		]);
	});

	it('should set result without env', () => {
		process.env.INPUT_SET_ENV_NAME = '';
		const mockStdout               = spyOnStdout();

		setResult(['test1', 'test2']);

		stdoutCalledWith(mockStdout, [
			'::set-output name=diff::test1 test2',
		]);
	});
});
