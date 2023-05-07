const crypto = require('crypto');
const dotenv = require('dotenv');
const fs = require('fs');
const inquirer = require('inquirer');
const mongodb = require('mongodb');

dotenv.config();

function checkEnvFile() {
  // Check if all the fields in .env.sample are present in .env
  const env = dotenv.parse(fs.readFileSync('.env'));
  const envSample = dotenv.parse(fs.readFileSync('.env.sample'));
  const misplaced = Object.keys(envSample).filter((key) => !(key in env));
  if (misplaced.length > 0) {
    console.log('Please copy the contents of .env.sample to .env file');
    abort();
  }
}

async function accessAndRefreshTokens(accessTokenSecret, refreshTokenSecret) {
  // Generate and update the access and refresh token secrets in .env
  const config = dotenv.parse(fs.readFileSync('.env'));

  if (accessTokenSecret == null) {
    accessTokenSecret = crypto.randomBytes(32).toString('hex');
    config.ACCESS_TOKEN_SECRET = accessTokenSecret;
    fs.writeFileSync('.env', '');
    for (const key in config) {
      fs.appendFileSync('.env', `${key}=${config[key]}\n`);
    }
  }

  if (refreshTokenSecret == null) {
    refreshTokenSecret = crypto.randomBytes(32).toString('hex');
    config.REFRESH_TOKEN_SECRET = refreshTokenSecret;
    fs.writeFileSync('.env', '');
    for (const key in config) {
      fs.appendFileSync('.env', `${key}=${config[key]}\n`);
    }
  }
}

async function checkConnection(url) {
  // Check the connection to MongoDB with the specified URL.
  const client = new mongodb.MongoClient(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  console.log('\nChecking MongoDB connection....')

  try {
    await client.connect();
    console.log('\nConnection to MongoDB successful! 🎉');
    return true;
  } catch (error) {
    console.log(`\nConnection to MongoDB failed. Please try again.\n${error}`);
    console.log('\nTry starting up MongoDB on your local machine');
    abort();
    return false;
  } finally {
    await client.close();
  }
}

async function mongoDB() {
  // Get the mongodb url
  let DB_URL = process.env.MONGO_DB_URL;

  try {
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'choice',
        message:
          'Would you like to use a local instance or a cloud instance of MongoDB?',
        choices: [
          { name: 'Local', value: 0 },
          { name: 'Cloud', value: 1 },
        ],
      },
      {
        type: 'input',
        name: 'cloudInstance',
        message: 'Enter your MongoDB cloud instance URL:',
        when: function (answers) {
          return answers.choice === 1;
        },
      },
    ]);

    if (answers.choice === 0) {
      const url =
        'mongodb://localhost:27017/talawa-api?retryWrites=true&w=majority';
      const success = await checkConnection(url);

      if (success) {
        DB_URL = url;
        const config = dotenv.parse(fs.readFileSync('.env'));
        config.MONGO_DB_URL = DB_URL;
        fs.writeFileSync('.env', '');
        for (const key in config) {
          fs.appendFileSync('.env', `${key}=${config[key]}\n`);
        }
      } else {
        console.log('\nConnection to MongoDB failed. Please try again.');
        console.log('\nTry starting up MongoDB on your local machine');
        abort();
      }
    } else if (answers.choice === 1) {
      const success = await checkConnection(answers.cloudInstance);

      if (success) {
        DB_URL = answers.cloudInstance;
        const config = dotenv.parse(fs.readFileSync('.env'));
        config.MONGO_DB_URL = DB_URL;
        fs.writeFileSync('.env', '');
        for (const key in config) {
          fs.appendFileSync('.env', `${key}=${config[key]}\n`);
        }
      } else {
        console.log('\nConnection to MongoDB failed. Please try again.');
        console.log(
          '\nMake sure your MongoDB cloud instance URL is correct and try again.'
        );
        abort();
      }
    } else {
      console.log('\nInvalid choice. Please try again.\n');
      abort();
    }
  } catch (err) {
    console.error(err);
    abort();
  }
}

async function recaptcha() {
  //Get recaptcha details
  console.log(
    '\nPlease visit this URL to set up reCAPTCHA:\n\nhttps://www.google.com/recaptcha/admin/create'
  );
  console.log(
    '\nSelect reCAPTCHA v2 and the "I`m not a robot" checkbox option'
  );
  console.log(
    '\nAdd "localhost" in domains and accept the terms, then press submit'
  );

  const { recaptcha_secret_key } = await inquirer.prompt([
    {
      type: 'input',
      name: 'recaptcha_secret_key',
      message: 'Enter your reCAPTCHA secret site key:',
      validate: async (input) => {
        if (validateRecaptcha(input)) {
          return true;
        }
        return 'Invalid reCAPTCHA secret key. Please try again.';
      },
    },
  ]);
  const config = dotenv.parse(fs.readFileSync('.env'));
  config.RECAPTCHA_SECRET_KEY = recaptcha_secret_key;
  fs.writeFileSync('.env', '');
  for (const key in config) {
    fs.appendFileSync('.env', `${key}=${config[key]}\n`);
  }
}

