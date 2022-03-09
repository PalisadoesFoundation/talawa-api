/**
 * @brief Code to show command to start the application
 * @description After all the steps of the installation havee finished,
 * this code displays the command to start the application
 */
const chalk = require('chalk');
const boxen = require('boxen');
const display_heading = require('./utils/Display_Heading');

const start_application = async () => {
  try {
    //Display message
    display_heading('START THE APPLICATION');
    console.log(
      chalk.green(
        'All the installation steps have been executed successfully 🎉. \nYou can start the application using the command below'
      )
    );

    //Display the command
    console.log(
      boxen('npm start', {
        float: 'center',
        textAlignment: 'center',
        borderColor: 'magenta',
        borderStyle: 'bold',
        padding: 1,
      })
    );

    process.exit(0);
  } catch (err) {
    console.log(chalk.red('ERROR: Failed to start the application'));
    console.log('REASON: ', err.message);
    process.exit(1);
  }
};

module.exports = start_application;
