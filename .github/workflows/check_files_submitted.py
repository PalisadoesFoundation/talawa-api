"""
Script to check if Pull Request surpasses the designated threshold of 20 files.

We strongly recommend optimizing the changes to align with our established
guidelines.
Please reduce the number of files to meet this standard before submission.
Thank you for your cooperation

Methodology:
    Accepts the Base Branch and PR Branch Head references as
    command Line arguments.
    Checks the number of files modified in the PR branch by utilizing
    subprocess module to run the CLI commands using git diff.
    Checks the number of changed files returned by the 'get_changed_files'
    by the calculating the length of the list.
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
import argparse


def get_changed_files(base_branch, pr_branch):
    """
    Get the list of changed files between branches.

    Args:
        base_branch (str): Base branch name.
        pr_branch (str): Pull request branch name.

    Returns:
        list: List of changed file names.
    """
    try:
        with subprocess.Popen(
            [
                "git",
                "diff",
                "--name-only",
                f"origin/{base_branch}...{pr_branch}",
                "--",
            ],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            universal_newlines=True,
        ) as git_diff_process:
            git_diff_output, git_diff_error = git_diff_process.communicate()

            if git_diff_process.returncode != 0:
                print(f"Error: {git_diff_error}")
                sys.exit(1)

            changed_files = git_diff_output.splitlines()
            return changed_files
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)


def main():
    """
    Perform checks on changed files between base and pull request branches.

    1. Gathers branch name references from the command-line arguments
       utilizing the argparse module.
    2. Utilizes the 'get_changed_files' function to retrieve the modified files
       between the specified branches.
    3. If the number of files exceeds 20, issues an error message and exits
       with a status code of 1, ensuring adherence to file count standards.

    Args:
        None. (Uses command-line arguments)

    Returns:
        None. (Exits with sys.exit() if conditions are met)
    """
    parser = argparse.ArgumentParser(description="Check the number of changed files.")
    parser.add_argument("--base_branch", help="Base branch name", required=True)
    parser.add_argument("--pr_branch", help="Pull request branch name", required=True)
    parser.add_argument(
        "--max-files",
        type=int,
        default=20,
        help="Maximum allowed number of changed files (default is 20)",
    )
    args = parser.parse_args()

    base_branch = args.base_branch
    pr_branch = args.pr_branch

    changed_files = get_changed_files(base_branch, pr_branch)
    if len(changed_files) > args.max_files:
        print("The pull request contains an excessive number of changed files (more than 20).")
        print("Please ensure your changes are concise and focused.")
        print("Potential Causes: ")
        print("-A potential merge into an unintended or incorrect branch.")
        print("-Wrong source branch can be the cause.")
        print("-Ensure utilizing 'develop' as the source branch.")
        sys.exit(1)


if __name__ == "__main__":
    main()