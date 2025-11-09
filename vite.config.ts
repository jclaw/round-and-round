import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig(() => {
  return {
    plugins: [
      tsconfigPaths()
    ],
    test: {
      environment: 'jsdom',
      environmentOptions: {
        jsdom: { url: 'http://localhost/' }
      },
      globals: true,
      setupFiles: ['./vitest.setup.ts'],
      include: [
        'src/**/*.{test,spec}.{ts}',
        'tests/**/*.{test,spec}.{ts}'
      ],
      coverage: { reporter: ['text', 'lcov'] }
    }
  }
})
