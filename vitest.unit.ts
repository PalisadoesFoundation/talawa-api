import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    setupFiles: [], 
    include: ['test/unit_tests/*.test.ts'],
    exclude: [],
    globals: true,
    environment: 'node',
    alias: {
      '~': path.resolve(__dirname, '.'),
      'src': path.resolve(__dirname, './src')
    }
  },
});
