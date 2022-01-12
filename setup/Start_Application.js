const chalk = require('chalk')
const boxen = require('boxen')
const display_heading = require('./utils/Display_Heading');

const start_application = async() => {
    try {
        display_heading('START THE APPLICATION');
        console.log(chalk.green(
            'All the installation steps have been executed successfully 🎉. \nYou can start the application using the command below'
        ));
        console.log(boxen("npm start", { float: 'center', textAlignment: 'center', borderColor: 'magenta', borderStyle: 'bold', padding: 1 }));

        process.exit(0);
    } catch (err) {
        console.log(chalk.red("ERROR: Failed to start the application"))
        console.log("REASON: ", err.message);
        process.exit(1);
    }
};

module.exports = start_application;