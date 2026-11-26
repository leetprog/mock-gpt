import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: 'src/index.ts',
        create: 'src/create.ts',
      },
      formats: ['es', 'cjs'],
    },
  },
  test: {
    environment: 'jsdom',
    // No mock behavior exists yet to test (see docs/ARCHITECTURE.md) — don't fail the
    // build over an empty test suite until there's something to test.
    passWithNoTests: true,
  },
});
