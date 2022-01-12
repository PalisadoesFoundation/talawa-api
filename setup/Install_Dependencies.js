const fs = require('fs');
const path = require('path');
const cmd = require('node-cmd');
const display_heading = require('./utils/Display_Heading');
const display_markdown = require('./utils/Display_Markdown');

const install_dependencies = async () => {
  display_heading('INSTALLING PROJECT DEPENDENCIES');
  const data = fs.readFileSync(
    path.join(__dirname, 'markdown/Install.md'),
    'utf-8'
  );
  display_markdown(data);

  cmd.runSync('npm install -f');
  display_markdown('Project dependencies installed successfully 🎉');
};

module.exports = install_dependencies;
