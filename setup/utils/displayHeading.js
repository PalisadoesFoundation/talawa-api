/**
 * @function to take a string and display it
 * inside a box. It is used to denote the individual
 * installation steps.
 */
const boxen = require("boxen");
const chalk = require("chalk");

const displayHeading = (heading) => {
  //configuration of the box to be displayed
  const displayOptions = {
    float: "center",
    padding: { left: 20, right: 20 },
    margin: "auto",
    borderStyle: "double",
  };

  //Display the box enveloping the given heading
  console.log(boxen(chalk.yellow(heading), displayOptions));
};

module.exports = displayHeading;
