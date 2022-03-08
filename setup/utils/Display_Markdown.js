/**
 * @function to display the content of a markdown file
 */
var marked = require('marked');
var TerminalRenderer = require('marked-terminal');

marked.setOptions({
  renderer: new TerminalRenderer(),
});

const display_markdown = (text) => {
  console.log(marked(text));
};

module.exports = display_markdown;
