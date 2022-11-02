/**
 * @brief Code to install the dependencies
 * @description This code will install the dependencies
 * listed in the `package.json` file.
 */
const fs = require("fs");
const path = require("path");
const cmd = require("node-cmd");
const displayHeading = require("./utils/displayHeading");
const displayMarkdown = require("./utils/displayMarkdown");
const chalk = require("chalk");

const installDependencies = async () => {
  try {
    //Display a message
    displayHeading("INSTALLING PROJECT DEPENDENCIES");
    const data = fs.readFileSync(
      path.join(__dirname, "markdown/install.md"),
      "utf-8"
    );
    displayMarkdown(data);

    //Install the dependencies
    cmd.runSync("npm install -f");
    console.log(chalk.green("Project dependencies installed successfully 🎉"));
  } catch (err) {
    console.log(chalk.red("ERROR: Failed to install project dependencies ❌"));
    console.log("REASON: ", err.message);

    process.exit(1);
  }
};

module.exports = installDependencies;
