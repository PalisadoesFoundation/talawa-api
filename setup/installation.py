import asyncio,getpass
from cryptography.fernet import Fernet
from setup.utils import *

#Function to encrypt any sensitive information
def encrypt_password(message):
    key = Fernet.generate_key()
    fernet = Fernet(key)
    encMessage = fernet.encrypt(message.encode())
    return encMessage

#Take input of super administrator
def user_input():
    
    name = input("Name: ")
    username = input("Username: ")
    password = getpass.getpass("Password: ")
    hashed_password = encrypt_password(password)

    access_token = getpass.getpass("Access token: ")
    refresh_token = getpass.getpass("Refresh token: ")
    mongodb_url = getpass.getpass("Mongodb Url: ")
    
    #Check if all the information is provided
    if not name or not username or not password or not access_token or not refresh_token or not mongodb_url:
        exit_process("All fields were not provided")
        exit()
    else:
        display_success("User configured successfully :party_popper:")

    #Create a file for environment variables
    f = open(".env","w+")
    f.write(f"NAME={name}\nUSERNAME={username}\nPASSWORD={hashed_password}\nACCESS_TOKEN_SECRET={access_token}\nREFRESH_TOKEN_SECRET={refresh_token}\nMONGO_DB_URL={mongodb_url}\n")

"""
To run any command on the shell
@parameters - cmd - command to run
            - success - message if command executed successfully
            - error - message if command failed to execute 
"""
async def run(cmd,success="Success",error="Error"):
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
            
        if proc.returncode == 0:
            display_success(success)
    except Exception as e:
        exit_process(e)
        exit_process(error)

