const fs = require('fs')
const chalk = require('chalk')
const display_heading = require('./utils/Display_Heading')
const input = require('./utils/Input');
const check_url = require('./utils/Check_Mongo_URL.js');

const convertObjectToString = (object) => {
    let string = '';
    for (let key of Object.keys(object)) {
        string += `${key}=${object[key]}\n`;
    }

    return string;
};

const set_user_configuration = async(path) => {
    try {

        display_heading('USER INPUT');
        console.log(chalk.cyan('Please fill in the required fields. All fields are compulsory.'));

        const questions = [{
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

        const response = await input(questions);
        if (!response['REFRESH_TOKEN_SECRET'] ||
            !response['ACCESS_TOKEN_SECRET'] ||
            !response['MONGO_DB_URL']
        ) {
            console.log(chalk.red("ERROR: All fields are compulsory ❌"))
            process.exit(1);
        }

        const isValidURL = await check_url(response['MONGO_DB_URL']);

        if (isValidURL) {
            fs.appendFile(path, convertObjectToString(response), (err) => {
                if (err) {
                    console.log(chalk.red("ERROR: Unable to create/write .env file"))
                    console.log("REASON: ", err.message)
                    process.exit(1)
                }
            });
        }

        console.log(chalk.green("User configured successfully 🎉"))

    } catch (error) {
        console.log(chalk.red("ERROR: Failed to set user configuration ❌"))
        console.log("REASON: ", error.message)
        process.exit(1)
    }
};

module.exports = set_user_configuration;