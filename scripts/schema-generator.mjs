// schema-generator.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildSchema, printSchema, lexicographicSortSchema, execute, parse, getIntrospectionQuery } from 'graphql';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function ensureDirectoryExists(filePath) {
  const dirname = path.dirname(filePath);
  if (!fs.existsSync(dirname)) {
    await fs.promises.mkdir(dirname, { recursive: true });
  }
}

async function introspectionQuery(schema) {
  const result = await execute({
    schema,
    document: parse(getIntrospectionQuery()),
  });
  
  if (!result.data) {
    throw new Error('Failed to generate introspection query');
  }
  return result.data;
}

function generateSimpleMarkdown(schema) {
  const schemaStr = printSchema(schema);
  const types = schema.getTypeMap();
  
  let markdown = '# GraphQL Schema Documentation\n\n';
  
  // Add table of contents
  markdown += '## Table of Contents\n\n';
  for (const typeName of Object.keys(types).sort()) {
    if (!typeName.startsWith('__')) {
      markdown += `- [${typeName}](#${typeName.toLowerCase()})\n`;
    }
  }
  
  markdown += '\n## Types\n\n';
  
  // Add each type
  for (const [typeName, type] of Object.entries(types)) {
    if (!typeName.startsWith('__')) {
      markdown += `### ${typeName}\n\n`;
      if (type.description) {
        markdown += `${type.description}\n\n`;
      }
      
      // Add fields if they exist
      if (type.getFields) {
        const fields = type.getFields();
        markdown += '#### Fields\n\n';
        markdown += '| Field | Type | Description |\n';
        markdown += '|-------|------|-------------|\n';
        
        for (const [fieldName, field] of Object.entries(fields)) {
          const fieldType = field.type.toString();
          const description = field.description || '';
          markdown += `| ${fieldName} | ${fieldType} | ${description} |\n`;
        }
        markdown += '\n';
      }
    }
  }
  
  return markdown;
}

async function generateSchemaFiles() {
  try {
    // Define paths relative to project root
    const projectRoot = path.resolve(__dirname, '..');
    const schemaPath = path.join(projectRoot, 'schema.graphql');
    const jsonSchemaPath = path.join(projectRoot, 'docs', 'github-actions', 'schema.json');
    const markdownPath = path.join(projectRoot, 'docs', 'docs', 'Schema.md');

    console.log('Reading schema from:', schemaPath);
    
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found at ${schemaPath}`);
    }

    // Read and process schema
    const schemaString = await fs.promises.readFile(schemaPath, 'utf-8');
    const schema = buildSchema(schemaString);
    const sortedSchema = lexicographicSortSchema(schema);
    
    // Generate and save JSON schema
    console.log('Generating JSON schema...');
    const jsonSchema = await introspectionQuery(sortedSchema);
    await ensureDirectoryExists(jsonSchemaPath);
    await fs.promises.writeFile(jsonSchemaPath, JSON.stringify(jsonSchema, null, 2));
    console.log('JSON schema saved to:', jsonSchemaPath);

    // Generate markdown documentation
    console.log('Generating Markdown documentation...');
    await ensureDirectoryExists(markdownPath);
    const markdown = generateSimpleMarkdown(sortedSchema);
    await fs.promises.writeFile(markdownPath, markdown);
    console.log('Successfully generated schema documentation at:', markdownPath);

  } catch (error) {
    console.error('Error details:', {
      message: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

// Run the generator
generateSchemaFiles();