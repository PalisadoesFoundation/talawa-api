"""Functions that run during or before the installation.

These are the functions that run before the Talawa API is installed.
Every function has a final message associated with it - whether the execution
was successful or not.

"""
import getpass
import asyncio
from cryptography.fernet import Fernet
from pymongo import MongoClient
from setup.utils import display_success, exit_process


def encrypt_password(message):
    """Encrypts any sensitive information.

    This function will encrypt any text passed into it,
    and return the encrypted text, and a special key.
    The "generate_key()" method generates a new Fernet key.
    The text is then encrypted using the special key.

    Args:
        text: String
            Text to be encrypted

    Returns:
        list: [hashed_password,decryption_key]

    """
    key = Fernet.generate_key()
    fernet = Fernet(key)
    encrypted_message = fernet.encrypt(message.encode())
    return [encrypted_message, key]


def user_input():
    """Takes input of super administrator

    This method takes the input from the super administrator,
    and saves the necessary details by creating a ".env" file,
    if not already exists. It also checks whether all the fields
    were provided or not, else raises an error and exists the
    installation process.

    Args:
        None

    Returns:
        None
    """
    name = input("Name: ")
    username = input("Username: ")
    password = getpass.getpass("Password: ")
    hashed_password, decryption_key = encrypt_password(password)

    access_token = getpass.getpass("Access token: ")
    refresh_token = getpass.getpass("Refresh token: ")
    mongodb_url = getpass.getpass("Mongodb Url: ")

    # Check if all the information is provided
    if (not name) or (not username) or (not password):
        exit_process("All fields were not provided")
    elif (not access_token) or (not refresh_token) or (not mongodb_url):
        exit_process("Token or Database URL is missing")

    # Check MongoDB connection
    client = MongoClient(mongodb_url)
    try:
        client.server_info()
    except Exception as err:
        exit_process(err)

    # Create a file for environment variables and save it
    with open(".env", "w+", encoding="utf-8") as config:
        name = f"NAME={name}\n"
        username = f"USERNAME={username}\n"
        password = f"PASSWORD={hashed_password}\n"
        decryption_key = f"DECRYPTION_KEY={decryption_key}\n"
        access_token = f"ACCESS_TOKEN_SECRET={access_token}\n"
        refresh_token = f"REFRESH_TOKEN_SECRET={refresh_token}\n"
        mongodb_url = f"MONGO_DB_URL={mongodb_url}\n"
        data = name + username + password + decryption_key
        data += access_token + refresh_token + mongodb_url
        config.write(data)

    display_success("User configured successfully :party_popper:")

async def run(cmd, success="Success", error="Error"):
    """To run any command on the shell

    This function runs any gievn command in the shell,
    and on completion, displays a given message for success,
    or another message on encountering an error. The logs are
    also displayed on the console simultaneously.

    The function is made asynchronous using "asyncio" package,
    to ensure that for a series of commands, any latter command starts
    to be exected only after the former command has been executed.

    Args:
        cmd: String
            Command to be executed in the shell
        success: String
            Message if command executed successfully
        error: String
            Message if command failed to execute

    Returns:
        None

    """
    try:
        proc = await asyncio.create_subprocess_shell(
            cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE)

        stdout, stderr = await proc.communicate()
        if stdout:
            print(f"\n{stdout.decode()}")
        if stderr:
            print(f"[stderr]\n{stderr.decode()}")

        if proc.returncode is not None:
            display_success(success)
            return
    except RuntimeError as err:
        print(err)
        exit_process(err or error)
    else:
        pass
