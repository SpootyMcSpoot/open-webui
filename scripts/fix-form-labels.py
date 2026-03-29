#!/usr/bin/env python3
"""
Automated fixer for form label accessibility violations

This script adds aria-label attributes to unlabeled form inputs
to achieve WCAG 2.1 AA compliance.
"""

import re
import sys
from pathlib import Path
from typing import List, Tuple

# Patterns
INPUT_PATTERN = re.compile(r"(<input[^>]*>)", re.IGNORECASE)
TEXTAREA_PATTERN = re.compile(r"(<textarea[^>]*>)", re.IGNORECASE)
SELECT_PATTERN = re.compile(r"(<select[^>]*>)", re.IGNORECASE)

ARIA_LABEL_CHECK = re.compile(r"aria-label\s*=", re.IGNORECASE)
ARIA_LABELLEDBY_CHECK = re.compile(r"aria-labelledby\s*=", re.IGNORECASE)

BIND_VALUE_PATTERN = re.compile(r"bind:value\s*=\s*\{([^}]+)\}", re.IGNORECASE)
PLACEHOLDER_PATTERN = re.compile(
    r'placeholder\s*=\s*["\']([^"\']+)["\']', re.IGNORECASE
)
ID_PATTERN = re.compile(r'\bid\s*=\s*["\']([^"\']+)["\']', re.IGNORECASE)


def generate_label_from_variable(var_name: str) -> str:
    """
    Convert a variable name to a human-readable label

    Examples:
        params.max_tokens -> Maximum Tokens
        settings.temperature -> Temperature
        searchQuery -> Search Query
        model_id -> Model ID
    """
    # Extract the last part after dot
    name = var_name.split(".")[-1]

    # Handle camelCase: insert space before capitals
    name = re.sub(r"([a-z])([A-Z])", r"\1 \2", name)

    # Replace underscores with spaces
    name = name.replace("_", " ")

    # Title case each word
    words = name.split()
    words = [
        w.title() if w.lower() not in ["id", "url", "api"] else w.upper() for w in words
    ]

    return " ".join(words).strip()


def generate_label_from_placeholder(placeholder: str) -> str:
    """Use placeholder text as label if it's descriptive enough"""
    # Remove template syntax
    placeholder = re.sub(r"\{[^}]+\}", "", placeholder)
    placeholder = re.sub(r'\$i18n\.t\([\'"]([^\'"]+)[\'"]\)', r"\1", placeholder)
    placeholder = placeholder.strip()

    # If placeholder is just "..." or very short, don't use it
    if len(placeholder) < 3 or placeholder in ["...", "Search", "Enter"]:
        return None

    return placeholder


def generate_label_from_id(element_id: str) -> str:
    """Generate label from ID attribute"""
    # steps-range -> Steps Range
    # model-selector -> Model Selector
    name = element_id.replace("-", " ").replace("_", " ")
    return name.title()


def should_skip_element(element: str) -> bool:
    """Check if element should be skipped (already labeled or doesn't need label)"""
    # Already has aria-label or aria-labelledby
    if ARIA_LABEL_CHECK.search(element) or ARIA_LABELLEDBY_CHECK.search(element):
        return True

    # Hidden inputs don't need labels
    if 'type="hidden"' in element or "type='hidden'" in element:
        return True

    # Submit/button inputs don't need labels
    if 'type="submit"' in element or 'type="button"' in element:
        return True

    return False


def generate_label(element: str) -> str:
    """
    Generate an appropriate aria-label for an element

    Priority:
    1. Variable name from bind:value
    2. Placeholder text (if descriptive)
    3. ID attribute
    4. Generic label based on element type
    """
    # Try to extract from bind:value
    bind_match = BIND_VALUE_PATTERN.search(element)
    if bind_match:
        var_name = bind_match.group(1)
        label = generate_label_from_variable(var_name)
        if label:
            return label

    # Try placeholder
    placeholder_match = PLACEHOLDER_PATTERN.search(element)
    if placeholder_match:
        placeholder_text = placeholder_match.group(1)
        label = generate_label_from_placeholder(placeholder_text)
        if label:
            return label

    # Try ID
    id_match = ID_PATTERN.search(element)
    if id_match:
        element_id = id_match.group(1)
        label = generate_label_from_id(element_id)
        if label and label not in ["Steps Range"]:  # Skip generic IDs
            return label

    # Fallback to generic
    if "<input" in element.lower():
        if 'type="search"' in element or "type='search'" in element:
            return "Search"
        if 'type="number"' in element or "type='number'" in element:
            return "Number Input"
        if 'type="range"' in element or "type='range'" in element:
            return "Range Slider"
        return "Text Input"
    elif "<textarea" in element.lower():
        return "Text Area"
    elif "<select" in element.lower():
        return "Dropdown Select"

    return None


