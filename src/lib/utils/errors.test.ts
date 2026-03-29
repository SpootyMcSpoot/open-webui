import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
	parseHttpError,
	formatError,
	createRetryAction,
	announceError,
	clearErrorAnnouncement,
	type UserFriendlyError
} from './errors';

describe('parseHttpError', () => {
	it('should handle 429 rate limit errors', () => {
		const error = { status: 429, statusText: 'Too Many Requests' };
		const result = parseHttpError(error);

		expect(result.title).toBe('Slow down!');
		expect(result.message).toContain('wait 30 seconds');
		expect(result.severity).toBe('warning');
		expect(result.retryCountdown).toBe(30);
	});

	it('should handle 401 unauthorized errors', () => {
		const error = { status: 401, statusText: 'Unauthorized' };
		const result = parseHttpError(error);

		expect(result.title).toBe('Session expired');
		expect(result.message).toContain('log in again');
		expect(result.severity).toBe('warning');
		expect(result.actions).toHaveLength(1);
		expect(result.actions[0].label).toBe('Log in');
	});

	it('should handle 403 forbidden errors', () => {
		const error = { status: 403, statusText: 'Forbidden' };
		const result = parseHttpError(error);

		expect(result.title).toBe('Session expired');
		expect(result.severity).toBe('warning');
	});

	it('should handle 404 model not found with context', () => {
		const error = { status: 404, statusText: 'Not Found' };
		const context = { modelId: 'gpt-4' };
		const result = parseHttpError(error, context);

		expect(result.title).toBe('Model not found');
		expect(result.message).toContain('gpt-4');
		expect(result.severity).toBe('error');
	});

	it('should handle 404 generic not found', () => {
		const error = { status: 404, statusText: 'Not Found' };
		const result = parseHttpError(error);

		expect(result.title).toBe('Not found');
		expect(result.severity).toBe('error');
	});

	it('should handle 413 payload too large', () => {
		const error = { status: 413, statusText: 'Payload Too Large' };
		const result = parseHttpError(error);

		expect(result.title).toBe('Message too large');
		expect(result.message).toContain('too large');
		expect(result.severity).toBe('warning');
	});

	it('should handle 500 server errors', () => {
		const error = { status: 500, statusText: 'Internal Server Error' };
		const result = parseHttpError(error);

		expect(result.title).toBe('Server error');
		expect(result.message).toContain("we've been notified");
		expect(result.severity).toBe('error');
	});

	it('should handle 502 bad gateway', () => {
		const error = { status: 502, statusText: 'Bad Gateway' };
		const result = parseHttpError(error);

		expect(result.title).toBe('Server error');
		expect(result.severity).toBe('error');
	});

	it('should handle 503 service unavailable', () => {
		const error = { status: 503, statusText: 'Service Unavailable' };
		const result = parseHttpError(error);

		expect(result.title).toBe('Server error');
		expect(result.severity).toBe('error');
	});

	it('should handle 504 gateway timeout', () => {
		const error = { status: 504, statusText: 'Gateway Timeout' };
		const result = parseHttpError(error);

		expect(result.title).toBe('Server error');
		expect(result.severity).toBe('error');
	});

	it('should extract error details from various response formats', () => {
		const error1 = { status: 400, data: { detail: 'Custom error detail' } };
		const result1 = parseHttpError(error1);
		expect(result1.technicalDetails).toBe('Custom error detail');

		const error2 = { status: 400, data: { message: 'Custom error message' } };
		const result2 = parseHttpError(error2);
		expect(result2.technicalDetails).toBe('Custom error message');

		const error3 = { status: 400, response: { data: { error: 'API error' } } };
		const result3 = parseHttpError(error3);
		expect(result3.technicalDetails).toBe('API error');
	});
});

describe('formatError - message patterns', () => {
	it('should detect context length errors', () => {
		const error = 'Context length exceeded: token limit reached';
		const result = formatError(error);

		expect(result.title).toBe('Conversation too long');
		expect(result.message).toContain('context limit');
		expect(result.actions).toHaveLength(1);
		expect(result.actions[0].label).toBe('New chat');
	});

	it('should detect network timeout errors', () => {
		const error = 'Network timeout after 30 seconds';
		const result = formatError(error);

		expect(result.title).toBe('Connection timeout');
		expect(result.message).toContain('timed out');
		expect(result.severity).toBe('error');
	});

	it('should detect fetch errors', () => {
		const error = 'Failed to fetch resource';
		const result = formatError(error);

		expect(result.title).toBe('Connection timeout');
		expect(result.message).toContain('timed out');
	});

	it('should detect rate limit in message', () => {
		const error = 'Rate limit exceeded, try again later';
		const result = formatError(error);

		expect(result.title).toBe('Rate limited');
		expect(result.retryCountdown).toBe(60);
	});

	it('should detect model unavailable errors', () => {
		const error = 'Model not available at this time';
		const result = formatError(error);

		expect(result.title).toBe('Model unavailable');
		expect(result.message).toContain('different model');
	});

	it('should detect permission errors', () => {
		const error = 'Permission denied for this action';
		const result = formatError(error);

		expect(result.title).toBe('Permission denied');
		expect(result.severity).toBe('error');
	});

	it('should detect invalid input errors', () => {
		const error = 'Invalid input format';
		const result = formatError(error);

		expect(result.title).toBe('Invalid input');
		expect(result.message).toContain('check and try again');
	});

	it('should handle generic string errors', () => {
		const error = 'Something unexpected happened';
		const result = formatError(error);

		expect(result.title).toBe('Something went wrong');
		expect(result.severity).toBe('error');
	});
});

