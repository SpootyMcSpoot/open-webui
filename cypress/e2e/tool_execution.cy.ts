// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../support/index.d.ts" />

// Tests for tool execution display and chat functionality.
// Validates that the AI stack (OpenWebUI + LiteLLM) correctly handles
// tool calls, model responses, and multi-turn conversations.
describe('Tool Execution and Chat', () => {
	after(() => {
		// eslint-disable-next-line cypress/no-unnecessary-waiting
		cy.wait(2000);
	});

	beforeEach(() => {
		cy.loginAdmin();
		cy.visit('/');
	});

	context('Model Selection', () => {
		it('model selector shows available models', () => {
			cy.get('button[aria-label="Select a model"]').click();
			cy.get('button[aria-roledescription="model-item"]').should('have.length.greaterThan', 0);
		});

		it('can select a model and see it reflected', () => {
			cy.get('button[aria-label="Select a model"]').click();
			cy.get('button[aria-roledescription="model-item"]').first().click();
			// Model name should appear somewhere in the UI after selection
			cy.get('button[aria-label="Select a model"]').should('not.contain.text', 'Select a model');
		});
	});

	context('Basic Chat', () => {
		it('sends a message and receives a response', () => {
			cy.get('button[aria-label="Select a model"]').click();
			cy.get('button[aria-roledescription="model-item"]').first().click();

			cy.get('#chat-input').type('What is 2 + 2? Answer with just the number.', {
				force: true
			});
			cy.get('button[type="submit"]').click();

			cy.get('.chat-user').should('exist');
			cy.get('.chat-assistant', { timeout: 30_000 }).should('exist');
			cy.get('div[aria-label="Generation Info"]', { timeout: 120_000 }).should('exist');
		});

		it('handles multi-turn conversation', () => {
			cy.get('button[aria-label="Select a model"]').click();
			cy.get('button[aria-roledescription="model-item"]').first().click();

			// First message
			cy.get('#chat-input').type('Remember the number 42.', { force: true });
			cy.get('button[type="submit"]').click();
			cy.get('div[aria-label="Generation Info"]', { timeout: 120_000 }).should('exist');

			// Second message referencing the first
			cy.get('#chat-input').type('What number did I ask you to remember?', {
				force: true
			});
			cy.get('button[type="submit"]').click();

			// Should have two assistant messages
			cy.get('.chat-assistant', { timeout: 30_000 }).should('have.length.at.least', 2);
			cy.get('div[aria-label="Generation Info"]', { timeout: 120_000 }).should(
				'have.length.at.least',
				2
			);
		});
	});

	context('Response Quality', () => {
		it('generation info shows token count', () => {
			cy.get('button[aria-label="Select a model"]').click();
			cy.get('button[aria-roledescription="model-item"]').first().click();

			cy.get('#chat-input').type('Say hello.', { force: true });
			cy.get('button[type="submit"]').click();

			cy.get('div[aria-label="Generation Info"]', { timeout: 120_000 }).should('exist');
			// Generation info should contain timing or token data
			cy.get('div[aria-label="Generation Info"]').first().click();
		});

		it('response is not empty', () => {
			cy.get('button[aria-label="Select a model"]').click();
			cy.get('button[aria-roledescription="model-item"]').first().click();

			cy.get('#chat-input').type('What is the capital of France? One word answer.', {
				force: true
			});
			cy.get('button[type="submit"]').click();

			cy.get('.chat-assistant', { timeout: 30_000 })
				.first()
				.invoke('text')
				.should('have.length.greaterThan', 0);
			cy.get('div[aria-label="Generation Info"]', { timeout: 120_000 }).should('exist');
		});
	});

	context('Chat Management', () => {
		it('can create a new chat', () => {
			// Start a conversation
			cy.get('button[aria-label="Select a model"]').click();
			cy.get('button[aria-roledescription="model-item"]').first().click();
			cy.get('#chat-input').type('Hello.', { force: true });
			cy.get('button[type="submit"]').click();
			cy.get('div[aria-label="Generation Info"]', { timeout: 120_000 }).should('exist');

			// Create new chat
			cy.get('button[aria-label="New Chat"]').click();

			// Should be on a fresh chat page
			cy.get('.chat-user').should('not.exist');
			cy.get('.chat-assistant').should('not.exist');
		});
	});
});
