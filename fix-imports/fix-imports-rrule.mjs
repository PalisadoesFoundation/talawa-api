import fs from 'fs/promises';
import path from 'path';

const directoryPath = './build';
const oldImport = `import { Frequency, rrulestr } from "rrule";`;
const oldImport2 = `import { rrulestr } from "rrule";`;
// const oldImport3 = `import mongoose, { model, models } from "mongoose"`;
const newImport = `import rrule from "rrule";
const { Frequency, rrulestr } = rrule;`;

async function replaceImports(dir) {
  try {
    const files = await fs.readdir(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = await fs.stat(filePath);
      
      if (stat.isDirectory()) {
        await replaceImports(filePath);  // Recursively check directories
      } else if (path.extname(file) === '.js') {
        let content = await fs.readFile(filePath, 'utf8');
        
        // Correct the condition to check both oldImport and oldImport2
        if (content.includes(oldImport) || content.includes(oldImport2)) {
          content = content.replace(oldImport, newImport).replace(oldImport2, newImport);
          await fs.writeFile(filePath, content, 'utf8');
          console.log(`Updated rrule imports in ${filePath}`);
        }
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

replaceImports(directoryPath);