def add_aria_label(element: str, label: str) -> str:
    """
    Add aria-label to an element

    Inserts before 'class=' if present, otherwise before closing tag
    Uses i18n for translation support
    """
    # Wrap label in i18n.t() for translation
    aria_attr = f"aria-label=\"{{$i18n.t('{label}')}}\""

    # Find a good insertion point
    # Priority: before class=, before first attribute, before />

    if "class=" in element:
        # Insert before class attribute
        return element.replace("class=", f"{aria_attr} class=")
    elif "type=" in element:
        # Insert before type attribute
        return element.replace("type=", f"{aria_attr} type=")
    else:
        # Insert before closing >
        if "/>" in element:
            return element.replace("/>", f" {aria_attr} />")
        elif ">" in element:
            return element.replace(">", f" {aria_attr}>")

    return element


def fix_file(file_path: Path, dry_run: bool = False) -> Tuple[int, List[str]]:
    """
    Fix all unlabeled inputs in a file

    Returns: (number_of_fixes, list_of_changes)
    """
    try:
        content = file_path.read_text(encoding="utf-8")
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
        return (0, [])

    original_content = content
    fixes = 0
    changes = []

    # Find all form elements
    all_elements = []
    all_elements.extend([("input", m) for m in INPUT_PATTERN.finditer(content)])
    all_elements.extend([("textarea", m) for m in TEXTAREA_PATTERN.finditer(content)])
    all_elements.extend([("select", m) for m in SELECT_PATTERN.finditer(content)])

    # Sort by position (reverse order so replacements don't affect positions)
    all_elements.sort(key=lambda x: x[1].start(), reverse=True)

    for element_type, match in all_elements:
        element = match.group(0)

        # Skip if already labeled or doesn't need label
        if should_skip_element(element):
            continue

        # Generate label
        label = generate_label(element)
        if not label:
            continue

        # Add aria-label
        fixed_element = add_aria_label(element, label)
        if fixed_element != element:
            content = content[: match.start()] + fixed_element + content[match.end() :]
            fixes += 1
            changes.append(f"  {element_type}: {label}")

    # Write back if changes made and not dry run
    if fixes > 0 and not dry_run:
        file_path.write_text(content, encoding="utf-8")

    return (fixes, changes)


def main():
    """Main fixer function"""
    import argparse

    parser = argparse.ArgumentParser(
        description="Fix form label accessibility violations"
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be fixed without making changes",
    )
    parser.add_argument("--file", type=str, help="Fix a specific file")
    parser.add_argument(
        "--top", type=int, help="Fix only the top N files with most issues"
    )

    args = parser.parse_args()

    src_dir = Path("src/lib/components")

    if not src_dir.exists():
        print(f"Error: {src_dir} not found")
        return 1

    # Get list of files to fix
    if args.file:
        files_to_fix = [Path(args.file)]
    else:
        files_to_fix = list(src_dir.rglob("*.svelte"))

    total_fixes = 0
    files_modified = 0

    print(f"\n{'DRY RUN - ' if args.dry_run else ''}Fixing form labels...\n")

    for svelte_file in files_to_fix:
        fixes, changes = fix_file(svelte_file, dry_run=args.dry_run)

        if fixes > 0:
            files_modified += 1
            total_fixes += fixes
            rel_path = svelte_file.relative_to(src_dir)
            print(f"{rel_path} - {fixes} fixes:")
            for change in changes:
                print(change)
            print()

    # Summary
    print(f"\n{'DRY RUN ' if args.dry_run else ''}SUMMARY:")
    print(f"Files modified: {files_modified}")
    print(f"Total fixes: {total_fixes}")

    if args.dry_run:
        print("\nRe-run without --dry-run to apply changes")

    return 0


if __name__ == "__main__":
    sys.exit(main())
