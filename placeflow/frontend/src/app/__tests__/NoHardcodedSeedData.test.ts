import { describe, it, expect } from 'vitest';

const FORBIDDEN_SEED_NAMES = [
  'Aarav Sharma',
  'Karan Mehta',
  'Priya Nair',
  'Rohan Verma',
  'Diya Patel',
];

describe('Phase 3: Zero Hardcoded Seed Person Names in Portal Code', () => {
  it('ensures no file under src/portals/ outside __tests__ contains hardcoded demo student names', () => {
    const portalFiles = import.meta.glob<string>('../../portals/**/*.{ts,tsx}', {
      query: '?raw',
      import: 'default',
      eager: true,
    });

    const violations: string[] = [];

    for (const [filePath, content] of Object.entries(portalFiles)) {
      if (filePath.includes('/__tests__/')) {
        continue;
      }
      for (const name of FORBIDDEN_SEED_NAMES) {
        if (content.includes(name)) {
          violations.push(`${filePath} contains '${name}'`);
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
