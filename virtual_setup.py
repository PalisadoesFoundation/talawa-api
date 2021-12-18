"""Extended code for Automated installation

This code is a part of the Automated installation
process of the Talawa API. This script is executed
exclusively inside the virtual environment.

1. User input

While setting up the application, it is necessary for the administrator,
to provide the secret tokens required to run the application.
More details of the user input can be found inside "setup/installation.py".

2. Install the JavaScript dependencies

The JavaScript dependencies that are required to run the application
are installed in this step. The program executes the "npm install" command,
and all dependencies listed within the "package.json" are installed.

3. Starting the application

The application then can be started with the "npm start" command,
and the logs will get simultaneously displayed on the console. This
step will need to be executed by the user.

More information about the setup functions can be found
in "setup/README.md" file

"""

import asyncio
from setup import installation, utils

# Display messagee on installng Python packages
utils.display_markdown("# INSTALLING PYTHON PACKAGES", "light_blue")
utils.display_success("Successfully installed Python packages :party_popper:")

# 1. Take input of details from user
with open("./setup/markdown/Input.md", encoding="utf-8") as user_input:
    utils.display_markdown(user_input.read(), "white")
installation.user_input()

# 2. Install JavaScript dependencies
utils.display_markdown("# INSTALLING JAVASCRIPT DEPENDENCIES", "white")
utils.console.print(
    "If you are installing the packages for the first time,\n" +
    "it may take a while...")
asyncio.run(
    installation.run(
        "npm install",
        "Successfully installed dependencies :party_popper:",
        "Failed to install dependencies :cross_mark:"))

# 3. Start the application
utils.display_markdown("# STARTING APPLICATION")
with open("./setup/markdown/Start.md", encoding="utf-8") as user_input:
    utils.display_markdown(user_input.read(), "white")
