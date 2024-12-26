import { readdirSync, statSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { join, extname, dirname, resolve } from 'path';

const directory = './build'; // Adjust this if the build output folder changes

function fixImports(dir) {
  readdirSync(dir).forEach((file) => {
    const filePath = join(dir, file);

    if (statSync(filePath).isDirectory()) {
      fixImports(filePath);
    } else if (filePath.endsWith('.js')) {
      let content = readFileSync(filePath, 'utf-8');

      // Fix missing extensions in import paths and add assert for JSON imports
      content = content.replace(
        /from\s+['"](\..*?)['"]/g,
        (match, path) => {
          const resolvedPath = resolve(dirname(filePath), path);
          
          // Handle directories and missing extensions
          if (existsSync(resolvedPath) && statSync(resolvedPath).isDirectory()) {
            return `from '${path}/index.js'`;
          } else if (!extname(path) && existsSync(`${resolvedPath}.js`)) {
            return `from '${path}.js'`;
          }

          // Add assert for JSON files
          if (path.endsWith('.json')) {
            return `from '${path}' with { type: 'json' }`;
          }

          // If the file or directory doesn't exist, leave the import unchanged
          return match;
        }
      );

      writeFileSync(filePath, content, 'utf-8');
    }
  });
}

fixImports(directory);
console.log('Added index.js and .js extention to imports');
