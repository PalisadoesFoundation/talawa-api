#!/usr/bin/env python3
"""Sanitization Disable Comment Checker.

Methodology:

    Validates that check-sanitization-disable comments include proper
    justifications to prevent abuse of the security bypass mechanism.

Note:
    This script complies with our python3 coding and documentation standards.
    It complies with:

        1) Pylint
        2) Pydocstyle
        3) Pycodestyle
        4) Flake8
        5) Python Black

"""
import os
import re
import argparse
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
    # Pattern matches: // check-sanitization-disable: <justification>
    # Group 1 captures the justification text after the colon
    disable_pattern = re.compile(
        r"//\s*check-sanitization-disable\s*:\s*(.+)$",
        re.IGNORECASE | re.MULTILINE,
    )

    # Pattern to catch disable comments WITHOUT justification
    disable_no_justification_pattern = re.compile(
        r"//\s*check-sanitization-disable\s*$",
        re.IGNORECASE | re.MULTILINE,
    )

    try:
        with open(file_path, encoding="utf-8") as file:
            content = file.read()

            # First check if there's a disable comment without justification
            no_justification_match = disable_no_justification_pattern.search(
                content
            )
            if no_justification_match:
                return (
                    True,
                    "Disable comment missing justification. "
                    "Format: // check-sanitization-disable: <reason>",
                )

            # Check all disable comments with justifications
            matches = disable_pattern.findall(content)
            for justification in matches:
                justification_text = justification.strip()
                # Require minimum 10 characters for meaningful justification
                if len(justification_text) < 10:
                    return (
                        True,
                        (
                            f"Justification too short ({len(justification_text)} "
                            f"chars): '{justification_text}'. Minimum 10 "
                            f"characters required."
                        ),
                    )

    except FileNotFoundError:
        print(f"File not found: {file_path}")
        return False, ""
    except PermissionError:
        print(f"Permission denied: {file_path}")
        return False, ""
    except OSError as e:
        print(f"Error reading file {file_path}: {e}")
        return False, ""

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
                        is_invalid, error_message = (
                            check_sanitization_disable(file_path)
                        )
                        if is_invalid:
                            print(f"❌ {file_path}: {error_message}")
                            has_errors = True

    return has_errors


def arg_parser_resolver():
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
