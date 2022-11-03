/**
 * @brief Code to display information about Talawa
 * @description This code reads the content from the
 * `About.md` file and displays it on the console. The text
 * contains basic information about the Talawa
 */

const fs = require("fs");
const path = require("path");
const displayHeading = require("./utils/displayHeading");
const displayMarkdown = require("./utils/displayMarkdown");

const displayAbout = () => {
  //Read text from markdown file
  const data = fs.readFileSync(
    path.join(__dirname, "markdown/about.md"),
    "utf-8"
  );

  //Display the text on console
  displayHeading("TALAWA API");
  displayMarkdown(data);
};

module.exports = displayAbout;
