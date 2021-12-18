# Setup

This is a supporting custom Python module dedicated to the automated installation of the Talawa API in a device. 

## Contents

It contains the following files and subdirectories:

```sh

setup
├── __init__.py
├── installation.py
├── utils.py
└── markdown
    ├── About.md
    └── Input.md

```

A brief explanation of each of the contents of this file is given below :

- [installation.py](./installation.py) : This file contails all the functions that are necessary to execute the installation of the Talawa API. These functions are: 
    - **encrypt_password(text : String) -> [encrypted_text : String, decryptiom_key : String]**: 
        This function takes a text and encrypts it by generating a random key using the 'cryptography' module. It returns the encrypted text, and the special key that can be used to decrypt the text. It is used to encrypt the password provided by the user. 
    - **user_input(None) -> None**: 
        This function is used to take input from the user and set the environment variables. After taking input, it checks whether any field has been missed by the user and then verifies the connection strings by making a connection to the database. If all checks have passed, it creates a ```.env``` file, and stores these credentials as environment variables. 
    - **run(command : String, success_message : String, error_message : String) -> None**:
        This function is used to execute any command passed on as parameter. It also takes the two parameters of ```success_message``` and ```error_message``` that will be displayed upon encountering any success and error respectively, during the execution of the command. It is of async type, to maintain the flow of execution of multiple commands.

- [utils.py](./utils.py) : This file contains some helper functions that are necessary in the above two programs
    - **display_markdown(text : String, color : String) -> None**:
        This function is used to display any markdown-type content on the console. the color of the text can be changed by passing the color. Default color is *yellow*
    - **display_success(text : String, color : String) -> None**:
        This function is used to display any message of successful execution, on the console. Color can be changed by passing the parameter. Default color is *yellow*. 
    - **exit_process(text : String) -> None**:
        this function is used to exit the installation process whenever something unexpected happens. It displays the reason of terminating the process, and finally exits the process.


- markdown : This subdirectory contains the data displayed during installation of the Talawa API
    - [About.md](./markdown/About.md) - This is the information that is displayed when the installation of the Talawa API begins 
    - [Input.md](./markdown/Input.md) - This file contains the instructions that are shown when the user provides the program credentials as input. 
    - [Start.md](./markdown/Start.md) - This file contains the final message that is displayed to the user when the installation of the Talawa API has been completed.




