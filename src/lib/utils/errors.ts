/**
 * Error handling utility for user-friendly error messages and recovery actions.
 * Maps technical errors to actionable user feedback with ARIA live region support.
 */

export type ErrorSeverity = 'error' | 'warning' | 'info';

export interface ErrorAction {
	label: string;
	handler: () => void | Promise<void>;
	variant?: 'primary' | 'secondary';
}

export interface UserFriendlyError {
	title: string;
	message: string;
	severity: ErrorSeverity;
	actions: ErrorAction[];
	icon?: string;
	technicalDetails?: string;
	retryCountdown?: number;
}

export interface ErrorContext {
	operation?: string;
	modelId?: string;
	url?: string;
	[key: string]: any;
}

/**
 * Parse HTTP error response and return user-friendly error details
 */
export function parseHttpError(error: any, context: ErrorContext = {}): UserFriendlyError {
	const status = error?.status || error?.response?.status;
	const statusText = error?.statusText || error?.response?.statusText || '';
	const errorData = error?.data || error?.response?.data || error;

	// Extract error message from various formats
	const technicalMessage =
		errorData?.detail ||
		errorData?.message ||
		errorData?.error ||
		error?.message ||
		statusText ||
		'Unknown error';

	// Map status codes to user-friendly messages
	switch (status) {
		case 429:
			return {
				title: 'Slow down!',
				message: "You're making requests too quickly. Please wait 30 seconds before trying again.",
				severity: 'warning',
				icon: '⏱️',
				retryCountdown: 30,
				actions: [],
				technicalDetails: technicalMessage
			};

		case 401:
		case 403:
			return {
				title: 'Session expired',
				message: 'Your session has expired. Please log in again to continue.',
				severity: 'warning',
				icon: '🔒',
				actions: [
					{
						label: 'Log in',
						handler: () => {
							window.location.href = '/auth';
						},
						variant: 'primary'
					}
				],
				technicalDetails: technicalMessage
			};

		case 404:
			if (context.modelId) {
				return {
					title: 'Model not found',
					message: `The model "${context.modelId}" is not available. Try selecting a different model.`,
					severity: 'error',
					icon: '🤖',
					actions: [],
					technicalDetails: technicalMessage
				};
			}
			return {
				title: 'Not found',
				message: 'The requested resource could not be found.',
				severity: 'error',
				icon: '🔍',
				actions: [],
				technicalDetails: technicalMessage
			};

		case 413:
			return {
				title: 'Message too large',
				message:
					'Your message or attachments are too large. Try reducing the size or splitting into multiple messages.',
				severity: 'warning',
				icon: '📦',
				actions: [],
				technicalDetails: technicalMessage
			};

		case 500:
		case 502:
		case 503:
		case 504:
			return {
				title: 'Server error',
				message: "Something went wrong on our end. We've been notified and are working on it.",
				severity: 'error',
				icon: '⚠️',
				actions: [],
				technicalDetails: technicalMessage
			};

		default:
			// Check for specific error patterns in message
			return parseErrorMessage(technicalMessage, context);
	}
}

/**
 * Parse error message for specific patterns
 */
