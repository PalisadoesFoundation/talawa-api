# Setup

This directory contains all the scripts required to execute the **automated installation** process of Talawa API. Each file contains a function to complete a particular step. All the functions are asynchronous and display whether the operation has been completed successfully or not.

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
Let's go through each file and understand the processes running behind the hood.


## Display_About.js
This file displays the core features of Talawa that are present in  _about_ file in the _markdown_ folder. The _display_about_ function is for reading and displaying the content.

![Image](https://res.cloudinary.com/dtqeozivt/image/upload/v1650680373/display_about_ik4vjs.png)


## Install_Dependencies.js

This file handles the installation of the dependencies. There are two main functions in it:

 -  **For displaying the message:** 

It reads data from the _Install_ file in the _markdown_ folder.
![Image](https://res.cloudinary.com/dtqeozivt/image/upload/v1650720149/install1_fkrnmn.png)

 - **For installing the dependencies:**
 The `npm install -f` does all the work for us as shown here:
 
 ![Image](https://res.cloudinary.com/dtqeozivt/image/upload/v1650720150/install2_h62qfe.png)

The success/ error message is logged in a styled manner with the help of the [chalk](https://www.npmjs.com/package/chalk) package.

## Set_User_Configuration.js
This file takes user input for the required variables and saves them in a .env file after the following steps:

 - Converting the user input to strings for storing in the .env file
 
 ![Image](https://res.cloudinary.com/dtqeozivt/image/upload/v1650720869/install3_e3okid.png)
 - Verifying the MongoDB URL using a function written in _Check_Mongo_URL.js_ in the _utils_ folder.
 - If the URL is valid, then save it in the .env file
 
 The following code performs the above-mentioned operations:![Image](https://res.cloudinary.com/dtqeozivt/image/upload/v1650722139/user_input_bstjpv.png)

## Start_Application.js

Well, if you have finished all the steps of installation, the instructions in this file will take you from here!
![Image](https://res.cloudinary.com/dtqeozivt/image/upload/v1650720869/start_1_kgueq8.png)

To start the application, run the command: `npm start`

If any error occurs, the try-catch block will help us in logging it as shown:
![Image](https://res.cloudinary.com/dtqeozivt/image/upload/v1650720869/start_2_cllene.png)

## User_Input.js
The following functions are performed with the help of this file:

 - **Asking for user preference if he/she wants to set up the environment variables:**
 The function used for this operation is shown here:
 
![https://res.cloudinary.com/dtqeozivt/image/upload/v1650720877/user1_jq3e7n.png](https://res.cloudinary.com/dtqeozivt/image/upload/v1650720877/user1_jq3e7n.png)


 - **Taking user response and setting the variables:**
 After taking input from the user, it is passed to the  _Set_User_Configuration.js_ file to proceed further. The _if_ block confirms whether the user wants to set up the environment variables or not.
 
 ![https://res.cloudinary.com/dtqeozivt/image/upload/v1650720877/user_2_quas0w.png](https://res.cloudinary.com/dtqeozivt/image/upload/v1650720877/user_2_quas0w.png)



## Utils
This sub-directory contains some utility functions needed throughout the installation process.

Let's walk through each file once:

### **Check_Mongo_URL**
This file checks if the MongoDB URL is valid. We use the [mongoose](https://www.npmjs.com/package/mongoose) package to connect to the database with the provided URL. If the connection gets established, it means that the URL is valid.

![https://res.cloudinary.com/dtqeozivt/image/upload/v1650726177/Screenshot_2022-04-23_203238_c2rirh.png](https://res.cloudinary.com/dtqeozivt/image/upload/v1650726177/Screenshot_2022-04-23_203238_c2rirh.png)

### **Display_Heading**
The functions of this file display the headings for the installation process with _style_. The [boxen](https://www.npmjs.com/package/boxen) and [chalk](https://www.npmjs.com/package/chalk) packages add flavors to the CSS written by the developers.

![https://res.cloudinary.com/dtqeozivt/image/upload/v1650725600/display_heading_qjxnfj.png](https://res.cloudinary.com/dtqeozivt/image/upload/v1650725600/display_heading_qjxnfj.png)

### **Display_Markdown**
The contents of a markdown file are displayed with the help of the [marked](https://www.npmjs.com/package/marked) package.

![https://res.cloudinary.com/dtqeozivt/image/upload/v1650725600/display_markdown_wxsaxg.png](https://res.cloudinary.com/dtqeozivt/image/upload/v1650725600/display_markdown_wxsaxg.png)

### **Input**
The function takes user input in the console and returns an object containing the response of the user. [inquirer](https://www.npmjs.com/package/inquirer) package is used here.
![https://res.cloudinary.com/dtqeozivt/image/upload/v1650726037/input_ftcesy.png](https://res.cloudinary.com/dtqeozivt/image/upload/v1650726037/input_ftcesy.png)


## markdown
This directory contains the markdown texts displayed during the installation process.

#### About
The information about the Talawa project core features is in this file imported by the _Display_About_ file.

#### Install
This file contains the message to be displayed during the installation of project dependencies read by the _Install_Dependencies_ file.

