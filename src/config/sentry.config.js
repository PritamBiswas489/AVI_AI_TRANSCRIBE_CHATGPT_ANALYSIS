import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
/**
 * Initializes Sentry for error tracking and performance monitoring.
 * 
 * @param {string} dsn - The Data Source Name for Sentry.
 */

export function initializeSentry(dsn) {
	Sentry.init({
		dsn,
		integrations: [
			// Add our Profiling integration
			nodeProfilingIntegration(),
		],
		// Add Tracing by setting tracesSampleRate
		// We recommend adjusting this value in production
		tracesSampleRate: 1.0,
		// Set sampling rate for profiling
		// This is relative to tracesSampleRate
		profilesSampleRate: 1.0,
	});
}
