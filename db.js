const mongoose = require('mongoose');
const chalk = require('chalk');

const connect = async () => {
  try {
    await mongoose.connect(process.env.MONGO_DB_URL, {
      useCreateIndex: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      useNewUrlParser: true,
    });
  } catch (error) {
    console.log(chalk.red(error));
    process.exit(1);
  }
};
module.exports = { connect };
