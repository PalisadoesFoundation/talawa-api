const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Getting the current working directory
const directory = process.cwd();

/**
 * This function finds all markdown files at the root level of a given directory.
 * @param {string} dir - The directory to search in.
 * @returns {string[]} - An array of markdown file names.
 */
const findMarkdownFiles = (dir) => {
  // Reading the directory
  const dirents = fs.readdirSync(dir, { withFileTypes: true });

  // Filtering out the files
  const files = dirents
    .filter((dirent) => dirent.isFile())
    .map((dirent) => dirent.name);

  // Returning only the markdown files
  return files.filter((file) => path.extname(file) === ".md");
};

/**
 * This function generates a table of contents for a given markdown file.
 * @param {string} file - The markdown file to generate a table of contents for.
 */
const generateTOC = (file) => {
  // Constructing the file path
  const filePath = path.join(directory, file);

  // Generating the table of contents
  execSync(`markdown-toc -i ${filePath}`);

  // Logging the result
  console.log(`Table of contents generated for ${file}`);
};

/**
 * The main function of the script.
 * It finds all markdown files in the current directory and generates a table of contents for each one.
 */
function main() {
  // Finding all markdown files
  const markdownFiles = findMarkdownFiles(directory);

  // Checking if any markdown files were found
  if (markdownFiles.length === 0) {
    // Logging an error message and returning if no markdown files were found
    console.error("No Markdown files found in the current directory.");
    return;
  }

  // Generating a table of contents for each markdown file
  markdownFiles.forEach(generateTOC);
}

main();
