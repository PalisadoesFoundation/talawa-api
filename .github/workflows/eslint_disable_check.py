#!/usr/bin/env python3
# -*- coding: UTF-8 -*-
"""ESLint Checker Script.

Methodology:

    Recursively analyzes TypeScript files in the 'src' directory and its subdirectories
    as well as 'setup.ts' files to ensure they do not contain eslint-disable statements.

    This script enforces code quality practices in the project.

NOTE:

    This script complies with our python3 coding and documentation standards.
    It complies with:

        1) Pylint
        2) Pydocstyle
        3) Pycodestyle
        4) Flake8

"""

import os
import re
import argparse
import sys

def has_eslint_disable(file_path):
    """
    Check if a TypeScript file contains eslint-disable statements.

    Args:
        file_path (str): Path to the TypeScript file.

    Returns:
        bool: True if eslint-disable statement is found, False otherwise.
    """
    eslint_disable_pattern = re.compile(r'//\s*eslint-disable(?:-next-line|-line)?', re.IGNORECASE)
    
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()
            return bool(eslint_disable_pattern.search(content))
    except Exception as e:
        print(f"Error reading file {file_path}: {e}")
        return False

def check_eslint(directory):
    """
    Recursively check TypeScript files for eslint-disable statements in the 'src' directory.

    Args:
        directory (str): Path to the directory.

    Returns:
        list: List of files containing eslint-disable statements.
    """
    eslint_issues = []

    src_dir = os.path.join(directory, 'src')
    
    if not os.path.exists(src_dir):
        print(f"Source directory '{src_dir}' does not exist.")
        return eslint_issues

    for root, dirs, files in os.walk(src_dir):
        for file_name in files:
            if file_name.endswith('.tsx') and not file_name.endswith('.test.tsx'):
                file_path = os.path.join(root, file_name)
                if has_eslint_disable(file_path):
                    eslint_issues.append(f'File {file_path} contains eslint-disable statement.')

    setup_path = os.path.join(directory, 'setup.ts')
    if os.path.exists(setup_path) and has_eslint_disable(setup_path):
        eslint_issues.append(f'Setup file {setup_path} contains eslint-disable statement.')

    return eslint_issues

def arg_parser_resolver():
    """Resolve the CLI arguments provided by the user."""
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--directory",
        type=str,
        default=os.getcwd(),
        help="Path to the directory to check (default: current directory)"
    )
    return parser.parse_args()

def main():
    """
    Execute the script's main functionality.

    This function serves as the entry point for the script. It performs
    the following tasks:
    1. Validates and retrieves the directory to check from
       command line arguments.
    2. Recursively checks TypeScript files for eslint-disable statements.
    3. Provides informative messages based on the analysis.
    4. Exits with an error if eslint-disable statements are found.

    Raises:
        SystemExit: If an error occurs during execution.
    """
    args = arg_parser_resolver()
    if not os.path.exists(args.directory):
        print(f"Error: The specified directory '{args.directory}' does not exist.")
        sys.exit(1)

    eslint_issues = check_eslint(args.directory)

    if eslint_issues:
        for issue in eslint_issues:
            print(issue)
        print("ESLint-disable check failed. Exiting with error.")
        sys.exit(1)

    print("ESLint-disable check completed successfully.")
    sys.exit(0)

if __name__ == "__main__":
    main()
