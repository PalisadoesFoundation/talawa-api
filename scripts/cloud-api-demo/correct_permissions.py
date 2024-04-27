#!/usr/bin/env python3
import argparse
import subprocess


def execute_command(cmd):
    """Execute a shell command.

    Args:
        cmd: A list of strings representing the command and its arguments.

    Raises:
        SystemExit: If the command returns a non-zero exit code.
    """
    process = subprocess.run(cmd, capture_output=True, text=True)

    if process.returncode != 0:
        print(f"Error occurred: {process.stderr}")
        raise SystemExit(1)
    else:
        print(process.stdout)


def main():
    """Main function to parse arguments and execute commands.

    Args:
        None

    Raises:
        SystemExit: If any of the executed commands returns a non-zero exit code.
    """
    parser = argparse.ArgumentParser(description="Permission correction script.")
    parser.add_argument("--user", help="User to set as owner", default="talawa-api")
    parser.add_argument(
        "--files", nargs="+", help="Files to correct permissions for", required=True
    )

    args = parser.parse_args()

    for file in args.files:
        # Check and correct ownership
        execute_command(["chown", args.user, file])

        # Check and correct permissions
        execute_command(["chmod", "700", file])


if __name__ == "__main__":
    main()
