#!/usr/bin/env python3
import argparse
import os


def main():
    """Main function to parse arguments and create .env file.

    Args:
        None

    Raises:
        IOError: If there is an issue writing to the .env file.
    """
    # Define the command line arguments
    parser = argparse.ArgumentParser(description="Create .env file")
    parser.add_argument(
        "--access_token_secret", required=True, help="Access token secret"
    )
    parser.add_argument(
        "--refresh_token_secret", required=True, help="Refresh token secret"
    )
    parser.add_argument(
        "--recaptcha_secret_key", required=True, help="Recaptcha secret key"
    )
    parser.add_argument("--mail_username", required=True, help="Mail username")
    parser.add_argument("--mail_password", required=True, help="Mail password")
    parser.add_argument(
        "--last_resort_superadmin_email",
        required=True,
        help="Last resort superadmin email",
    )
    parser.add_argument(
        "--minio_root_user", required=True, help="Minio root user"
    )
    parser.add_argument(
        "--minio_root_password", required=True, help="Minio root password"
    )

    # Parse the command line arguments
    args = parser.parse_args()

    # Define the .env file contents
    env_contents = f"""
    NODE_ENV=
    ACCESS_TOKEN_SECRET={args.access_token_secret}
    REFRESH_TOKEN_SECRET={args.refresh_token_secret}
    MONGO_DB_URL=mongodb://localhost:27017/talawa-api
    RECAPTCHA_SECRET_KEY={args.recaptcha_secret_key}
    MAIL_USERNAME={args.mail_username}
    MAIL_PASSWORD={args.mail_password}
    IS_SMTP=
    SMTP_HOST=
    SMTP_PASSWORD=
    SMTP_USERNAME=
    SMTP_PORT=
    SMTP_SSL_TLS=
    LAST_RESORT_SUPERADMIN_EMAIL={args.last_resort_superadmin_email}
    COLORIZE_LOGS=false
    LOG_LEVEL=info
    REDIS_HOST=localhost
    REDIS_PORT=6379
    REDIS_PASSWORD=
    TALAWA_ADMIN_URL=api-demo.talawa.io
    MINIO_ROOT_USER={args.minio_root_user}
    MINIO_ROOT_PASSWORD={args.minio_root_password}
    MINIO_ENDPOINT=
    """

    # Write the .env file
    try:
        home = os.path.expanduser("~")
        with open(os.path.join(home, "develop", ".env"), "w") as f:
            f.write(env_contents)
    except IOError as e:
        print(f"Error occurred: {e}")
        raise SystemExit(1)


if __name__ == "__main__":
    main()
