import fs from 'fs';
import path from 'path';

const docsDir = path.resolve('./docs/docs/schema');

function fixMdxContent(content) {
  const replacements = {
    // Fix Promise<void> tags
    '`Promise`\\?<`void`\\?>': '`Promise<void>`',
    'Promise\\?<void\\?>': '`Promise<void>`',
    
    // Fix standalone tags
    '<void>': '`void`',
    '<object>': '`object`',
    
    // Fix Promise<object> tags
    '`Promise`\\?<`object`\\?>': '`Promise<object>`',
    'Promise\\?<object\\?>': '`Promise<object>`',
    
    // Fix README links
    '\\[.*?\\]\\((.*?)README\\.md\\)': '[Admin Docs](/)'
  };

  Object.entries(replacements).forEach(([pattern, replacement]) => {
    content = content.replace(new RegExp(pattern, 'g'), replacement);
  });

  return content;
}

function processFiles(dir) {
  try {
    const files = fs.readdirSync(dir);
    files.forEach((file) => {
      const filePath = path.join(dir, file);
      if (fs.lstatSync(filePath).isDirectory()) {
        processFiles(filePath);
      } else if (file.endsWith('.md')) {
        try {
          let content = fs.readFileSync(filePath, 'utf8');
          content = fixMdxContent(content);
          fs.writeFileSync(filePath, content, 'utf8');
          console.log(`✓ Processed: ${filePath}`);
        } catch (err) {
          console.error(`✗ Error processing ${filePath}:`, err);
        }
      }
    });
  } catch (error) {
    console.error(`✗ Error accessing ${dir}:`, error);
  }
}

processFiles(docsDir);