const mongoose = require('mongoose');
const display_markdown = require('./Display_Markdown');

const check_url = async (mongo_db_url) => {
  await mongoose.connect(mongo_db_url).catch((err) => {
    display_markdown('Error connecting to MongoDB :red_cross:');
    console.log('Reason: ', err.message);
    process.exit(1);
  });

  display_markdown('MongoDB URL verified successfully 🎉');
  return true;
};

module.exports = check_url;
