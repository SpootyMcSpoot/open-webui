# P0-3 Form Labels Audit Report

**Date:** 2026-03-29
**Task:** #53 - Associate form labels with inputs
**WCAG Requirement:** 2.1 AA - Success Criterion 1.3.1 (Info and Relationships)
**Status:** ⚠️ CRITICAL - 457 violations found

---

## Executive Summary

Automated audit discovered **457 unlabeled form inputs** across **88 files** in the Open WebUI codebase. This is a critical WCAG 2.1 AA violation that affects screen reader accessibility.

### Impact

- **Severity:** CRITICAL - Blocks screen reader users from using forms
- **Compliance:** WCAG 2.1 Level A violation (1.3.1 Info and Relationships)
- **Deadline:** April 24, 2026 (25 days remaining)
- **Estimated Effort:** 15-20 hours to fix all violations

### Breakdown

| Element Type | Count |
|--------------|-------|
| `<input>`    | 444   |
| `<textarea>` | 6     |
| `<select>`   | 7     |
| **Total**    | **457** |

---

## Worst Offenders (Files with Most Issues)

1. **chat/Settings/Advanced/AdvancedParams.svelte** - 49 issues
   - Range sliders without labels (temperature, steps, max tokens)
   - Number inputs without labels
   - Text inputs in parameter forms

2. **admin/Settings/Interface.svelte** - 34 issues
   - Configuration toggles
   - Text inputs for settings
   - Number inputs for limits

3. **admin/Settings/Banners.svelte** - 31 issues
   - Banner content inputs
   - Banner configuration forms

4. **admin/Settings/Documents.svelte** - 22 issues
   - Document processing settings
   - File upload configurations

5. **admin/Settings/Models.svelte** - 22 issues
   - Model configuration inputs
   - API key inputs
   - URL inputs

---

## Common Patterns Found

### 1. Range Sliders Without Labels (Most Common)

**Example from AdvancedParams.svelte:**
```svelte
<input
  id="steps-range"
  type="range"
  min="1"
  max="128"
  step="1"
  bind:value={params.steps}
  class="...range classes..."
/>
```

**Issue:** Range slider has `id` but no `aria-label` or associated `<label for="steps-range">`

**Fix:**
```svelte
<input
  id="steps-range"
  type="range"
  min="1"
  max="128"
  step="1"
  bind:value={params.steps}
  aria-label="{$i18n.t('Steps')}"
  class="...range classes..."
/>
```

### 2. Number Inputs Without Labels

**Example:**
```svelte
<input
  bind:value={params.max_tokens}
  type="number"
  class="bg-transparent"
/>
```

**Fix:**
```svelte
<input
  bind:value={params.max_tokens}
  type="number"
  aria-label="{$i18n.t('Maximum Tokens')}"
  class="bg-transparent"
/>
```

### 3. Text Inputs Without Labels

**Example:**
```svelte
<input
  class="text-sm w-full bg-transparent"
  type="text"
  bind:value={params.seed}
/>
```

**Fix:**
```svelte
<input
  class="text-sm w-full bg-transparent"
  type="text"
  bind:value={params.seed}
  aria-label="{$i18n.t('Random Seed')}"
/>
```

### 4. Search Inputs Without Labels

**Example:**
```svelte
<input
  type="search"
  placeholder="Search"
  bind:value={searchQuery}
/>
```

**Issue:** Placeholder is NOT sufficient for accessibility

**Fix:**
```svelte
<input
  type="search"
  placeholder="{$i18n.t('Search')}"
  aria-label="{$i18n.t('Search')}"
  bind:value={searchQuery}
/>
```

---

## Priority Levels

### P0 - Critical (Blocking user workflows)

**Files:** 15 files with 10+ violations each
**Total Issues:** 250+ violations
**Areas:**
- Settings forms (admin and user)
- Model configuration
- Advanced parameters
- Document settings

**These MUST be fixed for WCAG compliance.**

### P1 - High (Important forms)

**Files:** 30 files with 3-9 violations each
**Total Issues:** 150+ violations
**Areas:**
- User profile settings
- Chat settings
- Workspace configuration
- Integration settings

### P2 - Medium (Less frequently used)

**Files:** 43 files with 1-2 violations each
**Total Issues:** ~57 violations
**Areas:**
- Admin utilities
- Developer tools
- Advanced features

---

## Recommended Fix Strategy

### Phase 1: Bulk Fix with Script (8-10 hours)

Create an automated fixer script that:
1. Identifies inputs with `bind:value={params.xxx}`
2. Generates aria-label from variable name (e.g., `max_tokens` → `"Maximum Tokens"`)
3. Uses i18n for labels: `aria-label="{$i18n.t('...')}"`
4. Preserves existing aria-labels

**Coverage:** Can fix ~300 issues automatically

### Phase 2: Manual Review (4-6 hours)

Manually review and fix:
- Range sliders (need contextual labels)
- Complex forms with multiple related inputs
- Inputs that need `aria-labelledby` (grouped controls)
- Special cases (color pickers, file uploads, etc.)

**Coverage:** Remaining ~157 issues

### Phase 3: Testing (2-3 hours)

- Run accessibility tests with axe-core
- Test with screen readers (NVDA, JAWS, VoiceOver)
- Verify all forms are usable
- Document any exceptions

---

## Implementation Plan

