#!/usr/bin/env python3
import argparse
import subprocess
import os
import shutil

def execute_command(cmd):
    """Execute a shell command, capturing and printing output.

    Args:
        cmd: A list of strings representing the command and its arguments.

    Raises:
        FileNotFoundError: If npm executable is not found
        SystemExit: If the command returns a non-zero exit code.
    """

    npm_path = shutil.which("npm")  # Find the npm executable
    if npm_path is None:
        raise FileNotFoundError("npm executable not found.")

    if cmd[0] == "npm":
        cmd[0] = npm_path

    print(f"Executing command: {cmd}")
    print(f"Current working directory: {os.getcwd()}")

    process = subprocess.run(cmd, capture_output=True, text=True, env=os.environ, check=True) # check=True raises exception for non-zero return code

    print(process.stdout)  # Print stdout regardless of success/failure
    if process.returncode != 0:
        print(f"Error occurred: {process.stderr}")
        raise SystemExit(process.returncode) # Raise SystemExit with the return code

def main():
    """Main function to parse command-line arguments and execute commands."""
    parser = argparse.ArgumentParser(description="Database reset script.")
    parser.add_argument("--mongo-container", help="MongoDB container name", required=True)
    parser.add_argument("--mongo-db", help="MongoDB database name", required=True)
    parser.add_argument("--repo-dir", help="Repository directory", required=True)

    args = parser.parse_args()

    try: # added try-except block
        print(f"Dropping database: {args.mongo_db} in container: {args.mongo_container}")
        execute_command(
            [
                "docker",
                "exec",
                "-it",  # Consider removing -it if not needed for interaction
                args.mongo_container,
                "mongosh",
                "--eval",
                f"db.getSiblingDB('{args.mongo_db}').dropDatabase()",
            ]
        )
        print(f"Changing directory to: {args.repo_dir}")
        os.chdir(args.repo_dir)

        print("Stopping existing containers...")
        execute_command(["docker","compose", "-f", "docker-compose.dev.yaml", "down"])

        print("Starting containers using docker-compose...")
        execute_command(["docker","compose", "-f", "docker-compose.dev.yaml", "up","--build","-d"])

        print("Database reset and services restarted successfully.")


    except FileNotFoundError as e:
        print(f"Error: {e}")
        SystemExit(1)
    except subprocess.CalledProcessError as e: # catch subprocess errors
        print(f"Command execution failed with return code {e.returncode}")
        print(f"Stdout: {e.stdout}")
        print(f"Stderr: {e.stderr}")
        SystemExit(e.returncode)
    except SystemExit as e:
        print(f"A critical error occurred. Exiting with code {e}")
        exit(e)  # Exit with the captured code

if __name__ == "__main__":
    main()