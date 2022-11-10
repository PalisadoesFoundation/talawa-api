# setup

This directory contains all the scripts required to execute the **automated installation** process of Talawa API. Each file contains a function to complete a particular step. All the functions are asynchronous and display whether the operation has been completed successfully or not.

## Structure

```
setup
├── displayAbout.js
├── installDependencies.js
├── setUserConfiguration.js
├── startApplication.js
├── userInput.js
├── setup.md
├── utils
│   ├── checkMongoURL.js
│   ├── displayHeading.js
│   ├── displayMarkdown.js
│   └── input.js
└── markdown
    ├── About.md
    └── install.md
```

Let's go through each file and understand the processes running behind the hood.

## displayAbout.js

This file displays the core features of Talawa that are present in _about_ file in the _markdown_ folder. The _displayAbout_ function is for reading and displaying the content.

![Image](https://res.cloudinary.com/dtqeozivt/image/upload/v1650680373/display_about_ik4vjs.png)

## installDependencies.js

This file handles the installation of the dependencies. There are two main functions in it:

- **For displaying the message:**

It reads data from the _install_ file in the _markdown_ folder.
![Image](https://res.cloudinary.com/dtqeozivt/image/upload/v1650720149/install1_fkrnmn.png)

- **For installing the dependencies:**
  The `npm install -f` does all the work for us as shown here:

![Image](https://res.cloudinary.com/dtqeozivt/image/upload/v1650720150/install2_h62qfe.png)

The success/ error message is logged in a styled manner with the help of the [chalk](https://www.npmjs.com/package/chalk) package.

## setUserConfiguration.js

This file takes user input for the required variables and saves them in a .env file after the following steps:

- Converting the user input to strings for storing in the .env file

![Image](https://res.cloudinary.com/dtqeozivt/image/upload/v1650720869/install3_e3okid.png)

- Verifying the MongoDB URL using a function written in _checkMongoURL.js_ in the _utils_ folder.
- If the URL is valid, then save it in the .env file

The following code performs the above-mentioned operations:![Image](https://res.cloudinary.com/dtqeozivt/image/upload/v1650722139/user_input_bstjpv.png)

## startApplication.js

Well, if you have finished all the steps of installation, the instructions in this file will take you from here!
![Image](https://res.cloudinary.com/dtqeozivt/image/upload/v1650720869/start_1_kgueq8.png)

To start the application, run the command: `npm start`

If any error occurs, the try-catch block will help us in logging it as shown:
![Image](https://res.cloudinary.com/dtqeozivt/image/upload/v1650720869/start_2_cllene.png)

## userInput.js

The following functions are performed with the help of this file:

- **Asking for user preference if he/she wants to set up the environment variables:**
  The function used for this operation is shown here:

![https://res.cloudinary.com/dtqeozivt/image/upload/v1650720877/user1_jq3e7n.png](https://res.cloudinary.com/dtqeozivt/image/upload/v1650720877/user1_jq3e7n.png)

- **Taking user response and setting the variables:**
  After taking input from the user, it is passed to the _setUserConfiguration.js_ file to proceed further. The _if_ block confirms whether the user wants to set up the environment variables or not.

![https://res.cloudinary.com/dtqeozivt/image/upload/v1650720877/user_2_quas0w.png](https://res.cloudinary.com/dtqeozivt/image/upload/v1650720877/user_2_quas0w.png)

## Utils

This sub-directory contains some utility functions needed throughout the installation process.

Let's walk through each file once:

### **checkMongoURL**

This file checks if the MongoDB URL is valid. We use the [mongoose](https://www.npmjs.com/package/mongoose) package to connect to the database with the provided URL. If the connection gets established, it means that the URL is valid.

![https://res.cloudinary.com/dtqeozivt/image/upload/v1650726177/Screenshot_2022-04-23_203238_c2rirh.png](https://res.cloudinary.com/dtqeozivt/image/upload/v1650726177/Screenshot_2022-04-23_203238_c2rirh.png)

### **displayHeading**

The functions of this file display the headings for the installation process with _style_. The [boxen](https://www.npmjs.com/package/boxen) and [chalk](https://www.npmjs.com/package/chalk) packages add flavors to the CSS written by the developers.

![https://res.cloudinary.com/dtqeozivt/image/upload/v1650725600/display_heading_qjxnfj.png](https://res.cloudinary.com/dtqeozivt/image/upload/v1650725600/display_heading_qjxnfj.png)

### **displayMarkdown**

The contents of a markdown file are displayed with the help of the [marked](https://www.npmjs.com/package/marked) package.

![https://res.cloudinary.com/dtqeozivt/image/upload/v1650725600/display_markdown_wxsaxg.png](https://res.cloudinary.com/dtqeozivt/image/upload/v1650725600/display_markdown_wxsaxg.png)

### **input**

The function takes user input in the console and returns an object containing the response of the user. [inquirer](https://www.npmjs.com/package/inquirer) package is used here.
![https://res.cloudinary.com/dtqeozivt/image/upload/v1650726037/input_ftcesy.png](https://res.cloudinary.com/dtqeozivt/image/upload/v1650726037/input_ftcesy.png)

## markdown

This directory contains the markdown texts displayed during the installation process.

#### About

The information about the Talawa project core features is in this file imported by the _displayAbout_ file.

#### install

This file contains the message to be displayed during the installation of project dependencies read by the _installDependencies_ file.
