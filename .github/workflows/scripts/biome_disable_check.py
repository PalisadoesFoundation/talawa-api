#!/usr/bin/env python3
"""Biome Checker Script.

Methodology:

    Recursively analyzes specified files or directories to ensure they do
    not contain biome-ignore statements, enforcing code quality practices.

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


def has_biome_ignore(file_path: str) -> bool:
    """Check if a file contains biome-ignore statements.

    Args:
        file_path: Path to the file.

    Returns:
        bool: True if biome-ignore statement is found, False otherwise.
    """
    biome_ignore_pattern = re.compile(
        r"//\s*biome-ignore.*$", re.IGNORECASE | re.MULTILINE
    )

    try:
        with open(file_path, encoding="utf-8") as file:
            content = file.read()
            return bool(biome_ignore_pattern.search(content))
    except FileNotFoundError:
        print(f"File not found: {file_path}")
        return False
    except PermissionError:
        print(f"Permission denied: {file_path}")
        return False
    except (IOError, OSError) as e:
        print(f"Error reading file {file_path}: {e}")
        return False


def check_biome(files_or_directories: list[str]) -> bool:
    """Check files for biome-ignore statements.

    Args:
        files_or_directories: List of files or directories to check.

    Returns:
        bool: True if biome-ignore statement is found, False otherwise.
    """
    biome_found = False

    for item in files_or_directories:
        if (
            os.path.isfile(item)
            and item.endswith((".ts", ".tsx"))
            and has_biome_ignore(item)
        ):
            print(
                f"""\
File {item} contains biome-ignore statement. Please remove them and ensure \
the code adheres to the specified Biome rules."""
            )
            biome_found = True
        elif os.path.isdir(item):
            # If it's a directory, walk through it and check all
            # .ts and .tsx files
            for root, _, files in os.walk(item):
                if "node_modules" in root:
                    continue
                for file_name in files:
                    if file_name.endswith((".ts", ".tsx")):
                        file_path = os.path.join(root, file_name)
                        if has_biome_ignore(file_path):
                            print(
                                f"""File {file_path} contains biome-ignore
                                statement.""",
                            )
                            biome_found = True

    return biome_found


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
        help="""List of files to check for biome-ignore
        statements (default: None).""",
    )
    parser.add_argument(
        "--directory",
        type=str,
        nargs="+",
        default=[os.getcwd()],
        help="""One or more directories to check for biome-ignore
        statements (default: current directory).""",
    )
    return parser.parse_args()


def main():
    """Execute the script's main functionality.

    This function serves as the entry point for the script. It performs
    the following tasks:
    1. Validates and retrieves the files and directories to check from
       command line arguments.
    2. Recursively checks files for biome-ignore statements.
    3. Provides informative messages based on the analysis.
    4. Exits with an error if biome-ignore statements are found.

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
    # Check biome in the specified files or directories
    biome_found = check_biome(files_or_directories)

    if biome_found:
        print("Biome-ignore check failed. Exiting with error.")
        sys.exit(1)

    print("Biome-ignore check completed successfully.")


if __name__ == "__main__":
    main()
