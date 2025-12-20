import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import inquirer from 'inquirer';

const ROOT_DIR = process.cwd();
const ENV_DEV_SOURCE = path.join(ROOT_DIR, 'envFiles', '.env.devcontainer');
const ENV_CI_SOURCE = path.join(ROOT_DIR, 'envFiles', '.env.ci');
const ENV_DEST = path.join(ROOT_DIR, '.env');


async function main() {
  console.log('\n🚀 Talawa API DevContainer Setup\n');

  const isCI = process.env.CI;

  if (isCI) {
    console.log('✅ CI environment detected - using CI/Testing mode');
    const source = fs.existsSync(ENV_CI_SOURCE) ? ENV_CI_SOURCE : ENV_DEV_SOURCE;
    fs.copyFileSync(source, ENV_DEST);
    console.log('✅ .env configured for CI');
    return;
  }

  console.log('📄 Configuring Environment Variables...');

  if (!fs.existsSync(ENV_DEV_SOURCE)) {
    console.error(`❌ Error: Source file not found at ${ENV_DEV_SOURCE}`);
    process.exit(1);
  }

  fs.copyFileSync(ENV_DEV_SOURCE, ENV_DEST);
  console.log('✅ .env created for DevContainer setup');

  console.log('\n📦 Installing DevContainer CLI...');
  execSync('pnpm install -g @devcontainers/cli');

  if (process.platform === 'linux') {
    console.log('\n🔧 Adding user to docker group...');
    console.log('DEBUG: process.platform =', process.platform);
    execSync('sudo usermod -a -G docker $USER');
    execSync ('sudo su $USER -')
  }

  console.log('\n🐳 Building DevContainer...');
  execSync('devcontainer build --workspace-folder .', { stdio: 'inherit' });

  console.log('\n🚀 Starting DevContainer...');
  execSync('devcontainer up --workspace-folder .', { stdio: 'inherit' });
  
  console.log('\n⏳ Waiting for database services to be healthy...');
  let retries = 10;
  while (retries > 0) {
    try {
      execSync('docker exec talawa-postgres-1 pg_isready -U postgres', { stdio: 'ignore' });
      console.log('✅ Database services are ready');
      break;
    } catch {
      retries--;
      if (retries === 0) {
        console.log('⚠️  Database may not be fully ready, continuing anyway...');
      } else {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  console.log('\n📊 Applying database migrations...');
  execSync(`docker exec talawa-api-1 /bin/bash -c 'pnpm run apply_drizzle_migrations'`, { stdio: 'inherit' });

  const dataAnswer = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'addSampleData',
      message: 'Do you want to seed the database with sample data?',
      default: true,
    },
  ]);

  if (dataAnswer.addSampleData) {
    console.log('\n🌱 Seeding Sample Data...');
    try {
      execSync(`docker exec talawa-api-1 /bin/bash -c 'pnpm run add:sample_data'`, { stdio: 'inherit' });
      console.log('✅ Sample data seeded successfully');
    } catch (error) {
      console.log('⚠️  Sample data seeding failed, but you can run it manually later:');
      console.log(`    docker exec talawa-api-1 /bin/bash -c 'pnpm run add:sample_data'`);
    }
  }

  console.log('\n🚀 Starting API Server...');
  execSync('docker exec talawa-api-1 /bin/bash -c "nohup pnpm run start_development_server > /dev/null 2>&1 &"');

  console.log('\n⏳ Waiting for server to start...');
  await new Promise(resolve => setTimeout(resolve, 5000));

  console.log('\n✅ DevContainer Setup Complete!');
  console.log('------------------------------------------------');
  console.log('✓ API Server is running in detached mode at: http://localhost:4000');
  console.log('✓ GraphQL Playground: http://localhost:4000/graphql');
  console.log('  Stop server:  docker compose down');
  console.log('------------------------------------------------');
}

main();
