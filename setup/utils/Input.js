const inquirer = require('inquirer');

const input = async (questions) => {
  const answer = await inquirer.prompt(questions);
  return answer;
};

module.exports = input;
