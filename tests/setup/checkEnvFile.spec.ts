import { describe, expect, it, beforeAll, afterEach, afterAll, vi } from 'vitest';
import { checkEnvFile } from '../../setup';
import dotenv from 'dotenv';
import { readFileSync, unlinkSync } from 'fs';

dotenv.config();

const test = describe('checkEnvFile function', () => {
  let originalReadFileSync: (path: string, options?: {
    encoding?: null;
    flag?: string;
  } | undefined) => Buffer;

  let originalParse: (env: Buffer) => dotenv.DotenvParseOutput;

  beforeAll(() => {
    originalReadFileSync = readFileSync;
    originalParse = dotenv.parse;

    vi.mock('fs', () => ({
      readFileSync: (filePath: string) => {
        if (filePath === '.env') {
          return Buffer.from('EXISTING_FIELD=existing_value\n');
        } else if (filePath === '.env.sample') {
          return Buffer.from('EXISTING_FIELD=existing_value\nNEW_FIELD=new_value\n');
        }
        throw new Error(`Unexpected file path: ${filePath}`);
      }
    }));
    

    vi.mock('dotenv', () => ({
      parse: () => ({}),
    }));
    
  });

  afterEach(async () => {
    vi.resetModules();
    vi.restoreAllMocks();
  });

  afterAll(() => {
    unlinkSync('.env');
    unlinkSync('.env.sample');
  });

  it('adds missing fields from .env.sample', () => {
    checkEnvFile();
    const env = originalParse(originalReadFileSync('.env'));
    expect(env).toHaveProperty('NEW_FIELD');
    expect(env['NEW_FIELD']).toBe('new_value');
  });

  it('does not modify existing fields in .env', () => {
    checkEnvFile();
    const env = originalParse(originalReadFileSync('.env'));
    expect(env).toHaveProperty('EXISTING_FIELD');
    expect(env['EXISTING_FIELD']).toBe('existing_value');
  });
});