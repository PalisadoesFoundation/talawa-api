/**
 * @brief Code to display information about Talawa
 * @description This code reads the content from the
 * `About.md` file and displays it on the console. The text
 * contains basic information about the Talawa
 */

const fs = require('fs');
const path = require('path');
const display_heading = require('./utils/Display_Heading');
const display_markdown = require('./utils/Display_Markdown');

const display_about = () => {
  //Read text from markdown file
  const data = fs.readFileSync(
    path.join(__dirname, 'markdown/about.md'),
    'utf-8'
  );

  //Display the text on console
  display_heading('TALAWA ADMIN');
  display_markdown(data);
};

module.exports = display_about;
