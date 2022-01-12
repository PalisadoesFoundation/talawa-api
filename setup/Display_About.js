const fs = require('fs');
const path = require('path');
const display_heading = require('./utils/Display_Heading');
const display_markdown = require('./utils/Display_Markdown');

const display_about = () => {
  const data = fs.readFileSync(
    path.join(__dirname, 'markdown/about.md'),
    'utf-8'
  );
  display_heading('TALAWA ADMIN');
  display_markdown(data);
};

module.exports = display_about;
