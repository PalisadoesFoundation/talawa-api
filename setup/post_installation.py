"""Modules"""
import subprocess
from setup import utils


def start():
    """Begin the application"""
    process = subprocess.Popen(['npm', 'start'], shell=True)

    if process.returncode is not None:
        utils.exit_process("ERROR: Could not start the application")
    else:
        utils.display_success(
            "Successfully started the application :party_popper:")

    stdout, stderr = process.communicate()
    if stderr:
        print(stderr.decode())
    else:
        print(stdout.decode())
