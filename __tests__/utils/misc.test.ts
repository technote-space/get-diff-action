import { isTargetEvent } from '@technote-space/filter-github-action';
import { getContext } from '@technote-space/github-action-test-helper';
import { getPayload } from '../../src/utils/misc';
import { TARGET_EVENTS } from '../../src/constant';

describe('isTargetEvent', () => {
	it('should return true', () => {
		expect(isTargetEvent(TARGET_EVENTS, getContext({
			payload: {
				action: 'opened',
			},
			eventName: 'pull_request',
		}))).toBeTruthy();
	});

	it('should return false 1', () => {
		expect(isTargetEvent(TARGET_EVENTS, getContext({
			payload: {
				action: 'opened',
			},
			eventName: 'push',
		}))).toBeFalsy();
	});

	it('should return false 2', () => {
		expect(isTargetEvent(TARGET_EVENTS, getContext({
			payload: {
				action: 'closed',
			},
			eventName: 'pull_request',
		}))).toBeFalsy();
	});
});

describe('getPayload', () => {
	it('should get payload', () => {
		expect(getPayload(getContext({
			payload: {
				'test': 123,
			},
		}))).toEqual({
			'test': 123,
		});
	});
});
