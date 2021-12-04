"""Function that run after the installation of Talawa API has been completed.

These functions will be executed by the program
after the installation of Talawa API
has been successfully completed. They will display
the output or logs of the application on the shell.

"""
import subprocess
from setup import utils


def start():
    """Starts the application

    This function is called after the installation of Talawa API
    has been succesfully completed. It executes the command "npm start"
    to start the application, and also displays a message whether
    the application has successfully started or not.
    It also shows logs of the application on the console.

    Args:
        None

    Returns:
        None

    """
    with subprocess.Popen(["npm", "start"], shell=True) as process:

        if (process.returncode is not None) and (process.returncode != 0):
            utils.exit_process("ERROR: Could not start the application")
        else:
            utils.display_success(
                "Successfully started the application :party_popper:")

        stdout, stderr = process.communicate()
        if stderr:
            print(stderr.decode())
        else:
            print(stdout.decode())
