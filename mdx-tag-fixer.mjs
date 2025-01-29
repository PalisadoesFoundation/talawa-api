// Save this as fix-mdx.mjs or add "type": "module" to package.json
import { promises as fs } from 'fs';
import { join } from 'path';

async function* walkDir(dir) {
    const files = await fs.readdir(dir);
    for (const file of files) {
        const pathToFile = join(dir, file);
        const stat = await fs.stat(pathToFile);
        if (stat.isDirectory()) {
            yield* walkDir(pathToFile);
        } else if (pathToFile.endsWith('.md') || pathToFile.endsWith('.mdx')) {
            yield pathToFile;
        }
    }
}

async function fixFile(filePath) {
    let content = await fs.readFile(filePath, 'utf8');
    let wasFixed = false;

    // Only fix void tags
    const voidRegex = /<void([^>\/]*)(?!\/)>/g;
    if (voidRegex.test(content)) {
        content = content.replace(voidRegex, '<void$1 />');
        wasFixed = true;
    }

    if (wasFixed) {
        await fs.writeFile(filePath, content, 'utf8');
        console.log(`Fixed void tags in: ${filePath}`);
    }
}

async function fixMDXFiles(startPath) {
    try {
        for await (const filePath of walkDir(startPath)) {
            await fixFile(filePath);
        }
        console.log('Completed processing all MDX/MD files.');
    } catch (error) {
        console.error('Error processing files:', error);
    }
}

// Get the docs path from command line arguments
const docsPath = process.argv[2] || './docs';
console.log(`Starting to fix MDX files in: ${docsPath}`);
fixMDXFiles(docsPath);