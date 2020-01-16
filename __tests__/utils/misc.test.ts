import { isTargetEvent } from '@technote-space/filter-github-action';
import { getContext } from '@technote-space/github-action-test-helper';
import { TARGET_EVENTS } from '../../src/constant';

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
