"""Modules"""
import asyncio
from setup import installation, post_installation, utils

"""Display initial data"""
utils.display_markdown('# Talawa API')
with open('./setup/data/About.md', encoding="utf-8") as about:
    utils.display_markdown(about.read(), "white")

"""Set up virtual environment by installing virtualenv and creating it"""
utils.display_markdown('# SETTING UP ENVIRONMENT', 'light_blue')
asyncio.run(
    installation.run(
        "pip install virtualenv",
        "Successfully installed [bold cyan]virtualenv[/bold cyan] :party_popper:",
        "Failed to install virtualenv :cross_mark:"))
asyncio.run(
    installation.run(
        "virtualenv venv",
        "Successfully created a virtual environment :party_popper:",
        "Failed to create a virtual environment :cross_mark:"))

"""Activate virtual environment"""
VIRTUAL_ENV_PATH = "venv\\Scripts\\activate_this.py"
with open(VIRTUAL_ENV_PATH, encoding="utf-8") as f:
    code = compile(f.read(), VIRTUAL_ENV_PATH, 'exec')
    exec(code, dict(__file__=VIRTUAL_ENV_PATH))

"""Insttall Python packages as in requirements.txt"""
utils.display_markdown('# INSTALLING PYTHON PACKAGES', 'light_blue')
asyncio.run(
    installation.run(
        "pip install -r requirements.txt",
        "Successfully installed Python packages :party_popper:",
        "Failed to install requirements :cross_mark:"))

"""Take input of details from user"""
with open('./setup/data/Input.md', encoding="utf-8") as user_input:
    utils.display_markdown(user_input.read(), "white")
installation.user_input()

"""Install JavaSceipt dependencies as in package.json"""
utils.display_markdown("# INSTALLING JAVASCRIPT DEPENDENCIES", "white")
utils.console.print(
    "If you are installing the packages for the first time, it may take a while...")
asyncio.run(
    installation.run(
        "npm install",
        "Successfully installed dependencies :party_popper:",
        "Failed to install dependencies :cross_mark:"))

"""Start the application"""
utils.display_markdown("# STARTING APPLICATION")
post_installation.start()
