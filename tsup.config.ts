import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'workers/feed-worker': 'src/workers/feed-worker.ts',
  },
  outDir: 'dist',
  target: 'node18',
  format: ['cjs'],
  clean: true,
  sourcemap: true,
});
