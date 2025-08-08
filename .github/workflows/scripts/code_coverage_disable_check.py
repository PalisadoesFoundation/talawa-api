"""Code Coverage Disable Checker Script.

Methodology:

    Recursively analyzes TypeScript files in the specified directories or
    checks specific files
    to ensure they do not contain code coverage disable statements.

    This script enforces proper code coverage practices in the project.

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


def has_code_coverage_disable(file_path):
    """Check if a TypeScript file contains code coverage disable statements.

    Args:
        file_path (str): Path to the TypeScript file.

    Returns:
        bool: True if code coverage disable statement is found, False
        otherwise.
    """
    code_coverage_disable_pattern = re.compile(
        r"//?\s*istanbul\s+ignore(?:\s+(?:next|-line))?[^\n]*|"
        r"/\*\s*istanbul\s+ignore\s+(?:next|-line)\s*\*/",
        re.IGNORECASE,
    )
    try:
        with open(file_path, "r", encoding="utf-8") as file:
            content = file.read()
            return bool(code_coverage_disable_pattern.search(content))
    except FileNotFoundError:
        print(f"File not found: {file_path}")
        return False
    except PermissionError:
        print(f"Permission denied: {file_path}")
        return False
    except (IOError, OSError) as e:
        print(f"Error reading file {file_path}: {e}")
        return False


def check_code_coverage(files_or_dirs):
    """Check TypeScript files for code coverage disable statements.

    Args:
        files_or_dirs (list): List of files or directories to check.

    Returns:
        bool: True if code coverage disable statement is found, False
        otherwise.
    """
    code_coverage_found = False

    for item in files_or_dirs:
        if os.path.isdir(item):
            # If it's a directory, recursively walk through the files in it
            for root, _, files in os.walk(item):
                if "node_modules" in root:
                    continue
                for file_name in files:
                    if (
                        file_name.endswith(".ts")
                        and not file_name.endswith(".test.ts")
                        and not file_name.endswith(".spec.ts")
                    ):
                        file_path = os.path.join(root, file_name)
                        if has_code_coverage_disable(file_path):
                            print(
                                f"""\
File {file_path} contains code coverage disable statement."""
                            )
                            code_coverage_found = True
        elif os.path.isfile(item):
            # If it's a file, check it directly
            if (
                item.endswith(".ts")
                and not item.endswith(".test.ts")
                and not item.endswith(".spec.ts")
            ):
                if has_code_coverage_disable(item):
                    print(
                        f"""\
File {item} contains code coverage disable statement. \
Please remove it and add the appropriate tests."""
                    )
                    code_coverage_found = True

    return code_coverage_found


def arg_parser_resolver():
    """Resolve the CLI arguments provided by the user.

    Args:
        None

    Returns:
        result: Parsed argument object
    """
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--directory",
        type=str,
        nargs="+",
        default=[os.getcwd()],
        help="""One or more directories to check for code coverage disable
        statements (default: current directory).""",
    )
    parser.add_argument(
        "--files",
        type=str,
        nargs="+",
        default=[],
        help="""One or more files to check directly for code coverage disable
        statements (default: check directories).""",
    )
    return parser.parse_args()


def main():
    """Execute the script's main functionality.

    This function serves as the entry point for the script. It performs
    the following tasks:
    1. Validates and retrieves the files or directories to check from
       command line arguments.
    2. Checks files or directories for code coverage disable statements.
    3. Provides informative messages based on the analysis.
    4. Exits with an error if code coverage disable statements are found.

    Args:
        None

    Returns:
        None

    Raises:
        SystemExit: If an error occurs during execution.
    """
    args = arg_parser_resolver()
    files_or_dirs = args.files if args.files else args.directory
    # Check code coverage in the specified files or directories
    code_coverage_found = check_code_coverage(files_or_dirs)

    if code_coverage_found:
        print("Code coverage disable check failed. Exiting with error.")
        sys.exit(1)

    print("Code coverage disable check completed successfully.")


if __name__ == "__main__":
    main()
