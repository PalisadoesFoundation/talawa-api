/**
 * @brief Code to set the suer configuration
 * @description This code takes the user input of the required
 * environment variables and saves them inside a .env file. It also
 * checks if the MongoDB URL is valid or not
 */
const fs = require('fs');
const chalk = require('chalk');
const display_heading = require('./utils/Display_Heading');
const input = require('./utils/Input');
const check_url = require('./utils/Check_Mongo_URL.js');

/**
 * @function to convert the key-value pairs of
 * a JavaScript object into a string and each pair
 * is displayed in newline. It is used to convert the
 * user input into a string to be written in .env file
 * @parameters JavaScript object
 * @returns string
 */
const convertObjectToString = (object) => {
  let string = '';
  for (let key of Object.keys(object)) {
    string += `${key}=${object[key]}\n`;
  }

  return string;
};

/**
 * @function to take the user input and save it
 * inside a .env file, after verifying the URL
 */
const set_user_configuration = async (path) => {
  try {
    //Display message
    display_heading('USER INPUT');
    console.log(
      chalk.cyan(
        'Please fill in the required fields. All fields are compulsory.'
      )
    );

    //Variables to store the user configuration details
    const questions = [
      {
        type: 'input',
        name: 'REFRESH_TOKEN_SECRET',
        message: 'REFRESH_TOKEN_SECRET',
      },
      {
        type: 'input',
        name: 'ACCESS_TOKEN_SECRET',
        message: 'ACCESS_TOKEN_SECRET',
      },
      {
        type: 'input',
        name: 'MONGO_DB_URL',
        message: 'MONGO_DB_URL',
      },
    ];

    //Take user input
    const response = await input(questions);

    //Check if all fields have been filled
    if (
      !response['REFRESH_TOKEN_SECRET'] ||
      !response['ACCESS_TOKEN_SECRET'] ||
      !response['MONGO_DB_URL']
    ) {
      console.log(chalk.red('ERROR: All fields are compulsory ❌'));
      process.exit(1);
    }

    //Validate the MongoDB URL
    const isValidURL = await check_url(response['MONGO_DB_URL']);

    //If the URL is valid, then save it in .env file
    if (isValidURL) {
      const data = convertObjectToString(response);
      fs.writeFileSync(path, data, { encoding: 'utf8' });
    }

    console.log(chalk.green('User configured successfully 🎉'));
  } catch (error) {
    console.log(chalk.red('ERROR: Failed to set user configuration ❌'));
    console.log('REASON: ', error.message);
    process.exit(1);
  }
};

module.exports = set_user_configuration;
