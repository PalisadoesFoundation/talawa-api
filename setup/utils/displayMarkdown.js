/**
 * @function to display the content of a markdown file
 */
var marked = require("marked");
var TerminalRenderer = require("marked-terminal");

marked.setOptions({
  renderer: new TerminalRenderer(),
});

const displayMarkdown = (text) => {
  console.log(marked.parse(text));
};

module.exports = displayMarkdown;
