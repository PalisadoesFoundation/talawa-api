"""
Script to check if the number of files submitted in a Pull Request exceeds 20.

Methodology:
    Analyses the text file generated after the git diff command.
    Checks the number of files modified in the PR branch by
    counting the lines in the file.
    Exits with an appropriate error message if the number of files exceeds 20.

NOTE:
    This script complies with Python 3 coding and documentation standards,
    including:
        1) Pylint
        2) Pydocstyle
        3) Pycodestyle
        4) Flake8
    Run these commands from the CLI to ensure the code is compliant
    for all your pull requests.
"""

import sys
import subprocess


def check_file_lines(file_name):
    """
    Check the number of lines in a file.

    Args:
        file_name (str): Name of the file to check.

    Returns:
        bool: True if the number of lines is within limit, False otherwise.
    """
    try:
        with open(file_name, "r", encoding="utf-8") as file:
            num_lines = len(file.readlines())
            if num_lines > 20:
                print("Number of changed files exceeds 20.")
                return False
    except FileNotFoundError:
        print(f"File '{file_name}' not found.")
        return False

    return True


def run_checks():
    """
    Run checks on the script's formatting and documentation.

    This function utilizes 'black' to format the script and 'pydocstyle'
    to check for compliance with documentation standards.
    """
    black_check = subprocess.run(
        ["black", __file__], capture_output=True, check=True
        )
    if black_check.returncode != 0:
        print("Black failed to reformat the script.")
        print(black_check.stderr.decode())
        sys.exit(1)

    # Running Pydocstyle linting check on the script itself
    pydocstyle_check = subprocess.run(
        ["pydocstyle", __file__], capture_output=True, check=True
    )
    if pydocstyle_check.returncode != 0:
        print("Pydocstyle found linting issues in the script.")
        print(pydocstyle_check.stdout.decode())
        sys.exit(1)


def main():
    """Execute checks on the file."""
    if len(sys.argv) < 2:
        print("Usage: python script_name.py <file_to_check>")
        sys.exit(1)

    file_to_check = sys.argv[1]
    if not check_file_lines(file_to_check):
        sys.exit(1)

    # Running Black formatting check
    run_checks()


if __name__ == "__main__":
    main()
