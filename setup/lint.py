"""Modules"""
import subprocess
import utils

utils.display_markdown("# LINTING SETUP CONFIGURATION")
process = subprocess.Popen(['autopep8', "--in-place",
                            "--aggressive", "setup.py"], shell=True)
process = subprocess.Popen(['pylint', "setup.py"], shell=True)

process = subprocess.Popen(
    ['autopep8', "--in-place", "--recursive", "setup"], shell=True)
process = subprocess.Popen(['pylint', "setup"], shell=True)
