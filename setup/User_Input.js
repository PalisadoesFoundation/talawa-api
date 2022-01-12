const input = require("./utils/Input.js")
const display_heading = require("./utils/Display_Heading")
const set_user_configuration = require("./Set_User_Configuration")

const user_input = async(path) => {

    try {
        display_heading("USER INPUT")
        console.log("Do you want to set the user configuration?\n" +
            "This will overwrite any existing environment variable(s)\n" +
            "Enter Y for yes, any other key to ignore.")

        var questions = [{
            type: 'input',
            name: 'take_user_input',
            message: "->"
        }]
        const response = await input(questions)

        if (response.take_user_input === 'Y') {
            await set_user_configuration(path)
        }
    } catch (err) {
        console.log(chalk.red("ERROR: Failed to take user choice"))
        console.log("REASON: ", err.message)
        process.exit(1)
    }
}


module.exports = user_input