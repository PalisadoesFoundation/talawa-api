/**
 * @brief Code to provide choice for configuration
 * @description This code asks the user if he/she wants to
 * set up the environment variables and begins with the process
 * if the user chooses so.
 */
const input = require("./utils/input");
const displayHeading = require("./utils/displayHeading");
const setUserConfiguration = require("./setUserConfiguration");

const userInput = async (path) => {
  try {
    //Display the message
    displayHeading("SET USER CONFIGURATION");
    console.log(
      "Do you want to set the user configuration?\n" +
        "This will overwrite any existing environment variable(s)\n" +
        "Enter Y for yes, any other key to ignore."
    );

    //Variable to contain the user's choice
    var questions = [
      {
        type: "input",
        name: "take_user_input",
        message: "->",
      },
    ];

    //Take user input
    const response = await input(questions);

    //If user chooses to set the user configuration,
    //then proceed with the step
    if (response.take_user_input === "Y") {
      await setUserConfiguration(path);
    }
  } catch (err) {
    //console.log(chalk.red('ERROR: Failed to take user choice'));
    console.log("REASON: ", err.message);
    process.exit(1);
  }
};

module.exports = userInput;
