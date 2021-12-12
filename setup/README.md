# Setup

This is a supporting custom Python module dedicated to the automated installation of the Talawa API in a device. 

## Contents

It contains the following files and subdirectories:

```sh

setup
├── __init__.py
├── installation.py
├── post_installation.py
├── utils.py
└── markdown
    ├── About.md
    └── Input.md

```

A brief explanation of each of the contents of this file is given below :

- installation.py : This file contails all the functions that are necessary to execute the installation of the Talawa API. 

- post_installation.py : This file contails all the functions that run after the installation of the Talawa API has been completed successfully.

- utils.py : This file contains some helper functions that are necessary in the above two programs

- markdown : This subdirectory contains the data displayed during installation of the Talawa API
    - About.md - This is the information that is displayed when the installation of the Talawa API begins 
    - Input.md - This file contains the instructions that are shown when the user provides the program credentials as input. 




