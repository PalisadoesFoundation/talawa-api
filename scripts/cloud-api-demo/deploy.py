#!/usr/bin/env python3
import argparse
import subprocess
import os


def execute_command(cmd):
    """Execute a shell command.

    Args:
        cmd: A list of strings representing the command and its arguments.

    Raises:
        SystemExit: If the command returns a non-zero exit code.
    """
    process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    output, error = process.communicate()

    if process.returncode != 0:
        print(f"Error occurred: {error.decode().strip()}")
        raise SystemExit(1)
    else:
        print(output.decode().strip())


def main():
    """Main function to parse command-line arguments and execute commands.

    Args:
        None

    Raises:
        SystemExit: If any of the executed commands returns a non-zero exit code.
    """
    parser = argparse.ArgumentParser(description="Deployment script.")
    parser.add_argument("--path", help="Path to the project directory", required=True)
    parser.add_argument("--branch", help="Git branch to checkout", default="develop")

    args = parser.parse_args()

    # Navigate to the project directory
    os.chdir(args.path)

    # Switch to the specified branch
    execute_command(["git", "checkout", args.branch])

    # Pull the latest changes from the specified branch on the origin
    execute_command(["git", "pull", "origin", args.branch])

    # Stop and remove existing containers
    execute_command(["docker","compose", "down"])

    # Build and launch containers in the background
    execute_command(["docker","compose", "up", "-d", "--build"])

    # Remove all unused containers, networks, and images (both dangling and all unused)
    execute_command(["docker", "system", "prune", "-f"])


if __name__ == "__main__":
    main()
