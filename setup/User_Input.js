const fs = require("fs")
const display_heading = require("./utils/Display_Heading")
const display_markdown = require("./utils/Display_Markdown")
const input = require("./utils/Input.js")
const set_user_configuration = require("./Set_User_Configuration")

const user_input = async(path) => {

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
}


module.exports = user_input