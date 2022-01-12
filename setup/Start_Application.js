const display_heading = require('./utils/Display_Heading');
const display_markdown = require('./utils/Display_Markdown');

const start_application = async () => {
  display_heading('START THE APPLICATION');
  display_markdown(
    'All the installation steps have been executed successfully 🎉. \nYou can start the application using the command below'
  );
  display_markdown('```npm start```');

  process.exit(0);
};

module.exports = start_application;
