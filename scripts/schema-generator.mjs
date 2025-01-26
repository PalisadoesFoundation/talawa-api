import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildSchema, lexicographicSortSchema, execute, parse, getIntrospectionQuery } from 'graphql';

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
    const types = schema.getTypeMap();
    
    let markdown = '# Schema Types\n\n';
    
    // Create categorized type collections
    const categories = {
      Query: [],
      Mutation: [],
      Objects: [],
      Inputs: [],
      Enums: [],
      Scalars: [],
      Interfaces: [],
      Unions: []
    };
  
    // Categorize types
    for (const [typeName, type] of Object.entries(types)) {
      if (typeName.startsWith('__')) continue;
  
      if (typeName === 'Query') categories.Query.push(type);
      else if (typeName === 'Mutation') categories.Mutation.push(type);
      else if (type.astNode) {
        switch (type.astNode.kind) {
          case 'ObjectTypeDefinition': 
            categories.Objects.push(typeName);
            break;
          case 'InputObjectTypeDefinition': 
            categories.Inputs.push(typeName);
            break;
          case 'EnumTypeDefinition': 
            categories.Enums.push(typeName);
            break;
          case 'ScalarTypeDefinition': 
            categories.Scalars.push(typeName);
            break;
          case 'InterfaceTypeDefinition':
            categories.Interfaces.push(typeName);
            break;
          case 'UnionTypeDefinition':
            categories.Unions.push(typeName);
            break;
        }
      }
    }
  
    // Generate table of contents with <details>
    markdown += '<details>\n';
    markdown += '  <summary><strong>Table of Contents</strong></summary>\n\n';
    
    // Dynamically generate TOC sections
    Object.entries(categories).forEach(([category, typeList]) => {
      if (typeList.length > 0) {
        markdown += `  * [${category}](#${category.toLowerCase()})\n`;
        if (category !== 'Query' && category !== 'Mutation') {
          markdown += typeList
            .sort()
            .map(type => `    * [${type}](#${category.toLowerCase()}-${type.toLowerCase()})`)
            .join('\n') + '\n';
        }
      }
    });
    
    markdown += '\n</details>\n\n';
  
    // Add detailed sections for each category
    Object.entries(categories).forEach(([category, typeList]) => {
      if (typeList.length > 0) {
        markdown += `## ${category}\n`;
        
        if (category === 'Query' || category === 'Mutation') {
          markdown += '<table>\n<thead>\n<tr>\n';
          markdown += '<th align="left">Field</th>\n';
          markdown += '<th align="right">Argument</th>\n';
          markdown += '<th align="left">Type</th>\n';
          markdown += '<th align="left">Description</th>\n';
          markdown += '</tr>\n</thead>\n<tbody>\n';
          
          const type = typeList[0];
          const fields = type.getFields();
          
          Object.entries(fields).forEach(([fieldName, field]) => {
            markdown += `<tr>\n<td colspan="2" valign="top"><strong>${fieldName}</strong></td>\n`;
            markdown += `<td valign="top">${field.type}</td>\n`;
            markdown += `<td>${field.description || ''}</td>\n</tr>\n`;
            
            if (field.args && field.args.length > 0) {
              field.args.forEach(arg => {
                markdown += `<tr>\n`;
                markdown += `<td colspan="2" align="right" valign="top">${arg.name}</td>\n`;
                markdown += `<td valign="top">${arg.type}</td>\n`;
                markdown += `<td>${arg.description || ''}</td>\n`;
                markdown += `</tr>\n`;
              });
            }
          });
          
          markdown += '</tbody>\n</table>\n\n';
        } else {
          // Handle other categories
          markdown += '<table>\n<thead>\n<tr>\n';
          markdown += '<th align="left">Name</th>\n';
          markdown += '<th align="left">Details</th>\n';
          markdown += '</tr>\n</thead>\n<tbody>\n';
  
          typeList.sort().forEach(typeName => {
            const type = types[typeName];
            markdown += `<tr id="${category.toLowerCase()}-${typeName.toLowerCase()}">\n<td valign="top"><strong>${typeName}</strong></td>\n`;
            
            // Different handling for different type categories
            if (category === 'Objects' || category === 'Inputs') {
              if (type.getFields) {
                const fieldDetails = Object.entries(type.getFields())
                  .map(([fieldName, field]) => `${fieldName}: ${field.type}`)
                  .join('<br>');
                markdown += `<td>${fieldDetails}</td>\n`;
              } else {
                markdown += `<td></td>\n`;
              }
            } else if (category === 'Enums') {
              if (type.getValues) {
                const enumValues = type.getValues()
                  .map(value => value.name)
                  .join(', ');
                markdown += `<td>${enumValues}</td>\n`;
              } else {
                markdown += `<td></td>\n`;
              }
            } else if (category === 'Scalars') {
              markdown += `<td>Scalar Type</td>\n`;
            } else if (category === 'Interfaces' || category === 'Unions') {
              markdown += `<td>${type.description || ''}</td>\n`;
            }
            
            markdown += `</tr>\n`;
          });
  
          markdown += '</tbody>\n</table>\n\n';
        }
      }
    });
  
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