# Setup

This directory contains all the scripts required to execute the automated installation process of Talawa API. Each file contains a function to complete a particular step. All the functions are asynchronous and display whether the step has been completed successfully or not. 

The ```utils``` sub-directory contains some other necessary functions that are required in multiple steps. The ```markdown``` sub-directory contains some markdown text to be displayed during the installation steps.

## Structure

```
setup
├── Display_About.js
├── Install_Dependencies.js
├── Set_User_Configuration.js
├── Start_Application.js
├── User_Input.js
├── Setup.md
├── utils
│   ├── Check_Mongo_URL.js
│   ├── Display_Heading.js
│   ├── Display_Markdown.js
│   └── Input.js    
└── markdown
    ├── About.md
    └── Install.md
```

## Contents 

- **Display_About** - This file contains the function to display some information about Talawa 
- **Install_Dependencies** - This file contains the function to install all the project dependencies
- **Set_User_Configuration** - This file contains the function to ask fro user's choice of setting up environment variables 
- **Start_Application** - This file contains the function to display the command of starting the application
- **User** - This file contains the function to take the environment variables as input from the user, verify the MongoDB connection, and finally save these variables in a ```.env``` file
- **utils** - This sub-directory contains some utility functions that are needed throughtout the installation process. 
    - **Check_Mongo_URL** - This code checks if the MongoDB URL is valid 
    - **Display_Heading** - This code helps to display headings of each step of installation 
    - **Display_Markdown** - This code helps to render markdown texts  
    - **Input** - This code helps to take input from user, in the console 
- **markdown** - This file contains the markdown texts to be displayed during the installation process
    - **About.md** - The information about Talawa
    - **Install.md** - The message to be displayed during installation of project dependencies