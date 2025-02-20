#!/usr/bin/env python3
"""Script to detect and report usage of @ts-ignore comments in TypeScript."""

import argparse
import re
import sys
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(levelname)s: %(message)s",
)


def check_ts_ignore(files: list[str]) -> int:
    """Check for occurrences of '@ts-ignore' in the given files.

    Args:
        files (list[str]): List of file paths to check.

    Returns:
        int: 0 if no violations, 1 if violations are found.
    """
    ts_ignore_found = False

    for file in files:
        try:
            logging.info(f"Checking file: {file}")
            with open(file, encoding="utf-8") as f:
                for line_num, line in enumerate(f, start=1):
                    # Handle more variations of @ts-ignore
                    if re.search(
                        r"(?://|/\*)\s*@ts-ignore(?:\s+|$)", line.strip()
                    ):
                        print(
                            f"❌ Error: '@ts-ignore' found in {file} "
                            f"at line {line_num}"
                        )
                        logging.debug(
                            f"Found @ts-ignore in line: {line.strip()}"
                        )
                        ts_ignore_found = True
        except FileNotFoundError:
            logging.warning(f"File not found: {file}")
        except OSError as e:
            logging.error(f"Could not read {file}: {e}")
    if not ts_ignore_found:
        print("✅ No '@ts-ignore' comments found in the files.")

    return 1 if ts_ignore_found else 0


def main() -> None:
    """Main function to parse arguments and run the check.

    This function sets up argument parsing for file paths and runs the ts-ignore
    check on the specified files.

    Args:
        None

    Returns:
        None: The function exits the program with status code 0 if no ts-ignore
        comments are found, or 1 if any are detected.
    """
    parser = argparse.ArgumentParser(
        description="Check for @ts-ignore in changed files."
    )
    parser.add_argument(
        "--files", nargs="+", help="List of changed files", required=True
    )
    args = parser.parse_args()

    # Filter TypeScript files
    ts_files = [f for f in args.files if f.endswith((".ts", ".tsx"))]
    if not ts_files:
        logging.info("No TypeScript files to check.")
        sys.exit(0)

    exit_code = check_ts_ignore(args.files)
    sys.exit(exit_code)


if __name__ == "__main__":
    main()
