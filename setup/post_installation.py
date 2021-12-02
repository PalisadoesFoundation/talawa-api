from subprocess import *
from setup.utils import *

def start():
    process = Popen(['npm','start'],shell=True)
    
    if process.returncode != None:
        exit_process("ERROR: Could not start the application")
    else:
        display_success("Successfully started the application :party_popper:")

    stdout,stderr = process.communicate()
    if stderr:
        print(stderr.decode())
    else:
        print(stdout.decode())