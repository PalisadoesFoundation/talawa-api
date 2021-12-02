import asyncio
from setup import installation,post_installation,utils

#Display initial data
utils.display_markdown('# Talawa API')
with open('./setup/data/About.md') as about:
    utils.display_markdown(about.read(),"white")

#Set up virtual environment
utils.display_markdown('# SETTING UP ENVIRONMENT','light_blue')
asyncio.run(installation.run("pip install virtualenv","Successfully installed [bold cyan]virtualenv[/bold cyan] :party_popper:","Failed to install virtualenv :cross_mark:"))
asyncio.run(installation.run("virtualenv venv","Successfully created a virtual environment :party_popper:","Failed to create a virtual environment :cross_mark:"))

#Activate virtual environment
activate_this = "venv\Scripts\\activate_this.py"
with open(activate_this) as f:
    code = compile(f.read(), activate_this, 'exec')
    exec(code, dict(__file__=activate_this))

#Insttall python packages
utils.display_markdown('# INSTALLING PYTHON PACKAGES','light_blue')
asyncio.run(installation.run("pip install -r requirements.txt","Successfully installed Python packages :party_popper:","Failed to install requirements :cross_mark:"))

#Take input from user
with open('./setup/data/Input.md') as input:
    utils.display_markdown(input.read(),"white")
installation.user_input()

#Install dependencies
utils.display_markdown("# INSTALLING JAVASCRIPT DEPENDENCIES","white")
utils.console.print("If you are installing the packages for the first time, it may take a while...")
asyncio.run(installation.run("npm install","Successfully installed dependencies :party_popper:","Failed to install dependencies :cross_mark:"))

#Start the application
utils.display_markdown("# STARTING APPLICATION")
post_installation.start()