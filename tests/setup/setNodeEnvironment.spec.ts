import fs from 'fs';
import dotenv from 'dotenv';
import { setNodeEnvironment } from '../../setup';
import { vi, describe, it, expect } from 'vitest';
import inquirer from 'inquirer';

describe('setNodeEnvironment', () => {
  it('should set NODE_ENV to "development" and update .env file', async () => {
    // Mock getNodeEnvironment to return 'development'
    vi.spyOn(inquirer, "prompt").mockImplementationOnce(() => Promise.resolve({nodeEnv: 'development'}))
    vi.spyOn(global.process, 'env', 'set').mockReturnValueOnce(undefined);
    vi.spyOn(fs, 'readFileSync').mockReturnValueOnce('');
    const parseMock = vi.spyOn(dotenv, 'parse').mockReturnValueOnce({});

    await setNodeEnvironment();

    expect(parseMock).toHaveBeenCalledWith('');
    expect(process.env.NODE_ENV).toBe('development');
    expect(fs.readFileSync).toHaveBeenCalledWith('.env');
    expect(fs.writeFileSync).toHaveBeenCalledWith('.env', 'NODE_ENV=development\n');
  });
});
