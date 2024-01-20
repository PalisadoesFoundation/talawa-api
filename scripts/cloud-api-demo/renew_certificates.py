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
        SystemExit: If the executed command returns a non-zero exit code.
    """
    parser = argparse.ArgumentParser(description="SSL certificate renewal script.")
    parser.add_argument("--config-dir", help="Certbot config directory", required=True)
    parser.add_argument("--logs-dir", help="Certbot logs directory", required=True)
    parser.add_argument("--work-dir", help="Certbot work directory", required=True)

    args = parser.parse_args()

    # Renew the certificates
    execute_command(
        [
            "certbot",
            "renew",
            "--config-dir",
            args.config_dir,
            "--logs-dir",
            args.logs_dir,
            "--work-dir",
            args.work_dir,
        ]
    )


if __name__ == "__main__":
    main()
