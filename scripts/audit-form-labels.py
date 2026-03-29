#!/usr/bin/env python3
"""
Audit form inputs for missing labels (WCAG 2.1 AA compliance)

This script finds <input>, <textarea>, and <select> elements that lack proper labeling:
- Missing aria-label
- Missing aria-labelledby
- Not associated with a <label> element
"""

import re
import os
from pathlib import Path
from typing import List, Dict, Set

# Patterns for form elements
INPUT_PATTERN = re.compile(r"<input[^>]*>", re.IGNORECASE)
TEXTAREA_PATTERN = re.compile(r"<textarea[^>]*>", re.IGNORECASE)
SELECT_PATTERN = re.compile(r"<select[^>]*>", re.IGNORECASE)

# Patterns for label attributes
ARIA_LABEL_PATTERN = re.compile(r'aria-label\s*=\s*["\']([^"\']+)["\']', re.IGNORECASE)
ARIA_LABELLEDBY_PATTERN = re.compile(
    r'aria-labelledby\s*=\s*["\']([^"\']+)["\']', re.IGNORECASE
)
ID_PATTERN = re.compile(r'\bid\s*=\s*["\']([^"\']+)["\']', re.IGNORECASE)
PLACEHOLDER_PATTERN = re.compile(
    r'placeholder\s*=\s*["\']([^"\']+)["\']', re.IGNORECASE
)

# Label element pattern
LABEL_PATTERN = re.compile(r'<label[^>]*for\s*=\s*["\']([^"\']+)["\']', re.IGNORECASE)


def has_label_attribute(element: str) -> Dict[str, str]:
    """Check if element has aria-label or aria-labelledby"""
    result = {
        "aria_label": None,
        "aria_labelledby": None,
        "id": None,
        "placeholder": None,
    }

    aria_label_match = ARIA_LABEL_PATTERN.search(element)
    if aria_label_match:
        result["aria_label"] = aria_label_match.group(1)

    aria_labelledby_match = ARIA_LABELLEDBY_PATTERN.search(element)
    if aria_labelledby_match:
        result["aria_labelledby"] = aria_labelledby_match.group(1)

    id_match = ID_PATTERN.search(element)
    if id_match:
        result["id"] = id_match.group(1)

    placeholder_match = PLACEHOLDER_PATTERN.search(element)
    if placeholder_match:
        result["placeholder"] = placeholder_match.group(1)

    return result


def get_label_fors(content: str) -> Set[str]:
    """Extract all 'for' attribute values from label elements"""
    return set(LABEL_PATTERN.findall(content))


def audit_file(file_path: Path) -> List[Dict]:
    """Audit a single Svelte file for unlabeled form inputs"""
    issues = []

    try:
        content = file_path.read_text(encoding="utf-8")
    except Exception:
        return issues

    # Get all label 'for' attributes
    label_fors = get_label_fors(content)

    # Find all form elements
    all_elements = []
    all_elements.extend(
        [("input", m.group(0)) for m in INPUT_PATTERN.finditer(content)]
    )
    all_elements.extend(
        [("textarea", m.group(0)) for m in TEXTAREA_PATTERN.finditer(content)]
    )
    all_elements.extend(
        [("select", m.group(0)) for m in SELECT_PATTERN.finditer(content)]
    )

    for element_type, element in all_elements:
        attrs = has_label_attribute(element)

        # Check if element has any form of label
        has_aria_label = attrs["aria_label"] is not None
        has_aria_labelledby = attrs["aria_labelledby"] is not None
        has_associated_label = attrs["id"] and attrs["id"] in label_fors
        has_placeholder = attrs["placeholder"] is not None

        # Element is properly labeled if it has any of these
        is_labeled = has_aria_label or has_aria_labelledby or has_associated_label

        if not is_labeled:
            # Check if it's a hidden input (type="hidden")
            if 'type="hidden"' in element or "type='hidden'" in element:
                continue

            # Check if it's a submit/button input (these don't need labels)
            if 'type="submit"' in element or 'type="button"' in element:
                continue

            issues.append(
                {
                    "file": str(file_path),
                    "type": element_type,
                    "element": element[:100] + "..." if len(element) > 100 else element,
                    "id": attrs["id"],
                    "placeholder": attrs["placeholder"],
                    "has_placeholder_only": has_placeholder and not is_labeled,
                }
            )

    return issues


def main():
    """Main audit function"""
    src_dir = Path("src/lib/components")

    if not src_dir.exists():
        print(f"Error: {src_dir} not found")
        return

    all_issues = []
    files_checked = 0

    # Audit all Svelte files
    for svelte_file in src_dir.rglob("*.svelte"):
        files_checked += 1
        issues = audit_file(svelte_file)
        all_issues.extend(issues)

    # Report results
    print("\n=== Form Label Audit Results ===\n")
    print(f"Files checked: {files_checked}")
    print(f"Issues found: {len(all_issues)}\n")

    if all_issues:
        print("UNLABELED FORM INPUTS:\n")

        # Group by file
        by_file = {}
        for issue in all_issues:
            file_path = issue["file"]
            if file_path not in by_file:
                by_file[file_path] = []
            by_file[file_path].append(issue)

        # Sort files by issue count
        sorted_files = sorted(by_file.items(), key=lambda x: len(x[1]), reverse=True)

        for file_path, file_issues in sorted_files:
            rel_path = os.path.relpath(file_path, "src/lib/components")
            print(f"\n{rel_path} ({len(file_issues)} issues):")

            for issue in file_issues:
                print(f"  - {issue['type']}")
                if issue["id"]:
                    print(f"    ID: {issue['id']}")
                if issue["placeholder"]:
                    print(f"    Placeholder: {issue['placeholder']}")
                if issue["has_placeholder_only"]:
                    print(
                        "    ⚠️  Has placeholder but no proper label (WCAG violation)"
                    )
                print(f"    Element: {issue['element']}")

        print("\n\nSUMMARY:")
        print(f"Total unlabeled inputs: {len(all_issues)}")
        print(f"Files with issues: {len(by_file)}")

        # Count by type
        type_counts = {}
        for issue in all_issues:
            t = issue["type"]
            type_counts[t] = type_counts.get(t, 0) + 1

        print("\nBy element type:")
        for element_type, count in sorted(type_counts.items()):
            print(f"  {element_type}: {count}")

        # Count placeholder-only issues
        placeholder_only = sum(
            1 for issue in all_issues if issue["has_placeholder_only"]
        )
        if placeholder_only > 0:
            print(f"\n⚠️  Placeholder-only (WCAG violation): {placeholder_only}")
    else:
        print("✅ All form inputs have proper labels!")

    print()


if __name__ == "__main__":
    main()