describe('formatError - input types', () => {
	it('should handle Error objects', () => {
		const error = new Error('Test error message');
		const result = formatError(error);

		expect(result.technicalDetails).toBe('Test error message');
		expect(result.title).toBe('Something went wrong');
	});

	it('should handle already formatted errors', () => {
		const error: UserFriendlyError = {
			title: 'Custom Error',
			message: 'Custom message',
			severity: 'warning',
			actions: []
		};
		const result = formatError(error);

		expect(result).toBe(error);
		expect(result.title).toBe('Custom Error');
	});

	it('should handle HTTP error responses', () => {
		const error = { status: 500, message: 'Server error' };
		const result = formatError(error);

		expect(result.title).toBe('Server error');
		expect(result.severity).toBe('error');
	});

	it('should handle unknown error types', () => {
		const error = { unknownField: 'value' };
		const result = formatError(error);

		expect(result.title).toBe('Unexpected error');
		expect(result.technicalDetails).toContain('unknownField');
	});
});

describe('createRetryAction', () => {
	it('should create a retry action with default label', () => {
		const mockFn = () => {};
		const action = createRetryAction(mockFn);

		expect(action.label).toBe('Retry');
		expect(action.variant).toBe('primary');
		expect(action.handler).toBe(mockFn);
	});

	it('should create a retry action with custom label', () => {
		const mockFn = () => {};
		const action = createRetryAction(mockFn, 'Try Again');

		expect(action.label).toBe('Try Again');
		expect(action.variant).toBe('primary');
	});
});

describe('ARIA announcements', () => {
	beforeEach(() => {
		// Clean up any existing error announcer
		const existing = document.getElementById('error-announcer');
		if (existing) {
			existing.remove();
		}
	});

	afterEach(() => {
		clearErrorAnnouncement();
	});

	it('should create ARIA live region and announce error', () => {
		const error: UserFriendlyError = {
			title: 'Test Error',
			message: 'This is a test error message',
			severity: 'error',
			actions: []
		};

		announceError(error);

		const liveRegion = document.getElementById('error-announcer');
		expect(liveRegion).toBeTruthy();
		expect(liveRegion?.getAttribute('role')).toBe('status');
		expect(liveRegion?.getAttribute('aria-live')).toBe('assertive');
		expect(liveRegion?.getAttribute('aria-atomic')).toBe('true');
	});

	it('should use polite announcement for warnings', () => {
		const error: UserFriendlyError = {
			title: 'Warning',
			message: 'This is a warning',
			severity: 'warning',
			actions: []
		};

		announceError(error, 'polite');

		const liveRegion = document.getElementById('error-announcer');
		expect(liveRegion?.getAttribute('aria-live')).toBe('polite');
	});

	it('should clear announcement', () => {
		const error: UserFriendlyError = {
			title: 'Test',
			message: 'Message',
			severity: 'error',
			actions: []
		};

		announceError(error);
		let liveRegion = document.getElementById('error-announcer');
		expect(liveRegion?.textContent).toBeTruthy();

		clearErrorAnnouncement();
		liveRegion = document.getElementById('error-announcer');
		expect(liveRegion?.textContent).toBe('');
	});

	it('should reuse existing live region', () => {
		const error1: UserFriendlyError = {
			title: 'Error 1',
			message: 'First error',
			severity: 'error',
			actions: []
		};
		const error2: UserFriendlyError = {
			title: 'Error 2',
			message: 'Second error',
			severity: 'warning',
			actions: []
		};

		announceError(error1);
		const firstRegion = document.getElementById('error-announcer');

		announceError(error2);
		const secondRegion = document.getElementById('error-announcer');

		expect(firstRegion).toBe(secondRegion);
		expect(secondRegion?.textContent).toContain('Error 2');
	});
});

describe('error context', () => {
	it('should use context in error messages', () => {
		const error = { status: 404 };
		const context = { modelId: 'llama-3', operation: 'load model' };
		const result = formatError(error, context);

		expect(result.message).toContain('llama-3');
	});

	it('should handle missing context gracefully', () => {
		const error = { status: 404 };
		const result = formatError(error);

		expect(result.title).toBe('Not found');
		expect(result.message).not.toContain('undefined');
	});
});
