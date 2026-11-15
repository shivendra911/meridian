import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StateBlock } from '../StateBlock';

describe('StateBlock Component', () => {
  it('renders children with default paper variant', () => {
    render(
      <StateBlock>
        <h1>Preparing Profile</h1>
      </StateBlock>
    );

    expect(screen.getByText('Preparing Profile')).toBeDefined();
  });

  it('renders navy variant with correct styles', () => {
    const { container } = render(
      <StateBlock variant="navy">
        <h2>Interview Day</h2>
      </StateBlock>
    );

    const block = container.firstChild as HTMLElement;
    expect(block.className).toContain('bg-block-navy');
    expect(block.className).toContain('text-white');
  });

  it('renders teal variant for offers', () => {
    const { container } = render(
      <StateBlock variant="teal">
        <h2>Placement Offer</h2>
      </StateBlock>
    );

    const block = container.firstChild as HTMLElement;
    expect(block.className).toContain('bg-block-teal');
    expect(block.className).toContain('text-white');
  });
});
