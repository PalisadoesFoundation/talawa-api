"""This script is used to install Talawa API on your local machine."""
import base64
import datetime
import os
import re
import secrets
import shutil
import sys
import configparser
import pymongo
from pymongo import MongoClient
from getpass4 import getpass
import bcrypt
from dotenv import load_dotenv

DB_URL = ""


config = {
    "AccessTokenSecret": {"ACCESS_TOKEN_SECRET": ""},
    "RefreshTokenSecret": {"REFRESH_TOKEN_SECRET": ""},
    "DBConnectionString": {"MONGO_DB_URL=": ""},
    "reCAPTCHASecretKey": {"RECAPTCHA_SECRET_KEY": ""},
    "MailUsername": {"MAIL_USERNAME": ""},
    "MailPassword": {"MAIL_PASSWORD": ""},
}

ENV_VARS = {
    "ACCESS_TOKEN_SECRET": "",
    "REFRESH_TOKEN_SECRET": "",
    "MONGO_DB_URL": "",
    "RECAPTCHA_SECRET_KEY": "",
    "MAIL_USERNAME": "",
    "MAIL_PASSWORD": "",
}


def access_and_refresh_tokens(access_token_secret, refresh_token_secret):
    """Generate and updates the access and refresh token secrets in '.env' file."""
    config = configparser.ConfigParser(inline_comment_prefixes=(";", "#"))
    config.optionxform = str
    config.read(".env")

    if access_token_secret is None:
        access_token_secret = base64.b64encode(secrets.token_bytes(32)).decode()
        config["AccessTokenSecret"]["ACCESS_TOKEN_SECRET"] = access_token_secret
        with open(".env", "w", encoding="utf-8") as configfile:
            config.write(configfile, space_around_delimiters=False)

    if refresh_token_secret is None:
        refresh_token_secret = base64.b64encode(secrets.token_bytes(32)).decode()
        config["RefreshTokenSecret"]["REFRESH_TOKEN_SECRET"] = refresh_token_secret
        with open(".env", "w", encoding="utf-8") as configfile:
            config.write(configfile, space_around_delimiters=False)


def check_connection(url):
    """
    Check the connection to MongoDB with the specified URL.

    :param url: URL to connect to MongoDB.
    :return: True if connection is successful, otherwise raises an exception.
    """
    try:
        client = MongoClient(url)
        client.server_info()
        print("\nConnection to MongoDB successful! 🎉")
        return True
    except pymongo.errors.ServerSelectionTimeoutError as error:
        print("\nConnection to MongoDB failed. Please try again.\n")
        print(error)
        print("\nTry starting up MongoDB on your local machine")
        abort()
        return False
    except Exception as error:
        print("\nConnection to MongoDB failed. Please try again.")
        print("\nError: ", error)
        abort()
        return False


def mongo_db():
    """Request user to set up MongoDB and updates the URL in '.env' file."""
    global DB_URL

    try:
        choice = int(
            input(
                "\nWould you like to use a local instance or a cloud instance of MongoDB?\n\n0. Local\n1. Cloud\n\nEnter choice: "
            )
        )

        if choice == 0:
            url = "mongodb://localhost:27017/talawa-api?retryWrites=true&w=majority"
            success = check_connection(url)
            if success:
                DB_URL = url
                config = configparser.ConfigParser(inline_comment_prefixes=(";", "#"))
                config.optionxform = str
                config.read(".env")
                config["DBConnectionString"]["MONGO_DB_URL"] = DB_URL

                with open(".env", "w", encoding="utf-8") as configfile:
                    config.write(configfile, space_around_delimiters=False)
            else:
                print("\nConnection to MongoDB failed. Please try again.")
                print("\nTry starting up MongoDB on your local machine")
                abort()
        elif choice == 1:
            cloud_instance = input("\nEnter your MongoDB cloud instance URL: ")
            success = check_connection(cloud_instance)
            if success:
                DB_URL = cloud_instance
                config = configparser.ConfigParser(inline_comment_prefixes=(";", "#"))
                config.optionxform = str
                config.read(".env")
                config["DBConnectionString"]["MONGO_DB_URL"] = DB_URL

                with open(".env", "w", encoding="utf-8") as configfile:
                    config.write(configfile, space_around_delimiters=False)
            else:
                print("\nConnection to MongoDB failed. Please try again.")
                print("\nTry starting up MongoDB on your local machine")
                abort()
            DB_URL = cloud_instance
        else:
            print("\nInvalid choice. Please try again.\n")
            abort()
    except ValueError:
        print("\nInvalid choice. Please try again.\n")
        abort()


