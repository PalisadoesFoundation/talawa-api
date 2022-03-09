/**
 * @function to take user input from the console
 * @parameters questions: Array of JavaScript objects containing variables and questions
 * @returns An object of the responses of the user
 */
const inquirer = require('inquirer');

const input = async (questions) => {
  const answer = await inquirer.prompt(questions);
  return answer;
};

module.exports = input;
