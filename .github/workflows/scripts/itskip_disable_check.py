#!/usr/bin/env python3
# -*- coding: UTF-8 -*-
"""ESLint Checker Script.

Methodology:

    Recursively analyzes TypeScript files in the specified directory
    or checks specific files directly to ensure they do not contain
    it.skip statements.

    This script enforces code quality practices in the project.

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


def has_eslint_disable(file_path):
    """Check if a TypeScript file contains it.skip statements.

    Args:
        file_path (str): Path to the TypeScript file.

    Returns:
        bool: True if it.skip statement is found, False otherwise.
    """
    # Initialize key variables
    eslint_disable_pattern = re.compile(
        r"\s+it\.skip\(",
        re.IGNORECASE | re.DOTALL,
    )

    try:
        with open(file_path, "r", encoding="utf-8") as file:
            content = file.read()
            return bool(eslint_disable_pattern.search(content))
    except FileNotFoundError:
        print(f"File not found: {file_path}")
    except PermissionError:
        print(f"Permission denied: {file_path}")
    except (IOError, OSError) as e:
        print(f"Error reading file {file_path}: {e}")
    return False


def check_eslint(files_or_directories):
    """Check TypeScript files for it.skip statements.

    Args:
        files_or_directories (list): List of files or directories to check.

    Returns:
        bool: True if it.skip statement is found, False otherwise.
    """
    eslint_found = False

    for item in files_or_directories:
        if os.path.isfile(item):
            # Check a single file
            if item.endswith((".ts", ".tsx")) and has_eslint_disable(item):
                print(f"Error: File {item} contains it.skip statements.")
                eslint_found = True
        elif os.path.isdir(item):
            # Recursively check files in a directory
            for root, _, files in os.walk(item):
                if "node_modules" in root:
                    continue
                for file_name in files:
                    if file_name.endswith((".ts", ".tsx")):
                        file_path = os.path.join(root, file_name)
                        if has_eslint_disable(file_path):
                            print(
                                f"Error: File {file_path} contains "
                                "'it.skip' statements."
                            )

                            eslint_found = True
    return eslint_found


def arg_parser_resolver():
    """Resolve the CLI arguments provided by the user.

    Args: None

    Returns:
        result: Parsed argument object
    """
    parser = argparse.ArgumentParser(
        description="Check TypeScript files for it.skip statements."
    )
    parser.add_argument(
        "--files",
        type=str,
        nargs="+",
        default=[],
        help="List of files to check for it.skip statements.",
    )
    parser.add_argument(
        "--directory",
        type=str,
        nargs="+",
        default=[os.getcwd()],
        help="One or more directories to check for it.skip statements.",
    )
    return parser.parse_args()


def main():
    """Execute the script's main functionality.

    Args:
        None

    Returns:
        None

    This function serves as the entry point for the script. It performs
    the following tasks:

    1. Validates and retrieves the files and directories to check from
       command line arguments.
    2. Recursively checks TypeScript files for it.skip statements.
    3. Provides informative messages based on the analysis.
    4. Exits with an error if it.skip statements are found.

    Raises:
        SystemExit: If an error occurs during execution.
    """
    args = arg_parser_resolver()

    # Determine whether to check files or directories based on the arguments
    files_or_directories = args.files if args.files else args.directory
    # Check eslint in the specified files or directories
    eslint_found = check_eslint(files_or_directories)

    if eslint_found:
        print("ESLint-disable check failed. Exiting with error.")
        sys.exit(1)

    print("ESLint-disable check completed successfully.")


if __name__ == "__main__":
    main()