def recaptcha():
    """Request user to set up reCAPTCHA and updates the secret key in '.env' file."""
    print(
        "\nPlease visit this URL to set up reCAPTCHA:\n\nhttps://www.google.com/recaptcha/admin/create"
    )
    print("\nSelect reCAPTCHA v2")
    print("and the 'I'm not a robot' checkbox option\n")
    print("Add 'localhost in domains and accept the terms, then press submit")
    recaptcha_secret_key = input("\nEnter your reCAPTCHA secret site key: ")
    if not validate_recaptcha(recaptcha_secret_key):
        print("Invalid reCAPTCHA secret key. Please try again.")
        recaptcha_secret_key = input("\nEnter your reCAPTCHA secret site key: ")

    config = configparser.ConfigParser(inline_comment_prefixes=(";", "#"))
    config.optionxform = str
    config.read(".env")

    config["reCAPTCHASecretKey"]["RECAPTCHA_SECRET_KEY"] = recaptcha_secret_key

    with open(".env", "w", encoding="utf-8") as configfile:
        config.write(configfile, space_around_delimiters=False)


def is_valid_email(email):
    """Check if the email is valid."""
    pattern = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")
    match = pattern.match(email)
    return match is not None and match.group() == email


def validate_recaptcha(string):
    """Check if the reCAPTCHA secret key is valid."""
    pattern = r"^[6a-zA-Z0-9_-]{40}$"
    return bool(re.match(pattern, string))


def two_factor_auth():
    """Notifies user to set up Two-Factor Authentication on their Google Account."""
    print("\nIMPORTANT")
    print(
        "\nEnsure that you have Two-Factor Authentication set up on your Google Account. Visit this URL:"
    )
    print(
        "\nhttps://myaccount.google.com\n\nselect Security and under Signing in to Google section select App Passwords."
    )
    print(
        "Click on Select app section and choose Other(Custom name), enter talawa as the custom name and press Generate button."
    )

    email = input("\nEnter your email: ")
    if not is_valid_email(email):
        print("Invalid email. Please try again.")
        email = input("\nEnter your email: ")

    password = getpass("Enter the generated password: ")

    config = configparser.ConfigParser(inline_comment_prefixes=(";", "#"))
    config.optionxform = str
    config.read(".env")

    config["MailUsername"]["MAIL_USERNAME"] = email
    config["MailPassword"]["MAIL_PASSWORD"] = password

    with open(".env", "w", encoding="utf-8") as configfile:
        config.write(configfile, space_around_delimiters=False)


def check_super_admin():
    """Check if a Super Admin account already exists."""
    client = MongoClient(DB_URL)
    db = client["talawa-api"]
    users_collection = db["users"]

    super_admin = users_collection.find_one({"userType": "SUPERADMIN"})
    if super_admin:
        print("\nSuper Admin account already exists with the following mail:")
        print(super_admin["email"])
        return True

    print("\nNo Super Admin account exists. Creating one... 🎉")
    return False


