import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LearnView from './LearnView';

describe('LearnView', () => {
  it('renders heading', () => {
    render(<LearnView />);
    expect(screen.getByText('Belajar LP')).toBeInTheDocument();
  });

  it('renders all 6 topic titles', () => {
    render(<LearnView />);
    expect(screen.getByText('Apa itu DLMM?')).toBeInTheDocument();
    expect(screen.getByText('Apa itu DAMM?')).toBeInTheDocument();
    expect(screen.getByText('Impermanent Loss (IL)')).toBeInTheDocument();
    expect(screen.getByText('Fee & Yield')).toBeInTheDocument();
    expect(screen.getByText('Menghitung ROI')).toBeInTheDocument();
    expect(screen.getByText('Tips & Strategi')).toBeInTheDocument();
  });

  it('expands a topic on click', () => {
    render(<LearnView />);
    const dlmmButton = screen.getByText('Apa itu DLMM?');
    fireEvent.click(dlmmButton);
    expect(screen.getByText(/Dynamic Liquidity Market Maker/)).toBeInTheDocument();
  });

  it('shows Meteora docs link', () => {
    render(<LearnView />);
    const link = screen.getByText('Baca Meteora Official Docs');
    expect(link).toHaveAttribute('href', 'https://docs.meteora.ag');
    expect(link).toHaveAttribute('target', '_blank');
  });
});
