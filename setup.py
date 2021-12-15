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
environment. The list of packages is available within the
"requirements.txt" file in root folder.

6. User input

While setting up the application, it is necessary for the administrator,
to provide the secret tokens required to run the application.
More details of the user input can be found inside "setup/installation.py".

7. Install the JavaScript dependencies

The JavaScript dependencies that are required to run the application
are installed in this step. The program executes the "npm install" command,
and all dependencies listed within the "package.json" are installed.

8. Starting the application

The application is then started with the "npm start" command,
and the logs are simultaneously displayed on the console.

More information about the setup functions can be found
in "setup/README.md" file

"""
import os
import asyncio
import pathlib
from setup import installation, post_installation, utils

# 1. Shift to the Talawa API directory
path = pathlib.Path(__file__).parent.resolve()
os.chdir(path)

# 2. Display initial data
utils.display_markdown("# Talawa API")
with open("./setup/markdown/About.md", encoding="utf-8") as about:
    utils.display_markdown(about.read(), "white")

# 3. Installing a virtual environment
utils.display_markdown("# SETTING UP ENVIRONMENT", "light_blue")
asyncio.run(
    installation.run(
        "pip install virtualenv --user && python -m pip install -U pip",
        "Successfully installed [bold]virtualenv[/bold] :party_popper:",
        "Failed to install virtualenv :cross_mark:"))
asyncio.run(
    installation.run(
        "python -m venv ./venv",
        "Successfully created a virtual environment :party_popper:",
        "Failed to create a virtual environment :cross_mark:"))


# 4. Activate virtual environment
VIRTUAL_ENV_PATH = 'venv\\Scripts\\activate'
asyncio.run(
    installation.run(
        VIRTUAL_ENV_PATH,
        "Successfully activated virtual environment :party_popper:",
        "Failed to activate virtual environment :cross_mark:"))

# 5. Install Python packages
utils.display_markdown("# INSTALLING PYTHON PACKAGES", "light_blue")
asyncio.run(
    installation.run(
        "pip install -r requirements.txt --user --ignore-installed" +
        "--no-warn-script-location && pip install pylint-runner --user",
        "Successfully installed Python packages :party_popper:",
        "Failed to install requirements :cross_mark:"))

# 6. Take input of details from user
with open("./setup/markdown/Input.md", encoding="utf-8") as user_input:
    utils.display_markdown(user_input.read(), "white")
installation.user_input()

# 7. Install JavaScript dependencies
utils.display_markdown("# INSTALLING JAVASCRIPT DEPENDENCIES", "white")
utils.console.print(
    "If you are installing the packages for the first time,\n" +
    "it may take a while...")
asyncio.run(
    installation.run(
        "npm install",
        "Successfully installed dependencies :party_popper:",
        "Failed to install dependencies :cross_mark:"))

# 8. Start the application
utils.display_markdown("# STARTING APPLICATION")
post_installation.start()