function isValidEmail(email) {
  const pattern = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
  const match = email.match(pattern);
  return match !== null && match[0] === email;
}

function validateRecaptcha(string) {
  const pattern = /^[a-zA-Z0-9_-]{40}$/;
  return pattern.test(string);
}

function abort() {
  console.log('\nSetup process aborted. 🫠');
  process.exit(1);
}

async function twoFactorAuth() {
  //Get mail username and password
  console.log('\nIMPORTANT');
  console.log(
    '\nEnsure that you have Two-Factor Authentication set up on your Google Account.'
  );
  console.log('\nVisit Url: https://myaccount.google.com');
  console.log(
    '\nSelect Security and under Signing in to Google section select App Passwords.'
  );
  console.log(
    '\nClick on Select app section and choose Other(Custom name), enter talawa as the custom name and press Generate button.'
  );

  const { email, password } = await inquirer.prompt([
    {
      type: 'input',
      name: 'email',
      message: 'Enter your email:',
      validate: (input) =>
        isValidEmail(input) || 'Invalid email. Please try again.',
    },
    {
      type: 'password',
      name: 'password',
      message: 'Enter the generated password:',
      mask: '*',
    },
  ]);
  const config = dotenv.parse(fs.readFileSync('.env'));

  config.MAIL_USERNAME = email;
  config.MAIL_PASSWORD = password;
  fs.writeFileSync('.env', '');
  for (const key in config) {
    fs.appendFileSync('.env', `${key}=${config[key]}\n`);
  }
}

async function main() {
  console.log('Welcome to the Talawa API setup! 🚀');

  if (!fs.existsSync('.env')) {
    fs.copyFileSync('.env.sample', '.env');
  } else {
    checkEnvFile();
  }

  let accessToken = '',
    refreshToken = '';
  if (process.env.ACCESS_TOKEN_SECRET) {
    console.log(
      `\nAccess token secret already exists with the value:\n${process.env.ACCESS_TOKEN_SECRET}`
    );
  }
  const { shouldGenerateAccessToken } = await inquirer.prompt({
    type: 'confirm',
    name: 'shouldGenerateAccessToken',
    message: 'Would you like to generate a new access token secret?',
    default: true,
  });

  if (shouldGenerateAccessToken) {
    accessToken = null;
  }

  if (process.env.REFRESH_TOKEN_SECRET) {
    console.log(
      `\nRefresh token secret already exists with the value:\n${process.env.REFRESH_TOKEN_SECRET}`
    );
  }
  const { shouldGenerateRefreshToken } = await inquirer.prompt({
    type: 'confirm',
    name: 'shouldGenerateRefreshToken',
    message: 'Would you like to generate a new refresh token secret?',
    default: true,
  });

  if (shouldGenerateRefreshToken) {
    refreshToken = null;
  }

  accessAndRefreshTokens(accessToken, refreshToken);

  if (process.env.MONGO_DB_URL) {
    console.log(
      `\nMongoDB URL already exists with the value:\n${process.env.MONGO_DB_URL}`
    );
  }
  const { shouldSetMongoDb } = await inquirer.prompt({
    type: 'confirm',
    name: 'shouldSetMongoDb',
    message: 'Would you like to set up a MongoDB URL?',
    default: true,
  });

  if (shouldSetMongoDb) {
    await mongoDB();
  }

  if (process.env.RECAPTCHA_SECRET_KEY) {
    console.log(
      `\nreCAPTCHA secret key already exists with the value ${process.env.RECAPTCHA_SECRET_KEY}`
    );
  }
  const { shouldSetRecaptcha } = await inquirer.prompt({
    type: 'confirm',
    name: 'shouldSetRecaptcha',
    message: 'Would you like to set up a reCAPTCHA secret key?',
    default: true,
  });

  if (shouldSetRecaptcha) {
    await recaptcha();
  }

  if (process.env.MAIL_USERNAME) {
    console.log(
      `\nMail username already exists with the value ${process.env.MAIL_USERNAME}`
    );
  }
  const { shouldSetMail } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'shouldSetMail',
      message: 'Would you like to use the mail username and password?',
    },
  ]);
  if (shouldSetMail) {
    await twoFactorAuth();
  }

  console.log(
    '\nCongratulations! Talawa API has been successfully setup! 🥂🎉'
  );
}

main();
