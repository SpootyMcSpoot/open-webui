# P0 Quick Wins Implementation Tickets

**Created:** March 28, 2026
**Ready for:** GitHub Issues Creation
**Total Effort:** 24 hours (3-4 working days)

---

## Ticket 1: P0-4 Improved Error Messages

**Title:** Implement user-friendly error handling with recovery actions

**Priority:** P0
**Effort:** 8 hours
**Labels:** `ui-improvement`, `error-handling`, `P0-quick-win`

### Description

Replace technical error messages with user-friendly, actionable feedback. Users currently see raw error objects and technical messages, causing confusion and support tickets.

### Acceptance Criteria

- [ ] Error mapping utility created (`/src/lib/utils/errors.ts`)
- [ ] ErrorModal component with icon, title, description, action buttons
- [ ] 10+ error scenarios mapped to user-friendly messages
- [ ] Retry buttons with cooldown timers where appropriate
- [ ] ARIA live regions for screen reader announcements
- [ ] Integration in 10 critical error paths
- [ ] Unit tests for error mapping utility
- [ ] Integration tests for error recovery flows

### Implementation Details

**Files to Create:**
- `/src/lib/utils/errors.ts` - Error mapping utility
- `/src/lib/components/common/ErrorModal.svelte` - Enhanced error modal
- `/src/lib/components/common/ErrorToast.svelte` - Rich toast variant (optional)

**Files to Modify:**
- `/src/lib/components/chat/Chat.svelte` - Chat message errors
- `/src/lib/components/chat/MessageInput.svelte` - Input validation
- `/src/routes/+layout.svelte` - Authentication errors (line 873)
- `/src/routes/auth/+page.svelte` - Login errors (lines 48, 73, 83, 90)
- `/src/lib/components/workspace/Models/ModelEditor.svelte` - Model errors
- `/src/lib/apis/index.ts` - API error interceptor

**Error Scenarios to Map:**

| Status Code | User Message | Action |
|-------------|--------------|--------|
| 429 | "Slow down! Wait 30 seconds before trying again." | Countdown + Retry |
| 500-503 | "Something went wrong on our end. We've been notified." | Retry button |
| 401 | "Your session expired. Please log in again." | Log in button |
| 404 (model) | "This model isn't available. Try a different one." | Model selector |
| Network timeout | "Connection timed out. Check your internet." | Retry button |
| Context length | "Conversation too long. Start new chat or remove messages." | New chat button |

### Testing Requirements

- [ ] Test each mapped error scenario
- [ ] Verify retry functionality works
- [ ] Check screen reader announcements
- [ ] Test on mobile (toast visibility)
- [ ] Verify ARIA live regions
- [ ] Test with network throttling

### Expected Impact

- 60% reduction in user confusion
- 40% reduction in support tickets
- 70% error recovery success rate (up from 40%)

### References

- Full research: `/docs/ui-improvements/UI-UX-RESEARCH-REPORT-2026-03-28.md` (Part 3.1)
- ARIA best practices: https://www.sarasoueidan.com/blog/accessible-notifications-with-aria-live-regions-part-1/

---

## Ticket 2: P0-5 Mobile Input Improvements

**Title:** Optimize message input for mobile with WCAG Level AAA touch targets

**Priority:** P0
**Effort:** 8 hours
**Labels:** `ui-improvement`, `mobile`, `accessibility`, `P0-quick-win`

### Description

Improve mobile chat input experience with larger touch targets (WCAG 2.5.5 Level AAA), better keyboard handling, sticky input bar, and haptic feedback.

### Acceptance Criteria

- [ ] All touch targets 48x48px minimum (56x56px for primary actions)
- [ ] Send button: 56x56px on mobile
- [ ] File/voice buttons: 48x48px on mobile
- [ ] Button spacing: 12px on mobile
- [ ] Sticky input bar on mobile (always visible)
- [ ] Keyboard handling: `enterkeyhint="send"`, `inputmode="text"`
- [ ] Auto-scroll to input when keyboard opens
- [ ] Dynamic viewport height support (100dvh)
- [ ] Haptic feedback on send action
- [ ] Active state animations (scale on press)
- [ ] Safe area support for notched devices

### Implementation Details

**Files to Modify:**
- `/src/lib/components/chat/MessageInput.svelte` - Main input component
- `/src/lib/components/chat/Chat.svelte` - Adjust spacing for sticky input
- `/src/app.css` - Add mobile touch target utilities

**Files to Create:**
- `/src/lib/utils/haptics.ts` - Haptic feedback utility

**CSS Utilities to Add:**

```css
@media (max-width: 768px) {
  .touch-target {
    min-width: 48px;
    min-height: 48px;
    padding: 12px;
  }

  .touch-target-primary {
    min-width: 56px;
    min-height: 56px;
    padding: 16px;
  }

  .touch-active:active {
    transform: scale(0.95);
    opacity: 0.9;
  }
}

.safe-bottom {
  padding-bottom: calc(16px + env(safe-area-inset-bottom));
}
```

