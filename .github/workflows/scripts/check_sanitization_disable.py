#!/usr/bin/env python3
"""Sanitization Disable Comment Checker.

Methodology:

    Validates that check-sanitization-disable comments include proper
    justifications to prevent abuse of the security bypass mechanism.

    IMPORTANT: Only the exact lowercase form "check-sanitization-disable"
    is accepted. Mixed-case variants (e.g., "Check-Sanitization-Disable")
    are rejected to enforce consistency across the codebase.

Note:
    This script complies with our python3 coding and documentation standards.
    It complies with:

        1) Pylint
        2) Pydocstyle
        3) Pycodestyle
        4) Flake8
        5) Python Black

"""
import argparse
import os
import re
import sys


def check_sanitization_disable(file_path: str) -> tuple[bool, str]:
    """Check if file has valid sanitization disable comment with justification.

    Args:
        file_path: Path to the file to check.

    Returns:
        tuple: (has_invalid_disable, error_message)
            - has_invalid_disable: True if invalid disable comment found
            - error_message: Description of the error if invalid

    """
    # Single pattern that matches all disable comment variations:
    # - // check-sanitization-disable (no colon) -> captures None
    # - // check-sanitization-disable: (colon, no text) -> captures ""
    # - // check-sanitization-disable: text -> captures "text"
    # Note: Case-sensitive to enforce canonical lowercase form
    disable_pattern = re.compile(
        r"//\s*check-sanitization-disable(?:\s*:\s*(.*))?$",
        re.MULTILINE,
    )

    try:
        with open(file_path, encoding="utf-8") as file:
            content = file.read()

            # Find all disable comments
            matches = disable_pattern.findall(content)
            for justification in matches:
                # justification is empty string if colon present but no text
                # justification is empty string from non-capturing group if
                # no colon
                justification_text = justification.strip()

                # Check if justification is missing (no colon or colon w/ no
                # text)
                if not justification_text:
                    return (
                        True,
                        "Disable comment missing justification. "
                        "Format: // check-sanitization-disable: "
                        "<reason>",
                    )

                # Require minimum 10 characters for meaningful justification
                if len(justification_text) < 10:
                    return (
                        True,
                        (
                            f"Justification too short "
                            f"({len(justification_text)} chars): "
                            f"'{justification_text}'. "
                            f"Minimum 10 characters required."
                        ),
                    )

    except FileNotFoundError:
        return True, f"File not found: {file_path}"
    except PermissionError:
        return True, f"Permission denied: {file_path}"
    except OSError as e:
        return True, f"Error reading file {file_path}: {e}"

    return False, ""


def check_files(files_or_directories: list[str]) -> bool:
    """Check files for invalid sanitization disable comments.

    Args:
        files_or_directories: List of files or directories to check.

    Returns:
        bool: True if invalid disable comments found, False otherwise.

    """
    has_errors = False

    for item in files_or_directories:
        if os.path.isfile(item) and item.endswith(".ts"):
            is_invalid, error_message = check_sanitization_disable(item)
            if is_invalid:
                print(f"❌ {item}: {error_message}")
                has_errors = True
        elif os.path.isdir(item):
            # If it's a directory, walk through it and check all .ts files
            for root, _, files in os.walk(item):
                if "node_modules" in root:
                    continue
                for file_name in files:
                    if file_name.endswith(".ts"):
                        file_path = os.path.join(root, file_name)
                        is_invalid, error_message = check_sanitization_disable(
                            file_path
                        )
                        if is_invalid:
                            print(f"❌ {file_path}: {error_message}")
                            has_errors = True

    return has_errors


def arg_parser_resolver() -> argparse.Namespace:
    """Resolve the CLI arguments provided by the user.

    Args:
        None

    Returns:
        result: Parsed argument object

    """
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--files",
        type=str,
        nargs="+",
        default=[],
        help="""List of files to check for invalid sanitization
        disable comments (default: None).""",
    )
    parser.add_argument(
        "--directory",
        type=str,
        nargs="+",
        default=[os.getcwd()],
        help="""One or more directories to check for invalid sanitization
        disable comments (default: current directory).""",
    )
    return parser.parse_args()


def main():
    """Execute the script's main functionality.

    This function serves as the entry point for the script. It performs
    the following tasks:
    1. Validates and retrieves the files and directories to check from
       command line arguments.
    2. Recursively checks files for invalid sanitization disable comments.
    3. Provides informative messages based on the analysis.
    4. Exits with an error if invalid disable comments are found.

    Args:
        None

    Returns:
        None

    Raises:
        SystemExit: If an error occurs during execution.

    """
    args = arg_parser_resolver()

    # Determine whether to check files or directories based on the arguments
    files_or_directories = args.files if args.files else args.directory

    # Check for invalid disable comments
    has_errors = check_files(files_or_directories)

    if has_errors:
        print(
            "\n Sanitization disable comment validation failed. "
            "Please add proper justifications."
        )
        sys.exit(1)

    print("Sanitization disable comment validation passed.")


if __name__ == "__main__":
    main()
