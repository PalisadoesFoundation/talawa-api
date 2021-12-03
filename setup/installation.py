"""Modules"""
import getpass
import asyncio
from cryptography.fernet import Fernet
from setup.utils import display_success, exit_process


def encrypt_password(message):
    """Function to encrypt any sensitive information"""
    key = Fernet.generate_key()
    fernet = Fernet(key)
    encrypted_message = fernet.encrypt(message.encode())
    return encrypted_message


def user_input():
    """Take input of super administrator"""
    name = input("Name: ")
    username = input("Username: ")
    password = getpass.getpass("Password: ")
    hashed_password = encrypt_password(password)

    access_token = getpass.getpass("Access token: ")
    refresh_token = getpass.getpass("Refresh token: ")
    mongodb_url = getpass.getpass("Mongodb Url: ")

    """Check if all the information is provided"""
    if (not name) or (not username) or (not password):
        exit_process("All fields were not provided")
    elif (not access_token) or (not refresh_token) or (not mongodb_url):
        exit_process("Token or Database URL is missing")
    else:
        display_success("User configured successfully :party_popper:")

    """Create a file for environment variables and save it"""
    with open(".env", "w+", encoding="utf-8") as config:
        name = f"NAME={name}\n"
        username = f"USERNAME={username}\n"
        password = f"PASSWORD={hashed_password}\n"
        access_token = f"ACCESS_TOKEN_SECRET={access_token}\n"
        refresh_token = f"REFRESH_TOKEN_SECRET={refresh_token}\n"
        mongodb_url = f"nMONGO_DB_URL={mongodb_url}\n"
        data = name + username + password + access_token + refresh_token + mongodb_url
        config.write(data)


"""To run any command on the shell
@parameters - cmd - command to run
            - success - message if command executed successfully
            - error - message if command failed to execute
"""


async def run(cmd, success="Success", error="Error"):
    """Run the command"""
    try:
        proc = await asyncio.create_subprocess_shell(
            cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE)

        stdout, stderr = await proc.communicate()
        if stdout:
            print(f'\n{stdout.decode()}')
        if stderr:
            print(f'[stderr]\n{stderr.decode()}')

        if proc.returncode is None:
            display_success(success)
    except:
        """Exit on error"""
        exit_process(error)
