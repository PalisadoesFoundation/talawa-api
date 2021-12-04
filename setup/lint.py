"""Linting the code.

This script contains the instructions to be executed to lint
the code using "pylint" and fix it simultaneously using the
"autopep8" package.

It executes in the following order:

1. Lint the setup.py file, or driver code of installation.
2. Fix the file using autopep8.
3. Lint the custom setup module like 1.
4. Fix the custom setup module like 2.

"""
import subprocess
from setup import utils

utils.display_markdown("# LINTING SETUP CONFIGURATION")
COMMANDS = ["autopep8", "--in-place", "--aggressive", "setup.py"]
with subprocess.Popen(COMMANDS, shell=True) as process:
    pass
COMMANDS = ["pylint", "setup.py"]
with subprocess.Popen(COMMANDS, shell=True) as process:
    pass
COMMANDS = ["autopep8", "--in-place", "--recursive", "setup"]
with subprocess.Popen(COMMANDS, shell=True) as process:
    pass
COMMANDS = ["pylint", "setup"]
with subprocess.Popen(COMMANDS, shell=True) as process:
    pass
