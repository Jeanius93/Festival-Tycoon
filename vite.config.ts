import { defineConfig } from 'vitest/config';
import pkg from './package.json' with { type: 'json' };

// Auf GitHub Pages liegt das Spiel unter /Festival-Tycoon/ (Groß-/Kleinschreibung zählt).
// Build und Vorschau (npm run preview) nutzen denselben Pfad wie GitHub Pages,
// der lokale Entwicklungsserver nutzt einfach '/'.
export default defineConfig(({ command, isPreview }) => ({
  base: command === 'build' || isPreview ? '/Festival-Tycoon/' : '/',
  build: {
    // Phaser allein ist gut 1 MB groß; das ist für ein Spiel normal.
    chunkSizeWarningLimit: 2000,
  },
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  test: {
    include: ['tests/**/*.test.ts'],
  },
}));
