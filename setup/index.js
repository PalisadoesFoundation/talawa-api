/**
 * @brief Driver code for express installation
 * @description This code installs the Talawa API by
 * running the individual steps automatically. The
 * process consists of 4 steps:
 * 1. Displaying information about Talawa API
 * 2. Install project dependencies
 * 3. Set up user configuration
 * 4. Display command to start the application
 *
 * Every step displays whether it has been
 * executed successfully or not
 */
const path = require("path");
const displayAbout = require("./displayAbout");
const installDependencies = require("./installDependencies");
const userInput = require("./userInput");
const startApplication = require("./startApplication");

/**
 * This asynchronous function runs the setup process
 * by executing each of the steps serially
 */
const runSetup = async () => {
  //1. Display information about the project
  displayAbout();

  //2. Install project dependencies
  await installDependencies();

  //3. Set up user configuration
  await userInput(path.join(__dirname, ".env"));

  //4. Display command to start the application
  await startApplication();
};

runSetup();