### Step 1: Create Automated Fixer

```python
#!/usr/bin/env python3
"""
Auto-fix form labels by adding aria-label attributes
"""

import re
from pathlib import Path

def generate_label(variable_name: str) -> str:
    """Convert bind:value variable to label text"""
    # params.max_tokens -> Maximum Tokens
    # settings.temperature -> Temperature
    # searchQuery -> Search Query

    name = variable_name.split('.')[-1]  # Get last part
    name = re.sub(r'([A-Z])', r' \1', name)  # Add spaces before capitals
    name = name.replace('_', ' ')  # Replace underscores
    return name.strip().title()

def fix_input(element: str) -> str:
    """Add aria-label to input element if missing"""
    # Check if already has aria-label
    if 'aria-label' in element:
        return element

    # Extract bind:value variable
    bind_match = re.search(r'bind:value\s*=\s*\{([^}]+)\}', element)
    if bind_match:
        var_name = bind_match.group(1)
        label_text = generate_label(var_name)

        # Insert aria-label before class attribute
        if 'class=' in element:
            return element.replace('class=', f'aria-label="{{$i18n.t(\'{label_text}\')}}" class=')
        else:
            # Insert before closing >
            return element.replace('/>', f' aria-label="{{$i18n.t(\'{label_text}\')}}" />')

    return element

# Apply to all files...
```

### Step 2: Files to Fix First (P0)

1. `chat/Settings/Advanced/AdvancedParams.svelte` (49 issues)
2. `admin/Settings/Interface.svelte` (34 issues)
3. `admin/Settings/Banners.svelte` (31 issues)
4. `admin/Settings/Documents.svelte` (22 issues)
5. `admin/Settings/Models.svelte` (22 issues)
6. `chat/Settings/Interface.svelte` (18 issues)
7. `admin/Settings/Users.svelte` (18 issues)
8. `admin/Settings/Audio.svelte` (16 issues)
9. `chat/Settings/Connections.svelte` (14 issues)
10. `chat/Settings/Account.svelte` (13 issues)

**Subtotal:** 237 issues in top 10 files (52% of all violations)

### Step 3: Testing Checklist

After fixes:
- [ ] Run `python3 scripts/audit-form-labels.py` → Should show 0 issues
- [ ] Run Playwright accessibility tests
- [ ] Test with NVDA screen reader on Windows
- [ ] Test with VoiceOver on macOS
- [ ] Verify all settings forms work correctly
- [ ] Check i18n translations exist for new labels

---

## Alternative: Component-Level Fix

Instead of file-by-file fixes, create wrapper components:

### LabeledInput.svelte
```svelte
<script>
  export let label;
  export let value;
  export let type = 'text';
  // ... other props
</script>

<input
  {type}
  bind:value
  aria-label="{$i18n.t(label)}"
  {...$$restProps}
/>
```

**Usage:**
```svelte
<LabeledInput label="Maximum Tokens" bind:value={params.max_tokens} type="number" />
```

**Pros:**
- Enforces labeling by design
- Easier to maintain
- Centralized accessibility

**Cons:**
- Requires refactoring existing code
- More changes needed
- Higher risk of introducing bugs

**Recommendation:** Use automated fixer script for current violations, then adopt component pattern for new code.

---

## Time Estimates

| Phase | Task | Time |
|-------|------|------|
| 1 | Create automated fixer script | 2h |
| 1 | Run fixer on P0 files (237 issues) | 1h |
| 1 | Test and verify automated fixes | 2h |
| 2 | Manual fixes for complex cases | 4h |
| 2 | Range slider labels | 2h |
| 2 | Form groups with aria-labelledby | 2h |
| 3 | Screen reader testing | 2h |
| 3 | Accessibility test suite updates | 1h |
| 3 | Documentation | 1h |
| **Total** | | **17 hours** |

---

## WCAG Success Criteria

### 1.3.1 Info and Relationships (Level A)

**Requirement:** Information, structure, and relationships conveyed through presentation can be programmatically determined or are available in text.

**Current Status:** ❌ FAIL - 457 form inputs cannot be programmatically determined

**After Fix:** ✅ PASS - All inputs have programmatic labels via `aria-label` or `<label>`

### Related Criteria

**4.1.2 Name, Role, Value (Level A)**
- All user interface components must have name and role programmatically determinable
- Currently failing for 457 inputs
- Will pass after labels added

**2.4.6 Headings and Labels (Level AA)**
- Labels describe the topic or purpose
- Many inputs have placeholders but not proper labels
- Will improve significantly after fix

---

## Next Steps

1. **Create automated fixer script** (2 hours)
2. **Fix P0 files** (top 10 files with most issues)
3. **Manual review and fixes** for complex cases
4. **Test with screen readers**
5. **Update task #53 to completed**
6. **Move to task #54** (heading hierarchy)

---

## Audit Command

To re-run the audit:
```bash
python3 scripts/audit-form-labels.py
```

To save full output:
```bash
python3 scripts/audit-form-labels.py > form-labels-audit-full.txt
```

---

**Report Generated:** 2026-03-29 23:05 UTC
**Audit Tool:** `scripts/audit-form-labels.py`
**Files Checked:** 498 Svelte components
**Issues Found:** 457 unlabeled inputs
**Files Affected:** 88 files
**Priority:** CRITICAL - Blocking WCAG 2.1 AA compliance
