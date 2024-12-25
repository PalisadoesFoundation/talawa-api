import fs from 'fs/promises';
import path from 'path';

const directoryPath = './build';
const oldImport = `import { express as voyagerMiddleware } from "graphql-voyager/middleware";`;
const newImport = `import { express as voyagerMiddleware } from "graphql-voyager/middleware/index.js";`;

async function replaceImports(dir) {
  try {
    const files = await fs.readdir(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = await fs.stat(filePath);
      
      if (stat.isDirectory()) {
        await replaceImports(filePath);
      } else if (path.extname(file) === '.js') {
        let content = await fs.readFile(filePath, 'utf8');
        
        if (content.includes(oldImport)) {
          content = content.replace(oldImport, newImport);
          await fs.writeFile(filePath, content, 'utf8');
          console.log(`Updated graphql import in ${filePath}`);
        }
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

replaceImports(directoryPath);