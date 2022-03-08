/**
 * @brief Code to check MongoDB URL
 * @description This code checks if a MongoDB URL is
 * valid or not and stops the installation process if invalid,
 * otherwise returns a Promise which resolves to true in Boolean
 */
const mongoose = require('mongoose');
const chalk = require('chalk');

const check_url = async (mongo_db_url) => {
  //Conncection configuration
  const options = { useNewUrlParser: true, useUnifiedTopology: true };

  //Conncect to the MongoDB Server
  await mongoose.connect(mongo_db_url, options).catch((err) => {
    //If connection is not established, then stop the installation process
    console.log(chalk.red('ERROR: Error connecting to MongoDB server ❌'));
    console.log('REASON: ', err.message);
    process.exit(1);
  });

  //If connection is established, then it is successfull
  console.log(chalk.green('MongoDB URL verified successfully 🎉'));
  return true;
};

module.exports = check_url;
