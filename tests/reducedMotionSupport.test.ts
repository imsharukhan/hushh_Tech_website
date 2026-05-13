import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = resolve(__dirname, '..');

describe('reduced motion support', () => {
  it('disables CSS motion when the user prefers reduced motion', () => {
    const indexCss = readFileSync(resolve(repoRoot, 'src/index.css'), 'utf8');

    expect(indexCss).toContain('@media (prefers-reduced-motion: reduce)');
    expect(indexCss).toContain('animation-duration: 0.001ms !important');
    expect(indexCss).toContain('transition-duration: 0.001ms !important');
    expect(indexCss).toContain('scroll-behavior: auto !important');
    expect(indexCss).toContain('.marquee-track');
    expect(indexCss).toContain('animation: none !important');
  });

  it('configures Framer Motion to honor the user preference', () => {
    const mainTsx = readFileSync(resolve(repoRoot, 'src/main.tsx'), 'utf8');

    expect(mainTsx).toContain("import { MotionConfig } from 'framer-motion'");
    expect(mainTsx).toContain('<MotionConfig reducedMotion="user">');
  });
});
