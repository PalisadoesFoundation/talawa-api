const fs = require('fs');
const display_heading = require('./utils/Display_Heading');
const display_markdown = require('./utils/Display_Markdown');
const input = require('./utils/Input');
const check_url = require('./utils/Check_Mongo_URL.js');

const convertObjectToString = (object) => {
  let string = '';
  for (let key of Object.keys(object)) {
    string += `${key}=${object[key]}\n`;
  }

  return string;
};

const set_user_configuration = async (path) => {
  display_heading('USER INPUT');
  console.log('Please fill in the required fields. All fields are compulsory.');

  const questions = [
    {
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
  if (
    !response['REFRESH_TOKEN_SECRET'] ||
    !response['ACCESS_TOKEN_SECRET'] ||
    !response['MONGO_DB_URL']
  ) {
    display_markdown('Error: All fields are compulsory :cross_mark:');
  }

  const isValidURL = await check_url(response['MONGO_DB_URL']);

  if (isValidURL) fs.writeFileSync(path, convertObjectToString(response));
};

module.exports = set_user_configuration;