function parseErrorMessage(message: string, context: ErrorContext): UserFriendlyError {
	const lowerMessage = message.toLowerCase();

	// Context length exceeded
	if (
		lowerMessage.includes('context') &&
		(lowerMessage.includes('length') ||
			lowerMessage.includes('limit') ||
			lowerMessage.includes('token'))
	) {
		return {
			title: 'Conversation too long',
			message:
				"This conversation has exceeded the model's context limit. Start a new chat or remove some messages.",
			severity: 'warning',
			icon: '💬',
			actions: [
				{
					label: 'New chat',
					handler: () => {
						window.location.href = '/';
					},
					variant: 'primary'
				}
			],
			technicalDetails: message
		};
	}

	// Network timeout
	if (
		lowerMessage.includes('timeout') ||
		lowerMessage.includes('network') ||
		lowerMessage.includes('fetch') ||
		lowerMessage.includes('aborted')
	) {
		return {
			title: 'Connection timeout',
			message: 'The connection timed out. Check your internet connection and try again.',
			severity: 'error',
			icon: '🌐',
			actions: [],
			technicalDetails: message
		};
	}

	// Rate limit (non-429 status)
	if (lowerMessage.includes('rate') && lowerMessage.includes('limit')) {
		return {
			title: 'Rate limited',
			message: "You've hit a usage limit. Please wait a moment before trying again.",
			severity: 'warning',
			icon: '⏱️',
			retryCountdown: 60,
			actions: [],
			technicalDetails: message
		};
	}

	// Model not available
	if (
		lowerMessage.includes('model') &&
		(lowerMessage.includes('not available') ||
			lowerMessage.includes('not found') ||
			lowerMessage.includes('unavailable'))
	) {
		return {
			title: 'Model unavailable',
			message: 'The selected model is currently unavailable. Try a different model.',
			severity: 'warning',
			icon: '🤖',
			actions: [],
			technicalDetails: message
		};
	}

	// Permission denied
	if (lowerMessage.includes('permission') || lowerMessage.includes('forbidden')) {
		return {
			title: 'Permission denied',
			message: "You don't have permission to perform this action.",
			severity: 'error',
			icon: '🔒',
			actions: [],
			technicalDetails: message
		};
	}

	// Invalid input
	if (
		lowerMessage.includes('invalid') ||
		lowerMessage.includes('validation') ||
		lowerMessage.includes('malformed')
	) {
		return {
			title: 'Invalid input',
			message: 'There was a problem with your input. Please check and try again.',
			severity: 'warning',
			icon: '✏️',
			actions: [],
			technicalDetails: message
		};
	}

	// Generic fallback
	return {
		title: 'Something went wrong',
		message: 'An unexpected error occurred. Please try again.',
		severity: 'error',
		icon: '❌',
		actions: [],
		technicalDetails: message
	};
}

/**
 * Format error for display to user
 */
export function formatError(error: any, context: ErrorContext = {}): UserFriendlyError {
	// Handle already formatted errors
	if (error?.title && error?.message) {
		return error as UserFriendlyError;
	}

	// Handle HTTP errors
	if (error?.status || error?.response?.status) {
		return parseHttpError(error, context);
	}

	// Handle Error objects
	if (error instanceof Error) {
		return parseErrorMessage(error.message, context);
	}

	// Handle string errors
	if (typeof error === 'string') {
		return parseErrorMessage(error, context);
	}

	// Handle unknown error types
	return {
		title: 'Unexpected error',
		message: 'An unexpected error occurred. Please try again.',
		severity: 'error',
		icon: '❌',
		actions: [],
		technicalDetails: JSON.stringify(error)
	};
}

/**
 * Create a retry action with countdown timer
 */
export function createRetryAction(
	retryFn: () => void | Promise<void>,
	label: string = 'Retry'
): ErrorAction {
	return {
		label,
		handler: retryFn,
		variant: 'primary'
	};
}

/**
 * Announce error to screen readers via ARIA live region
 */
export function announceError(
	error: UserFriendlyError,
	politeness: 'polite' | 'assertive' = 'assertive'
) {
	const liveRegion = document.getElementById('error-announcer');
	if (!liveRegion) {
		// Create live region if it doesn't exist
		const region = document.createElement('div');
		region.id = 'error-announcer';
		region.className = 'sr-only';
		region.setAttribute('role', 'status');
		region.setAttribute('aria-live', politeness);
		region.setAttribute('aria-atomic', 'true');
		document.body.appendChild(region);

		// Set content after a brief delay to ensure screen reader picks it up
		setTimeout(() => {
			region.textContent = `${error.title}: ${error.message}`;
		}, 100);
	} else {
		liveRegion.setAttribute('aria-live', politeness);
		liveRegion.textContent = `${error.title}: ${error.message}`;
	}
}

/**
 * Clear ARIA live region
 */
export function clearErrorAnnouncement() {
	const liveRegion = document.getElementById('error-announcer');
	if (liveRegion) {
		liveRegion.textContent = '';
	}
}
