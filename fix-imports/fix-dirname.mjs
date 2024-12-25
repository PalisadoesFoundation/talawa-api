import fs from 'fs/promises';
import path from 'path';

const directoryPath = './build';
const dirnameDeclaration = `const __dirname = path.dirname(new URL(import.meta.url).pathname);
`;

async function addDirnameDeclaration(dir) {
  try {
    const files = await fs.readdir(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = await fs.stat(filePath);
      
      if (stat.isDirectory()) {
        await addDirnameDeclaration(filePath);
      } else if (path.extname(file) === '.js') {
        let content = await fs.readFile(filePath, 'utf8');
        
        if (content.includes('__dirname')) {
          let lines = content.split('\n');
          let pathImportIndex = lines.findIndex(line => line.includes("import") && line.includes("path"));
          
          if (pathImportIndex === -1 && !content.includes("import path from 'path'")) {
            // If path is not imported, add both import and declaration
            content = `import path from 'path';
${dirnameDeclaration}${content}`;
          } else if (pathImportIndex !== -1 && !content.includes("const __dirname =")) {
            // If path is already imported, just add the declaration after the import
            lines.splice(pathImportIndex + 1, 0, dirnameDeclaration);
            content = lines.join('\n');
          }
          
          await fs.writeFile(filePath, content, 'utf8');
          console.log(`Updated __dirname in ${filePath}`);
        }
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

addDirnameDeclaration(directoryPath);