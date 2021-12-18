"""Driver code for automated installation.

This program will install Talawa API on the system.
It executes the pre-defined commands on the shell and
then logs the output of each step.The application runs
on a virtual environment created using Python. Every
installation process shows a message - whether the
installation was successful or not.

The installation process is divided into 8 (eight) stages:

1. Shift to the Talawa API directory
Before executing any command, it is necessary to ensure
that the current path lies within the scope of Talawa API.
So, in this section, we navigate to the directory
from where this script is being executed.

2. Displaying initial data

This section shows teh following information about Talawa API:
    - about the Talawa API
    - core features in the application
    - a link to The Palisadoes Foundation
This content is available at "setup/markdown/About.md"
in the form of a markdown file.

3. Installing a virtual environment

In this step, Python"s "virtualenv" is installed,
and a virtual environment is created.
The final result is displayed on the terminal.

4. Activate the virtual environment

The virtual environment is activated,
and the current directory is now updated to the virtual environment.


5. Installing Python packages

In this step, all the Python packages, necessary for
the automated installation, are installed inside the virtual
environment. The command to install these packages is executed
within the 'setup' script of 'package.json' file. This is an
intermediate step when the execution shifts from 'setup.py' to
the 'virtual_setup.py' script. The list of packages is available
within the "requirements.txt" file in root folder.

The control now shifts to the 'virtual_setup.py' script
which is responsible for continuing the installation
process within the virtual environment that was created
above.

"""
import os
import asyncio
import pathlib
import platform
from setup import installation, utils

# 1. Shift to the Talawa API directory
path = pathlib.Path(__file__).parent.resolve()
os.chdir(path)

# 2. Display initial data
utils.display_markdown("# Talawa API")
with open("./setup/markdown/About.md", encoding="utf-8") as about:
    utils.display_markdown(about.read(), "white")

# 3. Installing a virtual environment
utils.display_markdown("# SETTING UP ENVIRONMENT", "light_blue")
VIRTUAL_ENV_INSTALLATION_COMMAND = 'pip install virtualenv --user && python -m pip install -U pip'
if platform.system() == "Debian":
    VIRTUAL_ENV_INSTALLATION_COMMAND = 'sudo apt install virtualenv'
elif platform.system() == "Linux":
    VIRTUAL_ENV_INSTALLATION_COMMAND = 'apt-get install -y python3-venv'
asyncio.run(
    installation.run(
        VIRTUAL_ENV_INSTALLATION_COMMAND,
        "Successfully installed [bold]virtualenv[/bold] :party_popper:",
        "Failed to install virtualenv :cross_mark:"))
asyncio.run(
    installation.run(
        "virtualenv venv",
        "Successfully created a virtual environment :party_popper:",
        "Failed to create a virtual environment :cross_mark:"))


# 4. Activate virtual environment
VIRTUAL_ENV_PATH = 'venv\\Scripts\\Activate'
if platform.system() != 'Windows':
    VIRTUAL_ENV_PATH = 'source venv/bin/activate'
print(VIRTUAL_ENV_PATH)
asyncio.run(
    installation.run(
        VIRTUAL_ENV_PATH,
        "Successfully activated virtual environment :party_popper:",
        "Failed to activate virtual environment :cross_mark:"))
