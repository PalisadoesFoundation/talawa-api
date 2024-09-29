const fs = require('fs');
const path = require('path');

// List of files to skip
const filesToSkip = [
  "app.ts",
  "index.ts",
  "constants.ts",
  "db.ts",
  "env.ts",
  "logger.ts",
  "getSort.ts",
  // Add more files to skip as needed
];

// List of directories to skip
const dirsToSkip = [
  "typeDefs",
  "services",

  // Add more directories to skip as needed
];

// Recursively find all .tsx files, excluding files listed in filesToSkip and directories in dirsToSkip
function findTsxFiles(dir) {
  let results = [];
  try {
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat && stat.isDirectory()) {
        // Skip directories in dirsToSkip
        if (!dirsToSkip.includes(path.basename(filePath))) {
          results = results.concat(findTsxFiles(filePath));
        }
      } else if (
        filePath.endsWith('.ts') &&
        !filePath.endsWith('.spec.ts') &&
        !filesToSkip.includes(path.relative(dir, filePath))
      ) {
        results.push(filePath);
      }
    });
  } catch (err) {
    console.error(`Error reading directory ${dir}: ${err.message}`);
  }
  return results;
}

// Check if a file contains at least one TSDoc comment
function containsTsDocComment(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return /\/\*\*[\s\S]*?\*\//.test(content);
  } catch (err) {
    console.error(`Error reading file ${filePath}: ${err.message}`);
    return false;
  }
}

// Main function to run the validation
function run() {
  const dir = process.argv[2] || './src'; // Allow directory path as a command-line argument
  const files = findTsxFiles(dir);
  let allValid = true;

  files.forEach((file) => {
    if (!containsTsDocComment(file)) {
      console.error(`No TSDoc comment found in file: ${file}`);
      allValid = false;
    }
  });

  if (!allValid) {
    process.exit(1);
  }
}

run();