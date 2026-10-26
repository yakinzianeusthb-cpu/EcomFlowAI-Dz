import { defineConfig } from 'vitest/config';

// Unit tests cover the pure logic under src/lib and src/i18n. They need no database or browser.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/lib/**/*.ts', 'src/i18n/**/*.ts', 'server-telegram.ts'],
      exclude: ['src/lib/prisma.ts', 'src/lib/utils.ts'],
      reporter: ['text', 'text-summary'],
    },
  },
});
