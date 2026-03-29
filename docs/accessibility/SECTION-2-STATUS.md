# Section 2: ARIA Live Regions - Status Report

**Date:** March 29, 2026
**Section:** P0-3 Task 2 - ARIA Live Regions
**Status:** Partially Complete
**Time Invested:** ~1.5 hours
**Estimated Remaining:** 2.5-3 hours

---

## Completed Items ✅

### 2.1 NotificationToast Component
**Status:** ✅ Already compliant (no changes needed)

The NotificationToast component (`src/lib/components/NotificationToast.svelte`) already has proper ARIA live region attributes:
- `role="status"` (line 86)
- `aria-live="polite"` (line 87)
- `aria-atomic="true"` (line 88)

This is correctly implemented for accessibility.

### 2.2 svelte-sonner Toast Library
**Status:** ✅ Already compliant (library handles it)

The application uses `svelte-sonner@0.3.28` for toast notifications (found in `src/routes/+layout.svelte`). This library already implements:
- `role="status"` for info/success messages
- `aria-live="polite"` for non-critical notifications
- `aria-live="assertive"` for error messages

No changes needed - the library is accessibility-compliant.

### 2.3 File Upload Button Loading State
**Status:** ✅ Complete

**File:** `src/lib/components/chat/MessageInput.svelte` (line ~1953)

**Changes Made:**
```svelte
<button
    id="send-message-button"
    aria-label={uploadPending ? 'Waiting for upload' : 'Send message'}
    aria-busy={uploadPending}  <!-- ADDED -->
    ...
>
```

**Impact:** Screen readers now announce when the send button is in a busy state during file uploads.

**Commit:** `b57e6f2fe` - "feat(accessibility): add aria-busy to file upload button"

---

## Remaining Work ⏳

### 2.4 Chat Message Generation Loading State (1-1.5 hours)

**Files to Modify:**
- `src/lib/components/chat/Messages/ResponseMessage.svelte`
- `src/lib/components/chat/Messages/Skeleton.svelte`

**Pattern:**
```svelte
{#if isGenerating}
<div
    aria-busy="true"
    aria-live="polite"
    aria-label="Generating response"
>
    <Skeleton />
    <span class="sr-only">Generating response from {modelName}</span>
</div>
{/if}
```

**Locations Identified:**
- `src/lib/components/chat/Messages/ResponseMessage/StatusHistory/StatusItem.svelte` (lines 22, 31-32, 139-140)
  - "Generating search query" status messages

### 2.5 Model Loading State (30 minutes)

**Context:** When switching models or loading model configurations

**Files to Check:**
- `src/lib/components/chat/ModelSelector/Selector.svelte`
- `src/lib/components/workspace/Models/ModelEditor.svelte`

**Pattern:**
```svelte
{#if modelLoading}
<div aria-busy="true" aria-label="Loading model configuration">
    <Spinner />
</div>
{/if}
```

### 2.6 Form Validation Error Messages (1-2 hours)

**Goal:** Add ARIA live regions for form validation errors

**Pattern:**
```svelte
<input
    id="email"
    type="email"
    bind:value={email}
    aria-invalid={emailError ? 'true' : 'false'}
    aria-describedby={emailError ? 'email-error' : undefined}
/>
{#if emailError}
<span
    id="email-error"
    role="alert"
    aria-live="assertive"
    class="text-xs text-red-500"
>
    {emailError}
</span>
{/if}
```

**Files to Audit:**
- Login/signup forms (auth routes)
- Admin settings forms
- Model configuration forms
- User profile forms

**Current Status:**
- Zero inputs have `aria-invalid` (verified via grep)
- Error messages exist but lack proper ARIA association

---

## Analysis & Recommendations

### What's Working Well

1. **Third-party libraries are accessible** - svelte-sonner handles toast notifications properly
2. **Existing components have good foundation** - NotificationToast already had role and aria-live
3. **Dynamic aria-label patterns exist** - MessageInput already used conditional aria-label

### Key Gaps

1. **Form validation lacks ARIA** - No aria-invalid, no aria-describedby associations
2. **Loading states partially covered** - File upload has aria-busy, but chat generation doesn't
3. **No status announcer utility** - Would benefit from a reusable StatusAnnouncer component

### Proposed StatusAnnouncer Component

Create `/home/pestilence/repos/personal/open-webui/src/lib/components/common/StatusAnnouncer.svelte`:

```svelte
<script lang="ts">
  export let message: string = '';
  export let assertive: boolean = false;

  let key = 0;
  $: if (message) key++;
</script>

{#key key}
  {#if message}
  <div
    role="status"
    aria-live={assertive ? 'assertive' : 'polite'}
    class="sr-only"
  >
    {message}
  </div>
  {/if}
{/key}
```

**Usage:**
```svelte
<script>
  import StatusAnnouncer from '$lib/components/common/StatusAnnouncer.svelte';
  let statusMessage = '';

  async function saveSettings() {
    await api.save();
    statusMessage = 'Settings saved successfully';
    setTimeout(() => statusMessage = '', 3000);
  }
</script>

<StatusAnnouncer message={statusMessage} />
```

**Benefits:**
- Reusable across all components
- Consistent announcement pattern
- Forces best practices (auto-clear, role, aria-live)

---

## Realistic Timeline

Given the 26 days remaining until April 24, 2026 deadline and current progress:

### Section 2 Completion Plan

**Day 1 (2 hours):**
- Create StatusAnnouncer component
- Add aria-busy to chat message generation
- Add aria-busy to model loading states

**Day 2 (1.5 hours):**
- Audit all major forms for validation
- Add aria-invalid and aria-describedby to login/signup forms
- Add aria-invalid to admin settings forms

**Day 3 (1 hour):**
- Test all ARIA live regions with screen reader
- Fix any issues discovered
- Document patterns for future development

**Total:** 4.5 hours over 3 days

---

## Decision Point

Given time constraints (26 days, ~14-19 hours remaining across all sections), we have two options:

### Option A: Complete Section 2 Fully (Recommended)
- Spend 2.5-3 more hours to finish ARIA live regions
- Ensures critical loading states and errors are accessible
- Higher WCAG compliance score

### Option B: Move to Section 3 (Faster)
- Accept partial Section 2 completion (toast + upload button done)
- Focus on Section 3 (Form Labels) which has broader impact
- Return to Section 2 if time permits

**Recommendation:** Option A - Complete Section 2
- Loading states and error announcements are critical for blind users
- Only 2.5-3 hours more investment
- Would bring Section 2 to 100% completion

---

## Next Steps

1. Create StatusAnnouncer component (30 min)
2. Add aria-busy to chat generation (45 min)
3. Add aria-busy to model loading (30 min)
4. Add aria-invalid to top 5 forms (1.5 hours)
5. Commit Section 2 completion

**Then proceed to:** Section 3 (Form Labels Association)

---

**Last Updated:** March 29, 2026
**Progress:** Section 2 is ~40% complete (3 of 6 subtasks done)
