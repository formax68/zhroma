import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    include: ['test/recon/*.test.js', 'test/extension/*.test.js'],
  },
});