**Haptic Feedback:**

```typescript
// /src/lib/utils/haptics.ts
export function triggerHaptic(type: 'light' | 'medium' | 'heavy' = 'light') {
  if ('vibrate' in navigator) {
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30]
    };
    navigator.vibrate(patterns[type]);
  }
}
```

### Testing Requirements

**Device Testing:**
- [ ] iOS Safari (iPhone SE, iPhone 14 Pro, iPad)
- [ ] Android Chrome (Pixel 7, Samsung S23)
- [ ] Keyboard show/hide transitions
- [ ] Orientation changes (portrait/landscape)
- [ ] System font scaling (150%, 200%)

**Interaction Testing:**
- [ ] Touch targets respond accurately
- [ ] No accidental button presses
- [ ] Haptic feedback triggers
- [ ] Keyboard doesn't obscure input
- [ ] Sticky input stays visible while scrolling
- [ ] Safe area works on notched devices

**Accessibility Testing:**
- [ ] WCAG 2.5.5 Level AAA (48px targets) compliance
- [ ] Sufficient spacing between buttons (8px minimum)
- [ ] Voice Control works on iOS
- [ ] Touch target measurement with DevTools

### Expected Impact

- 50% reduction in mobile input frustration
- 30% increase in mobile session duration
- WCAG 2.5.5 Level AAA compliance
- 5% touch miss rate (down from 15%)

### References

- Full research: `/docs/ui-improvements/UI-UX-RESEARCH-REPORT-2026-03-28.md` (Part 3.2)
- WCAG 2.5.5: https://www.w3.org/WAI/WCAG21/Understanding/target-size.html
- Mobile design trends: https://uxpilot.ai/blogs/mobile-app-design-trends

---

## Ticket 3: P0-6 Folder UI Polish

**Title:** Refine folder creation flow and add visual distinction

**Priority:** P0
**Effort:** 8 hours
**Labels:** `ui-improvement`, `folders`, `organization`, `P0-quick-win`

### Description

Improve folder user experience with inline quick-create (no modal), visual distinction (icons + colors), enhanced drag-and-drop feedback, and folder preview on hover.

### Acceptance Criteria

- [ ] Inline folder creation (no modal for simple folders)
- [ ] Keyboard shortcut: `Ctrl+Shift+N` / `Cmd+Shift+N`
- [ ] Enter to confirm, Escape to cancel
- [ ] 8 preset icons (📁 💼 🔬 🎨 📊 🏠 ⚙️ 📚)
- [ ] 8 preset colors (blue, green, purple, red, yellow, pink, gray, orange)
- [ ] Icon + color picker on folder hover
- [ ] Clear drag-drop visual feedback (blue ring, "Drop here" label)
- [ ] Scale animation on drag over (105%)
- [ ] Folder preview on hover (first 3 chats)
- [ ] Modal still available for advanced settings (system prompt, files)

### Implementation Details

**Files to Modify:**
- `/src/lib/components/layout/Sidebar/Folders.svelte` - Add inline creation
- `/src/lib/components/layout/Sidebar/RecursiveFolder.svelte` - Enhanced drag-drop
- `/src/lib/components/layout/Sidebar/Folders/FolderModal.svelte` - Keep for advanced

**Files to Create:**
- `/src/lib/components/layout/Sidebar/FolderItem.svelte` - Folder display with customization
- `/src/lib/components/layout/Sidebar/Folders/FolderCustomizer.svelte` - Icon/color picker

**Inline Creation Pattern:**

```svelte
{#if creatingFolder}
  <div class="flex items-center gap-2 px-3 py-2 mx-2 bg-gray-50 dark:bg-gray-850 rounded-lg">
    <div class="text-xl">📁</div>
    <input
      bind:value={newFolderName}
      on:keydown={handleCreateFolder}
      placeholder="Folder name..."
      class="flex-1 bg-transparent outline-none text-sm"
    />
    <button on:click={() => creatingFolder = false}>Cancel</button>
  </div>
{/if}
```

**Drag-Drop Visual Feedback:**

```svelte
<div
  class="folder-item rounded-lg transition-all
    {draggedOver ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950/30 scale-105' : ''}"
>
  {#if draggedOver}
    <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div class="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
        Drop here
      </div>
    </div>
  {/if}
</div>
```

### Testing Requirements

- [ ] Inline creation works (Enter/Escape)
- [ ] Keyboard shortcut triggers creation
- [ ] Icon picker displays all 8 icons
- [ ] Color picker applies styles correctly
- [ ] Drag-drop shows clear blue ring feedback
- [ ] "Drop here" label appears on drag over
- [ ] Folder preview shows on 500ms hover
- [ ] Preview shows first 3 chats
- [ ] Modal still accessible for advanced settings
- [ ] Mobile: touch targets adequate (icon/color buttons)
- [ ] Accessibility: keyboard navigation works

