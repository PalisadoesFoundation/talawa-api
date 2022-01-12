const mongoose = require('mongoose');
const chalk = require('chalk')

const check_url = async(mongo_db_url) => {

    const options = { useNewUrlParser: true, useUnifiedTopology: true };

    await mongoose.connect(mongo_db_url, options).catch((err) => {
        console.log(chalk.red('ERROR: Error connecting to MongoDB server ❌'));
        console.log('REASON: ', err.message);
        process.exit(1);
    });

    console.log(chalk.green('MongoDB URL verified successfully 🎉'));
    return true;
};

module.exports = check_url;