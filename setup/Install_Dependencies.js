/**
 * @brief Code to install the dependencies
 * @description This code will install the dependencies
 * listed in the `package.json` file.
 */
const fs = require('fs');
const path = require('path');
const cmd = require('node-cmd');
const display_heading = require('./utils/Display_Heading');
const display_markdown = require('./utils/Display_Markdown');
const chalk = require('chalk');

const install_dependencies = async () => {
  try {
    //Display a message
    display_heading('INSTALLING PROJECT DEPENDENCIES');
    const data = fs.readFileSync(
      path.join(__dirname, 'markdown/Install.md'),
      'utf-8'
    );
    display_markdown(data);

    //Install the dependencies
    cmd.runSync('npm install -f');
    console.log(chalk.green('Project dependencies installed successfully 🎉'));
  } catch (err) {
    console.log(chalk.red('ERROR: Failed to install project dependencies ❌'));
    console.log('REASON: ', err.message);

    process.exit(1);
  }
};

module.exports = install_dependencies;