def create_super_admin():
    """Create a Super Admin account for the first time."""
    client = MongoClient(DB_URL)
    db = client["talawa-api"]
    users_collection = db["users"]

    first_name = input("\nEnter your first name: ")
    last_name = input("Enter your last name: ")
    email = input("Enter your email: ")
    password = getpass("Password: ").encode("utf-8")
    hashed_password = bcrypt.hashpw(password, bcrypt.gensalt())

    new_user = {
        "firstName": first_name,
        "lastName": last_name,
        "email": email,
        "password": hashed_password.decode("utf-8"),
        "userType": "SUPERADMIN",
        "tokenVersion": 0,
        "appLanguageCode": "en",
        "createdOrganizations": [],
        "createdEvents": [],
        "joinedOrganizations": [],
        "registeredEvents": [],
        "eventAdmin": [],
        "adminFor": [],
        "membershipRequests": [],
        "organizationsBlockedBy": [],
        "status": "ACTIVE",
        "pluginCreationAllowed": True,
        "adminApproved": True,
        "organizationUserBelongsTo": None,
        "image": "https://picsum.photos/50",
        "createdAt": datetime.datetime.utcnow(),
        "__v": 0,
    }
    users_collection.insert_one(new_user)
    client.close()


def abort():
    """Aborts the installation process."""
    print("\nInstallation process aborted. 🫠")
    sys.exit()


def main():
    """Run main function to begin the installation process."""
    global DB_URL
    load_dotenv(dotenv_path=".env")

    print("Welcome to the Talawa API installer! 🚀")

    if not os.path.exists(".env"):
        shutil.copy(".env.sample", ".env")

    else:
        for key in ENV_VARS:
            env_value = os.getenv(key)
            if env_value is not None:
                ENV_VARS[key] = env_value

    if ENV_VARS["ACCESS_TOKEN_SECRET"] != "":
        print(
            f"\nAccess token secret already exists with the value\nACCESS_TOKEN_SECRET = {ENV_VARS['ACCESS_TOKEN_SECRET']}"
        )
    access_token_rewrite = input(
        "Would you like to generate a new access token secret? (y/n): "
    )

    if access_token_rewrite in ["n", "N"]:
        access_token = ENV_VARS["ACCESS_TOKEN_SECRET"]
    elif access_token_rewrite in ["y", "Y"]:
        access_token = None

    if ENV_VARS["REFRESH_TOKEN_SECRET"] != "":
        print(
            f"\nRefresh token secret already exists with the value\nREFRESH_TOKEN_SECRET = {ENV_VARS['REFRESH_TOKEN_SECRET']}"
        )
    refresh_token_rewrite = input(
        "Would you like to generate a new refresh token secret? (y/n): "
    )
    if refresh_token_rewrite in ["n", "N"]:
        refresh_token = ENV_VARS["ACCESS_TOKEN_SECRET"]
    elif refresh_token_rewrite in ["y", "Y"]:
        refresh_token = None

    access_and_refresh_tokens(access_token, refresh_token)

    if ENV_VARS["MONGO_DB_URL"] == "":
        mongo_db()
    else:
        print(
            f"\nMongoDB URL already exists with the value\nMONGO_DB_URL = {ENV_VARS['MONGO_DB_URL']}"
        )
        choice = input("Would you like to use the same MongoDB URL? (y/n): ")
        if choice in ["n", "N"]:
            mongo_db()
        elif choice in ["y", "Y"]:
            DB_URL = ENV_VARS["MONGO_DB_URL"]

    if ENV_VARS["RECAPTCHA_SECRET_KEY"] == "":
        recaptcha()
    else:
        print(
            f"\nreCAPTCHA secret key already exists with the value\nRECAPTCHA_SECRET_KEY = {ENV_VARS['RECAPTCHA_SECRET_KEY']}"
        )
        choice = input("Would you like to use the same reCAPTCHA secret key? (y/n): ")
        if choice in ["n", "N"]:
            recaptcha()
        elif choice in ["y", "Y"]:
            pass

    if ENV_VARS["MAIL_USERNAME"] == "":
        two_factor_auth()
    else:
        print(
            f"\nMail username already exists with the value\nMAIL_USERNAME = {ENV_VARS['MAIL_USERNAME']}"
        )
        choice = input("Would you like to use the same mail username? (y/n): ")
        if choice in ["n", "N"]:
            two_factor_auth()
        elif choice in ["y", "Y"]:
            pass

    super_admin = check_super_admin()

    if super_admin:
        pass
    else:
        create_super_admin()

    print("\nCongratulations! Talawa API has been successfully installed! 🥂🎉")


if __name__ == "__main__":
    main()
