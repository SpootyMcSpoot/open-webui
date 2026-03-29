# User-Friendly Error Handling

This document describes the improved error handling system implemented in P0-4.

## Overview

The error handling system provides:
- User-friendly error messages instead of technical jargon
- Actionable recovery options (retry buttons, navigation, etc.)
- ARIA live region support for screen reader accessibility
- Automatic error pattern detection (rate limits, timeouts, auth errors, etc.)
- Retry countdown timers for rate-limited operations

## Quick Start

### Basic Usage with Toast Notifications

```typescript
import { formatError } from '$lib/utils';
import { toast } from 'svelte-sonner';

// Simple error handling
try {
  await someApiCall();
} catch (error) {
  const friendlyError = formatError(error, { operation: 'save data' });
  toast.error(friendlyError.message);
}
```

### Using ErrorModal Component

```svelte
<script>
  import ErrorModal from '$lib/components/common/ErrorModal.svelte';
  import { formatError } from '$lib/utils';

  let showError = false;
  let error = null;

  async function handleAction() {
    try {
      await riskyOperation();
    } catch (err) {
      error = formatError(err, { operation: 'process request' });
      showError = true;
    }
  }
</script>

<ErrorModal bind:show={showError} {error} />
```

## Error Mapping Examples

### HTTP Status Codes

| Status | User Message | Actions |
|--------|-------------|---------|
| 429 | "Slow down! Wait 30 seconds before trying again." | 30-second countdown |
| 401/403 | "Your session expired. Please log in again." | Log in button |
| 404 (model) | "This model isn't available. Try a different one." | - |
| 413 | "Your message or attachments are too large..." | - |
| 500-504 | "Something went wrong on our end. We've been notified." | - |

### Error Message Patterns

The system automatically detects common error patterns:

**Context Length Exceeded:**
```
Error: "context length exceeded: 8192 tokens"
→ "Conversation too long. Start a new chat or remove some messages."
```

**Network Timeout:**
```
Error: "fetch timeout after 30 seconds"
→ "Connection timed out. Check your internet connection and try again."
```

**Rate Limit:**
```
Error: "rate limit exceeded"
→ "You've hit a usage limit. Please wait a moment before trying again."
```

**Model Unavailable:**
```
Error: "model not available"
→ "The selected model is currently unavailable. Try a different model."
```

**Permission Denied:**
```
Error: "permission denied"
→ "You don't have permission to perform this action."
```

## Advanced Usage

### Adding Custom Actions

```typescript
import { formatError, createRetryAction } from '$lib/utils';

const handleError = (error) => {
  const friendlyError = formatError(error);

  // Add custom retry action
  friendlyError.actions.push(
    createRetryAction(async () => {
      await retryOperation();
    }, 'Try Again')
  );

  return friendlyError;
};
```

### Providing Context

Context helps generate more specific error messages:

```typescript
// Generic 404
formatError({ status: 404 });
// → "Not found. The requested resource could not be found."

// 404 with model context
formatError({ status: 404 }, { modelId: 'llama-3' });
// → "Model not found. The model 'llama-3' is not available."
```

### ARIA Announcements

Error messages are automatically announced to screen readers:

```typescript
import { announceError, clearErrorAnnouncement } from '$lib/utils';

// Announce error (assertive for errors, polite for warnings)
announceError(friendlyError, 'assertive');

// Clear announcement when error is dismissed
clearErrorAnnouncement();
```

## ErrorModal Component API

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `show` | `boolean` | `false` | Controls modal visibility |
| `error` | `UserFriendlyError \| null` | `null` | Error object to display |
| `showTechnicalDetails` | `boolean` | `false` | Show technical error details |

### Features

- **Severity-based styling**: Error, warning, and info states with distinct colors
- **Icon display**: Visual indicators for error types
- **Countdown timers**: Automatic countdown for rate-limited errors
- **Collapsible technical details**: Developer-friendly error info
- **Action buttons**: Retry, login, navigate, or custom actions
- **Keyboard accessible**: Full keyboard navigation and Escape to close
- **ARIA support**: Proper ARIA attributes and live region announcements

## Integration Points

### Already Integrated

1. **Authentication flows** (`src/routes/auth/+page.svelte`)
   - Sign in errors
   - Sign up errors
   - LDAP authentication
   - OAuth callbacks

2. **Message input** (`src/lib/components/chat/MessageInput.svelte`)
   - Clipboard access errors
   - Location access errors

### Recommended Integration Points

1. **Chat API errors**: Apply to message sending, streaming errors
2. **Model loading errors**: Apply to model selection, loading failures
3. **File upload errors**: Apply to file size, type, and upload failures
4. **Settings updates**: Apply to config save errors
5. **Network requests**: Add global error interceptor

## Testing

Unit tests cover:
- All HTTP status code mappings (401, 403, 404, 413, 429, 500-504)
- Error message pattern detection
- Error formatting for different input types
- ARIA live region functionality
- Action creation and handling

Run tests:
```bash
npm run test:frontend -- src/lib/utils/errors.test.ts
```

## Future Improvements

1. **Error analytics**: Track error frequencies and patterns
2. **Custom error pages**: Full-page error states for critical failures
3. **Offline detection**: Specific handling for offline state
4. **Retry strategies**: Exponential backoff, circuit breaker patterns
5. **Error grouping**: Batch similar errors to avoid notification spam
6. **Internationalization**: Translate error messages

## Examples

### Example 1: API Call with Retry

```typescript
import { formatError, createRetryAction } from '$lib/utils';
import { toast } from 'svelte-sonner';

async function saveSettings(data) {
  try {
    await updateSettings(data);
    toast.success('Settings saved');
  } catch (error) {
    const friendlyError = formatError(error, { operation: 'save settings' });

    // Add retry action
    if (error.status >= 500) {
      friendlyError.actions.push(
        createRetryAction(() => saveSettings(data))
      );
    }

    // Show modal for critical errors, toast for minor ones
    if (friendlyError.severity === 'error') {
      showErrorModal(friendlyError);
    } else {
      toast.error(friendlyError.message);
    }
  }
}
```

### Example 2: File Upload with Size Check

```typescript
async function handleFileUpload(file) {
  // Pre-validate file size
  if (file.size > MAX_FILE_SIZE) {
    const error = formatError(
      { status: 413, message: `File size ${file.size} exceeds limit` },
      { operation: 'file upload' }
    );
    toast.error(error.message);
    return;
  }

  try {
    await uploadFile(file);
  } catch (error) {
    const friendlyError = formatError(error, { operation: 'file upload' });
    toast.error(friendlyError.message);
  }
}
```

### Example 3: Authenticated Request with Auto-Redirect

```typescript
async function fetchUserData() {
  try {
    return await getUserProfile();
  } catch (error) {
    const friendlyError = formatError(error);

    // Auth errors automatically include login action
    if (error.status === 401 || error.status === 403) {
      showErrorModal(friendlyError); // Modal includes "Log in" button
    } else {
      toast.error(friendlyError.message);
    }
  }
}
```

## Browser Support

- **Modern browsers**: Full support (Chrome, Firefox, Safari, Edge)
- **ARIA announcements**: Supported in all browsers with screen readers
- **Countdown timers**: Uses `setInterval` (universal support)
- **Accessibility**: WCAG 2.1 AA compliant

## Related Documentation

- [WCAG 2.1 AA Accessibility Compliance](/docs/accessibility/)
- [Component Library](/src/lib/components/common/)
- [API Error Handling Best Practices](/docs/api-guidelines.md)