### Expected Impact

- 30% increase in folder adoption
- 60% faster folder creation (15s vs 45s)
- 40% of folders use custom icons/colors
- Better visual scanning and organization
- Improved discoverability of drag-drop

### References

- Full research: `/docs/ui-improvements/UI-UX-RESEARCH-REPORT-2026-03-28.md` (Part 3.3)
- Notion folder design patterns (research source)
- Gmail label system (research source)

---

## Implementation Order

**Recommended sequence:**

1. **P0-4: Error Messages** (Days 1-2, 8 hours)
   - Foundational improvement affecting entire app
   - Can be tested in isolation
   - High user impact

2. **P0-5: Mobile Input** (Days 2-3, 8 hours)
   - Builds on WCAG work
   - Mobile is 40%+ of traffic
   - Can be feature-flagged for testing

3. **P0-6: Folder Polish** (Days 3-4, 8 hours)
   - Depends on mobile fixes (touch targets)
   - Visual improvements are last
   - Can be deployed incrementally

**Total Timeline:** 3-4 working days for 1 developer (or 2 days for 2 developers working in parallel)

---

## Testing Strategy

### Automated Testing

**Unit Tests (Vitest):**
- `errors.test.ts` - Error mapping utility (10+ test cases)
- `haptics.test.ts` - Haptic feedback utility

**Integration Tests (Playwright):**
- Error recovery flows (retry buttons, navigation)
- Mobile input interactions (touch targets, keyboard)
- Folder creation and customization

**Accessibility Tests:**
- axe-core scan for WCAG 2.5.5 compliance
- Touch target measurement
- Screen reader announcements (ARIA live regions)

### Manual Testing

**Device Matrix:**
- iOS Safari (iPhone SE, iPhone 14 Pro, iPad)
- Android Chrome (Pixel 7, Samsung S23)
- Desktop browsers (Chrome, Firefox, Safari, Edge)

**Test Scenarios:**
- Error handling: Trigger each mapped error scenario
- Mobile input: Test all touch targets, keyboard behavior
- Folder UI: Create folders, customize, drag-and-drop

**Accessibility Validation:**
- Keyboard navigation (Tab, Enter, Escape)
- Screen reader testing (NVDA, VoiceOver)
- Voice Control on iOS
- Touch target measurement (Chrome DevTools)

---

## Deployment Plan

### Phase 1: Feature Flags (Day 1)

```typescript
// Add to config
export const FEATURE_FLAGS = {
  ENHANCED_ERROR_HANDLING: true,
  MOBILE_INPUT_IMPROVEMENTS: false, // Enable after testing
  FOLDER_UI_POLISH: false
};
```

### Phase 2: Staging Deployment (Days 2-3)

- Deploy all three features to staging
- Internal testing by team
- Gather feedback and iterate

### Phase 3: Production Rollout (Days 4-5)

**Gradual rollout:**
- 10% of users (monitor for 24h)
- 50% of users (monitor for 24h)
- 100% of users

**Monitoring:**
- Error recovery success rate
- Mobile session duration
- Folder creation rate
- Sentry for error tracking
- Analytics events for user actions

### Phase 4: Post-Launch (Week 2)

- Collect user feedback (in-app survey)
- Analyze metrics vs targets
- Fix any critical bugs
- Iterate based on data

---

## Success Metrics Summary

| Metric | Baseline | Target | Success Criteria |
|--------|----------|--------|------------------|
| Error recovery rate | 40% | 70% | ✅ 60%+ is acceptable |
| Support tickets (errors) | 100/month | 60/month | ✅ 70/month is acceptable |
| Mobile session duration | 8 min | 12 min | ✅ 10 min is acceptable |
| Touch miss rate | 15% | 5% | ✅ 8% is acceptable |
| Folder creation time | 45 sec | 15 sec | ✅ 25 sec is acceptable |
| Folder adoption | 20% | 30% | ✅ 25% is acceptable |

---

## Risk Mitigation

**High Risk:**
- Mobile keyboard inconsistencies → Test on real devices, progressive enhancement
- Error mapping incomplete → Log unmapped errors, iterate weekly

**Medium Risk:**
- Haptic feedback annoying → Make opt-in, use light intensity
- Folder customization overwhelming → Hide behind hover, provide defaults

**Rollback Plan:**
- Feature flags allow instant disable
- Each feature can be rolled back independently
- Monitoring alerts trigger automatic rollback if error rate > 5%

---

## Next Actions

1. **Create GitHub issues** from these tickets
2. **Assign to developer(s)** (1 dev for 4 days, or 2 devs for 2 days)
3. **Set up telemetry** for success metrics
4. **Schedule daily standups** during implementation
5. **Prepare staging environment** for testing
6. **Notify QA team** for manual testing

**Ready to Begin:** Monday, April 1, 2026 (after WCAG P0-3 completion)

