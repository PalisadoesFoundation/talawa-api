import argparse
import subprocess

def execute_command(cmd):
    """Execute a shell command."""
    process = subprocess.run(cmd, capture_output=True, text=True)

    if process.returncode != 0:
        print(f"Error occurred: {process.stderr}")
    else:
        print(process.stdout)

def main():
    """Main function to parse arguments and execute commands."""
    parser = argparse.ArgumentParser(description="Permission correction script.")
    parser.add_argument("--user", help="User to set as owner", default="talawa-api")
    parser.add_argument("--files", nargs='+', help="Files to correct permissions for", required=True)

    args = parser.parse_args()

    for file in args.files:
        # Check and correct ownership
        execute_command(["chown", args.user, file])

        # Check and correct permissions
        execute_command(["chmod", "700", file])

if __name__ == "__main__":
    main()