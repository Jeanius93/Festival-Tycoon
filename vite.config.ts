import { defineConfig } from 'vitest/config';
import pkg from './package.json' with { type: 'json' };

// Auf GitHub Pages liegt das Spiel unter /Festival-Tycoon/ (Groß-/Kleinschreibung zählt).
// Der lokale Entwicklungsserver nutzt einfach '/'.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/Festival-Tycoon/' : '/',
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  test: {
    include: ['tests/**/*.test.ts'],
  },
}));
