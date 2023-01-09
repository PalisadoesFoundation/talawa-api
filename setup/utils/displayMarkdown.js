/**
 * @function to display the content of a markdown file
 */
var marked = require("marked");
var TerminalRenderer = require("marked-terminal");

marked.setOptions({
  renderer: new TerminalRenderer(),
});

/**
 * `displayMarkdown` takes a string of markdown text and returns the HTML equivalent.
 * @param text - The text to be parsed.
 */
const displayMarkdown = (text) => {
  console.log(marked.parse(text));
};

module.exports = displayMarkdown;
