import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import replaceLinks from '../fix-readme-links';

vi.mock('node:fs');
vi.mock('node:path');

describe('replaceLinks', () => {
  const mockConsole = {
    log: vi.spyOn(console, 'log').mockImplementation(() => {}),
    error: vi.spyOn(console, 'error').mockImplementation(() => {})
  };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.DOCS_DIR = './test-docs';
    
    vi.mocked(fs.readdirSync).mockReturnValue(['file.md', 'subdir']);
    vi.mocked(fs.lstatSync).mockReturnValue({ isDirectory: () => false });
    vi.mocked(fs.readFileSync).mockReturnValue('[Test](../README.md)');
    vi.mocked(path.resolve).mockReturnValue('/test/docs');
    vi.mocked(path.join).mockImplementation((...args) => args.join('/'));
  });

  afterEach(() => {
    delete process.env.DOCS_DIR;
  });

  test('processes markdown files and replaces README links', () => {
    replaceLinks('/test/docs');

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      '/test/docs/file.md',
      '[Admin Docs](/)',
      'utf8'
    );
    expect(mockConsole.log).toHaveBeenCalledWith('Processing directory: /test/docs');
  });

  test('recursively processes subdirectories', () => {
    vi.mocked(fs.lstatSync)
      .mockReturnValueOnce({ isDirectory: () => true })
      .mockReturnValue({ isDirectory: () => false });

    replaceLinks('/test/docs');

    expect(fs.readdirSync).toHaveBeenCalledTimes(2);
  });

  test('handles file system errors', () => {
    const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {});
    vi.mocked(fs.readdirSync).mockImplementation(() => { throw new Error('Test error'); });

    replaceLinks('/test/docs');

    expect(mockConsole.error).toHaveBeenCalled();
    expect(mockExit).toHaveBeenCalledWith(1);
    mockExit.mockRestore();
  });
});