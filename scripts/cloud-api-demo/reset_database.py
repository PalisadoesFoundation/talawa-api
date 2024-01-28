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
    process = subprocess.run(cmd, capture_output=True, text=True)

    if process.returncode != 0:
        print(f"Error occurred: {process.stderr}")
        raise SystemExit(1)
    else:
        print(process.stdout)


def main():
    """Main function to parse command-line arguments and execute commands.

    Args:
        None

    Raises:
        SystemExit: If any of the executed commands returns a non-zero exit code.
    """
    parser = argparse.ArgumentParser(description="Database reset script.")
    parser.add_argument(
        "--mongo-container", help="MongoDB container name", required=True
    )
    parser.add_argument("--mongo-db", help="MongoDB database name", required=True)
    parser.add_argument("--repo-dir", help="Repository directory", required=True)

    args = parser.parse_args()

    # Use docker exec command to drop the specified MongoDB database
    execute_command(
        [
            "docker",
            "exec",
            "-it",
            args.mongo_container,
            "mongosh",
            "--eval",
            f"db.getSiblingDB('{args.mongo_db}').dropDatabase()",
        ]
    )

    # Changing to repo dir
    os.chdir(args.repo_dir)

    # Run a command to import sample data using npm
    execute_command(["npm", "run", "import:sample-data"])


if __name__ == "__main__":
    main()
