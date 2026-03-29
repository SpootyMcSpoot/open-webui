<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { fade } from 'svelte/transition';
	import Modal from './Modal.svelte';
	import type { UserFriendlyError, ErrorAction } from '$lib/utils/errors';
	import { announceError, clearErrorAnnouncement } from '$lib/utils/errors';

	export let show = false;
	export let error: UserFriendlyError | null = null;
	export let showTechnicalDetails = false;

	let countdown = 0;
	let countdownInterval: ReturnType<typeof setInterval> | null = null;

	// Announce error to screen readers when shown
	$: if (show && error) {
		announceError(error, error.severity === 'error' ? 'assertive' : 'polite');
	}

	// Clear announcement when hidden
	$: if (!show) {
		clearErrorAnnouncement();
	}

	// Handle retry countdown
	$: if (show && error?.retryCountdown) {
		countdown = error.retryCountdown;
		if (countdownInterval) {
			clearInterval(countdownInterval);
		}
		countdownInterval = setInterval(() => {
			countdown--;
			if (countdown <= 0 && countdownInterval) {
				clearInterval(countdownInterval);
				countdownInterval = null;
			}
		}, 1000);
	}

	onDestroy(() => {
		if (countdownInterval) {
			clearInterval(countdownInterval);
		}
	});

	const getSeverityStyles = (severity: string) => {
		switch (severity) {
			case 'error':
				return {
					bg: 'bg-red-50 dark:bg-red-950/20',
					border: 'border-red-200 dark:border-red-800',
					icon: 'text-red-600 dark:text-red-400',
					title: 'text-red-900 dark:text-red-100'
				};
			case 'warning':
				return {
					bg: 'bg-yellow-50 dark:bg-yellow-950/20',
					border: 'border-yellow-200 dark:border-yellow-800',
					icon: 'text-yellow-600 dark:text-yellow-400',
					title: 'text-yellow-900 dark:text-yellow-100'
				};
			case 'info':
				return {
					bg: 'bg-blue-50 dark:bg-blue-950/20',
					border: 'border-blue-200 dark:border-blue-800',
					icon: 'text-blue-600 dark:text-blue-400',
					title: 'text-blue-900 dark:text-blue-100'
				};
			default:
				return {
					bg: 'bg-gray-50 dark:bg-gray-850',
					border: 'border-gray-200 dark:border-gray-700',
					icon: 'text-gray-600 dark:text-gray-400',
					title: 'text-gray-900 dark:text-gray-100'
				};
		}
	};

	const handleAction = async (action: ErrorAction) => {
		try {
			await action.handler();
			show = false;
		} catch (err) {
			console.error('Error action failed:', err);
		}
	};

	const handleClose = () => {
		show = false;
		if (countdownInterval) {
			clearInterval(countdownInterval);
			countdownInterval = null;
		}
	};

	$: styles = error ? getSeverityStyles(error.severity) : getSeverityStyles('error');
</script>

{#if error}
	<Modal
		bind:show
		size="sm"
		ariaLabel={error.title}
		ariaDescribedBy="error-message"
	>
		<div class="p-6">
			<!-- Header with icon and title -->
			<div class="flex items-start gap-4 mb-4">
				{#if error.icon}
					<div class="flex-shrink-0 text-3xl {styles.icon}" aria-hidden="true">
						{error.icon}
					</div>
				{/if}
				<div class="flex-1">
					<h2
						id="error-title"
						class="text-xl font-semibold {styles.title} mb-2"
					>
						{error.title}
					</h2>
				</div>
			</div>

			<!-- Message -->
			<div
				id="error-message"
				class="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed"
			>
				{error.message}
			</div>

			<!-- Countdown timer -->
			{#if countdown > 0}
				<div
					class="flex items-center gap-2 p-3 rounded-lg {styles.bg} border {styles.border} mb-4"
					transition:fade={{ duration: 200 }}
				>
					<span class="text-sm text-gray-700 dark:text-gray-300">
						You can try again in <strong>{countdown}</strong> second{countdown !== 1 ? 's' : ''}
					</span>
				</div>
			{/if}

			<!-- Technical details (collapsible) -->
			{#if error.technicalDetails}
				<div class="mb-4">
					<button
						on:click={() => (showTechnicalDetails = !showTechnicalDetails)}
						class="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
						aria-expanded={showTechnicalDetails}
						aria-controls="technical-details"
					>
						{showTechnicalDetails ? 'Hide' : 'Show'} technical details
					</button>

					{#if showTechnicalDetails}
						<div
							id="technical-details"
							class="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700"
							transition:fade={{ duration: 200 }}
						>
							<code class="text-xs text-gray-800 dark:text-gray-200 break-all">
								{error.technicalDetails}
							</code>
						</div>
					{/if}
				</div>
			{/if}

			<!-- Actions -->
			<div class="flex flex-wrap gap-2 justify-end">
				{#if error.actions && error.actions.length > 0}
					{#each error.actions as action}
						<button
							on:click={() => handleAction(action)}
							disabled={countdown > 0}
							class="px-4 py-2 rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed
								{action.variant === 'primary'
									? 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500'
									: 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 focus:ring-gray-500'}"
						>
							{action.label}
						</button>
					{/each}
				{/if}

				<button
					on:click={handleClose}
					class="px-4 py-2 rounded-lg font-medium bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 transition-all focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
				>
					Close
				</button>
			</div>
		</div>
	</Modal>
{/if}

<style>
	/* Ensure proper spacing and accessibility */
	:global(.sr-only) {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border-width: 0;
	}
</style>
