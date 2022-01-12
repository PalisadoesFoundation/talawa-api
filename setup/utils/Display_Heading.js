const boxen = require('boxen');
const chalk = require('chalk');
const markdown = require('markdown-js');

const display_heading = (heading) => {
  console.log(
    boxen(chalk.yellow(heading), {
      float: 'center',
      padding: { left: 20, right: 20 },
      margin: 'auto',
      borderStyle: 'double',
    })
  );
};

module.exports = display_heading;
